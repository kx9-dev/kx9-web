import http from "node:http";
import fs from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hostnameFromHeaders, resolveSiteFile } from "./routing.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(packageRoot, process.argv.includes("--dev") ? "public" : "dist/public");
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("A valid PORT is required.");
if (!fs.existsSync(path.join(root, "index.html"))) throw new Error("Site is missing; run sync or build first.");
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json",
};
function log(level, event, fields = {}) {
  process.stdout.write(`${JSON.stringify({level, event, ...fields})}\n`);
}
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, {Allow: "GET, HEAD"}).end("Method not allowed"); return;
  }
  if (req.url === "/healthz") {
    res.writeHead(200, {"Content-Type": "application/json"}).end(req.method === "HEAD" ? undefined : '{"status":"ok"}'); return;
  }
  try {
    const file = resolveSiteFile(root, hostnameFromHeaders(req.headers), req.url);
    if (!file) { res.writeHead(404).end("Not found"); return; }
    let info;
    try { info = await stat(file); }
    catch (error) { if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error; }
    if (!info?.isFile()) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": path.extname(file) === ".html" ? "no-cache" : "public, max-age=3600",
    });
    if (req.method === "HEAD") { res.end(); return; }
    const stream = fs.createReadStream(file);
    stream.on("error", () => { log("error", "file_stream_failed"); res.destroy(); });
    stream.pipe(res);
  } catch (error) {
    if (error instanceof URIError || error instanceof TypeError) {
      res.writeHead(400).end("Invalid request"); return;
    }
    log("error", "request_failed", {code: error.code || "UNKNOWN"});
    if (!res.headersSent) res.writeHead(500).end("Unable to load this page.");
    else res.destroy();
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, "0.0.0.0", () => log("info", "site_listening", {port}));
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    log("info", "site_stopping");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
