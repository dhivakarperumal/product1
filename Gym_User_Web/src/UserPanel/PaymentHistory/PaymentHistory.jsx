import { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { resolveUserId } from "../../utils/userUtils";
import { History, CheckCircle } from "lucide-react";

const PaymentHistory = () => {
  const { user } = useAuth();
  const userId = resolveUserId(user);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, emi, orders
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, amount-desc, amount-asc

  useEffect(() => {
    fetchPaymentHistory();
  }, [userId]);

  const fetchPaymentHistory = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch EMI payments
      const emiRes = await api.get(`/memberships/emi/upcoming?userId=${userId}&daysAhead=365`);
      const emiData = Array.isArray(emiRes.data)
        ? emiRes.data
        : Array.isArray(emiRes.data?.data)
        ? emiRes.data.data
        : [];
      const emiPayments = emiData.map((p) => ({
        ...p,
        type: "EMI",
        date: p.paidDate || p.dueDate,
      }));

      // Fetch order payments
      const ordersRes = await api.get(`/orders/user/${userId}`);
      const ordersData = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : Array.isArray(ordersRes.data?.data)
        ? ordersRes.data.data
        : [];
      const orders = ordersData.map((o) => ({
        id: o.order_id || o.id,
        type: "ORDER",
        amount: Number(o.total_price || o.totalPrice || o.amount || 0),
        date: o.createdAt || o.created_at || o.created_at || o.date,
        status: o.status || o.order_status || "completed",
        description: `Order #${o.order_id || o.id}`,
        orderId: o.order_id || o.id,
      }));

      // Combine payments
      const allPayments = [...emiPayments, ...orders];
      setPayments(allPayments);
    } catch (err) {
      console.error("Failed to fetch payment history:", err);
      setError("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    let filtered = payments;

    if (filter === "emi") {
      filtered = payments.filter((p) => p.type === "EMI");
    } else if (filter === "orders") {
      filtered = payments.filter((p) => p.type === "ORDER");
    }

    return filtered;
  };

  const getSortedPayments = (paymentsToSort) => {
    const sorted = [...paymentsToSort];

    if (sortBy === "date-desc") {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === "date-asc") {
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "amount-desc") {
      sorted.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else if (sortBy === "amount-asc") {
      sorted.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    }

    return sorted;
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    try {
      return `₹${Number(amount || 0).toFixed(2)}`;
    } catch {
      return "₹0.00";
    }
  };

  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "completed":
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "overdue":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "cancelled":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const filteredPayments = getFilteredPayments();
  const sortedPayments = getSortedPayments(filteredPayments);
  const totalAmount = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <History className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Payment History</h1>
            <p className="text-gray-400 mt-1">View all your payments and transactions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {sortedPayments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <p className="text-white/60 text-sm mb-2">Total Paid</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <p className="text-white/60 text-sm mb-2">Total Transactions</p>
            <p className="text-3xl font-bold text-white">{sortedPayments.length}</p>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "emi", "orders"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                filter === type
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {type === "all" ? "All" : type === "emi" ? "EMI" : "Orders"}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
        >
          <option value="date-desc">Latest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedPayments.length === 0 && (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 text-lg">No payment history found</p>
        </div>
      )}

      {/* Payment History List */}
      {!loading && sortedPayments.length > 0 && (
        <div className="space-y-4">
          {sortedPayments.map((payment, idx) => {
            const isEmi = payment.type === "EMI";
            const amount = Number(payment.amount || 0);
            const date = new Date(payment.date);

            return (
              <div
                key={`${payment.id}-${idx}`}
                className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg border ${getStatusColor(payment.status)}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {isEmi
                            ? `EMI Payment - Installment #${payment.installmentNumber}`
                            : payment.description || "Order Payment"}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {isEmi ? payment.planName || "N/A" : `Order ID: ${payment.orderId || payment.id}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Amount</p>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Date</p>
                      <p className="text-white font-semibold">{formatDate(date)}</p>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {String(payment.status || "").charAt(0).toUpperCase() +
                        String(payment.status || "").slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70 border border-white/20">
                      {payment.type}
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                {isEmi && payment.paidDate && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/60 text-sm">
                      Paid on: <span className="text-green-400">{formatDate(payment.paidDate)}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
