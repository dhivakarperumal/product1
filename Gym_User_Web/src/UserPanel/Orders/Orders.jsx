import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { ShoppingCart, X, Package, CheckCircle, Truck, Clock } from "lucide-react";
import toast from "react-hot-toast";

// ✅ Image helper
const makeImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("data:")) return img;

  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
  if (maybeBase64 && img.length > 50) {
    return `data:image/webp;base64,${img}`;
  }

  const base = import.meta.env.VITE_API_URL || "";
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};

const ORDER_STEPS = [
  "OrderPlaced",
  "Processing",
  "Packing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
];

const formatStatus = (s) => s.replace(/([A-Z])/g, " $1").trim();

const normalizeStatus = (status) => {
  if (!status) return "OrderPlaced";

  const clean = status.toLowerCase().replace(/[\s_-]+/g, "");

  if (clean === "delivered") return "Delivered";
  if (clean === "cancelled") return "Cancelled";
  if (clean === "shipped") return "Shipped";
  if (clean.includes("out")) return "OutForDelivery";
  if (clean.includes("pack")) return "Packing";
  if (clean.includes("process")) return "Processing";

  return "OrderPlaced";
};

const Orders = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ✅ Fetch Orders
  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await api.get(`/orders/user/${userId}`);
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  // ✅ Loading
  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // ✅ Empty
  if (orders.length === 0) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
        <ShoppingCart size={50} className="text-white/30 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Orders Yet</h2>
        <p className="text-white/60 mb-6">Start shopping and place your first order</p>

        <button
          onClick={() => navigate("/user/products")}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:scale-105 transition"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">Order Tracking</h2>
        <p className="text-white/60 mt-1">
          Track and manage your orders
        </p>
      </div>

      {/* ORDERS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {orders.map((order) => {
          const statusIcon = {
            "OrderPlaced": <Clock className="w-4 h-4" />,
            "Processing": <Package className="w-4 h-4" />,
            "Packing": <Package className="w-4 h-4" />,
            "Shipped": <Truck className="w-4 h-4" />,
            "OutForDelivery": <Truck className="w-4 h-4" />,
            "Delivered": <CheckCircle className="w-4 h-4" />,
          };
          
          const statusColor = {
            "OrderPlaced": "bg-blue-500/20 text-blue-400",
            "Processing": "bg-purple-500/20 text-purple-400",
            "Packing": "bg-yellow-500/20 text-yellow-400",
            "Shipped": "bg-orange-500/20 text-orange-400",
            "OutForDelivery": "bg-orange-500/20 text-orange-400",
            "Delivered": "bg-green-500/20 text-green-400",
          };
          
          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 cursor-pointer transition"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-white/60">Order ID</p>
                  <p className="text-lg font-bold text-white">{order.order_id || order.id}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${statusColor[normalizeStatus(order.status)]}`}>
                  {statusIcon[normalizeStatus(order.status)]}
                  {formatStatus(normalizeStatus(order.status))}
                </span>
              </div>

              {/* ORDER DATE & TOTAL */}
              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
                <div>
                  <p className="text-xs text-white/60 mb-1">Date</p>
                  <p className="text-sm text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Total</p>
                  <p className="text-lg font-bold text-orange-400">₹{order.total}</p>
                </div>
              </div>

              {/* ITEMS PREVIEW */}
              <div className="space-y-2">
                {order.items?.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex gap-3">
                    {item.image && (
                      <img
                        src={makeImageUrl(item.image)}
                        alt={item.product_name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.product_name}</p>
                      <p className="text-xs text-white/50">Qty: {item.qty}</p>
                    </div>
                  </div>
                ))}
                {order.items?.length > 2 && (
                  <p className="text-xs text-white/50 py-2">+{order.items.length - 2} more items</p>
                )}
              </div>

              <p className="text-xs text-white/40 mt-4">Click to view details</p>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
              <div>
                <p className="text-white/60 text-sm">Order Number</p>
                <p className="text-2xl font-bold text-white">{selectedOrder.order_id || selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* STATUS TIMELINE */}
            <div className="mb-6">
              <p className="text-white/60 text-sm mb-3">Order Status</p>
              <div className="flex items-center gap-2">
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 ${statusColor[normalizeStatus(selectedOrder.status)]}`}>
                  {statusIcon[normalizeStatus(selectedOrder.status)]}
                  {formatStatus(normalizeStatus(selectedOrder.status))}
                </div>
              </div>
            </div>

            {/* ORDER DETAILS */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white/60 text-xs mb-1">Order Date</p>
                <p className="text-white font-semibold">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Total Amount</p>
                <p className="text-lg font-bold text-orange-400">₹{selectedOrder.total}</p>
              </div>
            </div>

            {/* ITEMS */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-lg">
                    {item.image && (
                      <img
                        src={makeImageUrl(item.image)}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-semibold">{item.product_name}</p>
                      <p className="text-white/60 text-sm">Quantity: {item.qty}</p>
                      <p className="text-orange-400 font-semibold">₹{item.price * item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:scale-105 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;