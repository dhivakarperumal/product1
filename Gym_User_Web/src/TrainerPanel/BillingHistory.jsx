import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../PrivateRouter/AuthContext";
import api from "../api";
import toast from "react-hot-toast";
import { Eye, Download, Filter, Calendar, DollarSign } from "lucide-react";

const BillingHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const fetchBillingHistory = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Get trainer's assigned memberships
      const assignmentsRes = await api.get("/assignments", { params: { trainerUserId: user.id } });
      const assignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];

      if (assignments.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Resolve member UUIDs for each assignment. Membership rows may contain numeric ids (memberId)
      // so fetch member details when needed to obtain the member_id (UUID).
      const memberUuidPromises = assignments.map(async (a) => {
        const possible = a.memberId || a.gymMemberId || a.member_id || a.userId || a.user_id || a.id;
        const ref = possible;

        if (!ref) return null;

        // If ref looks like a UUID (contains a hyphen), assume it's already member_uuid
        if (typeof ref === 'string' && ref.includes('-')) return ref;

        // Otherwise try to fetch member details by numeric id
        try {
          const memRes = await api.get(`/members/${ref}`);
          const mem = memRes.data || {};
          return mem.member_id || mem.memberId || mem.member_uuid || mem.memberUuid || null;
        } catch (err) {
          console.warn('Failed to resolve member UUID for assignment', a, err?.message || err);
          return null;
        }
      });

      const resolved = await Promise.all(memberUuidPromises);
      const memberUuids = [...new Set(resolved.filter(Boolean))];

      if (memberUuids.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch orders for each member UUID using the user orders endpoint
      const orderFetchPromises = memberUuids.map((mu) => api.get(`/orders/user/${encodeURIComponent(mu)}`));
      const settled = await Promise.allSettled(orderFetchPromises);

      const ordersForMembers = [];
      const fetchErrors = [];
      settled.forEach((s, idx) => {
        const memberId = memberUuids[idx];
        if (s.status === 'fulfilled') {
          const data = s.value?.data;
          if (Array.isArray(data) && data.length > 0) {
            ordersForMembers.push(...data);
          }
        } else {
          console.warn('Failed to fetch orders for member', memberId, s.reason || s.status);
          fetchErrors.push({ memberId, error: s.reason });
        }
      });

      if (fetchErrors.length > 0) {
        console.warn('Some member order fetches failed:', fetchErrors);
      }

      // Show all orders for members assigned to this trainer
      setOrders(ordersForMembers);
    } catch (err) {
      console.error("Failed to fetch billing history:", err);
      toast.error("Failed to load billing history");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  // Trainer identifier values to match against order creator fields
  // Include UUIDs, numeric IDs, username, email and other common fields
  const trainerIdentifiers = [
    user?.userUuid,
    user?.user_uuid,
    user?.member_uuid,
    user?.memberUuid,
    user?.id,
    user?.userId,
    user?.user_id,
    user?.username,
    user?.name,
    user?.email,
    user?.employee_id,
  ]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter(Boolean);

  const normalize = (s) => (s === null || s === undefined ? '' : String(s).trim().toLowerCase());
  const trainerNormalized = trainerIdentifiers.map(normalize).filter(Boolean);

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      if (filterStatus !== "all" && order.status !== filterStatus) {
        return false;
      }
      if (filterType !== "all" && order.order_type !== filterType) {
        return false;
      }

      if (dateRange.startDate || dateRange.endDate) {
        const orderDate = new Date(order.created_at);
        if (dateRange.startDate && orderDate < new Date(dateRange.startDate)) {
          return false;
        }
        if (dateRange.endDate && orderDate > new Date(dateRange.endDate)) {
          return false;
        }
      }

      // Only include orders that were created by this trainer (robust matching)
      const creators = [
        order.created_by,
        order.createdBy,
        order.creator_uuid,
        order.creatorId,
        order.created_by_uuid,
        order.admin_uuid,
        order.notes,
      ]
        .filter(Boolean)
        .map((v) => String(v).trim())
        .filter(Boolean);

      const creatorsNormalized = creators.map(normalize).filter(Boolean);

      // Check for exact or substring matches (covers UUID, numeric id, email, username)
      const isCreatedByTrainer = creatorsNormalized.some((c) => trainerNormalized.some((t) => c === t || c.includes(t) || t.includes(c)));

      if (!isCreatedByTrainer) return false;

      return true;
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      delivered: "bg-green-500/20 text-green-400 border-green-500/50",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/50",
      orderPlaced: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    };
    return statusMap[status] || "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  const getTypeBadge = (type) => {
    return type === "ONLINE"
      ? "bg-purple-500/20 text-purple-400"
      : "bg-orange-500/20 text-orange-400";
  };

  const filteredOrders = getFilteredOrders();
  const totalAmount = filteredOrders.reduce(
    (sum, order) => sum + (isFinite(Number(order?.total)) ? Number(order.total) : 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Billing History</h1>
            <p className="text-gray-400">View all your billing orders</p>
          </div>
          <button
            onClick={fetchBillingHistory}
            className="px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowDebug((s) => !s)}
            className="ml-2 px-4 py-2 bg-slate-800/40 text-gray-300 hover:bg-slate-800/60 border border-white/5 rounded-lg transition-colors"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-white">{filteredOrders.length}</p>
              </div>
              <Filter className="w-8 h-8 text-orange-500/50" />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-3xl font-bold text-green-400">₹{Number(totalAmount || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500/50" />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Delivered Orders</p>
                <p className="text-3xl font-bold text-blue-400">
                  {filteredOrders.filter((o) => o.status === "delivered").length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-500/50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Filter size={20} /> Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase block mb-2 font-medium">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase block mb-2 font-medium">
                Order Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All</option>
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase block mb-2 font-medium">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase block mb-2 font-medium">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Member</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-orange-400">{order.order_id}</td>
                      <td className="px-6 py-4 text-sm text-white">
                        {order.shipping?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-400">
                        ₹{Number(order?.total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadge(order.order_type)}`}>
                          {order.order_type || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                          {order.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetails(true);
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Debug panel (toggleable) */}
      {showDebug && (
        <div className="mx-auto max-w-7xl mt-4 p-4 bg-red-900/10 border border-red-800/20 rounded-lg text-sm text-white">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <div className="mb-2">
            <strong>Trainer identifiers:</strong>
            <div className="ml-2 text-xs text-gray-200 break-words">{JSON.stringify(trainerIdentifiers)}</div>
          </div>
          <div>
            <strong>Normalized trainer identifiers:</strong>
            <div className="ml-2 text-xs text-gray-200 break-words">{JSON.stringify(trainerNormalized)}</div>
          </div>
          <div className="mt-3">
            <strong>Sample orders (id -> creators):</strong>
            <div className="space-y-1 mt-2">
              {orders.slice(0, 10).map((o) => (
                <div key={o.order_id} className="text-xs text-gray-200">
                  <span className="font-mono">{o.order_id}</span> =&gt; {JSON.stringify({ created_by: o.created_by, admin_uuid: o.admin_uuid, notes: o.notes, createdBy: o.createdBy })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-white/10 rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Order Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Order ID</p>
                  <p className="text-white font-mono font-semibold">{selectedOrder.order_id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border inline-block ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Order Type</p>
                  <p className={`font-semibold ${selectedOrder.order_type === "ONLINE" ? "text-purple-400" : "text-orange-400"}`}>
                    {selectedOrder.order_type}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Payment Status</p>
                  <p className="text-white font-semibold">{selectedOrder.payment_status}</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Shipping Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Name:</span> <span className="text-white">{selectedOrder.shipping?.name}</span></p>
                  <p><span className="text-gray-400">Email:</span> <span className="text-white">{selectedOrder.shipping?.email}</span></p>
                  <p><span className="text-gray-400">Phone:</span> <span className="text-white">{selectedOrder.shipping?.phone}</span></p>
                  <p><span className="text-gray-400">Address:</span> <span className="text-white">{selectedOrder.shipping?.address}</span></p>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg text-sm">
                        <div>
                          <p className="text-white font-medium">{item.product_name}</p>
                          <p className="text-gray-400">{item.variant || "N/A"} × {item.qty}</p>
                        </div>
                        <p className="text-green-400 font-semibold">₹{(item.price * item.qty).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-green-400">₹{Number(selectedOrder?.total || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingHistory;
