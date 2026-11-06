const config = require("../../config");
const style = require("../../lib/style");
const { sendCard } = require("../../lib/card");

// WhatsApp gives the time a message was sent; the gap to now is the delay.
function delayMs(msg) {
  const t = msg?.messageTimestamp;
  const secs = t && typeof t === "object" ? (t.toNumber ? t.toNumber() : Number(t.low)) : Number(t);
  return Date.now() - secs * 1000;
}

module.exports = [
  {
    name: "ping",
    desc: "Check response speed",
    async run(ctx) {
      const { msg, sock, session, settings } = ctx;
      let ms = delayMs(msg);
      if (!Number.isFinite(ms) || ms < 0 || ms > 30000) {
        // no usable timestamp: time a tiny request to WhatsApp instead
        const t = Date.now();
        try {
          await sock.sendPresenceUpdate("available");
        } catch (e) {}
        ms = Date.now() - t;
      }

      const link = settings.pairUrl || config.pairUrl || "";
      const rule = "╠══════════════════════╣";
      let out = "╔════════════◇◆◇════════════╗\n";
      out += "   ❄️😈 " + style.serifBold(config.botName) + " 😈❄️\n";
      out += rule + "\n";
      out += "║ 🧿 pong " + Math.round(ms) + " ms\n";
      out += "║ ⏳ bot running for : " + style.uptime(Date.now() - session.startedAt) + "\n";
      out += rule + "\n";
      if (link) out += link + "\n" + rule + "\n";
      out += style.serifItalic("Shadows, Arise") + " 👆\n";
      out += "╚════════════◇◆◇════════════╝";

      await sendCard(ctx, out);
    },
  },
  {
    name: "alive",
    desc: "Check if the bot is online",
    async run({ reply }) {
      await reply("『 SYSTEM ONLINE 』\n" + config.botName + " is awake. ⚔️");
    },
  },
  {
    name: "owner",
    desc: "Show the owner",
    async run({ reply, session }) {
      await reply("👑 Creator: " + (config.creator || "") + "\n🤖 Your bot owner: wa.me/" + session.owners[0]);
    },
  },
  {
    name: "status",
    aliases: ["runtime", "uptime"],
    desc: "Show bot status and uptime",
    async run({ reply, session, settings }) {
      let out = "『 SYSTEM STATUS 』\n\n";
      out += "STATUS: ONLINE\n";
      out += "MODE: " + (settings.mode || config.mode || "public").toUpperCase() + "\n";
      out += "UPTIME: " + style.uptime(Date.now() - session.startedAt) + "\n";
      await reply(out);
    },
  },
];
