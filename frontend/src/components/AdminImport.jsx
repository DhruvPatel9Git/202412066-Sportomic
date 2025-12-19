import { useState } from "react";

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);

  async function upload() {
    if (!file) return setStatus("Select a JSON file first");
    setStatus("Uploading...");
    try {
      const text = await file.text();
      const res = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001") +
          "/import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: text,
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      setStatus("Import successful: " + JSON.stringify(json.result));
    } catch (err) {
      setStatus("Import failed: " + err.message);
    }
  }

  return (
    <div>
      <h2>Admin Import</h2>
      <p>
        Upload a JSON file with `venues`, `members`, `bookings`, `transactions`
        arrays.
      </p>
      <input
        type="file"
        accept="application/json"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={upload}>Upload and Import</button>
      </div>
      {status && <p style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}
