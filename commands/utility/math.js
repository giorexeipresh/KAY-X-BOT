const { calc, fmt } = require("../../lib/util");

const num = (s) => {
  const n = Number(String(s ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && String(s ?? "").trim() !== "" ? n : null;
};

// units: factor to a base unit per group
const UNITS = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125, t: 1000 },
  volume: { l: 1, ml: 0.001, gal: 3.785411784, cup: 0.2365882365, floz: 0.0295735295625 },
  speed: { ms: 1, kmh: 1 / 3.6, mph: 0.44704, kn: 0.514444 },
  data: { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 },
};
const ALIAS = { km: "km", kilometer: "km", kilometers: "km", mile: "mi", miles: "mi", meter: "m", meters: "m", metre: "m", metres: "m", foot: "ft", feet: "ft", inch: "in", inches: "in", pound: "lb", pounds: "lb", lbs: "lb", kilo: "kg", kilos: "kg", kilogram: "kg", ounce: "oz", ounces: "oz", liter: "l", litre: "l", liters: "l", litres: "l", gallon: "gal", gallons: "gal", "km/h": "kmh", kph: "kmh", "m/s": "ms", knot: "kn", knots: "kn", byte: "b", bytes: "b" };
const unit = (u) => {
  const k = String(u || "").toLowerCase();
  return ALIAS[k] || k;
};

const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

module.exports = [
  {
    name: "calc",
    aliases: ["math", "calculate"],
    desc: "Calculator. Example: .calc (5+3)*2 or .calc sqrt(144)",
    async run({ text, reply }) {
      try {
        await reply("🧮 " + text.trim() + " = *" + fmt(calc(text), 10) + "*");
      } catch (e) {
        await reply("⚠️ " + e.message);
      }
    },
  },
  {
    name: "percent",
    desc: "Percentage of a number. Example: .percent 20 150",
    async run({ args, reply }) {
      const p = num(args[0]), n = num(args[1]);
      if (p === null || n === null) return reply("Example: .percent 20 150  (what is 20% of 150)");
      await reply("📐 " + fmt(p) + "% of " + fmt(n) + " = *" + fmt((p / 100) * n) + "*");
    },
  },
  {
    name: "sqrt",
    desc: "Square root. Example: .sqrt 144",
    async run({ args, reply }) {
      const n = num(args[0]);
      if (n === null || n < 0) return reply("Give a number that is 0 or more.\nExample: .sqrt 144");
      await reply("√" + fmt(n) + " = *" + fmt(Math.sqrt(n)) + "*\n" + fmt(n) + "² = " + fmt(n * n));
    },
  },
  {
    name: "prime",
    desc: "Check if a number is prime. Example: .prime 97",
    async run({ args, reply }) {
      const n = num(args[0]);
      if (n === null || !Number.isInteger(n) || n < 0 || n > 1e12) return reply("Give a whole number up to 1,000,000,000,000.\nExample: .prime 97");
      let next = n + 1;
      while (!isPrime(next)) next++;
      await reply((isPrime(n) ? "✅ " + n + " is prime." : "❌ " + n + " is not prime.") + "\nNext prime: " + next);
    },
  },
  {
    name: "fib",
    aliases: ["fibonacci"],
    desc: "Fibonacci numbers. Example: .fib 10",
    async run({ args, reply }) {
      const n = num(args[0]);
      if (n === null || !Number.isInteger(n) || n < 1 || n > 100) return reply("Pick a number from 1 to 100.\nExample: .fib 10");
      const seq = [];
      let a = 0n, b = 1n;
      for (let i = 0; i < n; i++) { seq.push(a); [a, b] = [b, a + b]; }
      await reply("🌀 First " + n + " Fibonacci numbers:\n" + seq.join(", "));
    },
  },
  {
    name: "gcd",
    aliases: ["lcm"],
    desc: "GCD and LCM of two numbers. Example: .gcd 12 18",
    async run({ args, reply }) {
      const a = num(args[0]), b = num(args[1]);
      if (a === null || b === null || !Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1) return reply("Give two whole numbers.\nExample: .gcd 12 18");
      const g = gcd(a, b);
      await reply("🔢 GCD: *" + g + "*\nLCM: *" + (a / g) * b + "*");
    },
  },
  {
    name: "factorial",
    aliases: ["fac"],
    desc: "Factorial. Example: .factorial 10",
    async run({ args, reply }) {
      const n = num(args[0]);
      if (n === null || !Number.isInteger(n) || n < 0 || n > 100) return reply("Pick a whole number from 0 to 100.\nExample: .factorial 10");
      let r = 1n;
      for (let i = 2n; i <= BigInt(n); i++) r *= i;
      await reply("❗ " + n + "! = *" + r + "*");
    },
  },
  {
    name: "convert",
    aliases: ["conv"],
    desc: "Convert units. Example: .convert 10 km mi",
    async run({ args, reply }) {
      const v = num(args[0]), from = unit(args[1]), to = unit(args[2] === "to" ? args[3] : args[2]);
      if (v === null || !from || !to) {
        return reply("Example: .convert 10 km mi\n\nLength: m km cm mm mi yd ft in\nWeight: kg g mg lb oz t\nVolume: l ml gal cup floz\nSpeed: ms kmh mph kn\nData: b kb mb gb tb\n(for temperature use .temp)");
      }
      for (const group of Object.values(UNITS)) {
        if (group[from] && group[to]) {
          return reply("🔁 " + fmt(v) + " " + from + " = *" + fmt((v * group[from]) / group[to]) + " " + to + "*");
        }
      }
      await reply("I can't convert " + from + " to " + to + ". Send .convert to see the units.");
    },
  },
  {
    name: "temp",
    aliases: ["temperature"],
    desc: "Convert temperature. Example: .temp 100c or .temp 98.6 f",
    async run({ text, reply }) {
      const m = text.trim().toLowerCase().replace("°", "").match(/^(-?\d+(?:\.\d+)?)\s*([cfk])/);
      if (!m) return reply("Example: .temp 100c   or   .temp 98.6 f   or   .temp 300 k");
      const v = parseFloat(m[1]);
      const c = m[2] === "c" ? v : m[2] === "f" ? ((v - 32) * 5) / 9 : v - 273.15;
      if (c < -273.15) return reply("That is below absolute zero.");
      await reply("🌡️ " + fmt(c, 2) + " °C\n" + fmt((c * 9) / 5 + 32, 2) + " °F\n" + fmt(c + 273.15, 2) + " K");
    },
  },
  {
    name: "bmi",
    desc: "Body mass index. Example: .bmi 70 175 (kg and cm)",
    async run({ args, reply }) {
      const kg = num(args[0]), cm = num(args[1]);
      if (kg === null || cm === null || kg < 2 || kg > 500 || cm < 50 || cm > 260) return reply("Example: .bmi 70 175  (weight in kg, height in cm)");
      const b = kg / (cm / 100) ** 2;
      const band = b < 18.5 ? "Below the usual range" : b < 25 ? "Within the usual range" : b < 30 ? "Above the usual range" : "Well above the usual range";
      await reply("⚖️ BMI: *" + b.toFixed(1) + "*\n" + band + "\n\nBMI is only a rough guide. A doctor can tell you what is right for you.");
    },
  },
  {
    name: "age",
    desc: "Work out age from a birth date. Example: .age 25/12/2000",
    async run({ text, reply }) {
      const t = text.trim();
      let y, m, d, x;
      if ((x = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [y, m, d] = [x[1], x[2], x[3]];
      else if ((x = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) [d, m, y] = [x[1], x[2], x[3]];
      else return reply("Example: .age 25/12/2000  (day/month/year)\nor: .age 2000-12-25");
      const birth = new Date(Date.UTC(+y, +m - 1, +d));
      if (birth.getUTCFullYear() !== +y || birth.getUTCMonth() !== +m - 1 || birth.getUTCDate() !== +d) return reply("That date does not exist.");
      const now = new Date();
      if (birth > now) return reply("That date is in the future.");
      let years = now.getUTCFullYear() - birth.getUTCFullYear();
      let months = now.getUTCMonth() - birth.getUTCMonth();
      let days = now.getUTCDate() - birth.getUTCDate();
      if (days < 0) { months--; days += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate(); }
      if (months < 0) { years--; months += 12; }
      const total = Math.floor((now - birth) / 86400000);
      await reply("🎂 You are *" + years + " years, " + months + " months, " + days + " days* old.\n(" + total.toLocaleString("en-US") + " days alive)");
    },
  },
  {
    name: "roman",
    desc: "Roman numerals both ways. Example: .roman 1994 or .roman MCMXCIV",
    async run({ args, reply }) {
      const a = (args[0] || "").trim();
      if (/^\d+$/.test(a)) {
        let n = parseInt(a, 10);
        if (n < 1 || n > 3999) return reply("Pick a number from 1 to 3999.");
        let out = "";
        for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
        return reply("🏛️ " + a + " = *" + out + "*");
      }
      if (/^[ivxlcdm]+$/i.test(a)) {
        const s = a.toUpperCase();
        let n = 0, i = 0;
        for (const [v, r] of ROMAN) while (s.startsWith(r, i)) { n += v; i += r.length; }
        let back = "", left = n;
        for (const [v, r] of ROMAN) while (left >= v) { back += r; left -= v; }
        if (i !== s.length || n < 1 || n > 3999 || back !== s) return reply("That is not a valid Roman numeral.");
        return reply("🏛️ " + s + " = *" + n + "*");
      }
      await reply("Example: .roman 1994   or   .roman MCMXCIV");
    },
  },
  {
    name: "tip",
    desc: "Tip and split a bill. Example: .tip 5000 10 4",
    async run({ args, reply }) {
      const bill = num(args[0]);
      const pct = args[1] === undefined ? 10 : num(args[1]);
      const people = args[2] === undefined ? 1 : num(args[2]);
      if (bill === null || pct === null || people === null || bill < 0 || pct < 0 || !Number.isInteger(people) || people < 1 || people > 100)
        return reply("Example: .tip 5000 10 4\n(bill, tip percent, number of people)");
      const tip = (bill * pct) / 100;
      const total = bill + tip;
      let out = "💵 Bill: " + fmt(bill, 2) + "\nTip (" + fmt(pct) + "%): " + fmt(tip, 2) + "\nTotal: *" + fmt(total, 2) + "*";
      if (people > 1) out += "\nEach of " + people + ": *" + fmt(total / people, 2) + "*";
      await reply(out);
    },
  },
];
