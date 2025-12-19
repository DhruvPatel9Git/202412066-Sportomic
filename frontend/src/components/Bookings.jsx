import { useEffect, useState } from "react";
import { fetchJSON } from "../api";

export default function Bookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJSON("/bookings?limit=20")
      .then((d) => mounted && setItems(d.items || []))
      .catch((e) => setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Member</th>
          <th>Venue</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Coupon</th>
        </tr>
      </thead>
      <tbody>
        {items.map((b) => (
          <tr key={String(b._id)}>
            <td>
              {b.booking_date ? new Date(b.booking_date).toLocaleString() : "-"}
            </td>
            <td>{b.member_name || "-"}</td>
            <td>{b.venue_name || "-"}</td>
            <td>
              {b.amount != null ? `₹${Number(b.amount).toLocaleString()}` : "-"}
            </td>
            <td>{b.status || "-"}</td>
            <td>{b.coupon_code || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
