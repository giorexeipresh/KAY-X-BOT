// Text given with the command, or the text of the message being replied to.
function input({ text, msg }) {
  if (text) return text;
  const q = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return q?.conversation || q?.extendedTextMessage?.text || q?.imageMessage?.caption || "";
}

// Safe calculator: no eval. Supports + - * / % ^ ( ) and sqrt abs round floor ceil sin cos tan log ln, pi, e.
function calc(expr) {
  const src = String(expr).toLowerCase().replace(/×/g, "*").replace(/÷/g, "/").replace(/\*\*/g, "^").replace(/[\s,]/g, "");
  if (!src) throw new Error("Type a calculation. Example: .calc (5+3)*2");
  if (src.length > 200) throw new Error("That calculation is too long.");

  const tokens = [];
  const re = /(\d*\.?\d+(?:e[+-]?\d+)?)|([a-z]+)|([-+*/%^()])/gy;
  let pos = 0, m;
  while (pos < src.length) {
    re.lastIndex = pos;
    m = re.exec(src);
    if (!m) throw new Error("I can't read \"" + src[pos] + "\" in that calculation.");
    tokens.push(m[1] !== undefined ? { n: parseFloat(m[1]) } : m[2] !== undefined ? { id: m[2] } : { op: m[3] });
    pos = re.lastIndex;
  }

  let i = 0;
  const peek = () => tokens[i];
  const fns = {
    sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil,
    sin: (x) => Math.sin((x * Math.PI) / 180), cos: (x) => Math.cos((x * Math.PI) / 180), tan: (x) => Math.tan((x * Math.PI) / 180),
    log: Math.log10, ln: Math.log,
  };

  function expr_() {
    let v = term();
    while (peek() && (peek().op === "+" || peek().op === "-")) {
      const op = tokens[i++].op;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function term() {
    let v = power();
    while (peek() && (peek().op === "*" || peek().op === "/" || peek().op === "%")) {
      const op = tokens[i++].op;
      const r = power();
      v = op === "*" ? v * r : op === "/" ? v / r : v % r;
    }
    return v;
  }
  function power() {
    const base = unary();
    if (peek() && peek().op === "^") {
      i++;
      return Math.pow(base, power());
    }
    return base;
  }
  function unary() {
    if (peek() && peek().op === "-") { i++; return -unary(); }
    if (peek() && peek().op === "+") { i++; return unary(); }
    return primary();
  }
  function primary() {
    const t = tokens[i++];
    if (!t) throw new Error("The calculation ends too early.");
    if (t.n !== undefined) return t.n;
    if (t.op === "(") {
      const v = expr_();
      if (!peek() || peek().op !== ")") throw new Error("Missing a closing bracket.");
      i++;
      return v;
    }
    if (t.id) {
      if (t.id === "pi") return Math.PI;
      if (t.id === "e") return Math.E;
      if (fns[t.id]) {
        if (!peek() || peek().op !== "(") throw new Error("Use brackets: " + t.id + "(9)");
        i++;
        const v = expr_();
        if (!peek() || peek().op !== ")") throw new Error("Missing a closing bracket.");
        i++;
        return fns[t.id](v);
      }
      throw new Error("I don't know \"" + t.id + "\".");
    }
    throw new Error("Something is wrong near \"" + t.op + "\".");
  }

  const result = expr_();
  if (i < tokens.length) throw new Error("Something is wrong in that calculation.");
  if (!Number.isFinite(result)) throw new Error("The answer is not a normal number (dividing by zero?).");
  return result;
}

// 12345.6789 -> "12,345.6789", tidy rounding
const fmt = (n, digits = 6) => {
  const r = Number(n.toFixed(digits));
  return r.toLocaleString("en-US", { maximumFractionDigits: digits });
};

// Same text always gives the same number (used for love %, ratings)
function hash(str) {
  let h = 5381;
  for (const ch of String(str).toLowerCase().trim()) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
  return h;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = { input, calc, fmt, hash, pick };
