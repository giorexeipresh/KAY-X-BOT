"use strict";
// Runs many WhatsApp logins ("sessions") at once. Each connected number has its own folder in /sessions.
// A session reconnects by itself forever and is removed only when the person unlinks it from WhatsApp.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pino = require("pino");
const config = require("../config");
const settingsLib = require("./settings");
const { loadCommands } = require("./loader");
const handle = require("../handlers/message");
const { groupEvents } = require("./passive");

const ROOT = path.join(__dirname, "..", "sessions");
const LEGACY = path.join(__dirname, "..", "session"); // folder used by the first single-number version
const MAX = Number(process.env.MAX_SESSIONS || config.maxSessions || 20);
const CODE_TTL = 2 * 60 * 1000; // how long a pairing code is reused
const PAIR_WINDOW = 3 * 60 * 1000; // an unpaired web session is deleted after this

const commands = loadCommands();
const sessions = new Map(); // number -> session (QR logins use a temporary name until the scan finishes)
const byId = new Map(); // QR page id -> session

// Needed only for the QR option on the web page: npm install qrcode
let QR = null;
try {
  QR = require("qrcode");
} catch (e) {}

let lib;
const baileys = () => (lib ||= import("baileys"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clean = (n) => String(n || "").replace(/\D/g, "");
const valid = (n) => n.length >= 8 && n.length <= 15;
const dirOf = (n) => path.join(ROOT, n);
const tag = (s) => "[***" + s.number.slice(-4) + "]";

function isRegistered(dir) {
  try {
    return !!JSON.parse(fs.readFileSync(path.join(dir, "creds.json"), "utf8")).registered;
  } catch (e) {
    return false;
  }
}

function create(number, { verbose = false, temp = false } = {}) {
  const dir = dirOf(number);
  fs.mkdirSync(dir, { recursive: true });
  const s = {
    number,
    dir,
    temp, // true = QR login that has not finished yet (number not known)
    id: null,
    qr: null,
    qrImage: null,
    qrFor: null,
    verbose, // true = print the pairing code in the console (used for your own number)
    owners: [number], // the number that is linked is the owner of its own bot
    settings: settingsLib.load(dir),
    status: "starting",
    sock: null,
    code: null,
    codeAt: 0,
    startedAt: Date.now(),
    retries: 0,
    stopped: false,
    expiry: null,
    waiters: [],
  };
  s.save = () => settingsLib.save(dir, s.settings);
  sessions.set(number, s);
  return s;
}

function destroy(s) {
  s.stopped = true;
  s.status = "removed";
  clearTimeout(s.expiry);
  try {
    s.sock?.end?.(undefined);
  } catch (e) {}
  for (const w of s.waiters.splice(0)) w.reject(new Error("Session closed"));
  sessions.delete(s.number);
  if (s.id) byId.delete(s.id);
  try {
    fs.rmSync(s.dir, { recursive: true, force: true });
  } catch (e) {}
}

async function connect(s) {
  if (s.stopped) return;
  const {
    default: makeWASocket,
    Browsers,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
  } = await baileys();

  const { state, saveCreds } = await useMultiFileAuthState(s.dir);
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch (e) {}

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.ubuntu("Chrome"),
  });
  s.sock = sock;
  s.status = state.creds.registered ? "connecting" : "pairing";
  sock.ev.on("creds.update", saveCreds);

  if (!state.creds.registered && !s.verbose && !s.expiry) {
    s.expiry = setTimeout(() => {
      if (!s.stopped && !isRegistered(s.dir)) {
        console.log(tag(s), "pairing not completed in time, removing");
        destroy(s);
      }
    }, PAIR_WINDOW);
    s.expiry.unref?.();
  }

  let asked = false;
  sock.ev.on("connection.update", async (update) => {
    if (s.sock !== sock || s.stopped) return;
    const { connection, lastDisconnect, qr } = update;

    // QR login: just keep the newest QR so the web page can show it.
    if (qr && s.temp) {
      s.qr = qr;
      s.status = "pairing";
    }

    // WhatsApp sends a "qr" event first; that is the moment a pairing code can be requested.
    if (qr && !s.temp && !state.creds.registered && !asked) {
      asked = true;
      try {
        const code = await sock.requestPairingCode(s.number);
        s.code = code;
        s.codeAt = Date.now();
        if (s.verbose) console.log("PAIRING CODE:", code);
        for (const w of s.waiters.splice(0)) w.resolve(code);
      } catch (e) {
        asked = false;
        console.log(tag(s), "pairing error:", e.message);
        for (const w of s.waiters.splice(0)) w.reject(e);
      }
    }

    if (connection === "open" && s.temp && state.creds.me?.id) {
      // QR scanned and connected without a restart: move to the real number's folder
      adopt(s, state.creds.me.id).catch((e) => console.log(tag(s), "could not finish QR login:", e.message));
      return;
    }

    if (connection === "open") {
      s.status = "online";
      s.retries = 0;
      s.code = null;
      clearTimeout(s.expiry);
      s.expiry = null;
      console.log(tag(s), "ONLINE");
    }

    if (connection === "close") {
      const status = lastDisconnect?.error?.output?.statusCode;
      s.status = "closed";
      if (status === DisconnectReason.loggedOut) {
        console.log(tag(s), "logged out from WhatsApp, removing session");
        destroy(s);
        return;
      }
      if (status === DisconnectReason.connectionReplaced) {
        s.status = "replaced";
        console.log(tag(s), "this login is open somewhere else, not reconnecting");
        return;
      }
      if (s.temp && state.creds.me?.id) {
        // WhatsApp restarts the connection right after a QR scan: that is the moment to rename the folder
        await sleep(500); // let the login files finish saving
        await adopt(s, state.creds.me.id).catch((e) => console.log(tag(s), "could not finish QR login:", e.message));
        return;
      }
      const wait = Math.min(30000, 1500 * 2 ** Math.min(s.retries++, 5));
      console.log(tag(s), "closed (" + status + "), reconnecting in " + Math.round(wait / 1000) + "s");
      setTimeout(() => connect(s).catch((e) => console.log(tag(s), "reconnect failed:", e.message)), wait);
    }
  });

  sock.ev.on("group-participants.update", (ev) => {
    groupEvents(s, ev).catch((e) => console.log(tag(s), "group event error:", e.message));
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      handle(s, msg, commands).catch((e) => console.log(tag(s), "handler error:", e.message));
    }
  });
}

// Your own number (from config). Prints the pairing code in the console if it is not linked yet.
async function start(number, { verbose = false } = {}) {
  number = clean(number);
  if (!valid(number)) throw new Error("Invalid number");
  if (sessions.has(number)) return sessions.get(number);
  const s = create(number, { verbose });
  await connect(s);
  return s;
}

// Web page flow: returns { status: "pairing", code } or { status: "online" | "connecting" }.
async function requestPair(raw) {
  const number = clean(raw);
  if (!valid(number)) throw new Error("Enter your full number with country code, digits only.");

  let s = sessions.get(number);
  if (s && isRegistered(s.dir)) return { status: s.status === "online" ? "online" : "connecting" };
  if (s && s.code && Date.now() - s.codeAt < CODE_TTL) return { status: "pairing", code: s.code };
  if (s) destroy(s);
  if (sessions.size >= MAX) throw new Error("This server is full right now. Try again later.");

  s = create(number);
  let timer;
  try {
    const code = await new Promise((resolve, reject) => {
      s.waiters.push({ resolve, reject });
      timer = setTimeout(() => reject(new Error("WhatsApp did not answer in time. Try again.")), 45000);
      connect(s).catch(reject);
    });
    return { status: "pairing", code };
  } catch (e) {
    if (!s.code) destroy(s);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// QR login: the visitor does not type a number, so the folder gets a temporary name until WhatsApp tells us who scanned.
async function startQr() {
  if (!QR) throw new Error("QR login is not installed on this server. Use the pairing code option.");
  if (sessions.size >= MAX) throw new Error("This server is full right now. Try again later.");
  const id = crypto.randomBytes(8).toString("hex");
  const s = create("qr" + id, { temp: true });
  s.id = id;
  byId.set(id, s);
  await connect(s);
  return { id };
}

// Renames the temporary folder to the real number and reconnects as a normal session.
async function adopt(s, meId) {
  if (s.adopting || s.stopped) return;
  s.adopting = true;
  const number = clean(String(meId).split(":")[0].split("@")[0]);
  if (!valid(number)) throw new Error("Unknown number");
  const old = sessions.get(number);
  if (old && old !== s) destroy(old); // re-linking the same number replaces the old login
  try {
    s.sock?.end?.(undefined);
  } catch (e) {}
  s.sock = null;
  clearTimeout(s.expiry);
  s.expiry = null;
  sessions.delete(s.number);
  const dir = dirOf(number);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.renameSync(s.dir, dir);
  s.number = number;
  s.dir = dir;
  s.owners = [number];
  s.settings = settingsLib.load(dir);
  s.save = () => settingsLib.save(dir, s.settings);
  s.temp = false;
  s.qr = null;
  s.qrImage = null;
  s.adopting = false;
  s.retries = 0;
  s.status = "connecting";
  sessions.set(number, s);
  console.log(tag(s), "linked by QR");
  const id = s.id;
  setTimeout(() => byId.delete(id), 10 * 60 * 1000).unref?.();
  await connect(s);
}

// Polled by the web page: { status: "waiting" | "qr" | "online" | "expired" | "error", qr?: dataURL }
async function qrStatus(id) {
  const s = byId.get(String(id || ""));
  if (!s) return { status: "expired" };
  if (!s.temp) return { status: s.status === "online" ? "online" : "connecting" };
  if (!s.qr) return { status: "waiting" };
  try {
    if (s.qrFor !== s.qr) {
      s.qrImage = await QR.toDataURL(s.qr, { margin: 2, width: 320 });
      s.qrFor = s.qr;
    }
    return { status: "qr", qr: s.qrImage };
  } catch (e) {
    return { status: "error" };
  }
}

function getStatus(raw) {
  const s = sessions.get(clean(raw));
  return { status: s ? s.status : "none" };
}

// Brings back every linked number after a restart or redeploy.
async function restoreAll() {
  fs.mkdirSync(ROOT, { recursive: true });
  for (const name of fs.readdirSync(ROOT)) {
    const dir = path.join(ROOT, name);
    try {
      if (!fs.statSync(dir).isDirectory()) continue;
      if (name.startsWith("qr")) {
        fs.rmSync(dir, { recursive: true, force: true }); // unfinished QR login
        continue;
      }
      if (clean(name) !== name || !valid(name)) continue;
      if (!isRegistered(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        continue;
      }
      if (sessions.size >= MAX) break;
      const s = create(name);
      connect(s).catch((e) => console.log(tag(s), "start failed:", e.message));
      await sleep(1500);
    } catch (e) {
      console.log("restore skipped", name, e.message);
    }
  }
}

// If you ran the first version (one number in /session), keep that login instead of pairing again.
function migrateLegacy(number) {
  try {
    number = clean(number);
    if (fs.existsSync(path.join(LEGACY, "creds.json")) && !fs.existsSync(dirOf(number))) {
      fs.mkdirSync(ROOT, { recursive: true });
      fs.renameSync(LEGACY, dirOf(number));
      console.log("Moved your existing login to the new sessions folder.");
    }
  } catch (e) {
    console.log("Could not move the old session:", e.message);
  }
}

module.exports = {
  start,
  requestPair,
  startQr,
  qrStatus,
  getStatus,
  restoreAll,
  migrateLegacy,
  stats: () => ({ linked: sessions.size, online: [...sessions.values()].filter((x) => x.status === "online").length, max: MAX, free: Math.max(0, MAX - sessions.size), commands: new Set([...commands.values()].filter((c) => !c.hidden)).size }),
  has: (n) => sessions.has(clean(n)),
  count: () => sessions.size,
  online: () => [...sessions.values()].filter((s) => s.status === "online").length,
  commands,
};
