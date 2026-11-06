const { hash, pick } = require("../../lib/util");

const FACTS = [
  "Octopuses have three hearts.",
  "A day on Venus is longer than a year on Venus.",
  "Bananas are botanically berries, but strawberries are not.",
  "Sharks have been around longer than trees.",
  "Lightning can be hotter than the surface of the Sun.",
  "Wombats produce cube-shaped droppings.",
  "Honey is so stable that sealed honey has been found in ancient Egyptian tombs and was still edible.",
  "The Eiffel Tower can be about 15 cm taller in summer because the metal expands in the heat.",
  "A group of flamingos is called a flamboyance.",
  "Your stomach gets a new lining every few days.",
];

const RIDDLES = [
  ["What has keys but can't open locks?", "A piano (or a keyboard)."],
  ["What gets wetter the more it dries?", "A towel."],
  ["What has a head and a tail but no body?", "A coin."],
  ["The more you take, the more you leave behind. What am I?", "Footsteps."],
  ["What has hands but can't clap?", "A clock."],
  ["What can travel around the world while staying in a corner?", "A stamp."],
  ["What has to be broken before you can use it?", "An egg."],
  ["I speak without a mouth and hear without ears. What am I?", "An echo."],
];

const WYR = [
  ["be able to fly", "be able to turn invisible"],
  ["always be 10 minutes late", "always be 20 minutes early"],
  ["have unlimited data but slow internet", "fast internet but only 1GB a month"],
  ["never use social media again", "never watch another movie or series"],
  ["live without music", "live without sweets"],
  ["speak every language", "talk to animals"],
  ["have a pause button for life", "have a rewind button for life"],
  ["be famous but broke", "be rich but unknown"],
];

const FORTUNES = [
  "A pleasant surprise is on its way to you.",
  "Someone you haven't heard from will message you soon.",
  "Your hard work is about to be noticed.",
  "A small risk you take this week will pay off.",
  "Good news arrives before the weekend.",
  "Patience will solve what rushing could not.",
  "You will soon laugh about something that worries you today.",
  "A new door opens when you stop knocking on the old one.",
];

const COMPLIMENTS = [
  "You make hard things look easy.",
  "Your energy lifts every chat you join.",
  "You are the kind of person people are glad to know.",
  "You have a great sense of humour.",
  "Your ideas are better than you think.",
  "You are stronger than your last bad day.",
  "People feel calmer around you.",
];

const ROASTS = [
  "You're the reason the group chat goes quiet.",
  "You have the confidence of someone who has never been wrong, which is impressive because you often are.",
  "Your phone has 3% battery and so does your plan for today.",
  "You're like a software update: nobody asked, and it takes forever.",
  "If laziness were an Olympic sport, you'd send someone to compete for you.",
  "You bring so much energy... to wherever you're not.",
];

const PICKUPS = [
  "Are you Wi-Fi? Because I'm feeling a connection.",
  "Do you have a map? I keep getting lost in your smile.",
  "Are you a charger? Because I'm lost without you.",
  "Is your name Google? Because you have everything I've been searching for.",
  "Are you a keyboard? Because you're just my type.",
];

const ADVICE = [
  "Drink some water, then keep going.",
  "Do the hardest thing first and the rest of the day is easy.",
  "Save a little every time money comes in, even if it's small.",
  "Sleep is not a waste of time. Try to protect it.",
  "Say sorry quickly and thank you often.",
  "Don't compare your chapter 1 to someone else's chapter 20.",
  "Finish what you started before starting something new.",
];

const bar = (p) => "█".repeat(Math.round(p / 10)) + "░".repeat(10 - Math.round(p / 10));

const games = new Map(); // chat -> { n, tries }

module.exports = [
  {
    name: "love",
    aliases: ["ship"],
    desc: "Love match for two names. Example: .love Ada and Tunde",
    async run({ text, reply }) {
      const parts = text.split(/\s+(?:and|&|x|\+|with)\s+/i).map((s) => s.trim()).filter(Boolean);
      const names = parts.length >= 2 ? parts : text.trim().split(/\s+/);
      if (names.length < 2 || !names[0] || !names[1]) return reply("Give two names.\nExample: .love Ada and Tunde");
      const [a, b] = [names[0], names[1]];
      const p = hash([a.toLowerCase(), b.toLowerCase()].sort().join("|")) % 101;
      const verdict = p >= 85 ? "Soulmates! 💍" : p >= 65 ? "Strong match 💖" : p >= 40 ? "There's a spark ✨" : p >= 20 ? "Needs work 🤔" : "Better as friends 😅";
      await reply("💘 " + a + " + " + b + "\n\n" + bar(p) + " *" + p + "%*\n" + verdict + "\n\n(just for fun)");
    },
  },
  {
    name: "rate",
    desc: "Rate anything out of 10. Example: .rate jollof rice",
    async run({ text, reply }) {
      if (!text.trim()) return reply("Example: .rate jollof rice");
      const score = hash(text) % 11;
      await reply("⭐ " + text.trim() + "\n\nRating: *" + score + "/10*");
    },
  },
  {
    name: "iq",
    desc: "Get a (very scientific) IQ score",
    async run({ reply }) {
      await reply("🧠 Your IQ today: *" + (70 + Math.floor(Math.random() * 91)) + "*\n(this is a joke, not a test)");
    },
  },
  {
    name: "lucky",
    desc: "Your lucky number and colour for today",
    async run({ reply }) {
      const colours = ["Purple", "Gold", "Blue", "Green", "Red", "Black", "White", "Orange"];
      await reply("🍀 Lucky number: *" + (1 + Math.floor(Math.random() * 99)) + "*\nLucky colour: *" + pick(colours) + "*");
    },
  },
  {
    name: "fortune",
    desc: "Read your fortune",
    async run({ reply }) {
      await reply("🔮 " + pick(FORTUNES));
    },
  },
  {
    name: "compliment",
    desc: "Get a compliment",
    async run({ reply }) {
      await reply("💜 " + pick(COMPLIMENTS));
    },
  },
  {
    name: "roast",
    desc: "A playful roast. Example: .roast Tunde",
    async run({ text, reply }) {
      const who = text.trim();
      await reply("🔥 " + (who ? who + ": " : "") + pick(ROASTS) + "\n\n(just joking 😄)");
    },
  },
  {
    name: "pickup",
    aliases: ["pickupline"],
    desc: "A cheesy pickup line",
    async run({ reply }) {
      await reply("😏 " + pick(PICKUPS));
    },
  },
  {
    name: "fact",
    desc: "A random fun fact",
    async run({ reply }) {
      await reply("🧩 Did you know?\n" + pick(FACTS));
    },
  },
  {
    name: "riddle",
    desc: "A riddle. The answer comes after 15 seconds",
    async run({ reply }) {
      const [q, a] = pick(RIDDLES);
      await reply("❓ RIDDLE\n\n" + q + "\n\nAnswer in 15 seconds...");
      setTimeout(() => reply("💡 Answer: " + a).catch(() => {}), 15000);
    },
  },
  {
    name: "wyr",
    aliases: ["wouldyourather"],
    desc: "Would you rather...",
    async run({ reply }) {
      const [a, b] = pick(WYR);
      await reply("🤔 WOULD YOU RATHER\n\n🅰️ " + a + "\n\n🅱️ " + b + "\n\nReply A or B!");
    },
  },
  {
    name: "advice",
    desc: "A bit of advice",
    async run({ reply }) {
      await reply("🧭 " + pick(ADVICE));
    },
  },
  {
    name: "guess",
    desc: "Guess the number 1-100. Start: .guess  then: .guess 50",
    async run({ args, from, reply }) {
      const a = (args[0] || "").toLowerCase();
      if (a === "stop" || a === "end") {
        const g = games.get(from);
        games.delete(from);
        return reply(g ? "Game over. The number was " + g.n + "." : "No game is running.");
      }
      if (!a) {
        games.set(from, { n: 1 + Math.floor(Math.random() * 100), tries: 0 });
        return reply("🎯 I'm thinking of a number from 1 to 100.\nGuess with: .guess 50");
      }
      const g = games.get(from);
      if (!g) return reply("Start a game first with .guess");
      const n = parseInt(a, 10);
      if (!Number.isInteger(n) || n < 1 || n > 100) return reply("Guess a whole number from 1 to 100.");
      g.tries++;
      if (n === g.n) {
        games.delete(from);
        return reply("🎉 Correct! It was " + g.n + ". You got it in " + g.tries + " " + (g.tries === 1 ? "try" : "tries") + ".");
      }
      await reply((n < g.n ? "⬆️ Higher" : "⬇️ Lower") + "  (try " + g.tries + ")");
    },
  },
];
