import { useEffect, useState, useMemo, useRef } from "react";
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
import { createPortal } from 'react-dom';
import { FaChevronDown } from "react-icons/fa";
import { useAuth } from "../../PrivateRouter/AuthContext";
import AdminFilter from "../../components/AdminFilter";

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
  <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <h2 className="text-3xl font-bold text-white">{value}</h2>
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

const CustomDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.right - 200,
      width: "200px",
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 min-w-[160px]"
      >
        <span>
          {options.find((opt) => opt.value === value)?.label || label}
        </span>

        <FaChevronDown
          className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>


      {isOpen &&
        buttonRef.current &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-slate-950/95 border border-white/10 rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-2"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  value === opt.value
                    ? "bg-orange-500 text-white"
                    : "text-slate-300 hover:bg-white/5"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}


    </div>
  );
};

/* ================= PAGE ================= */
const AllOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [view, setView] = useState("table");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [adminFilter, setAdminFilter] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(querySearch);

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super admin';

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
  const fetchOrders = async (adminUuid = null) => {
    if (cache.adminOrders && !adminUuid) {
      setOrders(cache.adminOrders);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const params = {};
      if (adminUuid) {
        params.adminUuid = adminUuid;
      }
      const res = await api.get("/orders", { params });
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
      if (!adminUuid) {
        cache.adminOrders = formatted;
      }
    } catch (err) {
      console.error("failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle admin filter change
  const handleAdminFilterChange = (adminUuid) => {
    setAdminFilter(adminUuid);
    setCurrentPage(1);
    fetchOrders(adminUuid);
  };

  useEffect(() => {
    fetchOrders();
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

  // Ensure orderId is in ORD#### format
  const formatOrderIdForApi = (id) => {
    if (!id) return "";
    if (String(id).startsWith("ORD")) return id;
    const num = parseInt(String(id).replace(/[^0-9]/g, ""), 10) || 0;
    return `ORD${String(num).padStart(3, "0")}`;
  };

  const updateStatus = async (orderId, newStatus) => {
    const formattedOrderId = formatOrderIdForApi(orderId);
    if (newStatus === "cancelled") {
      setModalType("cancelled");
      setPendingStatus({ orderId: formattedOrderId, newStatus });
      setModalInput({ reason: "", courier: "", docket: "" });
      setShowStatusModal(true);
      return;
    }

    if (newStatus === "shipped") {
      setModalType("shipped");
      setPendingStatus({ orderId: formattedOrderId, newStatus });
      setModalInput({ reason: "", courier: "", docket: "" });
      setShowStatusModal(true);
      return;
    }

    // Direct update for other statuses
    confirmAndSendStatus(formattedOrderId, newStatus);
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

      // Re-fetch with current admin filter
      fetchOrders(adminFilter);
      setShowStatusModal(false);
    } catch (err) {
      console.error("updateStatus error:", err);
      let msg = "Failed to update status";
      if (err.response) {
        if (err.response.status === 401) msg = "You are not logged in. Please login again.";
        else if (err.response.status === 403) msg = "You do not have permission to update this order.";
        else if (err.response.status === 404) msg = "Order not found. Please refresh the page.";
        else if (err.response.data?.message) msg = err.response.data.message;
      }
      alert(msg);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Order Management</h1>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Orders</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FaClipboardList className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Delivered</p>
                <p className="text-3xl font-bold text-white">{stats.delivered}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <FaTruck className="text-emerald-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Cancelled</p>
                <p className="text-3xl font-bold text-white">{stats.cancelled}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <FaTimesCircle className="text-red-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Paid Orders</p>
                <p className="text-3xl font-bold text-white">{stats.paid}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FaCheckCircle className="text-green-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Revenue</p>
                <p className="text-3xl font-bold text-white">₹{stats.revenue.toLocaleString("en-IN")}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <FaMoneyBillWave className="text-indigo-400 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search Order ID or Member"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/90 border border-white/10 rounded-3xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

              {/* Admin Filter - Only visible to super admins */}
              {isSuperAdmin && (
                <AdminFilter 
                  value={adminFilter} 
                  onChange={handleAdminFilterChange}
                  disabled={loading}
                />
              )}

              <CustomDropdown
                label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All Status", value: "all" },
              { label: "Order Placed", value: "orderplaced" },
              { label: "Processing", value: "processing" },
              { label: "Packing", value: "packing" },
              { label: "Shipped", value: "shipped" },
              { label: "Out for Delivery", value: "outfordelivery" },
              { label: "Delivered", value: "delivered" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />

          <CustomDropdown
            label="Payment"
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={[
              { label: "All Payments", value: "all" },
              { label: "Paid", value: "paid" },
              { label: "Pending", value: "pending" },
            ]}
          />
          <button
            onClick={() => setDeliveryOnly((prev) => !prev)}
            className={`inline-flex items-center justify-center rounded-3xl px-4 py-3 text-sm font-medium transition ${
              deliveryOnly
                ? "bg-orange-500 text-white border border-orange-500"
                : "bg-slate-950/90 border border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            <FaTruck className="mr-2 h-4 w-4" />
            Delivery Only
          </button>

          {/* VIEW TOGGLE */}
          <div className="flex border border-white/15 rounded-3xl overflow-hidden bg-slate-950/50">
            <button
              onClick={() => setView("table")}
              className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition ${
                view === "table"
                  ? "bg-orange-500 text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <FaList className="mr-2 h-4 w-4" />
              Table
            </button>
            <button
              onClick={() => setView("grid")}
              className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition ${
                view === "grid"
                  ? "bg-orange-500 text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <FaThLarge className="mr-2 h-4 w-4" />
              Grid
            </button>
          </div>
        </div>
      </div>

        {/* ORDERS TABLE */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Order ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Member</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Amount</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Payment</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Actions</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Print</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((o) => (
                    <tr key={o.order_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }}
                        className="px-6 py-4 text-white cursor-pointer hover:text-orange-400"
                      >
                        {formatOrderId(o.order_id)}
                      </td>
                      <td
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }}
                        className="px-6 py-4 text-slate-300 cursor-pointer hover:text-orange-400"
                      >
                        {o.shipping?.name || o.pickup?.name || "-"}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        ₹{Number(o.total).toLocaleString("en-IN")}
                      </td>
                      <td
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }}
                        className="px-6 py-4 cursor-pointer"
                      >
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          normalizeKey(o.paymentStatus) === "paid"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge(o.status)}
                      </td>
                      <td className="px-6 py-4">
                        <CustomDropdown
                          label="Status"
                          value={normalizeKey(o.status)}
                          onChange={(value) => updateStatus(o.order_id, value)}
                          options={
                            normalizeKey(o.status) === "cancelled"
                              ? [{ label: "Cancelled", value: "cancelled" }]
                              : [
                                ...STATUS_SEQUENCE
                                  .map((step, idx) => {
                                    const currentIdx = STATUS_SEQUENCE.indexOf(normalizeKey(o.status));
                                    if (idx < currentIdx && currentIdx !== -1) return null;
                                    return {
                                      label: formatStatusLabel(step),
                                      value: step,
                                    };
                                  })
                                  .filter(Boolean),
                                ...(STATUS_SEQUENCE.indexOf(normalizeKey(o.status)) <
                                  STATUS_SEQUENCE.indexOf("shipped")
                                  ? [{ label: "Cancelled", value: "cancelled" }]
                                  : []),
                              ]
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => printOrder(o)}
                          className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="Print Invoice"
                        >
                          <FaPrint className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-6">
            {paginatedOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No orders found
              </div>
            ) : (
              paginatedOrders.map((o) => (
                <div
                  key={o.order_id}
                  className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.order_id}`) }}
                      className="cursor-pointer hover:text-orange-400"
                    >
                      <h3 className="font-semibold text-lg text-white">{formatOrderId(o.order_id)}</h3>
                      <p className="text-sm text-slate-400">{o.shipping?.name || o.pickup?.name || "-"}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {statusBadge(o.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        normalizeKey(o.paymentStatus) === "paid"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {(o.items || []).slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        {item.image && (
                          <img
                            src={makeImageUrl(item.image)}
                            className="w-12 h-12 object-cover rounded-lg border border-white/10"
                            alt=""
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
                          <p className="text-xs text-slate-400">Qty: {item.qty} | ₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                    {(o.items || []).length > 2 && (
                      <p className="text-xs text-slate-400 text-center">
                        +{(o.items || []).length - 2} more items
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <p className="text-lg font-bold text-white">
                      ₹{Number(o.total).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <CustomDropdown
                        label="Update Status"
                        value={normalizeKey(o.status)}
                        onChange={(value) => updateStatus(o.order_id, value)}
                        options={
                          normalizeKey(o.status) === "cancelled"
                            ? [{ label: "Cancelled", value: "cancelled" }]
                            : [
                              ...STATUS_SEQUENCE
                                .map((step, idx) => {
                                  const currentIdx = STATUS_SEQUENCE.indexOf(normalizeKey(o.status));
                                  if (idx < currentIdx && currentIdx !== -1) return null;
                                  return {
                                    label: formatStatusLabel(step),
                                    value: step,
                                  };
                                })
                                .filter(Boolean),
                              ...(STATUS_SEQUENCE.indexOf(normalizeKey(o.status)) <
                                STATUS_SEQUENCE.indexOf("shipped")
                                ? [{ label: "Cancelled", value: "cancelled" }]
                                : []),
                            ]
                        }
                      />
                    </div>
                    <button
                      onClick={() => printOrder(o)}
                      className="p-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Print Invoice"
                    >
                      <FaPrint className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Showing {Math.min((currentPage - 1) * ordersPerPage + 1, filteredOrders.length)} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                    currentPage === i + 1
                      ? "bg-orange-500 text-white"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
  </div>

  );
};

export default AllOrders;
