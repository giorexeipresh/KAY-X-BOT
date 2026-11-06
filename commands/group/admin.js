const { guard, targetsOf, findP, isAdm, ids, botIds, norm } = require("../../lib/group");

const tagOf = (jid) => "@" + norm(jid);
const say = ({ sock, from, msg }, text, mentions = []) => sock.sendMessage(from, { text, mentions }, { quoted: msg });

// Turn typed targets into real group members. Returns { found: [participant], notFound: n }.
function resolve(g, list) {
  const found = [];
  let notFound = 0;
  for (const jid of list) {
    const p = findP(g.meta, jid);
    if (p) found.push(p);
    else notFound++;
  }
  return { found, notFound };
}

module.exports = [
  {
    name: "kick",
    aliases: ["remove"],
    desc: "Remove a member. Example: .kick @user (or reply to them)",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, session, reply } = ctx;
      const g = await guard(ctx);
      if (!g) return;
      const list = targetsOf(ctx);
      if (!list.length) return reply("Tag the person or reply to their message.\nExample: .kick @user");

      const { found, notFound } = resolve(g, list);
      const mine = botIds(sock);
      const out = [];
      const remove = [];
      for (const p of found) {
        if (isAdm(p)) out.push("• " + tagOf(p.id) + " is an admin. Remove their admin role first.");
        else if (ids(p).some((i) => mine.includes(i) || session.owners.includes(i))) out.push("• I won't remove " + tagOf(p.id));
        else remove.push(p.id);
      }
      if (notFound) out.push("• " + notFound + " person(s) not found in this group");
      if (remove.length) {
        await sock.groupParticipantsUpdate(from, remove, "remove");
        out.unshift("✅ Removed " + remove.map(tagOf).join(", "));
      }
      await say(ctx, out.join("\n"), found.map((p) => p.id));
    },
  },
  {
    name: "add",
    desc: "Add a person by number. Example: .add 2348012345678",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, args, reply } = ctx;
      const g = await guard(ctx);
      if (!g) return;
      const nums = args.map((a) => a.replace(/\D/g, "")).filter((n) => n.length >= 8 && n.length <= 15);
      if (!nums.length) return reply("Example: .add 2348012345678  (country code, no +)");
      const res = await sock.groupParticipantsUpdate(from, nums.map((n) => n + "@s.whatsapp.net"), "add");
      const lines = (res || []).map((r) => {
        const who = norm(r.jid || r.content?.attrs?.jid || "");
        if (String(r.status) === "200") return "✅ Added " + who;
        if (String(r.status) === "409") return "ℹ️ " + who + " is already in the group";
        if (String(r.status) === "403") return "🔒 " + who + " only lets contacts add them. Send them the group link instead (.link)";
        if (String(r.status) === "408") return "ℹ️ " + who + " recently left. They need the link to rejoin";
        return "⚠️ Could not add " + who + " (code " + r.status + ")";
      });
      await reply(lines.join("\n") || "Nothing was added.");
    },
  },
  {
    name: "promote",
    desc: "Make a member an admin. Example: .promote @user",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, reply } = ctx;
      const g = await guard(ctx);
      if (!g) return;
      const list = targetsOf(ctx);
      if (!list.length) return reply("Tag the person or reply to their message.\nExample: .promote @user");
      const { found } = resolve(g, list);
      const targets = found.filter((p) => !isAdm(p));
      if (!targets.length) return reply("They are not in the group, or are already admins.");
      await sock.groupParticipantsUpdate(from, targets.map((p) => p.id), "promote");
      await say(ctx, "👑 " + targets.map((p) => tagOf(p.id)).join(", ") + " is now an admin.", targets.map((p) => p.id));
    },
  },
  {
    name: "demote",
    desc: "Remove someone's admin role. Example: .demote @user",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, reply } = ctx;
      const g = await guard(ctx);
      if (!g) return;
      const list = targetsOf(ctx);
      if (!list.length) return reply("Tag the person or reply to their message.\nExample: .demote @user");
      const { found } = resolve(g, list);
      const targets = found.filter((p) => isAdm(p));
      if (!targets.length) return reply("They are not in the group, or are not admins.");
      await sock.groupParticipantsUpdate(from, targets.map((p) => p.id), "demote");
      await say(ctx, "⬇️ " + targets.map((p) => tagOf(p.id)).join(", ") + " is no longer an admin.", targets.map((p) => p.id));
    },
  },
  {
    name: "mute",
    aliases: ["close"],
    desc: "Only admins can send messages",
    groupOnly: true,
    async run(ctx) {
      if (!(await guard(ctx))) return;
      await ctx.sock.groupSettingUpdate(ctx.from, "announcement");
      await ctx.reply("🔇 Group closed. Only admins can send messages.");
    },
  },
  {
    name: "unmute",
    aliases: ["open"],
    desc: "Let everyone send messages",
    groupOnly: true,
    async run(ctx) {
      if (!(await guard(ctx))) return;
      await ctx.sock.groupSettingUpdate(ctx.from, "not_announcement");
      await ctx.reply("🔊 Group opened. Everyone can send messages.");
    },
  },
  {
    name: "lock",
    desc: "Only admins can edit group info",
    groupOnly: true,
    async run(ctx) {
      if (!(await guard(ctx))) return;
      await ctx.sock.groupSettingUpdate(ctx.from, "locked");
      await ctx.reply("🔒 Group info locked. Only admins can edit it.");
    },
  },
  {
    name: "unlock",
    desc: "Let everyone edit group info",
    groupOnly: true,
    async run(ctx) {
      if (!(await guard(ctx))) return;
      await ctx.sock.groupSettingUpdate(ctx.from, "unlocked");
      await ctx.reply("🔓 Group info unlocked. Everyone can edit it.");
    },
  },
  {
    name: "setname",
    aliases: ["setsubject"],
    desc: "Change the group name. Example: .setname Shadow Army",
    groupOnly: true,
    async run(ctx) {
      if (!ctx.text.trim()) return ctx.reply("Example: .setname Shadow Army");
      if (ctx.text.length > 100) return ctx.reply("A group name can be 100 characters at most.");
      if (!(await guard(ctx))) return;
      await ctx.sock.groupUpdateSubject(ctx.from, ctx.text.trim());
      await ctx.reply("✅ Group name changed.");
    },
  },
  {
    name: "setdesc",
    aliases: ["setdescription"],
    desc: "Change the group description. Example: .setdesc Be kind",
    groupOnly: true,
    async run(ctx) {
      if (!ctx.text.trim()) return ctx.reply("Example: .setdesc Welcome, be kind to everyone");
      if (ctx.text.length > 2048) return ctx.reply("A description can be 2048 characters at most.");
      if (!(await guard(ctx))) return;
      await ctx.sock.groupUpdateDescription(ctx.from, ctx.text.trim());
      await ctx.reply("✅ Group description changed.");
    },
  },
  {
    name: "revoke",
    aliases: ["resetlink"],
    desc: "Reset the group invite link",
    groupOnly: true,
    async run(ctx) {
      if (!(await guard(ctx))) return;
      const code = await ctx.sock.groupRevokeInvite(ctx.from);
      await ctx.reply("🔗 The old link no longer works.\nNew link: https://chat.whatsapp.com/" + code);
    },
  },
  {
    name: "leave",
    desc: "Make the bot leave this group (owner only)",
    groupOnly: true,
    ownerOnly: true,
    async run(ctx) {
      await ctx.reply("👋 Leaving this group. Goodbye!");
      await ctx.sock.groupLeave(ctx.from);
    },
  },
  {
    name: "tagadmins",
    desc: "Call the admins. Example: .tagadmins please help",
    groupOnly: true,
    async run(ctx) {
      const { sock, from } = ctx;
      const meta = await sock.groupMetadata(from);
      const admins = meta.participants.filter(isAdm);
      const note = ctx.text.trim() || "Admins, you are needed here.";
      await say(ctx, "🚨 " + note + "\n\n" + admins.map((p) => "👑 " + tagOf(p.id)).join("\n"), admins.map((p) => p.id));
    },
  },
  {
    name: "delete",
    aliases: ["del"],
    desc: "Delete a message: reply to it with .delete",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, msg, reply } = ctx;
      const g = await guard(ctx);
      if (!g) return;
      const c = msg.message?.extendedTextMessage?.contextInfo;
      if (!c?.stanzaId) return reply("Reply to the message you want to delete, then send .delete");
      const mine = botIds(sock);
      const byBot = c.participant && mine.includes(norm(c.participant));
      await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: !!byBot, id: c.stanzaId, participant: c.participant } });
    },
  },
  {
    name: "poll",
    desc: "Create a poll. Example: .poll Best food? | Rice | Beans | Yam",
    async run(ctx) {
      const parts = ctx.text.split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) return ctx.reply("Example: .poll Best food? | Rice | Beans | Yam\n(a question, then 2 to 12 options, separated by |)");
      const [name, ...values] = parts;
      if (values.length > 12) return ctx.reply("A poll can have 12 options at most.");
      await ctx.sock.sendMessage(ctx.from, { poll: { name, values, selectableCount: 1 } });
    },
  },
  {
    name: "groupid",
    aliases: ["gid"],
    desc: "Show this group's ID",
    groupOnly: true,
    async run(ctx) {
      await ctx.reply("🆔 " + ctx.from);
    },
  },
];
