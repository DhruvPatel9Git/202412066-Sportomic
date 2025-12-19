import { useEffect, useState } from "react";
import { fetchJSON } from "../api";

export default function Members() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJSON("/members?limit=20")
      .then((d) => mounted && setItems(d.items || []))
      .catch((e) => setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  if (loading) return <p>Loading members...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Trial User</th>
          <th>Converted</th>
          <th>Join Date</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr key={String(m._id)}>
            <td>{m.name}</td>
            <td>{m.status}</td>
            <td>{m.is_trial_user ? "Yes" : "No"}</td>
            <td>{m.converted_from_trial ? "Yes" : "No"}</td>
            <td>
              {m.join_date ? new Date(m.join_date).toLocaleDateString() : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
