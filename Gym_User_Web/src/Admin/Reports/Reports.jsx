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
  <div className="rounded-[2rem] p-6 flex justify-between items-center bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] hover:bg-slate-950/90 transition-colors">
    <div>
      <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{title}</p>
      <h2 className="text-3xl font-bold text-white">{value}</h2>
    </div>
    <div className={`p-4 rounded-[2rem] ${color} border border-white/10`}>
      <Icon size={28} />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[2rem] bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Reports & Analytics</h1>
              <p className="text-white/60 text-sm">Download and view comprehensive gym data reports</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />
            <button
              onClick={() => downloadPDF(currentTab.label, currentTab.headers, currentTab.rows)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-medium transition-colors"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={() => downloadExcel(currentTab.label, currentTab.headers, currentTab.rows)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-medium transition-colors"
            >
              <Download size={16} /> Excel
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Stat title="Total Members" value={filteredMembers.length} icon={Users} color="bg-blue-500/20 text-blue-400" />
          <Stat title="Total Orders" value={filteredOrders.length} icon={ShoppingCart} color="bg-orange-500/20 text-orange-400" />
          <Stat title="Plan Purchases" value={filteredMemberships.length} icon={CreditCard} color="bg-green-500/20 text-green-400" />
          <Stat title="Enquiries" value={filteredEnquiries.length} icon={MessageSquare} color="bg-purple-500/20 text-purple-400" />
        </div>

        {/* Report Tabs */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-wrap gap-3">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === t.key
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 border border-orange-500/30"
                      : "bg-slate-800/50 text-gray-300 hover:bg-slate-800/70 hover:text-white border border-white/10"
                  }`}
                >
                  <Icon size={18} />
                  {t.label}
                  <span className={`text-xs px-2 py-1 rounded-full ml-1 ${
                    activeTab === t.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-700/50 text-gray-400"
                  }`}>
                    {t.data.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full animate-pulse" />
              </div>
              <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse mt-4">Loading report data...</p>
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
                <thead className="bg-slate-800/50">
                  <tr>
                    {currentTab.headers.map(h => (
                      <th key={h} className="px-6 py-4 text-left font-medium text-gray-300 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTab.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 hover:bg-slate-800/30 transition-colors"
                    >
                      {row.map((cell, j) => (
                        <td key={j} className="px-6 py-4 whitespace-nowrap text-white/80">
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

        {/* Footer Count */}
        {!loading && currentTab.rows.length > 0 && (
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Showing {currentTab.rows.length} {currentTab.label.toLowerCase()} records
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
