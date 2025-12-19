import { useEffect, useState } from "react";
import { fetchJSON } from "../api";

export default function VenueSelect({ value, onChange }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJSON("/venues")
      .then((d) => mounted && setVenues(d.items || []))
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
      <option value="">All Venues</option>
      {venues.map((v) => (
        <option key={String(v._id)} value={String(v._id)}>
          {v.name}
        </option>
      ))}
    </select>
  );
}
