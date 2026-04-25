import { useEffect, useMemo, useState } from "react";
import {
  FaFileAlt,
  FaCalendarAlt,
  FaDumbbell,
  FaUsers,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../../PrivateRouter/AuthContext";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../../api";

/* ================= HELPERS ================= */

const groupByMonth = (data, dateKey = "createdAt") => {
  const map = {};
  data.forEach(item => {
    if (!item[dateKey]) return;
    const month = dayjs(item[dateKey].toDate()).format("YYYY-MM");
    if (!map[month]) map[month] = [];
    map[month].push(item);
  });
  return map;
};

const Reports = () => {
  const { user } = useAuth();
  const trainerId = user?.id;

  const [attendance, setAttendance] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [members, setMembers] = useState([]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);

  /* ================= FIRESTORE ================= */
  useEffect(() => {
    if (!trainerId) return;

    const loadData = async () => {
      try {
        // load members via assignments (server filters by trainer)
        const assignRes = await api.get(`/assignments?trainerUserId=${trainerId}`);
        setMembers(
          (assignRes.data || []).filter(
            (a) => !a.status || a.status === "active"
          )
        );

        // workouts from our new mysql endpoint
        const workoutRes = await api.get(`/workouts?trainerId=${trainerId}`);
        const normalized = (workoutRes.data || []).map((w) => ({
          ...w,
          memberName: w.member_name,
          name: w.member_name,
          status: w.level || w.status,
          createdAt: w.created_at,
        }));
        setWorkouts(normalized);
      } catch (err) {
        console.error("failed to fetch reports data", err);
      }
    };

    loadData();
  }, [trainerId]);


  /* ================= GROUP REPORTS ================= */
  const reports = useMemo(() => {
    const rows = [];

    const push = (grouped, type, icon) => {
      Object.entries(grouped).forEach(([month, items]) => {
        rows.push({
          name: `${type} (${dayjs(month).format("MMM YYYY")})`,
          type,
          month,
          items,
          icon,
        });
      });
    };

    push(groupByMonth(attendance), "Attendance", <FaCalendarAlt />);
    push(groupByMonth(dietPlans), "Diet Plans", <FaFileAlt />);
    push(groupByMonth(workouts), "Workout Programs", <FaDumbbell />);

    return rows.sort((a, b) => b.month.localeCompare(a.month));
  }, [attendance, dietPlans, workouts]);

  const availableMonths = [...new Set(reports.map(r => r.month))];

  const filteredReports = reports.filter(r =>
    (typeFilter === "All" || r.type === typeFilter) &&
    (monthFilter === "All" || r.month === monthFilter)
  );

  /* ================= DOWNLOAD ================= */
  const downloadPDF = (report) => {
    const doc = new jsPDF();
    doc.text(report.name, 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["#", "Member", "Status"]],
      body: report.items.map((i, idx) => [
        idx + 1,
        i.name || i.memberName,
        i.status || i.level || "N/A",
      ]),
    });
    doc.save(`${report.name}.pdf`);
  };

  const downloadExcel = (report) => {
    const rows = report.items.map(i => ({
      Member: i.name || i.memberName,
      Status: i.status || i.level,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${report.name}.xlsx`);
  };

  return (
    <div className="p-6 min-h-screen space-y-6">

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Stat title="Members" value={members.length} icon={<FaUsers />} />
        <Stat title="Attendance Records" value={attendance.length} icon={<FaCalendarAlt />} />
        <Stat title="Diet Plans" value={dietPlans.length} icon={<FaFileAlt />} />
        <Stat title="Workout Programs" value={workouts.length} icon={<FaDumbbell />} />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap gap-4">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 rounded-lg text-white"
        >
          <option value="All">All Types</option>
          <option value="Attendance">Attendance</option>
          <option value="Diet Plans">Diet Plans</option>
          <option value="Workout Programs">Workout Programs</option>
        </select>

        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 rounded-lg text-white"
        >
          <option value="All">All Months</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>
              {dayjs(m).format("MMM YYYY")}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE (desktop) */}
      <div className="hidden sm:block rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <table className="min-w-[640px] w-full text-sm text-white">
          <thead className="bg-white/10">
            <tr>
              {["#", "Report", "Type", "Month", "Actions"].map(h => (
                <th key={h} className="px-4 py-4 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r, i) => (
              <tr key={i} className="border-b border-white/10">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3">{dayjs(r.month).format("MMM YYYY")}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setSelectedReport(r)} className="px-3 py-1 bg-orange-500 text-white rounded text-xs flex gap-1"><FaEye /> View</button>
                  <button onClick={() => downloadPDF(r)} className="px-3 py-1 bg-white/10 rounded text-xs">PDF</button>
                  <button onClick={() => downloadExcel(r)} className="px-3 py-1 bg-white/10 rounded text-xs">Excel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CARDS (mobile) */}
      <div className="sm:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <div className="p-4 text-white/60">No reports found</div>
        ) : (
          filteredReports.map((r, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.type} • {dayjs(r.month).format("MMM YYYY")}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedReport(r)} className="px-2 py-1 bg-orange-500 text-white rounded text-xs">View</button>
                    <button onClick={() => downloadPDF(r)} className="px-2 py-1 bg-white/10 rounded text-xs">PDF</button>
                    <button onClick={() => downloadExcel(r)} className="px-2 py-1 bg-white/10 rounded text-xs">Excel</button>
                  </div>
                  <span className="text-xs text-gray-400">#{i+1}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 w-full sm:w-[90%] max-w-full sm:max-w-4xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedReport.name}
              </h2>
              <button onClick={() => setSelectedReport(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.items.map((i, idx) => (
                    <tr key={idx} className="border-b border-white/10">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3">{i.name || i.memberName}</td>
                      <td className="px-4 py-3">{i.status || i.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STAT CARD ================= */
const Stat = ({ title, value, icon }) => (
  <div className="rounded-2xl p-5 flex justify-between items-center bg-white/5 border border-white/10">
    <div>
      <p className="text-sm text-white/60">{title}</p>
      <h2 className="text-2xl font-bold text-white">{value}</h2>
    </div>
    <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400 text-xl">
      {icon}
    </div>
  </div>
);

export default Reports;
