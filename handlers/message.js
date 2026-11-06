const config = require("../config");
const passive = require("../lib/passive");

const num = (jid = "") => String(jid).split("@")[0].split(":")[0];

// Called for every incoming message of one connected number (the "session").
module.exports = async function handle(session, msg, commands) {
  const { sock } = session;
  if (!msg.message) return;
  const m = msg.message;
  const body =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    "";
  const prefix = config.prefix || ".";

  const from = msg.key.remoteJid;
  if (!from || from === "status@broadcast") return;
  const isGroup = from.endsWith("@g.us");
  const sender = msg.key.participant || from;
  const alt = msg.key.participantAlt || msg.key.remoteJidAlt || "";
  const isOwner =
    !!msg.key.fromMe ||
    session.owners.includes(num(sender)) ||
    session.owners.includes(num(alt));

  // Link protection runs on every group message, not only commands.
  if (isGroup && body) {
    try {
      await passive.antilink({ sock, session, msg, from, sender, isOwner }, body);
    } catch (e) {
      console.log("antilink error:", e.message);
    }
  }

  if (!body.startsWith(prefix)) return;

  const args = body.slice(prefix.length).trim().split(/\s+/);
  const name = (args.shift() || "").toLowerCase();
  const cmd = commands.get(name);
  if (!cmd) return;

  const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
  const mode = session.settings.mode || config.mode || "public";

  if (mode === "private" && !isOwner) return;
  if (cmd.ownerOnly && !isOwner)
    return reply("「 ACCESS DENIED 」\nOnly the Shadow Monarch can use this.");
  if (cmd.groupOnly && !isGroup)
    return reply("「 This command works in groups only. 」");

  try {
    await cmd.run({
      sock,
      msg,
      args,
      text: args.join(" "),
      from,
      sender,
      isOwner,
      isGroup,
      reply,
      commands,
      prefix,
      session,
      settings: session.settings,
      saveSettings: session.save,
    });
  } catch (e) {
    console.log("Command error:", name, e.message);
    await reply("「 SYSTEM ERROR 」\nThat command failed. Try again.");
  }
};
