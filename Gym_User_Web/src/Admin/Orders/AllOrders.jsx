import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import cache from "../../cache";
import {
  FaPrint,
  FaTruck,
  FaClipboardList,
  FaMoneyBillWave,
  FaCheckCircle,
  FaSearch,
  FaTimesCircle,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";

/* ================= HELPERS ================= */

// format order ID with prefix and padding
const formatOrderId = (id) => {
  if (!id) return "";
  const num = parseInt(String(id).replace(/[^0-9]/g, ""), 10) || 0;
  return `ORD${String(num).padStart(3, "0")}`;
};

const normalizeKey = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const formatStatus = (s) => s.replace(/([A-Z])/g, " $1").trim();

const normalizeStatus = (status) => {
  if (!status) return "OrderPlaced";

  const clean = status
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  // ⚠️ Order matters — most specific first
  if (clean === "delivered") return "Delivered";
  if (clean === "cancelled" || clean === "canceled") return "Cancelled";
  if (clean === "shipped") return "Shipped";
  if (clean === "outfordelivery" || clean === "outdelivery" || clean === "outofdelivery") return "OutForDelivery";
  if (clean === "packing" || clean === "paking" || clean === "packed") return "Packing";
  if (clean === "processing" || clean === "procceing") return "Processing";
  if (clean === "orderplaced" || clean === "ordered" || clean === "orderplace") return "OrderPlaced";

  return "OrderPlaced";
};

const formatStatusLabel = (status) => {
  const k = normalizeKey(status);
  const map = {
    orderplaced: "Order Placed",
    processing: "Processing",
    packing: "Packing",
    shipped: "Shipped",
    outfordelivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[k] || status || "-";
};

const STATUS_SEQUENCE = [
  "orderplaced",
  "processing",
  "packing",
  "shipped",
  "outfordelivery",
  "delivered",
];


const makeImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const base = baseUrl.replace(/\/api$/, "");
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};


const getCustomerDetails = (o) => {
  if (normalizeKey(o.orderType) === "pickup") {
    return { name: o.pickup?.name || "-" };
  }
  return { name: o.shipping?.name || "-" };
};

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-gray-300">{title}</p>
        <h2 className="text-2xl font-bold text-white">{value}</h2>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
        {icon}
      </div>
    </div>
  </div>
);

/* ================= PAGE ================= */
const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [view, setView] = useState("table");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(querySearch);

  useEffect(() => {
    if (querySearch) {
      setSearch(querySearch);
    }
  }, [querySearch]);

  /* MODALS */
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "cancelled" or "shipped"
  const [pendingStatus, setPendingStatus] = useState(null); // { orderId, newStatus }
  const [modalInput, setModalInput] = useState({ reason: "", courier: "", docket: "" });
  const [submitting, setSubmitting] = useState(false);


  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  /* ================= LOAD ================= */
  useEffect(() => {
    const fetch = async () => {
      if (cache.adminOrders) {
        setOrders(cache.adminOrders);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get("/orders");
        const raw = res.data || [];
        const formatted = raw.map((o) => ({
          ...o,
          orderId: o.order_id,
          paymentStatus: o.payment_status,
          orderType: o.order_type,
          shipping: o.shipping,
          pickup: o.pickup,
          createdAt: o.created_at,
        }));
        setOrders(formatted);
        cache.adminOrders = formatted;
      } catch (err) {
        console.error("failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(
      (o) => normalizeKey(o.status) === "delivered"
    ).length;
    const cancelled = orders.filter(
      (o) => normalizeKey(o.status) === "cancelled"
    ).length;
    const paid = orders.filter(
      (o) => normalizeKey(o.paymentStatus) === "paid"
    ).length;

    const revenue = orders
      .filter((o) => normalizeKey(o.status) !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return { total, delivered, cancelled, paid, revenue };
  }, [orders]);

  /* ================= FILTER ================= */
  const filteredOrders = orders.filter((o) => {
    const customer = getCustomerDetails(o);

    const matchSearch =
      String(o.order_id || o.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
      customer.name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      normalizeKey(o.status) === normalizeKey(statusFilter);

    const matchPayment =
      paymentFilter === "all" ||
      normalizeKey(o.paymentStatus) === normalizeKey(paymentFilter);
    // DELIVERY ONLY → SHOW DELIVERED ORDERS ONLY
    if (deliveryOnly) {
      if (!normalizeKey(o.status).includes("delivered")) return false;
    }

    if (!(matchSearch && matchStatus && matchPayment)) return false;

    // 2. Date Range Filter
    return filterByDateRange([o], 'createdAt', dateRange.type, dateRange.range).length > 0;
  });

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (orderId, newStatus) => {
    if (newStatus === "cancelled") {
      setModalType("cancelled");
      setPendingStatus({ orderId, newStatus });
      setModalInput({ reason: "", courier: "", docket: "" });
      setShowStatusModal(true);
      return;
    }

    if (newStatus === "shipped") {
      setModalType("shipped");
      setPendingStatus({ orderId, newStatus });
      setModalInput({ reason: "", courier: "", docket: "" });
      setShowStatusModal(true);
      return;
    }

    // Direct update for other statuses
    confirmAndSendStatus(orderId, newStatus);
  };

  const confirmAndSendStatus = async (orderId, newStatus, extra = {}) => {
    try {
      setSubmitting(true);
      await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        cancelledReason: extra.reason,
        courierName: extra.courier,
        docketNumber: extra.docket
      });

      const res = await api.get("/orders");
      const raw = res.data || [];
      const formatted = raw.map((o) => ({
        ...o,
        orderId: o.order_id,
        paymentStatus: o.payment_status,
        orderType: o.order_type,
        shipping: o.shipping,
        pickup: o.pickup,
        createdAt: o.created_at,
      }));
      setOrders(formatted);
      setShowStatusModal(false);
    } catch (err) {
      console.error("updateStatus error:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };



  const printOrder = async (order) => {
    try {
      const res = await api.get(`/orders/${order.order_id}`);
      const orderDetails = res.data;

      const shipping =
        typeof orderDetails.shipping === "string"
          ? JSON.parse(orderDetails.shipping)
          : orderDetails.shipping;

      const items = orderDetails.items || [];

      const subtotal = items.reduce(
        (sum, i) => sum + Number(i.price) * Number(i.qty),
        0,
      );

      const win = window.open("", "", "width=900,height=700");

      win.document.write(`
<html>
<head>
<title>Invoice</title>

<style>

body{
font-family:Arial, Helvetica, sans-serif;
padding:40px;
background:#fafafa;
color:#333;
}

.header{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:30px;
border-bottom:2px solid #eee;
padding-bottom:15px;
}

.logo{
font-size:22px;
font-weight:bold;
color:#dc2626;
}

.invoice-title{
font-size:28px;
font-weight:bold;
color:#111;
}

.section{
margin-top:25px;
}

.card{
background:#fff;
border:1px solid #eee;
border-radius:10px;
padding:20px;
margin-top:10px;
}

.grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:20px;
}

.label{
font-weight:bold;
color:#555;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
background:#fff;
border-radius:10px;
overflow:hidden;
}

th{
background:#111;
color:#fff;
padding:12px;
font-size:14px;
}

td{
padding:12px;
border-bottom:1px solid #eee;
font-size:14px;
}

.product{
display:flex;
align-items:center;
gap:10px;
}

.product img{
width:50px;
height:50px;
object-fit:cover;
border-radius:6px;
border:1px solid #eee;
}

.total-box{
margin-top:25px;
background:#fff;
padding:20px;
border-radius:10px;
border:1px solid #eee;
width:280px;
margin-left:auto;
}

.total-row{
display:flex;
justify-content:space-between;
margin-bottom:8px;
font-size:14px;
}

.grand{
font-size:18px;
font-weight:bold;
color:#dc2626;
}

</style>
</head>

<body>

<div class="header">
<div class="logo">
<img src="/images/logo-dark.png" style="height:50px; object-fit:contain;" />
</div>
<div class="invoice-title">INVOICE</div>
</div>

<div class="grid">

<div class="card">
<p class="label">Order Details</p>
<p><b>Order ID:</b> ${orderDetails.order_id}</p>
<p><b>Status:</b> ${formatStatus(normalizeStatus(orderDetails.status))}</p>
<p><b>Date:</b> ${new Date(orderDetails.created_at).toLocaleString()}</p>
<p><b>Payment Method:</b> ${orderDetails.payment_method}</p>
<p><b>Payment Status:</b> ${orderDetails.payment_status}</p>
</div>

${shipping
          ? `
<div class="card">
<p class="label">Shipping Address</p>
<p>${shipping.name}</p>
<p>${shipping.phone}</p>
<p>${shipping.email || ""}</p>
<p>${shipping.address}</p>
<p>${shipping.city || ""}, ${shipping.state || ""}</p>
<p>${shipping.zip || ""}</p>
<p>${shipping.country || ""}</p>
</div>
`
          : ""
        }

</div>


<div class="section">
<h3>Order Items</h3>

<table>

<tr>
<th>Product</th>
<th>Variant</th>
<th>Qty</th>
<th>Price</th>
<th>Total</th>
</tr>

${items
          .map(
            (i) => `
<tr>

<td>
<div class="product">
<img src="${makeImageUrl(i.image) || "https://via.placeholder.com/50"}"/>
<span>${i.product_name}</span>
</div>
</td>

<td>${i.size || i.color || i.variant || "-"}</td>

<td>${i.qty}</td>

<td>₹${Number(i.price).toLocaleString()}</td>

<td>₹${(i.price * i.qty).toLocaleString()}</td>

</tr>
`,
          )
          .join("")}

</table>
</div>


<div class="total-box">

<div class="total-row">
<span>Subtotal</span>
<span>₹${subtotal.toLocaleString()}</span>
</div>

<div class="total-row grand">
<span>Total</span>
<span>₹${Number(orderDetails.total).toLocaleString()}</span>
</div>

</div>


</body>
</html>
`);

      win.document.close();
      win.focus();
      win.print();
    } catch (err) {
      console.error("Failed to fetch order details for print", err);
      alert("Failed to load order details for printing");
    }
  };

  /* ================= STATUS BADGE ================= */
  const statusBadge = (status) => {
    const key = normalizeKey(status);
    const base =
      key === "delivered"
        ? "bg-emerald-500/20 text-emerald-300"
        : key === "shipped"
          ? "bg-blue-500/20 text-blue-300"
          : key === "cancelled"
            ? "bg-red-500/20 text-red-300"
            : "bg-amber-500/20 text-amber-300";

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${base}`}>
        {formatStatusLabel(status)}
      </span>
    );
  };

  if (loading && !cache.adminOrders) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Syncing Shipments</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} icon={<FaClipboardList />} gradient="from-blue-500 to-cyan-500" />
        <StatCard title="Delivered" value={stats.delivered} icon={<FaTruck />} gradient="from-emerald-500 to-teal-500" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={<FaTimesCircle />} gradient="from-red-500 to-rose-500" />
        <StatCard title="Paid" value={stats.paid} icon={<FaCheckCircle />} gradient="from-green-500 to-emerald-500" />
        <StatCard title="Revenue" value={`₹ ${stats.revenue.toLocaleString("en-IN")}`} icon={<FaMoneyBillWave />} gradient="from-indigo-500 to-violet-500" />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 justify-between">

        {/* SEARCH */}
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            placeholder="Search Order ID or Member"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-2 items-center">
          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="orderplaced">Order Placed</option>
            <option value="processing">Processing</option>
            <option value="packing">Packing</option>
            <option value="shipped">Shipped</option>
            <option value="outfordelivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={() => setDeliveryOnly((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-sm border flex items-center gap-2 ${deliveryOnly
              ? "bg-orange-500 border-orange-500"
              : "bg-white/10 border-white/20"
              }`}
          >
            <FaTruck /> Delivery Only
          </button>

          {/* VIEW TOGGLE */}
          <div className="flex border border-white/20 rounded-xl overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2 ${view === "table" ? "bg-white/20" : "bg-transparent"
                }`}
            >
              <FaList />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 ${view === "grid" ? "bg-white/20" : "bg-transparent"
                }`}
            >
              <FaThLarge />
            </button>
          </div>
        </div>
      </div>

      {/* ================= TABLE VIEW ================= */}
      {view === "table" && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/20">
                <tr>

                  <th className="px-4 py-4 text-left">Order ID</th>
                  <th className="px-4 py-4 text-left">Member</th>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Payment</th>
                  <th className="px-4 py-4 text-left">Status</th>

                  <th className="px-4 py-4 text-left">Actions</th>
                  <th className="px-4 py-4 text-left">Printer</th>

                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o) => (
                  <tr key={o.order_id} className="border-b border-white/10 hover:bg-white/5">

                    <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="px-4 py-3 cursor-pointer hover:text-orange-400">{formatOrderId(o.order_id)}</td>
                    <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="px-4 py-3">
                      {o.shipping?.name || o.pickup?.name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      ₹{Number(o.total).toLocaleString("en-IN")}
                    </td>
                    <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${normalizeKey(o.paymentStatus) === "paid"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-amber-500/20 text-amber-300"
                        }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(o.status)}
                    </td>

                    <td className="px-4 py-3 flex gap-2">
                      <select
                        value={normalizeKey(o.status)}
                        onChange={(e) => updateStatus(o.order_id, e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                      >
                        {normalizeKey(o.status) === "cancelled" ? (
                          <option value="cancelled">Cancelled</option>
                        ) : (
                          <>
                            {STATUS_SEQUENCE.map((step, idx) => {
                              const currentIdx = STATUS_SEQUENCE.indexOf(normalizeKey(o.status));
                              // Only show current and future statuses
                              if (idx < currentIdx && currentIdx !== -1) return null;
                              return <option key={step} value={step}>{formatStatusLabel(step)}</option>;
                            })}

                            {/* Only show Cancelled if NOT yet shipped or beyond */}
                            {(STATUS_SEQUENCE.indexOf(normalizeKey(o.status)) < STATUS_SEQUENCE.indexOf("shipped")) && (
                              <option value="cancelled">Cancelled</option>
                            )}
                          </>
                        )}
                      </select>


                    </td>
                    <td>
                      <button
                        onClick={() => printOrder(o)}
                        className="px-2 py-1 bg-gray-700 rounded-lg text-xs flex items-center gap-1"
                      >
                        <FaPrint /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= GRID VIEW ================= */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedOrders.map((o) => (
            <div
              key={o.order_id}
              className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-2"
            >
              <div onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="flex justify-between items-center">
                <h3 className="font-bold">{formatOrderId(o.order_id || o.orderId)}</h3>
                {statusBadge(o.status)}
              </div>

              <p onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="text-sm text-gray-300">
                {o.shipping?.name || o.pickup?.name || "-"}
              </p>

              <div className="flex flex-wrap gap-2 py-2">
                {(o.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                    {item.image && (
                      <img
                        src={makeImageUrl(item.image)}
                        className="w-8 h-8 object-cover rounded-lg"
                        alt=""
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium truncate w-[100px]">{item.product_name}</p>
                      <p className="text-[9px] text-gray-400">Qty: {item.qty} | ₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }} className="font-semibold">
                ₹ {Number(o.total).toLocaleString("en-IN")}
              </p>

              <p className="text-xs">{o.paymentStatus}</p>

              <div className="flex gap-2">
                <select
                  value={normalizeKey(o.status)}
                  onChange={(e) => updateStatus(o.order_id, e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs w-full focus:ring-1 focus:ring-orange-500 outline-none"
                >
                  {normalizeKey(o.status) === "cancelled" ? (
                    <option value="cancelled">Cancelled</option>
                  ) : (
                    <>
                      {STATUS_SEQUENCE.map((step, idx) => {
                        const currentIdx = STATUS_SEQUENCE.indexOf(normalizeKey(o.status));
                        if (idx < currentIdx && currentIdx !== -1) return null;
                        return <option key={step} value={step}>{formatStatusLabel(step)}</option>;
                      })}

                      {/* Hide Cancelled if Shipped/Delivered */}
                      {(STATUS_SEQUENCE.indexOf(normalizeKey(o.status)) < STATUS_SEQUENCE.indexOf("shipped")) && (
                        <option value="cancelled">Cancelled</option>
                      )}
                    </>
                  )}
                </select>

                <button
                  onClick={() => printOrder(o)}
                  className="px-2 py-1 bg-gray-700 rounded-lg text-xs flex items-center gap-1"
                >
                  <FaPrint />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-end gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-lg border ${currentPage === i + 1
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white/10 border-white/20"
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* ================= STATUS UPDATE MODAL ================= */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/20 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                {modalType === "cancelled" ? (
                  <span className="text-red-500">Cancel Order</span>
                ) : (
                  <span className="text-orange-500">Shipping Details</span>
                )}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                {modalType === "cancelled"
                  ? "Please provide a reason for cancelling this order."
                  : "Enter the tracking information for this shipment."}
              </p>

              <div className="space-y-4">
                {modalType === "cancelled" ? (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Reason</label>
                    <textarea
                      autoFocus
                      value={modalInput.reason}
                      onChange={(e) => setModalInput({ ...modalInput, reason: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-red-500/50 outline-none min-h-[100px]"
                      placeholder="Customer changed their mind..."
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Courier Name</label>
                      <input
                        autoFocus
                        value={modalInput.courier}
                        onChange={(e) => setModalInput({ ...modalInput, courier: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-orange-500/50 outline-none"
                        placeholder="e.g. BlueDart, DTDC"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Docket Number</label>
                      <input
                        value={modalInput.docket}
                        onChange={(e) => setModalInput({ ...modalInput, docket: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-orange-500/50 outline-none"
                        placeholder="e.g. 123456789"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAndSendStatus(pendingStatus.orderId, pendingStatus.newStatus, modalInput)}
                  disabled={submitting}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition shadow-lg ${modalType === "cancelled"
                      ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                      : "bg-orange-600 hover:bg-orange-700 shadow-orange-600/20"
                    } disabled:opacity-50`}
                >
                  {submitting ? "Updating..." : "Confirm Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default AllOrders;
