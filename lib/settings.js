const fs = require("fs");
const path = require("path");

// Small per-number settings file kept next to that number's login (sessions/<number>/settings.json).
function load(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, "settings.json"), "utf8"));
  } catch (e) {
    return {};
  }
}

function save(dir, data) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Could not save settings:", e.message);
  }
}

module.exports = { load, save };
