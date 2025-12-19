import { useEffect, useState } from "react";
import { fetchJSON } from "../api";

export default function SportSelect({ value, onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJSON("/sports")
      .then((d) => mounted && setItems(d.items || []))
      .catch((e) => setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  if (error) return <span className="error">{error}</span>;

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value || null)}
    >
      <option value="">All Sports</option>
      {items.map((s) => (
        <option key={String(s.sport_id)} value={String(s.sport_id)}>
          {s.sport_name || String(s.sport_id)}
        </option>
      ))}
    </select>
  );
}
