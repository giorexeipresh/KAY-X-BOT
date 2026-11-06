const norm = (j = "") => String(j).split("@")[0].split(":")[0];
const ids = (p) => [p.id, p.lid, p.phoneNumber].filter(Boolean).map(norm);
const isAdm = (p) => !!p && (p.admin === "admin" || p.admin === "superadmin");
const botIds = (sock) => [sock.user?.id, sock.user?.lid].filter(Boolean).map(norm);
const findP = (meta, jid) => (jid ? meta.participants.find((p) => ids(p).includes(norm(jid))) : undefined);

async function groupInfo({ sock, from, sender, msg, isOwner }) {
  const meta = await sock.groupMetadata(from);
  const mine = botIds(sock);
  const theirs = [sender, msg.key.participantAlt].filter(Boolean).map(norm);
  const me = meta.participants.find((p) => ids(p).some((i) => mine.includes(i)));
  const them = meta.participants.find((p) => ids(p).some((i) => theirs.includes(i)));
  return {
    meta,
    botAdmin: isAdm(me),
    senderAdmin: isAdm(them) || !!isOwner,
  };
}

// People mentioned in the message, or the author of the message being replied to.
function targets(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo || {};
  if (ctx.mentionedJid?.length) return ctx.mentionedJid;
  if (ctx.participant) return [ctx.participant];
  return [];
}

// Same, plus plain phone numbers typed in the command.
function targetsOf({ msg, args }) {
  const t = targets(msg);
  if (t.length) return t;
  return (args || []).filter((a) => /^\+?\d{8,15}$/.test(a)).map((a) => a.replace("+", "") + "@s.whatsapp.net");
}

// Checks the sender is an admin (and, if needed, that the bot is). Replies and returns null if not.
async function guard(ctx, { botAdmin = true } = {}) {
  const g = await groupInfo(ctx);
  if (!g.senderAdmin) {
    await ctx.reply("Only group admins can use this.");
    return null;
  }
  if (botAdmin && !g.botAdmin) {
    await ctx.reply("Make me a group admin first.");
    return null;
  }
  return g;
}

module.exports = { groupInfo, targets, targetsOf, guard, findP, isAdm, ids, botIds, norm };
