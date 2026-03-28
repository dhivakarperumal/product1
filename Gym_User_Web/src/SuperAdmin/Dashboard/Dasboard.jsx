import React from "react";
import {
  FaUsers,
  FaRupeeSign,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ================= GLASS STYLE ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]";

/* ---------- STAT CARD ---------- */
const StatCard = ({ title, value, icon }) => (
  <div className={`${glassCard} p-6 flex justify-between items-center`}>
    <div>
      <p className="text-xs text-gray-300 uppercase">{title}</p>
      <h2 className="text-2xl font-bold text-white mt-2">{value}</h2>
    </div>
    <div className="text-xl text-white">{icon}</div>
  </div>
);

const Dashboard = () => {
  /* ---------- MOCK DATA ---------- */
  const stats = {
    users: 320,
    revenue: 125000,
    success: 240,
    pending: 35,
  };

  const revenueData = [
    { month: "Jan", revenue: 10000 },
    { month: "Feb", revenue: 15000 },
    { month: "Mar", revenue: 20000 },
    { month: "Apr", revenue: 18000 },
    { month: "May", revenue: 22000 },
    { month: "Jun", revenue: 25000 },
  ];

  const paymentStatusData = [
    { name: "Success", value: 240 },
    { name: "Pending", value: 35 },
    { name: "Failed", value: 10 },
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  const payments = [
    { id: 1, name: "Arun", amount: 1200, status: "Success" },
    { id: 2, name: "Kumar", amount: 800, status: "Pending" },
    { id: 3, name: "Ravi", amount: 1500, status: "Success" },
    { id: 4, name: "John", amount: 600, status: "Failed" },
  ];

  return (
    <div className="space-y-8 text-white">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <p className="text-gray-400 text-sm">
          Users & Payments Overview
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.users} icon={<FaUsers />} />
        <StatCard title="Revenue" value={`₹ ${stats.revenue}`} icon={<FaRupeeSign />} />
        <StatCard title="Success Payments" value={stats.success} icon={<FaCheckCircle />} />
        <StatCard title="Pending Payments" value={stats.pending} icon={<FaClock />} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BAR CHART */}
        <div className={`${glassCard} p-6`}>
          <h2 className="text-sm uppercase text-gray-300 mb-4">
            Monthly Revenue
          </h2>

          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className={`${glassCard} p-6`}>
          <h2 className="text-sm uppercase text-gray-300 mb-4">
            Payment Status
          </h2>

          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT PAYMENTS */}
      <div className={`${glassCard} p-6`}>
        <h2 className="text-sm uppercase text-gray-300 mb-4">
          Recent Payments
        </h2>

        <table className="w-full text-sm text-left text-white">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th>#</th>
              <th>Name</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p, i) => (
              <tr key={p.id} className="border-b border-white/10">
                <td className="py-3">{i + 1}</td>
                <td>{p.name}</td>
                <td className="text-emerald-400 font-semibold">
                  ₹ {p.amount}
                </td>
                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      p.status === "Success"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : p.status === "Pending"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Dashboard;