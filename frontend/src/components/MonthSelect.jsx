export default function MonthSelect({ months = [], value, onChange }) {
  // months: array of { month: ISODateString }
  const opts = (months || []).map((m) => ({
    value: m.month,
    label: new Date(m.month).toLocaleString(undefined, {
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value || null)}
    >
      <option value="">All Months</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
