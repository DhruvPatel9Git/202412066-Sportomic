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
        .collection("members")
        .find(
          {},
          {
            projection: {
              name: 1,
              status: 1,
              is_trial_user: 1,
              converted_from_trial: 1,
              join_date: 1,
            },
          }
        )
        .sort({ join_date: -1 })
        .limit(limit)
        .toArray();
    });

    send(res, 200, { items });
  } catch (err) {
    send(res, 500, { error: "Failed to load members", details: err.message });
  }
}

module.exports = handler;
