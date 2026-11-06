// Edit these values, or set the matching environment variables on your host.
const base = {
  creator: process.env.CREATOR || "༄ᶦᶰᵈ᭄➢Iήsͥⱥnͣeͫ 🤨😈࿐ Godwin", // shown in the menu
  botName: process.env.BOT_NAME || "KAY X BOT",
  prefix: process.env.PREFIX || ".",

  // Your own WhatsApp number: country code, no "+", no spaces. Example: 2348012345678
  // Leave the placeholder if you only want the web pairing page (other people pair there).
  owners: (process.env.OWNER_NUMBER || "234XXXXXXXXXX").split(","),

  mode: process.env.MODE || "public", // public or private (each connected number can change its own with .mode)

  port: Number(process.env.PORT) || 3000,
  maxSessions: Number(process.env.MAX_SESSIONS) || 20, // how many numbers one server will host
  groupImageChance: 0.5, // 0 to 1: how often the menu uses the group's own picture inside groups
  timezone: process.env.BOT_TIMEZONE || "Africa/Lagos",
  pairUrl: process.env.PAIR_URL || "", // the web pairing page address shown in .ping (or use the .setlink command)
};

// Your private settings (your number etc.) live in config.local.js, which is never uploaded to GitHub.
let local = {};
try { local = require("./config.local"); } catch (e) {}
module.exports = { ...base, ...local };
