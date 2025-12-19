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
      // Aggregate distinct sport_ids from bookings and return counts
      const rows = await db
        .collection("bookings")
        .aggregate([
          { $match: { sport_id: { $exists: true, $ne: null } } },
          { $group: { _id: "$sport_id", count: { $sum: 1 } } },
          { $project: { _id: 0, sport_id: "$_id", count: 1 } },
          { $sort: { count: -1 } },
        ])
        .toArray();
      return rows;
    });

    send(res, 200, { items });
  } catch (err) {
    send(res, 500, { error: "Failed to load sports", details: err.message });
  }
}

module.exports = handler;
