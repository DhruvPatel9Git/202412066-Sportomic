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
        .collection("bookings")
        .aggregate([
          { $sort: { booking_date: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: "members",
              localField: "member_id",
              foreignField: "_id",
              as: "member",
            },
          },
          { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "venues",
              localField: "venue_id",
              foreignField: "_id",
              as: "venue",
            },
          },
          { $unwind: { path: "$venue", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              booking_date: 1,
              amount: 1,
              status: 1,
              coupon_code: 1,
              member_name: "$member.name",
              venue_name: "$venue.name",
            },
          },
        ])
        .toArray();
    });

    send(res, 200, { items });
  } catch (err) {
    send(res, 500, { error: "Failed to load bookings", details: err.message });
  }
}

module.exports = handler;
