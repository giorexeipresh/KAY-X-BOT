const config = require("../../config");

module.exports = {
  name: "setlink",
  desc: "Set the pairing page link shown in .ping. Example: .setlink https://your-site.com",
  ownerOnly: true,
  async run({ args, reply, settings, saveSettings }) {
    const a = (args[0] || "").trim();
    const cur = settings.pairUrl || config.pairUrl || "(none)";
    if (!a) return reply("Current link: " + cur + "\n\nSet it: .setlink https://your-site.com\nRemove it: .setlink off");
    if (a.toLowerCase() === "off") {
      delete settings.pairUrl;
      saveSettings();
      return reply("✅ Link removed from .ping.");
    }
    if (!/^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}$/i.test(a)) return reply("That doesn't look like a web link.\nExample: .setlink https://your-site.com");
    settings.pairUrl = a;
    saveSettings();
    await reply("✅ Link saved. It now shows in .ping:\n" + a);
  },
};
