import { useState } from "react";
import {
  FaSearch,
  FaRupeeSign,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

/* ================= GLASS STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30";

/* ---------- STATUS STYLE ---------- */
const getStatusStyle = (status) => {
  switch (status) {
    case "Success":
      return "bg-emerald-500/20 text-emerald-300";
    case "Pending":
      return "bg-yellow-500/20 text-yellow-300";
    case "Failed":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-gray-500/20 text-gray-300";
  }
};

const Payment = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ---------- PAGINATION ---------- */
  const [page, setPage] = useState(1);
  const pageSize = 6;

  /* ---------- MOCK DATA ---------- */
  const payments = [
    { id: "TXN001", user: "Arun Kumar", email: "arun@gmail.com", amount: 1200, method: "UPI", status: "Success", date: "2026-03-27", time: "10:30 AM" },
    { id: "TXN002", user: "Ravi Kumar", email: "ravi@gmail.com", amount: 800, method: "Card", status: "Pending", date: "2026-03-27", time: "11:45 AM" },
    { id: "TXN003", user: "John", email: "john@gmail.com", amount: 1500, method: "Net Banking", status: "Success", date: "2026-03-26", time: "02:15 PM" },
    { id: "TXN004", user: "Kumar", email: "kumar@gmail.com", amount: 600, method: "UPI", status: "Failed", date: "2026-03-26", time: "05:20 PM" },
    { id: "TXN005", user: "Vijay", email: "vijay@gmail.com", amount: 2000, method: "Card", status: "Success", date: "2026-03-25", time: "09:10 AM" },
    { id: "TXN006", user: "Ajay", email: "ajay@gmail.com", amount: 950, method: "UPI", status: "Pending", date: "2026-03-25", time: "01:25 PM" },
  ];

  /* ---------- FILTER ---------- */
  const filtered = payments.filter((p) => {
    const matchSearch =
      p.user.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" || p.status === statusFilter;

    return matchSearch && matchStatus;
  });

  /* ---------- PAGINATION LOGIC ---------- */
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pagedData = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-8 text-white">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-gray-400 text-sm">
          Manage all transactions and payment details
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className={`${glassCard} p-6 flex justify-between items-center`}>
          <div>
            <p className="text-xs text-gray-300 uppercase">Total Revenue</p>
            <h2 className="text-2xl font-bold">₹ 8,050</h2>
          </div>
          <FaRupeeSign className="text-green-300 text-xl" />
        </div>

        <div className={`${glassCard} p-6 flex justify-between items-center`}>
          <div>
            <p className="text-xs text-gray-300 uppercase">Successful</p>
            <h2 className="text-2xl font-bold">3</h2>
          </div>
          <FaCheckCircle className="text-emerald-300 text-xl" />
        </div>

        <div className={`${glassCard} p-6 flex justify-between items-center`}>
          <div>
            <p className="text-xs text-gray-300 uppercase">Pending</p>
            <h2 className="text-2xl font-bold">2</h2>
          </div>
          <FaClock className="text-yellow-300 text-xl" />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={`${glassCard} p-5 flex flex-col lg:flex-row gap-4 justify-between`}>
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user or email"
            className={`pl-10 w-full ${glassInput}`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={glassInput}
        >
          <option value="all">All Status</option>
          <option value="Success">Success</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* TABLE */}
      <div className={`${glassCard} overflow-hidden`}>
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-white/20">
            <tr>
              <th className="px-4 py-4 text-left">Txn ID</th>
              <th className="px-4 py-4 text-left">User</th>
              <th className="px-4 py-4 text-left">Email</th>
              <th className="px-4 py-4 text-left">Amount</th>
              <th className="px-4 py-4 text-left">Method</th>
              <th className="px-4 py-4 text-left">Date</th>
              <th className="px-4 py-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {pagedData.map((p) => (
              <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold">{p.id}</td>
                <td className="px-4 py-3">{p.user}</td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">
                  ₹ {p.amount}
                </td>
                <td className="px-4 py-3">{p.method}</td>
                <td className="px-4 py-3">{p.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(p.status)}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}

            {pagedData.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-400">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 bg-white/10 rounded"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${
                page === i + 1 ? "bg-blue-500" : "bg-white/10"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 bg-white/10 rounded"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Payment;