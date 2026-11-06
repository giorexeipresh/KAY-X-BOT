const { groupInfo } = require("../../lib/group");

const adminsOf = (meta) =>
  meta.participants.filter((p) => p.admin === "admin" || p.admin === "superadmin");
const user = (jid) => String(jid).split("@")[0].split(":")[0];

module.exports = [
  {
    name: "tagall",
    aliases: ["everyone"],
    desc: "Tag all members. Example: .tagall Meeting now",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, msg, text, reply } = ctx;
      const g = await groupInfo(ctx);
      if (!g.senderAdmin) return reply("Only group admins can use this.");
      const list = g.meta.participants;
      let out = "📢 " + (text || "Attention everyone!") + "\n\n";
      out += list.map((p) => "👤 @" + user(p.id)).join("\n");
      await sock.sendMessage(
        from,
        { text: out, mentions: list.map((p) => p.id) },
        { quoted: msg }
      );
    },
  },
  {
    name: "hidetag",
    aliases: ["announce"],
    desc: "Notify everyone without showing tags. Example: .hidetag Hello",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, msg, text, reply } = ctx;
      const g = await groupInfo(ctx);
      if (!g.senderAdmin) return reply("Only group admins can use this.");
      if (!text) return reply("Type a message.\nExample: .hidetag Meeting at 5pm");
      await sock.sendMessage(
        from,
        { text, mentions: g.meta.participants.map((p) => p.id) },
        { quoted: msg }
      );
    },
  },
  {
    name: "groupinfo",
    aliases: ["ginfo"],
    desc: "Show group details",
    groupOnly: true,
    async run(ctx) {
      const { reply } = ctx;
      const g = await groupInfo(ctx);
      const m = g.meta;
      let out = "『 GROUP INFO 』\n\n";
      out += "📛 Name: " + m.subject + "\n";
      out += "👥 Members: " + m.participants.length + "\n";
      out += "👑 Admins: " + adminsOf(m).length + "\n";
      if (m.creation)
        out += "📅 Created: " + new Date(m.creation * 1000).toDateString() + "\n";
      if (m.desc) out += "\n📝 " + m.desc;
      await reply(out);
    },
  },
  {
    name: "admins",
    aliases: ["listadmins"],
    desc: "List the group admins",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, msg } = ctx;
      const g = await groupInfo(ctx);
      const list = adminsOf(g.meta);
      let out = "👑 GROUP ADMINS (" + list.length + ")\n\n";
      out += list.map((p) => "⚔️ @" + user(p.id)).join("\n");
      await sock.sendMessage(
        from,
        { text: out, mentions: list.map((p) => p.id) },
        { quoted: msg }
      );
    },
  },
  {
    name: "link",
    aliases: ["grouplink"],
    desc: "Get the group invite link",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, reply } = ctx;
      const g = await groupInfo(ctx);
      if (!g.senderAdmin) return reply("Only group admins can use this.");
      if (!g.botAdmin) return reply("Make me a group admin first.");
      const code = await sock.groupInviteCode(from);
      await reply("🔗 https://chat.whatsapp.com/" + code);
    },
  },
];
