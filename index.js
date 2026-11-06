const config = require("./config");
const manager = require("./lib/session");
const { startWeb } = require("./server/web");

// Keep the process alive when something unexpected happens.
process.on("unhandledRejection", (e) => console.log("Unhandled:", e?.message || e));
process.on("uncaughtException", (e) => console.log("Uncaught:", e?.message || e));

async function main() {
  console.log("Commands loaded:", [...new Set(manager.commands.values())].filter((c) => !c.hidden).length);

  const raw = String(config.owners?.[0] || "");
  const owner = raw.replace(/\D/g, "");
  const hasOwner = owner.length >= 8 && !/x/i.test(raw);

  if (hasOwner) manager.migrateLegacy(owner);
  await manager.restoreAll();

  // Your own number: prints a pairing code in this console if it is not linked yet.
  if (hasOwner && !manager.has(owner)) await manager.start(owner, { verbose: true });

  if (process.env.WEB !== "off") startWeb(manager);
}

main().catch((e) => console.log("Startup error:", e.message));
