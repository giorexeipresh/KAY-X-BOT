const { guard, targetsOf, findP, norm } = require("../../lib/group");
const { addWarn, getWarns, resetWarns, MAX_WARNS } = require("../../lib/passive");

const tagOf = (jid) => "@" + norm(jid);
const say = ({ sock, from, msg }, text, mentions = []) => sock.sendMessage(from, { text, mentions }, { quoted: msg });

// Simple on/off switch stored per group, e.g. settings.welcome[groupId] = true
function toggle(name, key, onText, offText, desc) {
  return {
    name,
    desc,
    groupOnly: true,
    async run(ctx) {
      const { args, from, settings, saveSettings, reply } = ctx;
      const a = (args[0] || "").toLowerCase();
      if (!["on", "off"].includes(a)) {
        return reply("Currently: " + (settings[key]?.[from] ? "ON" : "OFF") + "\nUse: ." + name + " on   or   ." + name + " off");
      }
      if (!(await guard(ctx, { botAdmin: false }))) return;
      settings[key] ||= {};
      settings[key][from] = a === "on";
      saveSettings();
      await reply(a === "on" ? onText : offText);
    },
  };
}

module.exports = [
  {
    name: "antilink",
    desc: "Delete links from non-admins. .antilink on | kick | off",
    groupOnly: true,
    async run(ctx) {
      const { args, from, settings, saveSettings, reply } = ctx;
      const a = (args[0] || "").toLowerCase();
      const cur = settings.antilink?.[from] || "off";
      if (!["on", "kick", "off"].includes(a)) {
        return reply(
          "🔗 Anti-link is currently: " + cur.toUpperCase() +
          "\n\n.antilink on - delete links and warn (" + MAX_WARNS + " warnings = removed)\n.antilink kick - delete links and remove the sender straight away\n.antilink off - allow links"
        );
      }
      const g = await guard(ctx, { botAdmin: false });
      if (!g) return;
      settings.antilink ||= {};
      settings.antilink[from] = a === "on" ? "warn" : a;
      saveSettings();
      let out = a === "off" ? "✅ Anti-link is OFF." : "✅ Anti-link is ON" + (a === "kick" ? " (kick mode)." : ".");
      if (a !== "off") out += "\nAdmins can still post links.";
      if (a !== "off" && !g.botAdmin) out += "\n⚠️ I am not an admin yet. Make me an admin or I cannot delete anything.";
      await reply(out);
    },
  },
  toggle("welcome", "welcome", "✅ Welcome messages are ON.", "✅ Welcome messages are OFF.", "Greet new members. .welcome on | off"),
  toggle("goodbye", "goodbye", "✅ Goodbye messages are ON.", "✅ Goodbye messages are OFF.", "Say goodbye when someone leaves. .goodbye on | off"),
  {
    name: "warn",
    desc: "Warn a member (" + MAX_WARNS + " warnings = removed). Example: .warn @user spamming",
    groupOnly: true,
    async run(ctx) {
      const { sock, from, session, args, reply } = ctx;
      const g = await guard(ctx, { botAdmin: false });
      if (!g) return;
      const list = targetsOf(ctx);
      if (!list.length) return reply("Tag the person or reply to their message.\nExample: .warn @user spamming");
      const p = findP(g.meta, list[0]);
      if (!p) return reply("That person is not in this group.");
      if (p.admin) return reply("I won't warn an admin.");
      const reason = args.filter((a) => !a.startsWith("@") && !/^\+?\d{8,15}$/.test(a)).join(" ");
      const n = addWarn(session, from, norm(p.id));
      if (n >= MAX_WARNS) {
        if (g.botAdmin) {
          resetWarns(session, from, norm(p.id));
          await sock.groupParticipantsUpdate(from, [p.id], "remove");
          return say(ctx, "🚫 " + tagOf(p.id) + " reached " + MAX_WARNS + " warnings and was removed.", [p.id]);
        }
        return say(ctx, "⚠️ " + tagOf(p.id) + " has " + n + "/" + MAX_WARNS + " warnings. Make me an admin so I can remove them.", [p.id]);
      }
      await say(ctx, "⚠️ " + tagOf(p.id) + " has been warned" + (reason ? ": " + reason : "") + ".\nWarning " + n + "/" + MAX_WARNS, [p.id]);
    },
  },
  {
    name: "warnings",
    aliases: ["warns"],
    desc: "See someone's warnings. Example: .warnings @user",
    groupOnly: true,
    async run(ctx) {
      const { from, session, reply } = ctx;
      const list = targetsOf(ctx);
      if (!list.length) return reply("Tag the person or reply to their message.\nExample: .warnings @user");
      const meta = await ctx.sock.groupMetadata(from);
      const p = findP(meta, list[0]);
      const key = norm(p ? p.id : list[0]);
      await say(ctx, "📋 " + tagOf(p ? p.id : list[0]) + " has " + getWarns(session, from, key) + "/" + MAX_WARNS + " warnings.", [p ? p.id : list[0]]);
    },
  },
  {
    name: "resetwarn",
    aliases: ["clearwarn"],
    desc: "Clear someone's warnings. Example: .resetwarn @user",
    groupOnly: true,
    async run(ctx) {
      const { from, session, reply } = ctx;
      const g = await guard(ctx, { botAdmin: false });
      if (!g) return;
      const list = targetsOf(ctx);
      if (!list.length) return reply("Tag the person or reply to their message.\nExample: .resetwarn @user");
      const p = findP(g.meta, list[0]);
      resetWarns(session, from, norm(p ? p.id : list[0]));
      await say(ctx, "✅ Warnings cleared for " + tagOf(p ? p.id : list[0]) + ".", [p ? p.id : list[0]]);
    },
  },
];
