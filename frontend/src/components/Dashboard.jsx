import { useEffect, useState } from "react";
import { fetchJSON } from "../api";
import VenueSelect from "./VenueSelect.jsx";
import SportSelect from "./SportSelect.jsx";
import MonthSelect from "./MonthSelect.jsx";
import Chart from "./Chart.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [venueId, setVenueId] = useState("");
  const [sportId, setSportId] = useState("");
  const [month, setMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const parts = [];
    if (venueId) parts.push(`venue_id=${venueId}`);
    if (sportId) parts.push(`sport_id=${sportId}`);
    if (month) {
      // month as YYYY-MM
      const m = new Date(month).toISOString().slice(0, 7);
      parts.push(`month=${m}`);
    }
    const qs = parts.length ? `?${parts.join("&")}` : "";
    fetchJSON(`/dashboard${qs}`)
      .then((d) => {
        if (mounted) {
          setData(d);
          if (d?.revenue?.monthly) setAvailableMonths(d.revenue.monthly);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [venueId, sportId, month]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  const { members, revenue, bookings } = data;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <VenueSelect value={venueId} onChange={setVenueId} />
        <SportSelect value={sportId} onChange={setSportId} />
        <MonthSelect
          months={availableMonths}
          value={month}
          onChange={setMonth}
        />
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-title">Active Members</div>
          <div className="card-value">{members.active}</div>
        </div>
        <div className="card">
          <div className="card-title">Inactive Members</div>
          <div className="card-value">{members.inactive}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Revenue</div>
          <div className="card-value">
            ₹{Number(revenue.total).toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Cancelled/Refunded</div>
          <div className="card-value">{bookings.totalCancelledRefunded}</div>
        </div>
      </div>

      <h3>Revenue per Venue</h3>
      <table>
        <thead>
          <tr>
            <th>Venue</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {(revenue.perVenue || []).map((v) => (
            <tr key={String(v.venue_id)}>
              <td>{v.venue_name || String(v.venue_id)}</td>
              <td>₹{Number(v.revenue).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>Revenue - Venues</h3>
      <Chart data={revenue.monthly || []} />
    </div>
  );
}
