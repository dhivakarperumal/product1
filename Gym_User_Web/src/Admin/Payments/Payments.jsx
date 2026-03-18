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
              username: m.username || m.userName || "No Name",
              email: m.email || m.userEmail || "",
              plans: [],
            });
          }

          usersMap.get(uId).plans.push({
            id: m.id,
            planName: m.planName,
            pricePaid: m.pricePaid || 0,
            startDate: m.startDate,
            endDate: m.endDate,
            createdAt: m.createdAt,
            status: m.status || "active",
            paymentStatus: m.paymentId ? "Paid" : "Paid",
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
    <div className="min-h-screen p-4 md:p-8 text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">

  {/* Title */}
  <h1 className="text-2xl md:text-3xl font-bold">
    Payment Details
  </h1>

  {/* Right Section */}
  <div className="flex flex-wrap items-center gap-3 mb-5 ml-auto">

    {/* Import Excel */}
    <label className="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-600 transition">
      Import Excel
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImport}
        className="hidden"
      />
    </label>

    {/* Export Excel */}
    <button
      onClick={exportToExcel}
      className="px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"
    >
      Export Excel
    </button>

    {/* Toggle Buttons */}
    <div className="flex items-center bg-[#2a2540] rounded-xl p-1">

      <button
        onClick={() => setViewType("table")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          viewType === "table"
            ? "bg-orange-500 text-white"
            : "text-gray-300 hover:bg-white/10"
        }`}
      >
        Table
      </button>

      <button
        onClick={() => setViewType("card")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          viewType === "card"
            ? "bg-orange-500 text-white"
            : "text-gray-300 hover:bg-white/10"
        }`}
      >
        Card
      </button>

    </div>

  </div>

</div>

      {/* SEARCH + FILTERS SAME ROW */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        {/* LEFT → SEARCH */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2 rounded-lg bg-white/10 border border-white/20"
          />
        </div>

        {/* RIGHT → FILTER BUTTONS */}
        <div className="flex flex-wrap gap-4 md:justify-end items-center">
          {/* Date Filters */}
          <div className="flex items-center bg-white/5 border border-white/20 rounded-xl p-1 gap-1">
            <div className="px-3 text-gray-400 border-r border-white/10 hidden lg:block">
              <Calendar size={16} />
            </div>
            {["all", "today", "yesterday", "this week", "this month", "custom"].map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${dateFilter === df
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {df.charAt(0).toUpperCase() + df.slice(1)}
              </button>
            ))}
          </div>

          {/* Custom Range Inputs */}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/20 rounded-xl p-1 animate-in slide-in-from-right-2 duration-300">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:ring-0 px-2 py-1 cursor-pointer"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:ring-0 px-2 py-1 cursor-pointer"
              />
            </div>
          )}

          {/* Status Filters */}
          <div className="flex items-center bg-white/5 border border-white/20 rounded-xl p-1 gap-1">
            {["all", "active", "inactive", "expiry"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${filterType === type
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Plans</p>
            <p className="text-2xl font-bold">{counts.all}</p>
          </div>
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Active</p>
            <p className="text-2xl font-bold">{counts.active}</p>
          </div>
          <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Inactive</p>
            <p className="text-2xl font-bold">{counts.inactive}</p>
          </div>
          <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
            <XCircle size={24} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Expiring Soon</p>
            <p className="text-2xl font-bold">{counts.expiry}</p>
          </div>
          <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>


      {/* ================= GRID VIEW ================= */}
      {viewType === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedPlans.map(({ member, plan }, index) => (
            <div
              key={`${member.uid}_${plan.id}`}
              className="relative bg-white/10 border border-white/20 rounded-xl p-6"
            >
              <span
                className={`absolute top-4 right-4 px-3 py-1 text-xs rounded-full border ${plan.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-400/30"
                  : "bg-gray-500/20 text-gray-300 border-gray-400/30"
                  }`}
              >
                {plan.status === "active" ? "Active" : "Inactive"}
              </span>

              {/* <div>
                {getSerialNumber(index)}
              </div> */}

              <p className="text-lg font-semibold">
                {member.username || "No Name"}
              </p>
              <p className="text-sm text-gray-300 mb-4">
                {member.email}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Plan</p>
                  <p>{plan.planName}</p>
                </div>

                <div>
                  <p className="text-gray-400">Amount</p>
                  <p>₹ {plan.pricePaid}</p>
                </div>

                <div>
                  <p className="text-gray-400">Start Date</p>
                  <p className="whitespace-nowrap">{formatDate(plan.startDate)}</p>
                </div>

                <div>
                  <p className="text-gray-400">Remaining Days</p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      getRemainingDays(plan.endDate) === "Expired"
                        ? "bg-red-500/20 text-red-400"
                        : isExpiringPlan(plan.endDate)
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >

                    {getRemainingDays(plan.endDate)}

                  </span>
                </div>

                <div>
                  <p className="text-gray-400">End Date</p>
                  <p className="whitespace-nowrap">{formatDate(plan.endDate)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => handlePrintReceipt(member, plan)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition"
                >
                  <FaPrint/>
                </button>
                {plan.status === "active" ? (
                  <button
                    onClick={() => handleStatusChange(member.uid, plan.id, "inactive")}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm transition"
                  >
                    Refund & Inactive
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(member.uid, plan.id, "active")}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm transition"
                  >
                    Mark Active
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}



      {/* ================= TABLE VIEW ================= */}
      {viewType === "table" && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-4">S.No</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Start Date</th>
                <th className="px-4 py-4">End Date</th>
                <th className="px-4 py-3">Days Left</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">Printer</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlans.map(({ member, plan }, index) => (
                <tr
                  key={`${member.uid}_${plan.id}`}
                  className="border-b border-white/10 hover:bg-white/5"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(member.uid)}
                      onChange={() => toggleRow(member.uid)}
                    />
                  </td>
                  <td className="px-4 py-4">{getSerialNumber(index)}</td>
                  <td className="px-4 py-4">{member.username}</td>
                 
                  <td className="px-4 py-4">{plan.planName}</td>
                  <td className="px-4 py-4">₹ {plan.pricePaid}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{formatDate(plan.startDate)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{formatDate(plan.endDate)}</td>
                   <td className="px-4 py-3">

                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      getRemainingDays(plan.endDate) === "Expired"
                        ? "bg-red-500/20 text-red-400"
                        : isExpiringPlan(plan.endDate)
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >

                    {getRemainingDays(plan.endDate)}

                  </span>

                </td>
                  <td className="px-4 py-4">
                    {plan.status === "active"
                      ? "Active"
                      : "Inactive"}
                  </td>
                  <td className="px-4 py-4  items-center gap-2">
			
                    {plan.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange(member.uid, plan.id, "inactive")}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition whitespace-nowrap"
                      >
                       Togle Inactive
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(member.uid, plan.id, "active")}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition whitespace-nowrap"
                      >
                        Mark Active
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-4  gap-2">
                    <button
                      onClick={() => handlePrintReceipt(member, plan)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition whitespace-nowrap"
                    >
                      <FaPrint/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1 rounded bg-white/10 border border-white/20"
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded border ${currentPage === page
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white/10 border-white/20"
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
            }
            className="px-3 py-1 rounded bg-white/10 border border-white/20"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Payments;
