const crypto = require("crypto");
const config = require("../../config");
const { pick } = require("../../lib/util");

const ZONES = {
  lagos: "Africa/Lagos", nigeria: "Africa/Lagos", accra: "Africa/Accra", ghana: "Africa/Accra", nairobi: "Africa/Nairobi",
  cairo: "Africa/Cairo", johannesburg: "Africa/Johannesburg", london: "Europe/London", paris: "Europe/Paris",
  berlin: "Europe/Berlin", moscow: "Europe/Moscow", dubai: "Asia/Dubai", mumbai: "Asia/Kolkata", india: "Asia/Kolkata",
  tokyo: "Asia/Tokyo", japan: "Asia/Tokyo", beijing: "Asia/Shanghai", china: "Asia/Shanghai", singapore: "Asia/Singapore",
  sydney: "Australia/Sydney", newyork: "America/New_York", ny: "America/New_York", chicago: "America/Chicago",
  losangeles: "America/Los_Angeles", la: "America/Los_Angeles", toronto: "America/Toronto", saopaulo: "America/Sao_Paulo",
  utc: "UTC", gmt: "UTC",
};

const zoneOf = (arg) => {
  const raw = (arg || "").trim();
  if (!raw) return config.timezone || "Africa/Lagos";
  return ZONES[raw.toLowerCase().replace(/[\s_-]/g, "")] || raw;
};

const LOREM = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur".split(" ");

const splitList = (text) => (text.includes(",") ? text.split(",") : text.includes("|") ? text.split("|") : text.split(/\s+/)).map((s) => s.trim()).filter(Boolean);

module.exports = [
  {
    name: "password",
    aliases: ["pass", "genpass"],
    desc: "Make a strong random password. Example: .password 16",
    async run({ args, reply }) {
      const len = args[0] === undefined ? 14 : parseInt(args[0], 10);
      if (!Number.isInteger(len) || len < 6 || len > 64) return reply("Pick a length from 6 to 64.\nExample: .password 16");
      const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%&?+="];
      const all = sets.join("");
      const chars = sets.map((s) => s[crypto.randomInt(s.length)]);
      while (chars.length < len) chars.push(all[crypto.randomInt(all.length)]);
      for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      await reply("🔐 ```" + chars.join("") + "```\n\nTap and hold to copy. Do not generate passwords in a chat other people can read.");
    },
  },
  {
    name: "uuid",
    desc: "Make a random unique ID",
    async run({ reply }) {
      await reply("🆔 " + crypto.randomUUID());
    },
  },
  {
    name: "rand",
    aliases: ["random"],
    desc: "Random number. Example: .rand 1 100",
    async run({ args, reply }) {
      let a = args[0] === undefined ? 1 : parseInt(args[0], 10);
      let b = args[1] === undefined ? (args[0] === undefined ? 100 : a) : parseInt(args[1], 10);
      if (args[1] === undefined && args[0] !== undefined) { b = a; a = 1; }
      if (!Number.isInteger(a) || !Number.isInteger(b)) return reply("Example: .rand 1 100");
      if (a > b) [a, b] = [b, a];
      await reply("🎯 " + (a + Math.floor(Math.random() * (b - a + 1))) + "  (between " + a + " and " + b + ")");
    },
  },
  {
    name: "pick",
    aliases: ["choose"],
    desc: "Pick one option. Example: .pick pizza, rice, burger",
    async run({ text, reply }) {
      const list = splitList(text);
      if (list.length < 2) return reply("Give at least two options.\nExample: .pick pizza, rice, burger");
      await reply("👉 I choose: *" + pick(list) + "*");
    },
  },
  {
    name: "shuffle",
    desc: "Shuffle a list. Example: .shuffle Ada, Tunde, Chidi",
    async run({ text, reply }) {
      const list = splitList(text);
      if (list.length < 2) return reply("Give at least two items.\nExample: .shuffle Ada, Tunde, Chidi");
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      await reply("🔀 " + list.map((x, i) => i + 1 + ". " + x).join("\n"));
    },
  },
  {
    name: "color",
    aliases: ["colour"],
    desc: "Random colour with its codes",
    async run({ reply }) {
      const n = crypto.randomInt(0x1000000);
      const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      await reply("🎨 HEX: #" + n.toString(16).padStart(6, "0").toUpperCase() + "\nRGB: " + r + ", " + g + ", " + b);
    },
  },
  {
    name: "lorem",
    desc: "Placeholder text. Example: .lorem 3",
    async run({ args, reply }) {
      const n = args[0] === undefined ? 2 : parseInt(args[0], 10);
      if (!Number.isInteger(n) || n < 1 || n > 8) return reply("Pick 1 to 8 sentences.\nExample: .lorem 3");
      const out = [];
      for (let i = 0; i < n; i++) {
        const words = Array.from({ length: 8 + Math.floor(Math.random() * 8) }, () => pick(LOREM));
        out.push(words.join(" ").replace(/^./, (c) => c.toUpperCase()) + ".");
      }
      await reply(out.join(" "));
    },
  },
  {
    name: "time",
    aliases: ["clock"],
    desc: "Current time. Example: .time london or .time Asia/Tokyo",
    async run({ text, reply }) {
      const zone = zoneOf(text);
      try {
        const now = new Date();
        const t = now.toLocaleTimeString("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const d = now.toLocaleDateString("en-GB", { timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric" });
        await reply("🕒 *" + t + "*\n" + d + "\n" + zone);
      } catch (e) {
        await reply("I don't know that place.\nTry a city like .time london, or a zone like .time Africa/Lagos");
      }
    },
  },
  {
    name: "date",
    aliases: ["today"],
    desc: "Today's date. Example: .date or .date tokyo",
    async run({ text, reply }) {
      const zone = zoneOf(text);
      try {
        const d = new Date().toLocaleDateString("en-GB", { timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric" });
        await reply("📅 " + d + "\n" + zone);
      } catch (e) {
        await reply("I don't know that place.\nTry .date london or .date Africa/Lagos");
      }
    },
  },
  {
    name: "countdown",
    desc: "Days until a date. Example: .countdown 25/12/2026",
    async run({ text, reply }) {
      const t = text.trim();
      let y, m, d, x;
      if ((x = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [y, m, d] = [x[1], x[2], x[3]];
      else if ((x = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) [d, m, y] = [x[1], x[2], x[3]];
      else return reply("Example: .countdown 25/12/2026  (day/month/year)");
      const target = new Date(Date.UTC(+y, +m - 1, +d));
      if (target.getUTCFullYear() !== +y || target.getUTCMonth() !== +m - 1 || target.getUTCDate() !== +d) return reply("That date does not exist.");
      const now = new Date();
      const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const days = Math.round((target - today) / 86400000);
      if (days === 0) return reply("⏳ That is today!");
      if (days > 0) return reply("⏳ " + days + " day" + (days === 1 ? "" : "s") + " to go (" + Math.floor(days / 7) + " weeks and " + (days % 7) + " days).");
      await reply("⌛ That was " + -days + " day" + (days === -1 ? "" : "s") + " ago.");
    },
  },
];
