# Sportomic Booking Analytics

Tech: Node.js http server (no Express), MongoDB native driver, React + Vite. No auth.

## Folder Structure

- backend/ — Node server, MongoDB connection, controllers
- frontend/ — Vite React app, minimal UI

## Backend

Env variables (copy `backend/.env.example` to `backend/.env`):

- `MONGODB_URI` — MongoDB Atlas connection string
- `DB_NAME` — database name (e.g. `sportomic`)
- `PORT` — default `3001`

Install and run:

```bash
cd backend
npm install
npm run dev
```

Endpoints:

- GET `/dashboard` — active/inactive members, total revenue, revenue per venue, cancelled/refunded counts
- GET `/bookings?limit=20`
- GET `/members?limit=20`
- GET `/transactions?limit=20`

Notes:

- Connection is reused across requests via a singleton client/db cache.
- Responses are JSON and optimized to return only necessary fields.

## Frontend

Install and run:

```bash
cd frontend
npm install
npm run dev
```

Optional: set `VITE_API_BASE_URL` in `frontend/.env` (default is http://localhost:3001).

Open the Vite dev URL (default http://localhost:5173). The app fetches the backend endpoints and displays:

- Dashboard metrics (cards + revenue per venue table)
- Bookings table
- Members table
- Transactions table

## Production build

```bash
cd frontend
npm run build
npm run preview
```

## Data expectations

Collections (by name): `venues`, `members`, `bookings`, `transactions`.

- `members.status`: uses `'active'` for active; all others counted as inactive in the dashboard.
- `transactions.status`: `'success'` entries are used for revenue totals and per-venue revenue.
- `bookings.status`: `'cancelled'` and `'refunded'` are counted in cancellation metrics.

You can adapt statuses/fields in the controllers if your dataset differs.

## Seeding data

Prepare a seed file by copying the example:

```bash
cd backend
copy seed-data.example.json seed-data.json
```

Edit `backend/seed-data.json` and then run the seed script:

```bash
cd backend
node scripts/seed.js
# or provide a custom path
node scripts/seed.js C:\\path\\to\\your-data.json
```

The seed script upserts by `_id` when provided, otherwise inserts new documents. It also converts 24-char hex strings to ObjectId for reference fields and parses date strings.

Import via HTTP

You can also import JSON directly via the backend HTTP endpoint (no auth). POST your JSON to `/import` on the backend (content-type: `application/json`). The server will upsert the same collections as the seed script.

Example (PowerShell):

```powershell
curl -X POST "http://localhost:3001/import" -H "Content-Type: application/json" -d (Get-Content seed-data.json -Raw)
```
