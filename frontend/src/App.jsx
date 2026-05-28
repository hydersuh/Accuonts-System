import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";

// Layout
import Layout from "./components/Layout/Layout";
import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import Footer from "./components/Layout/Footer";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ledgers from "./pages/Ledgers";
// import Vouchers from "./pages/Vouchers";
// import Reports from "./pages/Reports";
// import ChartOfAccounts from "./pages/ChartOfAccounts";
// import Settings from "./pages/Settings";
// import FinancialYears from "./pages/FinancialYears";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="ledgers" element={<Ledgers />} />
          {/* <Route path="vouchers" element={<Vouchers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
          <Route path="financial-years" element={<FinancialYears />} />
          <Route path="settings" element={<Settings />} /> */} 
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
