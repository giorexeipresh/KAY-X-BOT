const fs = require("fs");
const path = require("path");

// Loads every .js file under /commands. A file can export one command or an array of them.
function loadCommands(dir = path.join(__dirname, "..", "commands")) {
  const commands = new Map();
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith(".js")) {
        try {
          const mod = require(p);
          for (const c of Array.isArray(mod) ? mod : [mod]) {
            if (!c.name || typeof c.run !== "function") continue;
            c.category = c.category || path.basename(path.dirname(p));
            for (const n of [c.name, ...(c.aliases || [])]) {
              if (commands.has(n)) console.log("Warning: two commands use the name \"" + n + "\" (" + f.name + ")");
              commands.set(n, c);
            }
          }
        } catch (e) {
          console.log("Failed to load", f.name, "-", e.message);
        }
      }
    }
  };
  walk(dir);
  return commands;
}

module.exports = { loadCommands };
