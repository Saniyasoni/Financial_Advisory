import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Verify from "./pages/Verify";
import DevInbox from "./pages/DevInbox";
import React from "react";
import Profile from "./pages/Profile";
import Goals from "./pages/Goals";
import BudgetPlanner from "./pages/BudgetPlanner";
import Insights from "./pages/Insights";
import Analytics from "./pages/Analytics";

function Protected({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dev/inbox" element={<DevInbox />} />


        {/* Dashboard */}
        <Route
          path="/:username/dashboard"
          element={
         <Protected>
         <Dashboard />
         </Protected>
        }
/>

        {/* User transactions → /username_with_underscores/transactions */}
        <Route
          path="/:username/transactions"
          element={
          <Protected>
          <Transactions />
          </Protected>
        }
      />
            <Route
        path="/:username/profile"
        element={
          <Protected>
            <Profile />
          </Protected>
        }
      />
      
      {/* Goals */}
      <Route
        path="/:username/goals"
        element={
          <Protected>
            <Goals />
          </Protected>
        }
      />
      
      {/* Budget Planner */}
      <Route
        path="/:username/budget"
        element={
          <Protected>
            <BudgetPlanner />
          </Protected>
        }
      />
      
      {/* Insights */}
      <Route
        path="/:username/insights"
        element={
          <Protected>
            <Insights />
          </Protected>
        }
      />

      {/* Analytics */}
      <Route
        path="/:username/analytics"
        element={
          <Protected>
            <Analytics />
          </Protected>
        }
      />

      </Routes>

    </BrowserRouter>
  );
}
