import { useEffect, useState } from "react";
import { Search, Users, CheckCircle, XCircle, AlertTriangle, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import { FaPrint } from "react-icons/fa";

// backend API
import api from "../../api";
import cache from "../../cache";
const MEMBERSHIPS_API = `memberships`;
const MEMBERS_API = `members`;

const Payments = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [viewType, setViewType] = useState("table");
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchPayments = async () => {
      if (cache.adminPayments) {
        setMembers(cache.adminPayments);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get(MEMBERSHIPS_API);
        const membershipsData = res.data;

        // Group memberships by user to match the existing UI shape
        const usersMap = new Map();

        if (!Array.isArray(membershipsData)) {
          console.warn("Expected array for memberships, got:", membershipsData);
          setMembers([]);
          return;
        }

        membershipsData.forEach((m) => {
          const uId = m.userId || `guest_${m.id}`;
          if (!usersMap.has(uId)) {
            usersMap.set(uId, {
              uid: uId,
              username:
                m.username ||
                m.userName ||
                m.member_name ||
                m.memberName ||
                "No Name",
              email:
                m.email ||
                m.userEmail ||
                m.member_email ||
                m.memberEmail ||
                "",
              plans: [],
            });
          }

          usersMap.get(uId).plans.push({
            id: m.id,
            planName: m.planName || m.plan_name || m.planName || "Unknown Plan",
            pricePaid: Number(m.pricePaid ?? m.price ?? 0),
            startDate: m.startDate || m.start_date || m.joinDate || m.join_date,
            endDate: m.endDate || m.end_date || m.expiryDate || m.expiry_date,
            createdAt: m.createdAt || m.created_at || m.startDate || m.start_date,
            status: m.status || "active",
            paymentStatus: m.paymentId ? "Paid" : "Unpaid",
          });
        });

        const finalData = Array.from(usersMap.values());
        setMembers(finalData);
        cache.adminPayments = finalData;
      } catch (error) {
        console.error(error);
        if (!cache.adminPayments) alert("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  /* ================= EXPIRY CHECK ================= */
  const isExpiringPlan = (endDate) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const today = new Date();
    const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return days <= 7 && days > 0;
  };

  const isToday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isYesterday = (date) => {
    if (!date) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const d = new Date(date);
    return d.toDateString() === yesterday.toDateString();
  };

  const isThisWeek = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  };

  const isThisMonth = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const isInCustomRange = (date) => {
    if (!date || !customStart || !customEnd) return true;
    const d = new Date(date);
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  };

  const getSerialNumber = (index) =>
    (currentPage - 1) * itemsPerPage + index + 1;

  /* ================= MARK STATUS ================= */
  const handleStatusChange = async (memberId, planId, newStatus) => {
    if (!window.confirm(`Mark this plan as ${newStatus}?`)) return;

    try {
      // update via API
      const res = await api.put(`${MEMBERSHIPS_API}/${planId}`, { status: newStatus });
      
      if (res.status !== 200) {
        console.error("status update failed");
        alert("Update failed");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.uid !== memberId
            ? m
            : {
                ...m,
                plans: m.plans.map((p) =>
                  p.id === planId
                    ? { ...p, status: newStatus, paymentStatus: newStatus === "active" ? "Paid" : "Unpaid" }
                    : p
                ),
              }
        )
      );
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };



  const getRemainingDays = (endDate) => {

    if (!endDate) return "-";

    const end = new Date(endDate);
    const today = new Date();

    end.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "Expired";
    if (diff === 0) return "Last Day";

    return `${diff} days`;

  };


  /* ================= PRINT RECEIPT ================= */
  const handlePrintReceipt = (member, plan) => {
    const receiptContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="text-align: center; color: #f97316; margin-bottom: 5px;">Gym Admin</h2>
        <h3 style="text-align: center; border-bottom: 2px dashed #ddd; padding-bottom: 15px; margin-top: 0; color: #555;">Payment Receipt</h3>
        <p style="margin-top: 20px;"><strong>Member Name:</strong> ${member.username}</p>
        <p><strong>Email:</strong> ${member.email}</p>
        <p><strong>Plan:</strong> ${plan.planName}</p>
        <p><strong>Amount Paid:</strong> ₹${plan.pricePaid}</p>
        <p><strong>Start Date:</strong> ${formatDate(plan.startDate)}</p>
        <p><strong>End Date:</strong> ${formatDate(plan.endDate)}</p>
        <p><strong>Status:</strong> <span style="text-transform: capitalize;">${plan.status}</span></p>
        <div style="border-top: 2px dashed #ddd; margin-top: 30px; padding-top: 15px; text-align: center; color: #777;">
          <p>Thank you for choosing us!</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Receipt</title></head><body>');
      printWindow.document.write(receiptContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  /* ================= FILTER ================= */
  // Get flat list of all plans for counting
  const allInitialPlans = [];
  members.forEach((member) => {
    member.plans.forEach((plan) => {
      // Date Filter for counts
      let passDate = true;
      if (dateFilter === "today" && !isToday(plan.createdAt)) passDate = false;
      if (dateFilter === "yesterday" && !isYesterday(plan.createdAt)) passDate = false;
      if (dateFilter === "this week" && !isThisWeek(plan.createdAt)) passDate = false;
      if (dateFilter === "this month" && !isThisMonth(plan.createdAt)) passDate = false;
      if (dateFilter === "custom" && !isInCustomRange(plan.createdAt)) passDate = false;

      if (passDate) {
        allInitialPlans.push(plan);
      }
    });
  });

  const counts = {
    all: allInitialPlans.length,
    active: allInitialPlans.filter((p) => p.status === "active").length,
    inactive: allInitialPlans.filter((p) => p.status === "inactive").length,
    expiry: allInitialPlans.filter((p) => isExpiringPlan(p.endDate)).length,
  };

  const filteredMembers = members
    .map((member) => ({
      ...member,
      plans: member.plans.filter((plan) => {
        const q = search.toLowerCase();

        const match =
          member.username?.toLowerCase().includes(q) ||
          member.email?.toLowerCase().includes(q) ||
          plan.planName?.toLowerCase().includes(q);

        if (!match) return false;

        // Status Filter
        if (filterType === "active" && plan.status !== "active") return false;
        if (filterType === "inactive" && plan.status !== "inactive") return false;
        if (filterType === "expiry" && !isExpiringPlan(plan.endDate)) return false;

        // Date Filter
        if (dateFilter === "today" && !isToday(plan.createdAt)) return false;
        if (dateFilter === "yesterday" && !isYesterday(plan.createdAt)) return false;
        if (dateFilter === "this week" && !isThisWeek(plan.createdAt)) return false;
        if (dateFilter === "this month" && !isThisMonth(plan.createdAt)) return false;
        if (dateFilter === "custom" && !isInCustomRange(plan.createdAt)) return false;

        return true;
      }),
    }))
    .filter((m) => m.plans.length > 0);

  /* ================= FLATTEN FOR PAGINATION ================= */
  const allPlans = [];
  filteredMembers.forEach((member) => {
    member.plans.forEach((plan) => {
      allPlans.push({ member, plan });
    });
  });

  const totalPages = Math.ceil(allPlans.length / itemsPerPage);

  const paginatedPlans = allPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* RESET PAGE ON SEARCH/FILTER */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, dateFilter, customStart, customEnd]);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toISOString().split("T")[0];
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const allIds = paginatedPlans.map(({ member }) => member.uid);
      setSelectedRows(allIds);
    }
    setSelectAll(!selectAll);
  };

  const exportToExcel = () => {
    const selectedData = paginatedPlans
      .filter(({ member }) => selectedRows.includes(member.uid))
      .map(({ member, plan }, index) => ({
        "S.No": index + 1,
        Name: member.username,
        Email: member.email,
        Plan: plan.planName,
        Amount: plan.pricePaid,
        "Start Date": formatDate(plan.startDate),
        "End Date": formatDate(plan.endDate),
        Status: plan.status,
      }));

    if (selectedData.length === 0) {
      alert("Please select rows first");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(selectedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

    XLSX.writeFile(workbook, "payments.xlsx");
  };

  const excelDateToJSDate = (value) => {

    if (!value) return null;

    // If already string date
    if (typeof value === "string") {
      return value;
    }

    // If Excel serial number
    const utc_days = Math.floor(value - 25569);
    const utc_value = utc_days * 86400;
    const date = new Date(utc_value * 1000);

    return date.toISOString().split("T")[0];
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);

      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Imported Data:", jsonData);

      try {

        for (const row of jsonData) {

          await api.post(MEMBERS_API, {
              name: row.Name,
              username: row.Name,
              phone: String(row.Mobile || ""),
              email: row.Email,
              plan: row.Plan,
              amount: row.Amount,
              joinDate: excelDateToJSDate(row["Start Date"]),
              expiryDate: excelDateToJSDate(row["End Date"]),
              status: row.Status || "active"
            });

        }

        alert("Excel imported successfully");

        window.location.reload();

      } catch (error) {
        console.error(error);
        alert("Import failed");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  if (loading && !cache.adminPayments) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Processing Transactions</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Payment Management</h1>

          {/* Right Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Import Excel */}
            <label className="inline-flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 px-4 py-3 text-sm font-medium hover:bg-blue-500/30 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
              Import Excel
            </label>

            {/* Export Excel */}
            <button
              onClick={exportToExcel}
              disabled={selectedRows.length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-green-500/20 text-green-400 px-4 py-3 text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Excel
            </button>

            {/* Toggle Buttons */}
            <div className="flex items-center rounded-xl bg-slate-800/50 border border-white/10 p-1 backdrop-blur-xl">
              <button
                onClick={() => setViewType("table")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewType === "table"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewType("card")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewType === "card"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                Card
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT → SEARCH */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, or plan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* RIGHT → FILTER BUTTONS */}
            <div className="flex flex-wrap gap-4 lg:justify-end items-center">
              {/* Date Filters */}
              <div className="flex items-center rounded-xl bg-slate-800/50 border border-white/10 p-1 gap-1 backdrop-blur-xl">
                <div className="px-3 text-gray-400 border-r border-white/10 hidden lg:flex items-center">
                  <Calendar size={16} />
                </div>
                {["all", "today", "yesterday", "this week", "this month", "custom"].map((df) => (
                  <button
                    key={df}
                    onClick={() => setDateFilter(df)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      dateFilter === df
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {df.charAt(0).toUpperCase() + df.slice(1)}
                  </button>
                ))}
              </div>

              {/* Custom Range Inputs */}
              {dateFilter === "custom" && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 border border-white/10 p-3 backdrop-blur-xl animate-in slide-in-from-right-2 duration-300">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent border-none text-xs text-white focus:ring-0 cursor-pointer"
                  />
                  <span className="text-gray-500 text-xs">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent border-none text-xs text-white focus:ring-0 cursor-pointer"
                  />
                </div>
              )}

              {/* Status Filters */}
              <div className="flex items-center rounded-xl bg-slate-800/50 border border-white/10 p-1 gap-1 backdrop-blur-xl">
                {["all", "active", "inactive", "expiry"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterType === type
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">Total Plans</p>
                <p className="text-3xl font-bold text-white">{counts.all}</p>
              </div>
              <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl">
                <Users size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl cursor-pointer hover:bg-slate-950/90 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">Active</p>
                <p className="text-3xl font-bold text-white">{counts.active}</p>
              </div>
              <div className="p-4 bg-green-500/20 text-green-400 rounded-2xl">
                <CheckCircle size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">Inactive</p>
                <p className="text-3xl font-bold text-white">{counts.inactive}</p>
              </div>
              <div className="p-4 bg-red-500/20 text-red-400 rounded-2xl">
                <XCircle size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">Expiring Soon</p>
                <p className="text-3xl font-bold text-white">{counts.expiry}</p>
              </div>
              <div className="p-4 bg-yellow-500/20 text-yellow-400 rounded-2xl">
                <AlertTriangle size={28} />
              </div>
            </div>
          </div>
        </div>


        {/* Card View */}
        {viewType === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedPlans.map(({ member, plan }) => (
              <div
                key={`${member.uid}_${plan.id}`}
                className="relative rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl hover:bg-slate-950/90 transition-colors"
              >
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full border font-medium ${
                      plan.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-400/30"
                        : "bg-gray-500/20 text-gray-300 border-gray-400/30"
                    }`}
                  >
                    {plan.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {member.username || "No Name"}
                  </h3>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Plan</p>
                      <p className="text-white font-medium">{plan.planName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Amount</p>
                      <p className="text-white font-medium">₹ {plan.pricePaid}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Start Date</p>
                      <p className="text-white whitespace-nowrap">{formatDate(plan.startDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">End Date</p>
                      <p className="text-white whitespace-nowrap">{formatDate(plan.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Days</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          getRemainingDays(plan.endDate) === "Expired"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : isExpiringPlan(plan.endDate)
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {getRemainingDays(plan.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() => handlePrintReceipt(member, plan)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl text-sm font-medium transition-colors border border-blue-500/30"
                  >
                    <FaPrint size={14} />
                    Print
                  </button>
                  {plan.status === "active" ? (
                    <button
                      onClick={() => handleStatusChange(member.uid, plan.id, "inactive")}
                      className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-sm font-medium transition-colors border border-red-500/30"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(member.uid, plan.id, "active")}
                      className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl text-sm font-medium transition-colors border border-green-500/30"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}



        {/* Table View */}
        {viewType === "table" && (
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-gray-300 font-medium">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-4 text-gray-300 font-medium">S.No</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">Name</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">Plan</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">Amount</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">Start Date</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">End Date</th>
                    <th className="px-6 py-4 text-gray-300 font-medium text-center">Days</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">Status</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">Action</th>
                    <th className="px-6 py-4 text-gray-300 font-medium">Print</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlans.map(({ member, plan }, index) => (
                    <tr
                      key={`${member.uid}_${plan.id}`}
                      className="border-b border-white/5 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(member.uid)}
                          onChange={() => toggleRow(member.uid)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{getSerialNumber(index)}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{member.username}</p>
                          <p className="text-gray-400 text-xs">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{plan.planName}</td>
                      <td className="px-6 py-4 text-white font-medium">₹ {plan.pricePaid}</td>
                      <td className="px-6 py-4 text-white whitespace-nowrap">{formatDate(plan.startDate)}</td>
                      <td className="px-6 py-4 text-white whitespace-nowrap">{formatDate(plan.endDate)}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                            getRemainingDays(plan.endDate) === "Expired"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : isExpiringPlan(plan.endDate)
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}
                        >
                          {getRemainingDays(plan.endDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            plan.status === "active"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {plan.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {plan.status === "active" ? (
                          <button
                            onClick={() => handleStatusChange(member.uid, plan.id, "inactive")}
                            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-sm font-medium transition-colors border border-red-500/30"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(member.uid, plan.id, "active")}
                            className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl text-sm font-medium transition-colors border border-green-500/30"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePrintReceipt(member, plan)}
                          className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-colors border border-blue-500/30"
                        >
                          <FaPrint size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <div className="text-sm text-gray-400">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, allPlans.length)} to {Math.min(currentPage * itemsPerPage, allPlans.length)} of {allPlans.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-gray-300 hover:bg-slate-800/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-xl border transition-colors ${
                      currentPage === pageNum
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                        : "bg-slate-800/50 border-white/10 text-gray-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-gray-300 hover:bg-slate-800/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
