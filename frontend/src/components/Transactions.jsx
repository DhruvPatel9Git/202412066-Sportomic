import { useEffect, useState } from "react";
import { fetchJSON } from "../api";

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJSON("/transactions?limit=20")
      .then((d) => mounted && setItems(d.items || []))
      .catch((e) => setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  if (loading) return <p>Loading transactions...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Venue</th>
        </tr>
      </thead>
      <tbody>
        {items.map((t) => (
          <tr key={String(t._id)}>
            <td>
              {t.transaction_date
                ? new Date(t.transaction_date).toLocaleString()
                : "-"}
            </td>
            <td>{t.type || "-"}</td>
            <td>{t.status || "-"}</td>
            <td>
              {t.amount != null ? `₹${Number(t.amount).toLocaleString()}` : "-"}
            </td>
            <td>{t.venue_name || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
