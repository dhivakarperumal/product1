import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FaReceipt,
  FaSearch,
  FaEdit,
  FaCheck,
  FaTimes,
  FaClock,
  FaBan,
  FaCalendar,
  FaMoneyBillWave,
} from "react-icons/fa";

const SUBSCRIPTION_PLANS = {
  demo: { name: 'Demo', days: 5, amount: 0 },
  '1month': { name: '1 Month', days: 30, amount: 99 },
  '6month': { name: '6 Month', days: 180, amount: 499 },
  '12month': { name: '12 Month', days: 365, amount: 899 },
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

/* ================= GLASS CLASSES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30";

const Subscriptions = () => {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    subscription_status: '',
    subscription_plan: '',
    subscription_amount: '',
    subscription_start_date: '',
  });

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      const adminUsers = response.data.filter(user => user.role === 'admin');
      setAdmins(adminUsers);
    } catch (err) {
      console.error("Error loading admins:", err);
      toast.error("Failed to load admin subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const updateSubscriptionDetails = async (userId) => {
    try {
      const updatePayload = {};

      if (editData.subscription_status) {
        updatePayload.subscription_status = editData.subscription_status;
      }

      if (editData.subscription_plan) {
        updatePayload.subscription_plan = editData.subscription_plan;
      }

      if (editData.subscription_amount !== '' && editData.subscription_amount !== null) {
        const amount = parseFloat(editData.subscription_amount);
        if (!Number.isNaN(amount)) {
          updatePayload.subscription_amount = amount;
        }
      }

      if (editData.subscription_start_date) {
        updatePayload.subscription_start_date = editData.subscription_start_date;
      }

      if (Object.keys(updatePayload).length === 0) {
        toast.error("No subscription changes to save");
        return;
      }

      await api.put(`/users/${userId}`, updatePayload);
      toast.success("Subscription updated successfully");
      await loadAdmins();
      setEditingId(null);
      setEditData({
        subscription_status: '',
        subscription_plan: '',
        subscription_amount: '',
        subscription_start_date: '',
      });
    } catch (err) {
      console.error("Error updating subscription:", err);
      toast.error(err?.response?.data?.error || "Failed to update subscription");
    }
  };

  const getPlanDetails = (plan) => {
    return SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS['demo'];
  };

  const calculateEndDate = (startDate, plan) => {
    if (!startDate) return null;
    const details = getPlanDetails(plan);
    const end = new Date(startDate);
    end.setDate(end.getDate() + details.days);
    return end.toISOString().split('T')[0];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaCheck className="text-green-400" />;
      case 'pending':
        return <FaClock className="text-yellow-400" />;
      case 'cancelled':
        return <FaBan className="text-red-400" />;
      case 'expired':
        return <FaTimes className="text-gray-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.username?.toLowerCase().includes(search.toLowerCase()) ||
                         admin.email?.toLowerCase().includes(search.toLowerCase());
const normalizedStatus = String(admin.subscription_status || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`${glassCard} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <FaReceipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Subscriptions</h1>
              <p className="text-slate-400">Manage admin account subscriptions and access</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admins..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${glassInput} pl-10 w-full`}
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${glassInput} min-w-[150px]`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Admins List */}
        <div className={`${glassCard} p-6`}>
          <div className="space-y-4">
            {filteredAdmins.length === 0 ? (
              <div className="text-center py-12">
                <FaReceipt className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No admin subscriptions found</p>
              </div>
            ) : (
              filteredAdmins.map((admin) => (
                <div key={admin.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  {/* Admin Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {admin.username?.charAt(0)?.toUpperCase() || admin.email?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{admin.username || 'No Username'}</h3>
                        <p className="text-slate-400 text-sm">{admin.email}</p>
                      </div>
                    </div>
                  </div>

                  {editingId === admin.id ? (
                    /* Edit Form */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-xl">
                      {/* Status */}
                      <div>
                        <label className="text-xs text-slate-300 mb-2 block">Status</label>
                        <select
                          value={editData.subscription_status}
                          onChange={(e) => setEditData({...editData, subscription_status: String(e.target.value).toLowerCase()})}
                          className={`${glassInput} w-full`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Plan */}
                      <div>
                        <label className="text-xs text-slate-300 mb-2 block">Plan</label>
                        <select
                          value={editData.subscription_plan}
                          onChange={(e) => {
                            const plan = e.target.value;
                            setEditData({
                                ...editData,
                                subscription_plan: plan,
                                subscription_amount: getPlanDetails(plan).amount.toString(),
                              });
                            }}
                            className={`${glassInput} w-full`}
                          >
                            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                              <option key={key} value={key}>
                                {`${plan.name} - ${plan.amount === 0 ? 'Free' : `$${plan.amount}`}`}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="text-xs text-slate-300 mb-2 block">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.subscription_amount}
                          onChange={(e) => setEditData({...editData, subscription_amount: e.target.value})}
                          className={`${glassInput} w-full`}
                          placeholder="0.00"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="text-xs text-slate-300 mb-2 block">Start Date</label>
                        <input
                          type="date"
                          value={editData.subscription_start_date}
                          onChange={(e) => setEditData({...editData, subscription_start_date: e.target.value})}
                          className={`${glassInput} w-full`}
                        />
                      </div>

                      {/* End Date Display */}
                      <div>
                        <label className="text-xs text-slate-300 mb-2 block">End Date</label>
                        <div className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 text-sm">
                          {calculateEndDate(editData.subscription_start_date, editData.subscription_plan) || 'Set start date'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="md:col-span-2 flex gap-2">
                        <button
                          onClick={() => updateSubscriptionDetails(admin.id)}
                          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium"
                        >
                          <FaCheck className="w-4 h-4" />
                          Update
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditData({
                              subscription_status: '',
                              subscription_plan: '',
                              subscription_amount: '',
                              subscription_start_date: '',
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium"
                        >
                          <FaTimes className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Info */
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Status:</span>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(admin.subscription_status)}`}>
                          {getStatusIcon(admin.subscription_status)}
                          <span className="capitalize">{admin.subscription_status || 'Pending'}</span>
                        </div>
                      </div>

                      {/* Plan */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Plan:</span>
                        <span className="text-white font-medium">
                          {getPlanDetails(admin.subscription_plan || 'demo').name}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-yellow-400 w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400">Amount</span>
                          <span className="text-white font-medium">${parseFloat(admin.subscription_amount || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Start Date */}
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-blue-400 w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400">Start Date</span>
                          <span className="text-white font-medium">{formatDate(admin.subscription_start_date)}</span>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setEditingId(admin.id);
                            setEditData({
                              subscription_status: admin.subscription_status || 'pending',
                              subscription_plan: admin.subscription_plan || 'demo',
                              subscription_amount: (admin.subscription_amount || 0).toString(),
                              subscription_start_date: admin.subscription_start_date ? admin.subscription_start_date.split('T')[0] : '',
                            });
                          }}
                          className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;