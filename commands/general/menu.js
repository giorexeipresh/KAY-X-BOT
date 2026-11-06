const config = require("../../config");
const style = require("../../lib/style");
const { sendCard } = require("../../lib/card");

// The 10 menus. The first value must match the folder name inside /commands.
const CATS = [
  ["general", "⚔️", "GENERAL"],
  ["ai", "🤖", "ARTIFICIAL INTELLIGENCE"],
  ["games", "🎮", "GAMES"],
  ["anime", "🎌", "ANIME"],
  ["sticker", "🖼️", "STICKERS & IMAGES"],
  ["downloader", "📥", "DOWNLOADERS"],
  ["group", "👥", "GROUP MANAGEMENT"],
  ["search", "🔍", "SEARCH"],
  ["utility", "🛠️", "UTILITIES"],
  ["owner", "👑", "OWNER"],
];

const visible = (commands) => [...new Set(commands.values())].filter((c) => !c.hidden);
const footer = "「SHADOWS, ARISE!」\nPOWERED BY " + config.botName + " 🤖\n👑 CREATED BY " + (config.creator || "");

function mainMenu({ commands, settings, session, prefix }) {
  const total = visible(commands).length;
  const when = new Date().toLocaleString("en-GB", { timeZone: config.timezone || "Africa/Lagos" });
  const mode = (settings.mode || config.mode || "public").toUpperCase();

  let out = style.title("⚔️ *" + config.botName + "* ⚔️") + "\n\n";
  out += "影 *SHADOW MONARCH SYSTEM*\n\n";
  out += style.section("SYSTEM") + "\n";
  out += "│ ▢ Creator: " + (config.creator || "") + "\n";
  out += "│ ▢ Rank: Shadow Monarch\n";
  out += "│ ▢ Status: Online\n";
  out += "│ ▢ Mode: " + mode + "\n";
  out += "│ ▢ Prefix: " + prefix + "\n";
  out += "│ ▢ Commands: " + total + "\n";
  out += "│ ▢ Uptime: " + style.uptime(Date.now() - session.startedAt) + "\n";
  out += "│ ▢ Time: " + when + "\n";
  out += style.END + "\n\n";
  out += style.section("MENUS") + "\n";
  for (const [key, emoji, label] of CATS) {
    out += "│ " + emoji + " " + label + " ➜ " + prefix + key + "menu\n";
  }
  out += style.END + "\n\n";
  out += footer;
  return out;
}

function categoryMenu(key, { commands, prefix }) {
  const cat = CATS.find((c) => c[0] === key);
  const list = visible(commands).filter((c) => c.category === key);
  let out = style.title(cat[1] + " *" + cat[2] + " MENU*") + "\n\n";
  out += style.section("COMMANDS (" + list.length + ")") + "\n";
  if (!list.length) out += "│ Coming soon...\n";
  for (const c of list) out += "│ " + style.BULLET + " " + c.name + "\n";
  out += style.END + "\n\n";
  out += "Use it like " + prefix + (list[0]?.name || "menu") + "\n\n";
  out += footer;
  return out;
}

const main = {
  name: "menu",
  aliases: ["help", "start"],
  desc: "Show the main menu. Also: .menu arise, .menu owner",
  async run(ctx) {
    const pick = (ctx.args[0] || "").toLowerCase();
    if (CATS.some((c) => c[0] === pick)) {
      return sendCard(ctx, categoryMenu(pick, ctx), { groupPic: true });
    }
    return sendCard(ctx, mainMenu(ctx), { groupPic: true });
  },
};

// .generalmenu, .aimenu, .gamesmenu ... one hidden command per category
const perCategory = CATS.map(([key]) => ({
  name: key + "menu",
  hidden: true,
  category: "menu",
  async run(ctx) {
    return sendCard(ctx, categoryMenu(key, ctx), { groupPic: true });
  },
}));

module.exports = [main, ...perCategory];
