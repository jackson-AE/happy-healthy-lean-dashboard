const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index < 1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnv();

const reportingData = require("./api/reporting-data");
const port = Number(process.env.PORT || 8790);

function sendFile(res, file, contentType) {
  res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
  res.end(fs.readFileSync(file));
}

function runHandler(handler, req, res) {
  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function json(body) {
    if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
  };
  return handler(req, res);
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/reporting-data") return runHandler(reportingData, req, res);
  if (url.pathname === "/agency-engineer-icon.png") {
    return sendFile(res, path.join(__dirname, "agency-engineer-icon.png"), "image/png");
  }
  if (url.pathname === "/" || url.pathname === "/hhl-dashboard.html") {
    return sendFile(res, path.join(__dirname, "hhl-dashboard.html"), "text/html; charset=utf-8");
  }
  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not found" }));
}).listen(port, "127.0.0.1", () => {
  console.log(`Happy Healthy Lean dashboard running at http://127.0.0.1:${port}/`);
});
