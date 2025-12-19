const { withDb } = require("../db");

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function isHexId(v) {
  return typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);
}

function toObjectIdMaybe(v, ObjectId) {
  return isHexId(v) ? new ObjectId(v) : v;
}

function toDateMaybe(v) {
  if (!v) return v;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d;
}

function normalizeDoc(coll, doc, ObjectId) {
  const out = { ...doc };
  if (out._id) out._id = toObjectIdMaybe(out._id, ObjectId);

  if (coll === "members") {
    out.join_date = toDateMaybe(out.join_date);
    if (typeof out.is_trial_user === "string")
      out.is_trial_user = out.is_trial_user === "true";
    if (typeof out.converted_from_trial === "string")
      out.converted_from_trial = out.converted_from_trial === "true";
  }

  if (coll === "bookings") {
    out.venue_id = toObjectIdMaybe(out.venue_id, ObjectId);
    out.member_id = toObjectIdMaybe(out.member_id, ObjectId);
    out.sport_id = toObjectIdMaybe(out.sport_id, ObjectId);
    out.booking_date = toDateMaybe(out.booking_date);
  }

  if (coll === "transactions") {
    out.booking_id = toObjectIdMaybe(out.booking_id, ObjectId);
    out.transaction_date = toDateMaybe(out.transaction_date);
  }

  return out;
}

async function bulkUpsert(db, collName, docs, ObjectId) {
  if (!Array.isArray(docs) || docs.length === 0)
    return { inserted: 0, upserted: 0 };
  const ops = docs.map((d) => {
    const nd = normalizeDoc(collName, d, ObjectId);
    if (nd._id) {
      return {
        replaceOne: { filter: { _id: nd._id }, replacement: nd, upsert: true },
      };
    }
    return { insertOne: { document: nd } };
  });
  const res = await db.collection(collName).bulkWrite(ops, { ordered: false });
  const upserted = res.upsertedCount || 0;
  const inserted = (res.insertedCount || 0) + (res.nInserted || 0);
  return { inserted, upserted };
}

// Accepts JSON body with collections: venues, members, bookings, transactions
async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return send(res, 405, { error: "Method Not Allowed" });

    let body = "";
    for await (const chunk of req) body += chunk;
    if (!body) return send(res, 400, { error: "Empty body" });

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (err) {
      return send(res, 400, { error: "Invalid JSON", details: err.message });
    }

    const result = await withDb(async (db) => {
      const { ObjectId } = require("mongodb");
      const collections = ["venues", "members", "bookings", "transactions"];
      const out = {};
      for (const coll of collections) {
        const docs = payload[coll] || [];
        out[coll] = await bulkUpsert(db, coll, docs, ObjectId);
      }
      return out;
    });

    send(res, 200, { ok: true, result });
  } catch (err) {
    send(res, 500, { error: "Import failed", details: err.message });
  }
}

module.exports = handler;
