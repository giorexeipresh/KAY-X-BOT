const { input } = require("../../lib/util");

// One text tool = a name and a function that turns text into text.
function tool(name, desc, fn, aliases = []) {
  return {
    name,
    aliases,
    desc: desc + " Example: ." + name + " hello world",
    async run(ctx) {
      const t = input(ctx);
      if (!t) {
        return ctx.reply("Give me some text.\nExample: ." + name + " hello world\n(or reply to a message with ." + name + ")");
      }
      let out;
      try {
        out = fn(t, ctx);
      } catch (e) {
        return ctx.reply("⚠️ " + e.message);
      }
      await ctx.reply(out);
    },
  };
}

// Swap letters/digits for other Unicode alphabets
const remap = (text, ranges) =>
  [...text]
    .map((ch) => {
      const c = ch.codePointAt(0);
      for (const [from, to, base] of ranges) if (c >= from && c <= to) return String.fromCodePoint(base + c - from);
      return ch;
    })
    .join("");

const SMALL = { a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ" };

const FLIP = { a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z", "?": "¿", "!": "¡", ".": "˙", ",": "'", "'": ",", "(": ")", ")": "(", "[": "]", "]": "[", "<": ">", ">": "<", "_": "‾", "&": "⅋", "6": "9", "9": "6" };

const MORSE = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "'": ".----.", "/": "-..-.", "@": ".--.-.", "-": "-....-" };
const UNMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

module.exports = [
  tool("reverse", "Reverse text.", (t) => [...t].reverse().join(""), ["rev"]),
  tool("upper", "MAKE TEXT UPPERCASE.", (t) => t.toUpperCase(), ["uppercase"]),
  tool("lower", "make text lowercase.", (t) => t.toLowerCase(), ["lowercase"]),
  tool("title", "Capitalise Each Word.", (t) => t.toLowerCase().replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase()), ["titlecase"]),
  tool("mock", "aLtErNaTiNg CaSe.", (t) => {
    let n = 0;
    return [...t].map((ch) => (/[a-z]/i.test(ch) ? (n++ % 2 ? ch.toUpperCase() : ch.toLowerCase()) : ch)).join("");
  }),
  tool("clap", "Put 👏 between 👏 words.", (t) => t.trim().split(/\s+/).join(" 👏 ") + " 👏"),
  tool("novowels", "Remove vowels.", (t) => t.replace(/[aeiou]/gi, ""), ["devowel"]),

  {
    name: "count",
    aliases: ["wc"],
    desc: "Count characters, words and lines. Example: .count hello world",
    async run(ctx) {
      const t = input(ctx);
      if (!t) return ctx.reply("Give me some text.\nExample: .count hello world");
      const words = t.trim().split(/\s+/).filter(Boolean).length;
      await ctx.reply(
        "📊 TEXT COUNT\n\nCharacters: " + [...t].length + "\nWithout spaces: " + [...t.replace(/\s/g, "")].length +
        "\nWords: " + words + "\nLines: " + t.split("\n").length
      );
    },
  },
  {
    name: "repeat",
    desc: "Repeat text up to 20 times. Example: .repeat 3 hello",
    async run(ctx) {
      const n = parseInt(ctx.args[0], 10);
      const t = ctx.args.slice(1).join(" ");
      if (!n || !t) return ctx.reply("Example: .repeat 3 hello");
      if (n < 1 || n > 20) return ctx.reply("Pick a number from 1 to 20.");
      const out = Array(n).fill(t).join("\n");
      if (out.length > 3000) return ctx.reply("That would be too long.");
      await ctx.reply(out);
    },
  },

  tool("binary", "Text to binary.", (t) => [...Buffer.from(t, "utf8")].map((b) => b.toString(2).padStart(8, "0")).join(" ")),
  tool("unbinary", "Binary to text.", (t) => {
    const bits = t.replace(/\s+/g, "");
    if (!/^[01]+$/.test(bits) || bits.length % 8) throw new Error("Send only 0s and 1s in groups of 8.");
    return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2))).toString("utf8");
  }),
  tool("hex", "Text to hex.", (t) => Buffer.from(t, "utf8").toString("hex")),
  tool("unhex", "Hex to text.", (t) => {
    const h = t.replace(/\s+/g, "");
    if (!/^[0-9a-f]+$/i.test(h) || h.length % 2) throw new Error("That is not valid hex.");
    return Buffer.from(h, "hex").toString("utf8");
  }),
  tool("b64", "Text to Base64.", (t) => Buffer.from(t, "utf8").toString("base64"), ["base64"]),
  tool("unb64", "Base64 to text.", (t) => {
    const b = t.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(b)) throw new Error("That is not valid Base64.");
    return Buffer.from(b, "base64").toString("utf8");
  }, ["unbase64"]),
  tool("morse", "Text to Morse code.", (t) =>
    t.toLowerCase().split(/\s+/).map((w) => [...w].map((c) => MORSE[c]).filter(Boolean).join(" ")).filter(Boolean).join(" / ")
  ),
  tool("unmorse", "Morse code to text. Use / between words.", (t) => {
    const out = t.trim().split(/\s*\/\s*/).map((w) => w.split(/\s+/).map((c) => UNMORSE[c] ?? "?").join("")).join(" ");
    return out;
  }),
  tool("rot13", "ROT13 cipher (run it twice to decode).", (t) =>
    t.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26))
  ),
  tool("palindrome", "Check if text reads the same backwards.", (t) => {
    const s = t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    if (!s) throw new Error("Send some letters or numbers.");
    return [...s].join("") === [...s].reverse().join("") ? "✅ Yes, it is a palindrome." : "❌ No, it is not a palindrome.";
  }),

  tool("upsidedown", "ǝpısdn uʍop ʇxǝʇ", (t) => [...t.toLowerCase()].map((c) => FLIP[c] ?? c).reverse().join(""), ["fliptext"]),
  tool("bold", "𝗕𝗼𝗹𝗱 text.", (t) => remap(t, [[65, 90, 0x1d5d4], [97, 122, 0x1d5ee], [48, 57, 0x1d7ec]])),
  tool("italic", "𝘐𝘵𝘢𝘭𝘪𝘤 text.", (t) => remap(t, [[65, 90, 0x1d608], [97, 122, 0x1d622]])),
  tool("bubble", "ⓑⓤⓑⓑⓛⓔ text.", (t) => remap(t, [[65, 90, 0x24b6], [97, 122, 0x24d0], [49, 57, 0x2460], [48, 48, 0x24ea]])),
  tool("small", "sᴍᴀʟʟ ᴄᴀᴘꜱ text.", (t) => [...t.toLowerCase()].map((c) => SMALL[c] ?? c).join("")),
  tool("wide", "Ｗｉｄｅ　ｔｅｘｔ.", (t) => remap(t, [[33, 126, 0xff01]]).replace(/ /g, "　")),
  tool("strike", "S̶t̶r̶i̶k̶e̶ text.", (t) => [...t].map((c) => (c === " " || c === "\n" ? c : c + "̶")).join("")),
];
