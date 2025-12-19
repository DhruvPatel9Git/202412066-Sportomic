import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import Bookings from "./components/Bookings.jsx";
import Members from "./components/Members.jsx";
import Transactions from "./components/Transactions.jsx";
import AdminImport from "./components/AdminImport.jsx";

export default function App() {
  const [view, setView] = useState("dashboard");

  return (
    <div className="container">
      <h1>Sportomic Analytics</h1>
      <nav className="tabs">
        <button
          className={view === "dashboard" ? "active" : ""}
          onClick={() => setView("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={view === "bookings" ? "active" : ""}
          onClick={() => setView("bookings")}
        >
          Bookings
        </button>
        <button
          className={view === "members" ? "active" : ""}
          onClick={() => setView("members")}
        >
          Members
        </button>
        <button
          className={view === "transactions" ? "active" : ""}
          onClick={() => setView("transactions")}
        >
          Transactions
        </button>
        <button
          className={view === "admin" ? "active" : ""}
          onClick={() => setView("admin")}
        >
          Admin
        </button>
      </nav>

      <div className="content">
        {view === "dashboard" && <Dashboard />}
        {view === "bookings" && <Bookings />}
        {view === "members" && <Members />}
        {view === "transactions" && <Transactions />}
        {view === "admin" && <AdminImport />}
      </div>
    </div>
  );
}
