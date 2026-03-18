import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPrinter } from "react-icons/fi";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { ShoppingCart } from "lucide-react";

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
      <div className="min-h-screen bg-black text-center text-red-500 py-20">
        Loading Orders...
      </div>
    );
  }

  // ✅ Empty
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6">
        <ShoppingCart size={40} className="text-red-500" />
        <p>No Orders Found</p>

        <button
          onClick={() => navigate("/products")}
          className="bg-red-600 px-6 py-3 rounded"
        >
          Go to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl text-red-500 mb-6">My Orders</h1>

      {/* ORDER LIST */}
      <div className="grid md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="bg-gray-900 border border-red-500/30 p-4 rounded cursor-pointer"
          >
            <p className="text-red-500 font-bold">
              {order.order_id}
            </p>

            <p className="text-sm text-gray-400">
              {new Date(order.created_at).toLocaleString()}
            </p>

            <div className="flex justify-between mt-3">
              <span>₹{order.total}</span>

              <span className="bg-red-600 px-2 py-1 text-xs rounded">
                {formatStatus(normalizeStatus(order.status))}
              </span>
            </div>

            {/* PRODUCTS */}
            {order.items?.map((item, i) => (
              <div key={i} className="flex gap-2 mt-3">
                <img
                  src={makeImageUrl(item.image)}
                  className="w-12 h-12 object-cover"
                />
                <div>
                  <p className="text-sm">{item.product_name}</p>
                  <p className="text-xs text-gray-400">
                    x{item.qty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded w-[90%] max-w-xl">
            <button
              onClick={() => setSelectedOrder(null)}
              className="float-right text-red-500"
            >
              ✕
            </button>

            <h2 className="text-red-500 mb-4">
              {selectedOrder.order_id}
            </h2>

            <p>Status: {selectedOrder.status}</p>
            <p>Total: ₹{selectedOrder.total}</p>

            <div className="mt-4">
              {selectedOrder.items?.map((item, i) => (
                <div key={i} className="flex gap-3 mb-2">
                  <img
                    src={makeImageUrl(item.image)}
                    className="w-14 h-14"
                  />
                  <div>
                    <p>{item.product_name}</p>
                    <p>Qty: {item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;