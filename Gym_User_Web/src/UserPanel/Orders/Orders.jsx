import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { ShoppingCart, X, Package, CheckCircle, Truck, Clock } from "lucide-react";

// ✅ Cache for orders
const ordersCache = {};

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
  const isMountedRef = useRef(true);

  // ✅ Initialize state with fresh fetch on component mount
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ✅ Fetch Orders - always fetch fresh on mount to catch new orders from checkout
  useEffect(() => {
    if (!userId) return;

    const abortController = new AbortController();
    isMountedRef.current = true;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/user/${userId}`, {
          signal: abortController.signal
        });
        const fetchedOrders = Array.isArray(res.data) ? res.data : [];
        
        if (isMountedRef.current) {
          setOrders(fetchedOrders);
          setLoading(false);
          ordersCache[userId] = fetchedOrders;
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Error fetching orders:', err);
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      }
    };

    fetchOrders();
    
    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
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

      {/* STATUS STYLES */}
      {user && (() => {
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
          <>
            {/* ORDERS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {orders.map((order) => {
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
                <div className="bg-[#0a0e27] border border-white/10 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  {/* MODAL HEADER */}
                  <div className="flex justify-between items-start mb-8">
                    <h2 className="text-3xl font-bold text-red-500">Order Details</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  {/* ORDER ID & STATUS */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <p className="text-white text-lg font-semibold">Order ID: <span className="text-white">{selectedOrder.order_id || selectedOrder.id}</span></p>
                    </div>
                    <div className={`text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 ${statusColor[normalizeStatus(selectedOrder.status)]}`}>
                      {statusIcon[normalizeStatus(selectedOrder.status)]}
                      {formatStatus(normalizeStatus(selectedOrder.status))}
                    </div>
                  </div>

                  {/* DELIVERY ADDRESS */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-8">
                    <h3 className="text-red-500 font-bold text-lg mb-4">Delivery Address</h3>
                    <div className="text-white space-y-1">
                      <p className="font-semibold">{selectedOrder.shipping?.name || 'N/A'}</p>
                      <p className="text-white/60">{selectedOrder.shipping?.email || ''}</p>
                      <p className="text-white/60">{selectedOrder.shipping?.phone || 'N/A'}</p>
                      <p className="text-white/60">{selectedOrder.shipping?.address || 'N/A'}</p>
                      <p className="text-white/60">{selectedOrder.shipping?.state} - {selectedOrder.shipping?.zip}</p>
                    </div>
                  </div>

                  {/* BILLING ADDRESS */}
                  {selectedOrder.billing_address && (
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-8">
                      <h3 className="text-orange-500 font-bold text-lg mb-4">Billing Address</h3>
                      <div className="text-white space-y-1">
                        <p className="font-semibold">{selectedOrder.billing_name || selectedOrder.billing_address?.name || 'N/A'}</p>
                        <p className="text-white/60">{selectedOrder.billing_email || selectedOrder.billing_address?.email || ''}</p>
                        <p className="text-white/60">{selectedOrder.billing_phone || selectedOrder.billing_address?.phone || 'N/A'}</p>
                        <p className="text-white/60">{selectedOrder.billing_address?.address || 'N/A'}</p>
                        <p className="text-white/60">{selectedOrder.billing_address?.state} - {selectedOrder.billing_address?.zip}</p>
                      </div>
                    </div>
                  )}

                  {/* PRODUCTS TABLE */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-8 overflow-x-auto">
                    <div className="grid grid-cols-12 gap-4 mb-4 pb-4 border-b border-white/20">
                      <div className="col-span-7"><p className="text-red-500 font-bold">Product</p></div>
                      <div className="col-span-3"><p className="text-red-500 font-bold">Qty</p></div>
                      <div className="col-span-2"><p className="text-red-500 font-bold">Price</p></div>
                    </div>
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-4 mb-6 pb-6 border-b border-white/10 last:border-b-0">
                        <div className="col-span-7 flex gap-3">
                          {item.image && (
                            <img
                              src={makeImageUrl(item.image)}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-white font-semibold text-sm">{item.product_name}</p>
                            {(item.size || item.weight) && (
                              <p className="text-white/60 text-xs mt-1">
                                {item.size && `Size: ${item.size}`}
                                {item.size && item.weight && " • "}
                                {item.weight && `Weight: ${item.weight}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-white">{item.qty}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-white font-semibold">₹{item.price * item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL */}
                  <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/20">
                    <p className="text-white text-xl font-semibold">Total</p>
                    <p className="text-red-500 text-3xl font-bold">₹{selectedOrder.total}</p>
                  </div>

                  {/* TRACK ORDER TIMELINE */}
                  <div className="mb-6">
                    <h3 className="text-red-500 font-bold text-lg mb-6">Track Order</h3>
                    <div className="flex justify-between items-end">
                      {ORDER_STEPS.map((step, idx) => {
                        const currentStepIndex = ORDER_STEPS.indexOf(normalizeStatus(selectedOrder.status));
                        const isCompleted = idx <= currentStepIndex;

                        return (
                          <div key={step} className="flex flex-col items-center flex-1">
                            {/* Circle */}
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg mb-3 transition ${
                                isCompleted
                                  ? 'bg-red-600 border-2 border-red-600'
                                  : 'bg-gray-600 border-2 border-gray-600'
                              }`}
                            >
                              {idx + 1}
                            </div>

                            {/* Label */}
                            <p className={`text-xs text-center font-semibold ${isCompleted ? 'text-white' : 'text-white/50'}`}>
                              {formatStatus(step)}
                            </p>

                            {/* Connector */}
                            {idx < ORDER_STEPS.length - 1 && (
                              <div
                                className={`absolute w-12 h-1 top-6 ${isCompleted ? 'bg-red-600' : 'bg-gray-600'}`}
                                style={{ left: `calc(50% + 28px)`, transform: 'translateY(-50%)' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CLOSE BUTTON */}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:scale-105 transition mt-6"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
};

export default Orders;