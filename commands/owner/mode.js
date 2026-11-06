const config = require("../../config");

module.exports = {
  name: "mode",
  desc: "Set bot mode: .mode public or .mode private",
  ownerOnly: true,
  async run({ args, reply, settings, saveSettings }) {
    const m = (args[0] || "").toLowerCase();
    const cur = settings.mode || config.mode || "public";
    if (!["public", "private"].includes(m))
      return reply("Current mode: " + cur + "\nUse: .mode public or .mode private");
    settings.mode = m;
    saveSettings();
    await reply("⚙️ Mode set to " + m.toUpperCase());
  },
};
