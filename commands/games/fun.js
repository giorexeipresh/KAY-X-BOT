const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = [
  {
    name: "flip",
    aliases: ["coin"],
    desc: "Flip a coin",
    async run({ reply }) {
      await reply("🪙 " + pick(["Heads", "Tails"]));
    },
  },
  {
    name: "dice",
    aliases: ["roll"],
    desc: "Roll a dice",
    async run({ reply }) {
      await reply("🎲 You rolled a " + (1 + Math.floor(Math.random() * 6)));
    },
  },
  {
    name: "8ball",
    aliases: ["ask"],
    desc: "Ask the magic 8 ball. Example: .8ball Will I win?",
    async run({ text, reply }) {
      if (!text) return reply("Ask a question.\nExample: .8ball Will I be rich?");
      await reply("🎱 " + pick([
        "Yes, without a doubt.",
        "It is certain.",
        "Most likely.",
        "Ask again later.",
        "I cannot predict that now.",
        "Don't count on it.",
        "My sources say no.",
        "Very doubtful.",
      ]));
    },
  },
  {
    name: "rps",
    desc: "Rock paper scissors. Example: .rps rock",
    async run({ args, reply }) {
      const opts = ["rock", "paper", "scissors"];
      const me = (args[0] || "").toLowerCase();
      if (!opts.includes(me))
        return reply("Choose one: .rps rock, .rps paper or .rps scissors");
      const bot = pick(opts);
      let result = "It's a draw!";
      if (
        (me === "rock" && bot === "scissors") ||
        (me === "paper" && bot === "rock") ||
        (me === "scissors" && bot === "paper")
      ) result = "You win! 🏆";
      else if (me !== bot) result = "I win! 😈";
      await reply("You: " + me + "\nBot: " + bot + "\n\n" + result);
    },
  },
  {
    name: "truth",
    desc: "Get a truth question",
    async run({ reply }) {
      await reply("🗣️ TRUTH:\n" + pick([
        "What is the most embarrassing thing you have ever done?",
        "Who was your first crush?",
        "What is a secret you have never told anyone?",
        "What is the biggest lie you have told?",
        "What is your biggest fear?",
        "What is the last thing you searched on your phone?",
      ]));
    },
  },
  {
    name: "dare",
    desc: "Get a dare",
    async run({ reply }) {
      await reply("🔥 DARE:\n" + pick([
        "Send a voice note singing your favourite song.",
        "Change your WhatsApp status to 'I love this bot' for 1 hour.",
        "Text your best friend 'I miss you' right now.",
        "Do 15 push-ups and send proof.",
        "Speak in a funny accent for the next 5 messages.",
        "Send your most recent selfie to the group.",
      ]));
    },
  },
  {
    name: "joke",
    desc: "Get a random joke",
    async run({ reply }) {
      await reply("😂 " + pick([
        "Why don't programmers like nature? Too many bugs.",
        "Why did the phone go to school? To get smarter.",
        "I told my WiFi it was slow. Now we are not connected.",
        "Why was the computer cold? It left its Windows open.",
        "My battery is at 1% and so is my motivation.",
        "I would tell you a UDP joke, but you might not get it.",
      ]));
    },
  },
  {
    name: "slot",
    desc: "Spin the slot machine",
    async run({ reply }) {
      const s = ["🍒", "🍋", "🍇", "💎", "7️⃣", "🔔"];
      const a = pick(s), b = pick(s), c = pick(s);
      let out = "🎰 " + a + " | " + b + " | " + c + " 🎰\n\n";
      if (a === b && b === c) out += "JACKPOT! 🎉";
      else if (a === b || b === c || a === c) out += "So close! Two matched.";
      else out += "No luck. Try again.";
      await reply(out);
    },
  },
];
