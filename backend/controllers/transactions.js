const url = require("url");
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
    const { query } = url.parse(req.url, true);
    const limit = Math.max(1, Math.min(parseInt(query.limit || "25", 10), 100));

    const items = await withDb(async (db) => {
      return db
        .collection("transactions")
        .aggregate([
          { $sort: { transaction_date: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: "bookings",
              localField: "booking_id",
              foreignField: "_id",
              as: "booking",
            },
          },
          { $unwind: { path: "$booking", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "venues",
              localField: "booking.venue_id",
              foreignField: "_id",
              as: "venue",
            },
          },
          { $unwind: { path: "$venue", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              type: 1,
              amount: 1,
              status: 1,
              transaction_date: 1,
              venue_name: "$venue.name",
            },
          },
        ])
        .toArray();
    });

    send(res, 200, { items });
  } catch (err) {
    send(res, 500, {
      error: "Failed to load transactions",
      details: err.message,
    });
  }
}

module.exports = handler;
