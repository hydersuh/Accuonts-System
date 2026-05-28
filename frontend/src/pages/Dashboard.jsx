import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
// import StatsCard from "../components/Dashboard/StatsCard";
// import RecentTransactions from "../components/Dashboard/RecentTransactions";
// import ChartCard from "../components/Dashboard/ChartCard";
// import TopLedgers from "../components/Dashboard/TopLedgers";
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [topLedgers, setTopLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/dashboard/stats", {
        params: { fyId: 1 },
      });
      const data = response.data;
      setStats(data.stats);
      setRecentVouchers(data.recent_vouchers || []);
      setMonthlySummary(data.monthly_summary || []);
      setTopLedgers(data.top_ledgers || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Transactions",
      value: stats?.total_transactions || 0,
      icon: CurrencyDollarIcon,
      color: "bg-blue-500",
      format: "currency",
    },
    {
      title: "Total Vouchers",
      value: stats?.total_vouchers || 0,
      icon: DocumentTextIcon,
      color: "bg-green-500",
      format: "number",
    },
    {
      title: "Active Ledgers",
      value: stats?.total_ledgers || 0,
      icon: UsersIcon,
      color: "bg-purple-500",
      format: "number",
    },
    {
      title: "Bank Accounts",

      value: stats?.bank_ledgers || 0,
      icon: BuildingLibraryIcon,
      color: "bg-indigo-500",
      format: "number",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your accounts today.
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 
"
      >
        {statCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentTransactions transactions={recentVouchers} />
        <ChartCard data={monthlySummary} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TopLedgers ledgers={topLedgers} />
      </div>
    </div>
  );
}

export default Dashboard;
