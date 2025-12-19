const { withDb } = require("../db");

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

async function handler(req, res) {
  try {
    const items = await withDb(async (db) => {
      return db
        .collection("venues")
        .find({}, { projection: { name: 1, location: 1 } })
        .sort({ name: 1 })
        .toArray();
    });
    send(res, 200, { items });
  } catch (err) {
    send(res, 500, { error: "Failed to load venues", details: err.message });
  }
}

module.exports = handler;
