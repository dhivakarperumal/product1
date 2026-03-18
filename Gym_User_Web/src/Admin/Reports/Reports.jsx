import { useEffect, useState, useMemo } from "react";
import {
  Users, ShoppingCart, CreditCard, MessageSquare,
  Download, Eye, X, TrendingUp, FileText,
} from "lucide-react";
import api from "../../api";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";

/* ========================
   STAT CARD
======================== */
const Stat = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-2xl p-5 flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
    <div>
      <p className="text-sm text-white/60">{title}</p>
      <h2 className="text-3xl font-bold text-white mt-1">{value}</h2>
    </div>
    <div className={`p-3 rounded-xl ${color} text-2xl`}>
      <Icon size={24} />
    </div>
  </div>
);

/* ========================
   DOWNLOAD HELPERS
======================== */
const downloadPDF = (title, headers, rows) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${dayjs().format("DD MMM YYYY, h:mm A")}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [239, 68, 68] },
  });
  doc.save(`${title}-${dayjs().format("YYYY-MM-DD")}.pdf`);
};

const downloadExcel = (title, headers, rows) => {
  const data = rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${title}-${dayjs().format("YYYY-MM-DD")}.xlsx`);
};

/* ========================
   MAIN
======================== */
const Reports = () => {
  const [members, setMembers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [preview, setPreview] = useState(null);

  /* ========================
     FETCH DATA
  ======================== */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mRes, oRes, pRes, eRes] = await Promise.allSettled([
          api.get("/members"),
          api.get("/orders"),
          api.get("/memberships"),
          api.get("/enquiries"),
        ]);
        if (mRes.status === "fulfilled") setMembers(Array.isArray(mRes.value.data) ? mRes.value.data : []);
        if (oRes.status === "fulfilled") setOrders(Array.isArray(oRes.value.data) ? oRes.value.data : []);
        if (pRes.status === "fulfilled") setMemberships(Array.isArray(pRes.value.data) ? pRes.value.data : []);
        if (eRes.status === "fulfilled") setEnquiries(Array.isArray(eRes.value.data) ? eRes.value.data : []);
      } catch (err) {
        console.error("Reports fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ========================
     FILTERED DATA
  ======================== */
  const filteredMembers = useMemo(() => 
    filterByDateRange(members, 'join_date', dateRange.type, dateRange.range),
    [members, dateRange]
  );

  const filteredOrders = useMemo(() => 
    filterByDateRange(orders, 'created_at', dateRange.type, dateRange.range),
    [orders, dateRange]
  );

  const filteredMemberships = useMemo(() => 
    filterByDateRange(memberships, 'startDate', dateRange.type, dateRange.range),
    [memberships, dateRange]
  );

  const filteredEnquiries = useMemo(() => 
    filterByDateRange(enquiries, 'created_at', dateRange.type, dateRange.range),
    [enquiries, dateRange]
  );

  /* ========================
     TABLE CONFIGS
  ======================== */
  const tabs = [
    {
      key: "members",
      label: "Members",
      icon: Users,
      color: "bg-blue-500/20 text-blue-400",
      data: filteredMembers,
      headers: ["#", "Name", "Email", "Phone", "Plan", "Status", "Join Date"],
      rows: filteredMembers.map((m, i) => [
        i + 1,
        m.name || "N/A",
        m.email || m.user_email || "-",
        m.phone || "-",
        m.plan || m.role || "Member",
        m.status || "Active",
        m.join_date ? dayjs(m.join_date).format("DD MMM YYYY") : "-",
      ]),
    },
    {
      key: "orders",
      label: "Orders",
      icon: ShoppingCart,
      color: "bg-orange-500/20 text-orange-400",
      data: filteredOrders,
      headers: ["#", "Order ID", "Customer", "Total", "Status", "Date"],
      rows: filteredOrders.map((o, i) => [
        i + 1,
        o.id || o.order_id || "-",
        o.name || o.user_name || o.customer_name || "-",
        `₹${parseFloat(o.total || o.total_amount || 0).toFixed(2)}`,
        o.status || "-",
        o.created_at ? dayjs(o.created_at).format("DD MMM YYYY") : "-",
      ]),
    },
    {
      key: "payments",
      label: "Plans / Payments",
      icon: CreditCard,
      color: "bg-green-500/20 text-green-400",
      data: filteredMemberships,
      headers: ["#", "Member", "Email", "Plan", "Amount", "Mode", "Status", "Start", "End"],
      rows: filteredMemberships.map((p, i) => [
        i + 1,
        p.userName || p.username || "-",
        p.userEmail || p.email || "-",
        p.planName || "-",
        p.pricePaid != null ? `₹${parseFloat(p.pricePaid).toFixed(2)}` : "-",
        p.paymentMode || p.paymentId ? (p.paymentMode || "Razorpay") : "-",
        p.status || "active",
        p.startDate ? dayjs(p.startDate).format("DD MMM YYYY") : "-",
        p.endDate ? dayjs(p.endDate).format("DD MMM YYYY") : "-",
      ]),
    },
    {
      key: "enquiries",
      label: "Enquiries",
      icon: MessageSquare,
      color: "bg-purple-500/20 text-purple-400",
      data: filteredEnquiries,
      headers: ["#", "Name", "Email", "Phone", "Subject", "Status", "Date"],
      rows: filteredEnquiries.map((e, i) => [
        i + 1,
        e.name || "-",
        e.email || "-",
        e.phone || "-",
        e.subject || "-",
        e.status || "pending",
        e.created_at ? dayjs(e.created_at).format("DD MMM YYYY") : "-",
      ]),
    },
  ];

  const currentTab = tabs.find(t => t.key === activeTab);

  /* ========================
     UI
  ======================== */
  return (
    <div className="p-0 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
            <p className="text-white/50 text-sm">Download and view gym data reports</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />
          <button
            onClick={() => downloadPDF(currentTab.label, currentTab.headers, currentTab.rows)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition whitespace-nowrap"
          >
            <Download size={15} /> PDF
          </button>
          <button
            onClick={() => downloadExcel(currentTab.label, currentTab.headers, currentTab.rows)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition whitespace-nowrap"
          >
            <Download size={15} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Total Members" value={filteredMembers.length} icon={Users} color="bg-blue-500/20 text-blue-400" />
        <Stat title="Total Orders" value={filteredOrders.length} icon={ShoppingCart} color="bg-orange-500/20 text-orange-400" />
        <Stat title="Plan Purchases" value={filteredMemberships.length} icon={CreditCard} color="bg-green-500/20 text-green-400" />
        <Stat title="Enquiries" value={filteredEnquiries.length} icon={MessageSquare} color="bg-purple-500/20 text-purple-400" />
      </div>

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === t.key
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <Icon size={16} /> {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/20" : "bg-white/10"}`}>
                {t.data.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white/50 animate-pulse text-sm">Loading report data...</p>
          </div>
        ) : currentTab.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <TrendingUp size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No {currentTab.label} data found</p>
            <p className="text-sm mt-1">Data will appear here once added</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-white">
              <thead className="bg-white/10 border-b border-white/10">
                <tr>
                  {currentTab.headers.map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-white/80 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTab.rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 whitespace-nowrap text-white/80">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER COUNT */}
      {!loading && currentTab.rows.length > 0 && (
        <p className="text-white/40 text-xs text-right">
          Showing {currentTab.rows.length} {currentTab.label.toLowerCase()} records
        </p>
      )}
    </div>
  );
};

export default Reports;
