import { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { resolveUserId } from "../../utils/userUtils";
import { CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react";

const EMI = () => {
  const { user } = useAuth();
  const userId = resolveUserId(user);
  const [emiPayments, setEmiPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, completed, overdue

  useEffect(() => {
    fetchEmiPayments();
  }, [userId]);

  const fetchEmiPayments = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all EMI payments for the user
      const res = await api.get(`/memberships/emi/upcoming?userId=${userId}&daysAhead=365`);
      const emiData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setEmiPayments(emiData);
    } catch (err) {
      console.error("Failed to fetch EMI payments:", err);
      setError("Failed to load EMI payments");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    if (filter === "all") return emiPayments;
    return emiPayments.filter((p) => p.status === filter);
  };

  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "overdue":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
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

  const filteredPayments = getFilteredPayments();
  const totalAmount = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingAmount = filteredPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <CreditCard className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">EMI Payments</h1>
            <p className="text-gray-400 mt-1">Track your installment payments</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {filteredPayments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <p className="text-white/60 text-sm mb-2">Total Amount</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <p className="text-white/60 text-sm mb-2">Pending Amount</p>
            <p className="text-3xl font-bold text-orange-400">{formatCurrency(pendingAmount)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <p className="text-white/60 text-sm mb-2">Total Payments</p>
            <p className="text-3xl font-bold text-white">{filteredPayments.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {["all", "pending", "completed", "overdue"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              filter === status
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 text-lg">No {filter === "all" ? "EMI" : filter} payments found</p>
        </div>
      )}

      {/* EMI Payments List */}
      {!loading && filteredPayments.length > 0 && (
        <div className="space-y-4">
          {filteredPayments.map((payment, idx) => {
            const dueDate = new Date(payment.dueDate);
            const today = new Date();
            const isOverdue = dueDate < today && payment.status === "pending";

            return (
              <div
                key={`${payment.id}-${idx}`}
                className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg border ${getStatusColor(
                          payment.status
                        )} flex items-center justify-center`}
                      >
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          Installment #{payment.installmentNumber || idx + 1}
                        </h3>
                        <p className="text-white/60 text-sm">
                          Plan: {payment.planName || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Amount</p>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Due Date</p>
                      <p className={`font-semibold ${isOverdue ? "text-red-400" : "text-white"}`}>
                        {formatDate(payment.dueDate)}
                      </p>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {getStatusIcon(payment.status)}
                      {String(payment.status || "").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                {payment.paidDate && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/60 text-sm">
                      Paid on: <span className="text-green-400">{formatDate(payment.paidDate)}</span>
                    </p>
                  </div>
                )}

                {isOverdue && (
                  <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-red-400 text-sm">Payment is overdue. Please pay as soon as possible.</p>
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

export default EMI;
