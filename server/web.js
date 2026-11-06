const http = require("http");
const fs = require("fs");
const path = require("path");
const config = require("../config");

const PAGE = path.join(__dirname, "..", "public", "index.html");

// Simple limit so nobody can spam pairing requests: 5 per 10 minutes per visitor.
const hits = new Map();
function limited(ip, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) {
    const keep = list.filter((t) => now - t < 10 * 60 * 1000);
    if (keep.length) hits.set(ip, keep);
    else hits.delete(ip);
  }
}, 10 * 60 * 1000).unref();

const send = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
};

function readBody(req, limit = 2048) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > limit) {
        reject(new Error("Too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function startWeb(manager) {
  const port = Number(process.env.PORT) || config.port || 3000;

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const ip =
        (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";

      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(fs.readFileSync(PAGE));
      }

      // Used by uptime pingers so free hosts stay awake.
      if (req.method === "GET" && url.pathname === "/health") {
        return send(res, 200, {
          ok: true,
          sessions: manager.count(),
          online: manager.online(),
          uptime: Math.floor(process.uptime()),
        });
      }

      if (req.method === "GET" && url.pathname === "/api/stats") {
        return send(res, 200, manager.stats());
      }

      if (req.method === "GET" && url.pathname === "/api/status") {
        return send(res, 200, manager.getStatus(url.searchParams.get("number")));
      }

      if (req.method === "POST" && url.pathname === "/api/pair") {
        if (limited(ip)) return send(res, 429, { error: "Too many tries. Wait 10 minutes and try again." });
        let number;
        try {
          number = JSON.parse(await readBody(req)).number;
        } catch (e) {
          return send(res, 400, { error: "Bad request." });
        }
        try {
          return send(res, 200, await manager.requestPair(number));
        } catch (e) {
          return send(res, 400, { error: e.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/qr/start") {
        if (limited(ip)) return send(res, 429, { error: "Too many tries. Wait 10 minutes and try again." });
        try {
          return send(res, 200, await manager.startQr());
        } catch (e) {
          return send(res, 400, { error: e.message });
        }
      }

      if (req.method === "GET" && url.pathname === "/api/qr/poll") {
        return send(res, 200, await manager.qrStatus(url.searchParams.get("id")));
      }

      send(res, 404, { error: "Not found" });
    } catch (e) {
      send(res, 500, { error: "Server error" });
    }
  });

  server.listen(port, "0.0.0.0", () => console.log("Pairing page: http://localhost:" + port));
  return server;
}

module.exports = { startWeb };
