require("dotenv").config();
const http = require("http");
const url = require("url");
const dashboard = require("./controllers/dashboard");
const bookings = require("./controllers/bookings");
const members = require("./controllers/members");
const transactions = require("./controllers/transactions");
const venues = require("./controllers/venues");
const sports = require("./controllers/sports");
const { getDb } = require("./db");

const PORT = process.env.PORT || 3001;

function setCors(req, res) {
  const origin = req.headers?.origin;
  const allowed = (
    process.env.ALLOWED_ORIGINS ||
    "https://two02412066-sportomic.onrender.com,http://localhost:5173"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    // tell caches the response varies by origin
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer(async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsed = url.parse(req.url, true);
  const { pathname } = parsed;

  try {
    // Ensure DB ready (warms up connection fast on first request)
    await getDb();

    if (pathname === "/dashboard") return dashboard(req, res);
    if (pathname === "/bookings") return bookings(req, res);
    if (pathname === "/members") return members(req, res);
    if (pathname === "/transactions") return transactions(req, res);
    if (pathname === "/venues") return venues(req, res);
    if (pathname === "/sports") return sports(req, res);

    // Import endpoint (POST) - allows uploading JSON to insert/upsert collections
    if (pathname === "/import") {
      const importer = require("./controllers/import");
      return importer(req, res);
    }

    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: "Internal Server Error", details: err.message })
    );
  }
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
