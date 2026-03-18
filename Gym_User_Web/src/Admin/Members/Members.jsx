import React, { useEffect, useState } from "react";
import { Trash2, Pencil, Plus, ChevronLeft, ChevronRight, LayoutGrid, List, Search, Users, Mail, Phone, Calendar } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api"
import cache from "../../cache";
import * as XLSX from "xlsx";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";


const Members = () => {
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(querySearch);
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });

  useEffect(() => {
    setSearch(querySearch);
  }, [querySearch]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // table, card
  const navigate = useNavigate();

  // 🔄 FETCH MEMBERS
  const fetchMembers = async () => {
    if (cache.adminMembers) {
      setMembers(cache.adminMembers);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get("/members");
      const data = Array.isArray(res.data) ? res.data : [];
      setMembers(data);
      cache.adminMembers = data;
    } catch {
      if (!cache.adminMembers) toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 🔎 SEARCH & DATE FILTER - Robust filtering
  const filtered = (members || []).filter((m) => {
    // 1. Text Search
    let matchesText = true;
    if (search) {
      const s = search.toLowerCase();
      matchesText = (
        String(m.name || "").toLowerCase().includes(s) ||
        String(m.username || "").toLowerCase().includes(s) ||
        String(m.phone || "").includes(s) ||
        String(m.mobile || "").includes(s) ||
        String(m.email || "").toLowerCase().includes(s) ||
        String(m.user_email || "").toLowerCase().includes(s) ||
        String(m.plan || "").toLowerCase().includes(s)
      );
    }

    if (!matchesText) return false;

    // 2. Date Range Filter
    return filterByDateRange([m], 'join_date', dateRange.type, dateRange.range).length > 0;
  });

  // 📄 PAGINATION
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // 🗑 DELETE MEMBER
  const handleDelete = async (m) => {
    const idToDelete = m.id || m.member_id;
    if (!idToDelete && m.source === "users") {
      toast.error("Cannot delete a registered user from here. Use user management.");
      return;
    }

    if (!window.confirm(`Delete ${m.name || "this member"}?`)) return;

    try {
      await api.delete(`/members/${idToDelete}`);
      toast.success("Deleted successfully");
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  /* ================= EXPORT TO EXCEL ================= */
  const exportToExcel = () => {
    if (members.length === 0) {
      toast.error("No members to export");
      return;
    }

    const dataToExport = members.map((m, index) => ({
      "S.No": index + 1,
      Name: m.name || "N/A",
      Phone: m.phone || "N/A",
      Email: m.email || m.user_email || "-",
      Role: m.role || m.plan || "Member",
      Source: m.source === "users" ? "User" : "Gym Member",
      "Join Date": m.join_date || "-",
      "Expiry Date": m.expiry_date || "-",
      Status: m.status || "active"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "members_directory.xlsx");
    toast.success("Exported successfully");
  };

  /* ================= IMPORT FROM EXCEL ================= */
  const excelDateToJSDate = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const row of jsonData) {
          const email = row.Email || row.email;
          if (!email) continue;

          const username = email.split('@')[0];
          const joinDate = excelDateToJSDate(row["Join Date"] || row.joinDate || row["JoinDate"]);
          const duration = Number(row.Duration || row.duration || 0);

          // Calculate Expiry Date
          let expiryDate = row["Expiry Date"] || row.expiryDate || row["ExpiryDate"];
          if (!expiryDate && joinDate && duration) {
            const d = new Date(joinDate);
            d.setMonth(d.getMonth() + duration);
            expiryDate = d.toISOString().split("T")[0];
          } else if (expiryDate) {
            expiryDate = excelDateToJSDate(expiryDate);
          }

          // Calculate BMI
          const height = row.Height || row.height || "";
          const weight = row.Weight || row.weight || "";
          let bmi = row.BMI || row.bmi || "";
          if (!bmi && height && weight) {
            const h = Number(height) / 100;
            const w = Number(weight);
            if (h > 0) bmi = (w / (h * h)).toFixed(1);
          }

          const payload = {
            name: row.Name || row.name,
            username: username,
            phone: String(row.Phone || row.phone || row.Mobile || ""),
            email: email,
            gender: row.Gender || row.gender || "",
            height: height,
            weight: weight,
            bmi: bmi,
            plan: row.Plan || row.plan || "",
            duration: duration,
            joinDate: joinDate,
            expiryDate: expiryDate,
            status: row.Status || row.status || "active",
            address: row.Address || row.address || "",
            notes: row.Notes || row.notes || "",
            password: String(row.Phone || row.phone || row.Mobile || "123456")
          };

          await api.post("/members", payload);
        }

        toast.success("Imported successfully");
        fetchMembers();
      } catch (err) {
        console.error(err);
        toast.error("Import failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading && !cache.adminMembers) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Retrieving Member Directory</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-0 py-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 px-4 sm:px-0">
        {/* 🔍 SEARCH */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name or phone"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* ➕ ADD MEMBER + IMPORT/EXPORT */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Import */}
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-600 transition shadow-lg whitespace-nowrap flex-1 sm:flex-none">
            Import Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>

          {/* Export */}
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            Export Excel
          </button>

          <button
            onClick={() => navigate("/admin/addmembers")}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white
            bg-gradient-to-r from-orange-500 to-orange-600
            hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            <Plus size={16} />
            Add Member
          </button>

          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

          {/* 🖥 View Toggle */}
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20 ml-0 sm:ml-2">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition ${viewMode === "card" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              title="Card View"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition ${viewMode === "table" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              title="Table View"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* DATA VIEW */}
      {viewMode === "table" ? (
        /* ================= TABLE VIEW ================= */
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-gray-200">
            <thead className="border-b border-white/10">
              <tr>
                <th className="p-4 text-left font-medium">S No</th>
                <th className="p-4 text-left font-medium">Name</th>
                <th className="p-4 text-left font-medium">Phone</th>
                <th className="p-4 text-left font-medium">Email</th>
                <th className="p-4 text-left font-medium">Height</th>
                <th className="p-4 text-left font-medium">Weight</th>
                <th className="p-4 text-left font-medium">BMI</th>
                <th className="p-4 text-left font-medium">Plan</th>
                <th className="p-4 text-left font-medium">Type</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400">
                    {loading ? "Loading members..." : filtered.length === 0 ? "No records found" : "No data on this page"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((m, index) => (
                  <tr key={m.id || `u-${m.u_id}`} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-4 font-medium text-white">{startIndex + index + 1}</td>
                    <td className="p-4 font-medium text-white">{m.name || "N/A"}</td>
                    <td className="p-4">{m.phone || "N/A"}</td>
                    <td className="p-4">{m.email || m.user_email || "-"}</td>
                    <td className="p-4 text-gray-400">{m.height ? `${m.height} cm` : "-"}</td>
                    <td className="p-4 text-gray-400">{m.weight ? `${m.weight} kg` : "-"}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-white/10 text-orange-400 font-bold text-xs">
                        {m.bmi || "-"}
                      </span>
                    </td>
                   
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400">
                        {m.plan || m.role || "Member"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${m.source === "users"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-purple-500/20 text-purple-400"
                        }`}>
                        {m.source === "users" ? "User" : "Gym Member"}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => {
                          if (m.source === "users") {
                            navigate(`/admin/addmembers?user_id=${m.u_id}`);
                          } else {
                            navigate(`/admin/addmembers/${m.id}`);
                          }
                        }}
                        className="p-2 rounded-lg bg-yellow-500/80 hover:bg-yellow-500 text-white transition"
                        title={m.source === "users" ? "Convert to Gym Member" : "Edit Member"}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================= CARD VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedData.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-400 bg-white/5 border border-white/10 rounded-2xl">
              {loading ? "Loading..." : filtered.length === 0 ? "No records found" : "No data on this page"}
            </div>
          ) : (
            paginatedData.map((m, index) => (
              <div
                key={m.id || `u-card-${m.u_id}`}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:border-white/40 transition backdrop-blur-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Users size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white line-clamp-1">{m.name || "N/A"}</p>
                        <p className="text-xs text-gray-400">{startIndex + index + 1}. Member ID: #{m.id || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (m.source === "users") {
                            navigate(`/admin/addmembers?user_id=${m.u_id}`);
                          } else {
                            navigate(`/admin/addmembers/${m.id}`);
                          }
                        }}
                        className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Phone size={14} className="text-orange-500" />
                      {m.phone || "No phone"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Mail size={14} className="text-orange-500" />
                      <span className="truncate">{m.email || m.user_email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
                        {m.plan || m.role || "Member"}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold ring-1 ${m.source === "users"
                        ? "bg-blue-500/20 text-blue-400 ring-blue-500/30"
                        : "bg-purple-500/20 text-purple-400 ring-purple-500/30"
                        }`}>
                        {m.source === "users" ? "User" : "Gym Member"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 mt-4">
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10 text-center">
                    <p className="text-[10px] text-gray-400 uppercase mb-1">Height</p>
                    <p className="text-sm font-bold text-white">{m.height || "-"} <span className="text-[8px] font-normal opacity-50">cm</span></p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10 text-center">
                    <p className="text-[10px] text-gray-400 uppercase mb-1">Weight</p>
                    <p className="text-sm font-bold text-white">{m.weight || "-"} <span className="text-[8px] font-normal opacity-50">kg</span></p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10 text-center">
                    <p className="text-[10px] text-gray-400 uppercase mb-1">BMI</p>
                    <p className="text-sm font-bold text-orange-400">{m.bmi || "-"}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 📄 PAGINATION UI */}
      {filtered.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Showing <span className="text-white font-medium">{startIndex + 1}</span> to{" "}
            <span className="text-white font-medium">
              {Math.min(startIndex + itemsPerPage, filtered.length)}
            </span>{" "}
            of <span className="text-white font-medium">{filtered.length}</span> members
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110 z-10"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="5" className="bg-gray-900">5</option>
              <option value="10" className="bg-gray-900">10</option>
              <option value="20" className="bg-gray-900">20</option>
              <option value="50" className="bg-gray-900">50</option>
            </select>
          </div>
        </div>
      )}

    </div>
  );
};

export default Members;
