const { withDb } = require("../db");
const url = require("url");
const { ObjectId } = require("mongodb");

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
    const venueId =
      query.venue_id && /^[a-fA-F0-9]{24}$/.test(query.venue_id)
        ? new ObjectId(query.venue_id)
        : null;
    const sportId =
      query.sport_id && /^[a-fA-F0-9]{24}$/.test(query.sport_id)
        ? new ObjectId(query.sport_id)
        : null;

    const monthStr = query.month || null; // YYYY-MM
    let monthStart = null;
    let monthEnd = null;
    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      monthStart = new Date(monthStr + "-01T00:00:00.000Z");
      const parts = monthStr.split("-").map(Number);
      monthEnd = new Date(Date.UTC(parts[0], parts[1] - 1 + 1, 1));
    }

    const data = await withDb(async (db) => {
      // Active vs inactive members
      const membersFacet = await db
        .collection("members")
        .aggregate([
          {
            $facet: {
              active: [{ $match: { status: "active" } }, { $count: "count" }],
              inactive: [
                { $match: { status: { $ne: "active" } } },
                { $count: "count" },
              ],
            },
          },
          {
            $project: {
              active: { $ifNull: [{ $arrayElemAt: ["$active.count", 0] }, 0] },
              inactive: {
                $ifNull: [{ $arrayElemAt: ["$inactive.count", 0] }, 0],
              },
            },
          },
        ])
        .next();

      const members = membersFacet || { active: 0, inactive: 0 };

      // Total revenue from successful transactions (with optional filters)
      const txPipeline = [
        { $match: { status: "success" } },
        {
          $lookup: {
            from: "bookings",
            localField: "booking_id",
            foreignField: "_id",
            as: "booking",
          },
        },
        { $unwind: "$booking" },
      ];
      if (venueId) txPipeline.push({ $match: { "booking.venue_id": venueId } });
      if (sportId) txPipeline.push({ $match: { "booking.sport_id": sportId } });
      if (monthStart && monthEnd)
        txPipeline.push({
          $match: { transaction_date: { $gte: monthStart, $lt: monthEnd } },
        });
      txPipeline.push(
        { $group: { _id: null, total: { $sum: "$amount" } } },
        { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } }
      );
      const totalRevenueDoc = await db
        .collection("transactions")
        .aggregate(txPipeline)
        .next();
      const totalRevenue = totalRevenueDoc?.total || 0;

      // Revenue per venue
      const revenuePerVenue = await db
        .collection("transactions")
        .aggregate([
          { $match: { status: "success" } },
          {
            $lookup: {
              from: "bookings",
              localField: "booking_id",
              foreignField: "_id",
              as: "booking",
            },
          },
          { $unwind: "$booking" },
          {
            $group: { _id: "$booking.venue_id", revenue: { $sum: "$amount" } },
          },
          {
            $lookup: {
              from: "venues",
              localField: "_id",
              foreignField: "_id",
              as: "venue",
            },
          },
          { $unwind: { path: "$venue", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              venue_id: "$_id",
              venue_name: "$venue.name",
              revenue: 1,
            },
          },
          { $sort: { revenue: -1 } },
        ])
        .toArray();

      // Monthly revenue series
      const monthlyPipeline = [
        { $match: { status: "success" } },
        {
          $lookup: {
            from: "bookings",
            localField: "booking_id",
            foreignField: "_id",
            as: "booking",
          },
        },
        { $unwind: "$booking" },
      ];
      if (venueId)
        monthlyPipeline.push({ $match: { "booking.venue_id": venueId } });
      if (sportId)
        monthlyPipeline.push({ $match: { "booking.sport_id": sportId } });
      monthlyPipeline.push(
        {
          $group: {
            _id: {
              month: {
                $dateTrunc: { date: "$transaction_date", unit: "month" },
              },
            },
            total: { $sum: "$amount" },
          },
        },
        { $project: { _id: 0, month: "$_id.month", total: 1 } },
        { $sort: { month: 1 } }
      );
      const revenueMonthly = await db
        .collection("transactions")
        .aggregate(monthlyPipeline)
        .toArray();

      // Cancelled / refunded bookings count
      const cancelAgg = await db
        .collection("bookings")
        .aggregate([
          { $match: { status: { $in: ["cancelled", "refunded"] } } },
          ...(venueId ? [{ $match: { venue_id: venueId } }] : []),
          ...(sportId ? [{ $match: { sport_id: sportId } }] : []),
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .toArray();

      const cancelled =
        cancelAgg.find((d) => d._id === "cancelled")?.count || 0;
      const refunded = cancelAgg.find((d) => d._id === "refunded")?.count || 0;

      // Bookings summary (count, revenue, coupon redemptions)
      const bookingsMatch = [];
      if (venueId) bookingsMatch.push({ venue_id: venueId });
      if (sportId) bookingsMatch.push({ sport_id: sportId });
      if (monthStart && monthEnd)
        bookingsMatch.push({
          booking_date: { $gte: monthStart, $lt: monthEnd },
        });

      const bookingsAgg = await db
        .collection("bookings")
        .aggregate([
          ...(bookingsMatch.length
            ? [{ $match: { $and: bookingsMatch } }]
            : []),
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              revenue: { $sum: "$amount" },
              coupons: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ifNull: ["$coupon_code", false] },
                        { $ne: ["$coupon_code", ""] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              count: { $ifNull: ["$count", 0] },
              revenue: { $ifNull: ["$revenue", 0] },
              coupons: { $ifNull: ["$coupons", 0] },
            },
          },
        ])
        .next();

      const bookingsCount = bookingsAgg?.count || 0;
      const bookingRevenue = bookingsAgg?.revenue || 0;
      const couponRedemption = bookingsAgg?.coupons || 0;

      // Trial conversion
      const trialAgg = await db
        .collection("members")
        .aggregate([
          {
            $group: {
              _id: null,
              trial: {
                $sum: { $cond: [{ $eq: ["$is_trial_user", true] }, 1, 0] },
              },
              converted: {
                $sum: {
                  $cond: [{ $eq: ["$converted_from_trial", true] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              trial: { $ifNull: ["$trial", 0] },
              converted: { $ifNull: ["$converted", 0] },
            },
          },
        ])
        .next();

      const trials = trialAgg?.trial || 0;
      const converted = trialAgg?.converted || 0;
      const trialConversionRate =
        trials + converted > 0
          ? Math.round((converted / (trials + converted)) * 10000) / 100
          : 0;

      // Repeat booking rate
      const repeatAgg = await db
        .collection("bookings")
        .aggregate([
          ...(bookingsMatch.length
            ? [{ $match: { $and: bookingsMatch } }]
            : []),
          { $group: { _id: "$member_id", cnt: { $sum: 1 } } },
          {
            $group: {
              _id: null,
              membersWithBookings: { $sum: 1 },
              repeatMembers: { $sum: { $cond: [{ $gt: ["$cnt", 1] }, 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              membersWithBookings: { $ifNull: ["$membersWithBookings", 0] },
              repeatMembers: { $ifNull: ["$repeatMembers", 0] },
            },
          },
        ])
        .next();

      const membersWithBookings = repeatAgg?.membersWithBookings || 0;
      const repeatMembers = repeatAgg?.repeatMembers || 0;
      const repeatBookingRate =
        membersWithBookings > 0
          ? Math.round((repeatMembers / membersWithBookings) * 10000) / 100
          : 0;

      return {
        filters: { venue_id: venueId, sport_id: sportId, month: monthStr },
        members,
        revenue: {
          total: totalRevenue,
          perVenue: revenuePerVenue,
          monthly: revenueMonthly,
        },
        bookings: {
          count: bookingsCount,
          revenue: bookingRevenue,
          couponRedemption,
          cancelled,
          refunded,
          totalCancelledRefunded: cancelled + refunded,
          repeatBookingRate,
        },
        trials: { trials, converted, trialConversionRate },
        slotsUtilization: 0,
      };
    });

    send(res, 200, data);
  } catch (err) {
    send(res, 500, { error: "Failed to load dashboard", details: err.message });
  }
}

module.exports = handler;
