#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");

function isHexId(v) {
  return typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);
}

function toObjectIdMaybe(v) {
  return isHexId(v) ? new ObjectId(v) : v;
}

function toDateMaybe(v) {
  if (!v) return v;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d;
}

function normalizeDoc(coll, doc) {
  const out = { ...doc };
  // common _id normalization
  if (out._id) out._id = toObjectIdMaybe(out._id);

  if (coll === "members") {
    out.join_date = toDateMaybe(out.join_date);
    if (typeof out.is_trial_user === "string")
      out.is_trial_user = out.is_trial_user === "true";
    if (typeof out.converted_from_trial === "string")
      out.converted_from_trial = out.converted_from_trial === "true";
  }

  if (coll === "bookings") {
    out.venue_id = toObjectIdMaybe(out.venue_id);
    out.member_id = toObjectIdMaybe(out.member_id);
    out.sport_id = toObjectIdMaybe(out.sport_id);
    out.booking_date = toDateMaybe(out.booking_date);
  }

  if (coll === "transactions") {
    out.booking_id = toObjectIdMaybe(out.booking_id);
    out.transaction_date = toDateMaybe(out.transaction_date);
  }

  return out;
}

async function bulkUpsert(db, collName, docs) {
  if (!Array.isArray(docs) || docs.length === 0)
    return { inserted: 0, upserted: 0 };
  const ops = docs.map((d) => {
    const nd = normalizeDoc(collName, d);
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

async function main() {
  const inputArg = process.argv[2];
  const filePath = inputArg
    ? path.resolve(process.cwd(), inputArg)
    : path.resolve(__dirname, "../seed-data.json");

  if (!fs.existsSync(filePath)) {
    console.error("Seed file not found:", filePath);
    console.error("Provide a path or create backend/seed-data.json");
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON in seed file:", e.message);
    process.exit(1);
  }

  const db = await getDb();

  const collections = ["venues", "members", "bookings", "transactions"];
  const results = {};
  for (const coll of collections) {
    const docs = data[coll] || [];
    const res = await bulkUpsert(db, coll, docs);
    results[coll] = res;
  }

  console.log("Seed complete:", results);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
