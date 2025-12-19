// Minimal SVG line chart for monthly revenue
export default function Chart({ data }) {
  const points = (data || []).map((d) => ({
    x: new Date(d.month).getTime(),
    y: Number(d.total) || 0,
  }));

  if (!points.length) return <p>No data</p>;

  const width = 800;
  const height = 240;
  const padding = 32;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(...ys, 1);

  const scaleX = (x) =>
    padding + ((x - minX) / (maxX - minX || 1)) * (width - padding * 2);
  const scaleY = (y) =>
    height -
    padding -
    ((y - minY) / (maxY - minY || 1)) * (height - padding * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`)
    .join(" ");

  const monthsFmt = (d) =>
    new Date(d).toLocaleString(undefined, { month: "short" });

  const ticks = 6;
  const tickXs = Array.from(
    { length: ticks },
    (_, i) => minX + (i * (maxX - minX)) / (ticks - 1)
  );
  const tickLabels = tickXs.map((x) => monthsFmt(x));

  return (
    <svg
      width={width}
      height={height}
      style={{
        border: "1px solid #8884",
        borderRadius: 8,
        background: "#f8f8f8",
      }}
    >
      {/* axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#999"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#999"
      />

      {/* grid and ticks */}
      {tickXs.map((x, i) => (
        <g key={i}>
          <line
            x1={scaleX(x)}
            y1={padding}
            x2={scaleX(x)}
            y2={height - padding}
            stroke="#eee"
          />
          <text
            x={scaleX(x)}
            y={height - padding + 16}
            fontSize="10"
            textAnchor="middle"
            fill="#666"
          >
            {tickLabels[i]}
          </text>
        </g>
      ))}

      {/* path */}
      <path d={path} fill="none" stroke="#646cff" strokeWidth={2} />

      {/* points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(p.x)}
          cy={scaleY(p.y)}
          r={3}
          fill="#646cff"
        />
      ))}

      {/* title */}
      <text x={width / 2} y={16} fontSize="12" textAnchor="middle" fill="#333">
        Revenue - Monthly
      </text>
    </svg>
  );
}
