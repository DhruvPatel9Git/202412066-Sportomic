const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return res.json();
}
