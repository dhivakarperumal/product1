import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Save,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";

/* ───────────────────── STATUS BADGE ───────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    Present: "bg-green-500/20 text-green-400",
    Absent: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        map[status] || "bg-white/10 text-white/60"
      }`}
    >
      {status || "Not Marked"}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
 *  MEMBER ATTENDANCE PAGE
 * ───────────────────────────────────────────────────────── */
const MemberAttendance = () => {
  const todayString = dayjs().format("YYYY-MM-DD");

  const [date, setDate] = useState(todayString);
  const [dateRange, setDateRange] = useState({ type: "Today", range: null });

  const [members, setMembers]       = useState([]); // gym members list
  const [attendance, setAttendance] = useState({}); // { userId → "Present"|"Absent" }
  const [allRecords, setAllRecords] = useState([]); // raw API records for the table

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState({});  // { userId: bool }
  const [showMarkModal, setShowMarkModal] = useState(false);

  const [searchTerm, setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ─── Load active gym members (no trainers – role=user from /api/members) ─── */
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await api.get("/members");
        const active = (res.data || []).filter(
          (m) => (m.status || "").toLowerCase() === "active"
        );
        setMembers(active);
      } catch (err) {
        console.error("loadMembers error:", err);
        toast.error("Failed to load members");
      }
    };
    loadMembers();
  }, []);

  /* ─── Load attendance records from MySQL ─── */
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/attendance?memberOnly=true";
      if (dateRange.type === "Today" || dateRange.type === "Yesterday") {
        const d =
          dateRange.type === "Today"
            ? dayjs()
            : dayjs().subtract(1, "day");
        url += `&date=${d.format("YYYY-MM-DD")}`;
      }
      const res = await api.get(url);
      const records = res.data || [];
      setAllRecords(records);

      // Build a lookup map: userId → status  (used in the Mark modal)
      const map = {};
      records.forEach((r) => {
        if (r.member_id) map[r.member_id] = r.status;
      });
      setAttendance(map);
    } catch (err) {
      console.error("loadAttendance error:", err);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  /* ─── Mark attendance for a single member ─── */
  const markAttendance = async (member, status) => {
    const userId = member.u_id;
    if (!userId) {
      toast.error(`No linked account for ${member.name}`);
      return;
    }
    setSaving((p) => ({ ...p, [userId]: true }));
    try {
      await api.post("/attendance", { memberId: userId, status, date });
      setAttendance((p) => ({ ...p, [userId]: status }));
      toast.success(`${member.name} → ${status}`);
    } catch (err) {
      console.error("markAttendance error:", err);
      toast.error("Attendance update failed");
    } finally {
      setSaving((p) => ({ ...p, [userId]: false }));
    }
  };

  /* ─── Mark ALL members at once ─── */
  const handleMarkAll = async (defaultStatus) => {
    setSaving({ _all: true });
    try {
      await Promise.all(
        members.map((m) =>
          m.u_id
            ? api.post("/attendance", {
                memberId: m.u_id,
                status: attendance[m.u_id] || defaultStatus,
                date,
              })
            : null
        )
      );
      toast.success("All attendance saved!");
      setShowMarkModal(false);
      loadAttendance();
    } catch (err) {
      console.error("markAll error:", err);
      toast.error("Bulk save failed");
    } finally {
      setSaving({});
    }
  };

  /* ─── Filtered records for the table ─── */
  const filteredRecords = useMemo(() => {
    let data = allRecords;

    // Date range filter
    if (dateRange.type !== "All Time") {
      const mapped = data.map((r) => ({
        ...r,
        recordDate: r.date || r.check_in,
      }));
      data = filterByDateRange(mapped, "recordDate", dateRange.type, dateRange.range);
    }

    // Search + status filter
    return data.filter((r) => {
      const name = r.name || r.email || "Unknown";
      const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allRecords, searchTerm, statusFilter, dateRange]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const present = filteredRecords.filter((r) => r.status === "Present").length;
    const absent  = filteredRecords.filter((r) => r.status === "Absent").length;
    return { present, absent, total: filteredRecords.length };
  }, [filteredRecords]);

  /* ─── CSV Download ─── */
  const downloadCSV = () => {
    if (!filteredRecords.length) return toast.error("No data to download");
    let csv = "Name,Email,Status,Date\n";
    filteredRecords.forEach((r) => {
      csv += `"${r.name || ""}","${r.email || ""}","${r.status}","${r.date || ""}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `member-attendance-${date}.csv`;
    a.click();
  };

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="min-h-screen p-6 text-white space-y-8 bg-transparent">

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent italic">
            MEMBER ATTENDANCE
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2 font-medium">
            <Users className="w-5 h-5 text-orange-500" />
            Gym Members Management • {members.length} Active Members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter
            initialRange="Today"
            onRangeChange={(type, range) => setDateRange({ type, range })}
          />

          <button
            onClick={() => setShowMarkModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-red-600/20 flex items-center gap-3"
          >
            <CheckCircle className="w-6 h-6" /> Mark Today
          </button>

          <button
            onClick={downloadCSV}
            className="p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-orange-500"
            title="Download CSV"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Logs",     val: stats.total,   color: "blue",  icon: Users },
          { label: "Present Today",  val: stats.present, color: "green", icon: CheckCircle },
          { label: "Absent Today",   val: stats.absent,  color: "red",   icon: XCircle },
        ].map((s, idx) => (
          <div
            key={idx}
            className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex items-center justify-between group hover:border-orange-500/50 transition-all"
          >
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-1">
                {s.label}
              </p>
              <h3
                className={`text-5xl font-black ${
                  s.color === "green"
                    ? "text-green-400"
                    : s.color === "red"
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                {s.val}
              </h3>
            </div>
            <s.icon
              className={`w-12 h-12 opacity-20 group-hover:opacity-100 transition-all text-${s.color}-500`}
            />
          </div>
        ))}
      </div>

      {/* ── SEARCH + STATUS FILTER ── */}
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all shadow-sm"
          />
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {["All", "Present", "Absent"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                statusFilter === f
                  ? "bg-orange-600 text-white shadow-lg"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] hide-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
              <tr>
                <th className="px-10 py-6">Member</th>
                <th className="px-10 py-6">Plan</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-32 text-gray-500 animate-pulse font-bold tracking-widest uppercase"
                  >
                    Loading Members...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-32 text-gray-600 italic font-medium"
                  >
                    No records found for this date.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition group">
                    {/* Member info */}
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-xs">
                          {r.name?.charAt(0) || "M"}
                        </div>
                        <div>
                          <p className="font-black group-hover:text-orange-400 transition-colors uppercase text-sm tracking-tight">
                            {r.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Plan (role column repurposed) */}
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40">
                        {r.role || "Member"}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-10 py-6 text-center">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Date */}
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                        <Calendar className="w-3 h-3" />
                        {r.date
                          ? dayjs(r.date).format("DD MMM YYYY")
                          : r.check_in
                          ? dayjs(r.check_in).format("DD MMM YYYY")
                          : "—"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MARK MODAL ── */}
      {showMarkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            onClick={() => setShowMarkModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#0d0e12] border border-white/20 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal header */}
            <div className="bg-gradient-to-br from-red-600 to-orange-500 p-10 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-white italic">
                  MEMBER CHECKLIST
                </h3>
                <p className="text-white/80 mt-1 uppercase text-xs font-black tracking-widest">
                  {dayjs(date).format("DD MMMM YYYY")}
                </p>
              </div>
              <button
                onClick={() => setShowMarkModal(false)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Date picker inside modal */}
            <div className="px-10 pt-6 pb-2 flex items-center gap-4">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-black">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 text-white"
              />
            </div>

            {/* Member checklist */}
            <div className="flex-1 overflow-y-auto px-10 pb-6 space-y-3 hide-scrollbar mt-4">
              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-10">
                  No active members found.
                </p>
              ) : (
                members.map((m) => {
                  const userId = m.u_id;
                  const status = attendance[userId];
                  const isSaving = saving[userId] || saving["_all"];
                  return (
                    <div
                      key={m.id || m.member_id}
                      className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10"
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-xs">
                          {m.name?.charAt(0) || "M"}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">
                            {m.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {m.email}
                          </p>
                        </div>
                      </div>

                      {/* Present / Absent buttons */}
                      <div className="flex gap-2">
                        <button
                          disabled={isSaving}
                          onClick={() => markAttendance(m, "Present")}
                          className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            status === "Present"
                              ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                              : "bg-white/10 text-gray-400 hover:bg-green-600/20 hover:text-green-400"
                          } disabled:opacity-40`}
                        >
                          Present
                        </button>
                        <button
                          disabled={isSaving}
                          onClick={() => markAttendance(m, "Absent")}
                          className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            status === "Absent"
                              ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                              : "bg-white/10 text-gray-400 hover:bg-red-600/20 hover:text-red-400"
                          } disabled:opacity-40`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Save all footer */}
            <div className="px-10 py-6 border-t border-white/10 flex justify-end gap-4">
              <button
                onClick={() => setShowMarkModal(false)}
                className="px-6 py-3 bg-white/10 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/20 transition"
              >
                Close
              </button>
              <button
                disabled={!!saving["_all"]}
                onClick={() => handleMarkAll("Present")}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberAttendance;
