import { useEffect, useState } from "react";
import api from "../../api";
import { useParams, useNavigate } from "react-router-dom";

// base url used when appending relative image paths
import { API_URL as API_BASE } from "../../api";
import {
  FaArrowLeft,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaTruck,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaClipboardList,
  FaBoxOpen,
} from "react-icons/fa";

/* ================= STATUS BADGE ================= */
// format order ID with prefix and zero padding
const formatOrderId = (id) => {
  if (!id) return "";
  const num = parseInt(String(id).replace(/[^0-9]/g, ""), 10) || 0;
  return `ORD${String(num).padStart(3, "0")}`;
};

const statusBadge = (status) => {
  switch (status) {
    case "delivered":
      return "bg-emerald-500/20 text-emerald-300";
    case "cancelled":
      return "bg-red-500/20 text-red-300";
    case "processing":
      return "bg-amber-500/20 text-amber-300";
    case "shipped":
      return "bg-blue-500/20 text-blue-300";
    case "packing":
      return "bg-amber-500/20 text-amber-300";
    case "outfordelivery":
      return "bg-purple-500/20 text-purple-300";
    default:
      return "bg-gray-500/20 text-gray-300";
  }
};

/* ================= STATUS LABEL + ICON HELPERS ================= */
const normalizeKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const formatStatusLabel = (status) => {
  const k = normalizeKey(status);
  const map = {
    orderplaced: "Order Placed",
    ordered: "Order Placed",
    orderplace: "Order Placed",
    processing: "Processing",
    procceing: "Processing",
    packing: "Packing",
    paking: "Packing",
    packed: "Packing",
    shipped: "Shipped",
    outfordelivery: "Out for Delivery",
    outofdelivery: "Out for Delivery",
    outdelivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  return map[k] || (status ? String(status) : "");
};

const trackIcon = (status) => {
  const k = normalizeKey(status);
  if (k === "orderplaced" || k === "ordered") return <FaClock />;
  if (k === "processing" || k === "procceing") return <FaClipboardList />;
  if (k === "packing" || k === "paking" || k === "packed") return <FaBoxOpen />;
  if (k === "shipped") return <FaTruck />;
  if (k === "outfordelivery" || k === "outofdelivery" || k === "outdelivery") return <FaTruck />;
  if (k === "delivered") return <FaCheckCircle />;
  if (k === "cancelled" || k === "canceled") return <FaTimesCircle />;
  return <FaClock />;
};

/* ================= TRACK ITEM ================= */
const TrackItem = ({ title, time, active, isLast }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div
        className={`w-4 h-4 rounded-full ${
          active ? "bg-emerald-500" : "bg-gray-500"
        }`}
      />
      {!isLast && <div className="w-px h-10 bg-white/20 mt-1" />}
    </div>
    <div>
      <p className="capitalize font-semibold">{title}</p>
      {time && (
        <p className="text-xs text-gray-400">
          {new Date(time).toLocaleString("en-IN")}
        </p>
      )}
    </div>
  </div>
);

/* ================= PAGE ================= */
const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const o = res.data;
        if (o) {
          // Parse JSON fields that may come as strings
          let shipping = o.shipping;
          let pickup = o.pickup;
          let orderTrack = o.order_track;

          if (typeof shipping === "string") {
            try {
              shipping = JSON.parse(shipping);
            } catch (e) {
              shipping = {};
            }
          }

          if (typeof pickup === "string") {
            try {
              pickup = JSON.parse(pickup);
            } catch (e) {
              pickup = {};
            }
          }

          if (typeof orderTrack === "string") {
            try {
              orderTrack = JSON.parse(orderTrack);
            } catch (e) {
              orderTrack = [];
            }
          }

          setOrder({
            ...o,
            orderId: o.order_id,
            paymentStatus: o.payment_status,
            orderType: o.order_type,
            createdAt: o.created_at,
            shipping: shipping || {},
            pickup: pickup || {},
            orderTrack: orderTrack || [],
            items: (o.items || []).map((item) => ({
              name: item.product_name,
              productId: item.product_id,
              variant: item.size && item.color ? `${item.size}-${item.color}` : (item.size || item.color || "-"),
              quantity: item.qty,
              price: Number(item.price) || 0,
              total: (Number(item.price) || 0) * (item.qty || 0),
              size: item.size,
              color: item.color,
              image: item.image,
            })),
            courierName: o.courier_name,
            docketNumber: o.docket_number,
          });

        }
      } catch (err) {
        console.error("failed to load order", err);
      }
    };
    fetch();
  }, [id]);

  if (!order) {
    return <div className="text-white p-6">Loading order details...</div>;
  }

  return (
    <div className="space-y-8 text-white">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h2 className="text-2xl font-bold page-title">{formatOrderId(order.orderId)}</h2>
          <p className="text-sm text-gray-300">
            {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}
          </p>
        </div>
      </div>

      {/* ================= STATUS ================= */}
      <div className="flex gap-4 flex-wrap items-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(
            order.status
          )}`}
        >
          {order.status}
        </span>

        {order.courierName && (
           <div className="flex gap-4 text-xs bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/5">
             <span className="text-emerald-300 font-bold flex items-center gap-1.5">
               <FaTruck className="text-[10px]" /> {order.courierName}
             </span>
             {order.docketNumber && (
               <span className="text-emerald-200 border-l border-emerald-500/30 pl-4">
                 Docket: <span className="text-white font-black tracking-wider uppercase ml-1">{order.docketNumber}</span>
               </span>
             )}
           </div>
        )}
      </div>



      {/* ================= ORDER TRACK ================= */}
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <FaTruck /> Order Tracking
        </h3>

        <div className="mt-6">
          {/* Responsive step tracker: stacks vertically on small screens, horizontal on md+ */}
          <div className="flex flex-col md:flex-row md:items-center">
            {(function () {
              const stepKeys = [
                "orderplaced",
                "processing",
                "packing",
                "shipped",
                "outfordelivery",
                "delivered",
                "cancelled",
              ];

              const currentKey = normalizeKey(order.status);
              const currentIndex = stepKeys.indexOf(currentKey);

              return stepKeys.map((stepKey, idx, arr) => {
                const entry = (order.orderTrack || []).find(
                  (t) => normalizeKey(t.status) === stepKey
                );

                // Correct backfilling logic
                const isCancelled = currentKey === "cancelled";
                const stepIsCancelled = stepKey === "cancelled";
                
                let completed = !!entry?.time;
                if (!completed && currentIndex >= 0 && idx <= currentIndex) {
                  // If we are at/past this step and it's not cancelled, it's completed
                  if (!isCancelled || stepKey === "orderplaced") {
                     completed = true;
                  }
                }
                
                // Special case for cancelled dot
                const isCancelledDot = stepIsCancelled && isCancelled;

                const connectorCompleted = (currentIndex > idx && !isCancelled) || !!entry?.time;
                const isLast = idx === arr.length - 1;

                return (
                  <div key={stepKey} className="flex items-start md:items-center md:flex-1 mb-4 md:mb-0">
                    <div className="flex flex-col items-center text-center w-full md:w-28">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg ${
                          isCancelledDot ? "bg-red-500 text-white" :
                          completed ? "bg-yellow-400 text-black" : "bg-white/5 text-gray-300"
                        }`}
                      >
                        {isCancelledDot ? <FaTimesCircle /> : completed ? <FaCheckCircle /> : trackIcon(stepKey)}
                      </div>

                      <div className={`mt-3 font-semibold text-sm capitalize ${completed ? "text-white" : "text-gray-300"}`}>
                        {formatStatusLabel(stepKey)}
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {entry?.time
                          ? new Date(entry.time).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              weekday: "short",
                            })
                          : currentIndex === idx
                          ? "Current"
                          : ""}
                      </div>
                    </div>

                    {!isLast && (
                      <>
                        <div className="hidden md:flex-1 md:flex md:items-center md:mx-3">
                          <div
                            className={`h-1 rounded-full w-full ${
                              connectorCompleted ? "bg-yellow-400" : "bg-white/10"
                            }`}
                          />
                        </div>

                        <div className="md:hidden w-px h-6 bg-white/10 mx-auto mt-2" />
                      </>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* ================= CUSTOMER + ADDRESS ================= */}
      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FaUser /> Customer
          </h3>
          <p className="font-semibold">
            {order.pickup?.name || order.shipping?.name || "-"}
          </p>

          <p className="text-sm text-gray-300 flex items-center gap-2 mt-1">
            <FaPhone />
            {order.pickup?.phone || order.shipping?.phone || "-"}
          </p>

          <p className="text-sm text-gray-300 flex items-center gap-2 mt-1">
            <FaEnvelope />
            {order.pickup?.email || order.shipping?.email || "-"}
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FaMapMarkerAlt /> Shipping Address
          </h3>
          {normalizeKey(order.orderType) === "pickup" ? (
            <p className="text-sm text-gray-400">Store Pickup (No Shipping Address)</p>
          ) : (
            <>
              <p>{order.shipping?.address || "-"}</p>
              <p>
                {order.shipping?.city || "-"}, {order.shipping?.state || "-"}
              </p>
              <p>
                {order.shipping?.zip || "-"}, {order.shipping?.country || "-"}
              </p>
            </>
          )}
        </div>

      </div>

      {/* ================= ITEMS ================= */}
      <div className="bg-white/10 border border-white/20 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-white/20">
              <tr>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-center">Variant</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((i, idx) => (
                <tr key={idx} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    {i.image ? (
                      (() => {
                        const raw = i.image;
                        // compute src similar to user orders helper
                        let src = "";
                        if (raw) {
                          if (raw.startsWith('http') || raw.startsWith('data:')) {
                            src = raw;
                          } else {
                            src = `${API_BASE}/${raw.replace(/^\//,"")}`;
                          }
                        }
                        // drop tiny data URIs that are probably truncated
                        if (src.startsWith('data:') && src.length < 150) {
                          src = "invalid"; // force onError to trigger
                        }
                        return (
                          <img
                            src={src || "https://via.placeholder.com/60"}
                            alt={i.name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              console.error("admin order item image failed", e.target.src, "len", e.target.src.length);
                              e.target.src = "https://via.placeholder.com/60";
                            }}
                          />
                        );
                      })()
                    ) : (
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{i.name || "-"}</td>
                  <td className="px-4 py-3 text-center">{i.variant || "-"}</td>
                  <td className="px-4 py-3 text-center">{i.quantity || 0}</td>
                  <td className="px-4 py-3 text-right">₹{Number(i.price).toFixed(2) || "0.00"}</td>
                  <td className="px-4 py-3 text-right">₹{Number(i.total).toFixed(2) || "0.00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TOTAL ================= */}
      <div className="flex justify-end">
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full md:w-1/3">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>₹{Number(order.total || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-3">
            <span>Total</span>
            <span>₹{Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrderDetails;
