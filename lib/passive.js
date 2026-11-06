// Things the bot does without a command: delete links, welcome and goodbye messages.
const { groupInfo, findP, norm, botIds } = require("./group");

const LINK = /(?:https?:\/\/|www\.)\S+|(?:chat\.whatsapp\.com|wa\.me|t\.me|discord\.gg|bit\.ly)\/\S+/i;
const MAX_WARNS = 3;

function getWarns(session, group, key) {
  return session.settings.warns?.[group]?.[key] || 0;
}
function addWarn(session, group, key) {
  const w = (session.settings.warns ||= {});
  const g = (w[group] ||= {});
  g[key] = (g[key] || 0) + 1;
  session.save();
  return g[key];
}
function resetWarns(session, group, key) {
  if (session.settings.warns?.[group]) {
    delete session.settings.warns[group][key];
    session.save();
  }
}

async function antilink(ctx, body) {
  const { session, sock, msg, from, isOwner } = ctx;
  const mode = session.settings.antilink?.[from];
  if (!mode || mode === "off" || !body || !LINK.test(body) || msg.key.fromMe || isOwner) return;

  const g = await groupInfo(ctx);
  if (g.senderAdmin || !g.botAdmin) return; // admins may post links; without admin rights the bot can't act

  const p = findP(g.meta, ctx.sender) || findP(g.meta, msg.key.participantAlt);
  const who = p ? p.id : ctx.sender;
  const tag = "@" + norm(who);
  const say = (text) => sock.sendMessage(from, { text, mentions: [who] });

  try {
    await sock.sendMessage(from, { delete: msg.key });
  } catch (e) {}

  if (mode === "kick") {
    await sock.groupParticipantsUpdate(from, [who], "remove");
    return say("🚫 " + tag + " was removed for sending a link.");
  }
  const n = addWarn(session, from, norm(who));
  if (n >= MAX_WARNS) {
    resetWarns(session, from, norm(who));
    await sock.groupParticipantsUpdate(from, [who], "remove");
    return say("🚫 " + tag + " was removed after " + MAX_WARNS + " warnings for sending links.");
  }
  return say("⚠️ " + tag + " links are not allowed in this group.\nWarning " + n + "/" + MAX_WARNS);
}

async function groupEvents(session, { id, participants, action }) {
  const st = session.settings;
  const sock = session.sock;
  const welcome = action === "add" && st.welcome?.[id];
  const goodbye = action === "remove" && st.goodbye?.[id];
  if (!welcome && !goodbye) return;

  const jids = (participants || []).map((p) => (typeof p === "string" ? p : p.id || p.phoneNumber)).filter(Boolean);
  const mine = botIds(sock);
  const people = jids.filter((j) => !mine.includes(norm(j)));
  if (!people.length) return;

  let name = "the group";
  try {
    name = (await sock.groupMetadata(id)).subject || name;
  } catch (e) {}
  const tags = people.map((j) => "@" + norm(j)).join(", ");
  const text = welcome
    ? "👋 Welcome " + tags + " to *" + name + "*!\n\nRead the group rules and enjoy your stay."
    : "👋 " + tags + " has left *" + name + "*. Goodbye!";
  await sock.sendMessage(id, { text, mentions: people });
}

module.exports = { antilink, groupEvents, addWarn, getWarns, resetWarns, MAX_WARNS, LINK };
