// Shared look for every menu. Change a symbol here and all menus follow.
const BULLET = "亗ツ";
const TOP = "╭──────────────────➤➤➤";
const BOTTOM = "╰──────────────────➤➤➤";
const END = "└──────────────────────";

const title = (text) => TOP + "\n│ " + text + "\n" + BOTTOM;
const section = (name) => "┌─⊷ *" + name + "*";

function uptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (d ? d + "d " : "") + h + "h " + m + "m " + (s % 60) + "s";
}

// Bold serif and italic serif letters (used by the ping card)
const remap = (text, ranges) =>
  [...text]
    .map((ch) => {
      const c = ch.codePointAt(0);
      for (const [from, to, base] of ranges) if (c >= from && c <= to) return String.fromCodePoint(base + c - from);
      return ch;
    })
    .join("");
const serifBold = (t) => remap(t, [[65, 90, 0x1d400], [97, 122, 0x1d41a], [48, 57, 0x1d7ce]]);
const serifItalic = (t) => remap(t.replace(/h/g, "\u0001"), [[65, 90, 0x1d434], [97, 122, 0x1d44e]]).replace(/\u0001/g, "ℎ");

module.exports = { BULLET, TOP, BOTTOM, END, title, section, uptime, serifBold, serifItalic };
