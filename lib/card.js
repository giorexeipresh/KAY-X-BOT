const fs = require("fs");
const path = require("path");
const config = require("../config");

const MEDIA = path.join(__dirname, "..", "media");
const CAPTION_LIMIT = 900; // image captions are short on WhatsApp, longer text goes in a second message

// Random picture from /media. default.jpg is only used when you have added no pictures of your own.
function localImage() {
  try {
    const all = fs.readdirSync(MEDIA).filter((f) => /\.(jpe?g|png)$/i.test(f));
    const own = all.filter((f) => !/^default\./i.test(f));
    const pool = own.length ? own : all;
    if (!pool.length) return null;
    return fs.readFileSync(path.join(MEDIA, pool[Math.floor(Math.random() * pool.length)]));
  } catch (e) {
    return null;
  }
}

// The group's own profile picture. Returns null if the group has none or WhatsApp refuses.
async function groupPicture(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, "image");
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    return null;
  }
}

// Sends a menu as a picture with the text under it. Falls back to plain text if no picture works.
async function sendCard({ sock, from, msg, isGroup }, text, { groupPic = false } = {}) {
  const quoted = { quoted: msg };
  let img = null;
  const chance = config.groupImageChance ?? 0.5;
  if (isGroup && groupPic && Math.random() < chance) img = await groupPicture(sock, from);
  if (!img) img = localImage();
  if (!img) return sock.sendMessage(from, { text }, quoted);

  if (text.length <= CAPTION_LIMIT) {
    return sock.sendMessage(from, { image: img, caption: text }, quoted);
  }
  const cut = text.indexOf("\n\n");
  const head = cut > 0 ? text.slice(0, cut) : text.slice(0, CAPTION_LIMIT);
  const rest = cut > 0 ? text.slice(cut + 2) : text.slice(CAPTION_LIMIT);
  await sock.sendMessage(from, { image: img, caption: head }, quoted);
  return sock.sendMessage(from, { text: rest }, quoted);
}

module.exports = { sendCard };
