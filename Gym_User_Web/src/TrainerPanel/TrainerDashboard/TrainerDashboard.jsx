/* Trainer Dashboard - Advanced UI */
import React, { useEffect, useState, useRef } from "react";
import {
  FaUsers,
  FaDumbbell,
  FaClipboardList,
  FaCalendarCheck,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaSync,
  FaDownload,
  FaBell,
  FaEye,
  FaFire,
  FaTrophy,
} from "react-icons/fa";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import dayjs from "dayjs";
import cache from "../../cache";
import DateRangeFilter from "../../Admin/DateRangeFilter";
import { getDateRangeBounds } from "../../Admin/utils/dateUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const formatText = (value) => {
  if (value === null || value === undefined) return "-";
  if (React.isValidElement(value)) return value;
  if (typeof value === "string" || typeof value === "number") return value;
  if (value instanceof Date) return value.toLocaleDateString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const safeNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/* ================= ADVANCED STAT CARD ================= */
const StatCard = ({ title, value, icon, color, trend, trendValue, subtitle, onClick, isLoading }) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-3xl
      bg-gradient-to-br from-white/15 to-white/8 backdrop-blur-2xl
      border border-white/20
      p-6 flex justify-between items-center
      shadow-[0_20px_60px_rgba(0,0,0,0.15)]
      hover:shadow-[0_30px_80px_rgba(0,0,0,0.25)]
      hover:scale-[1.02] hover:-translate-y-1
      transition-all duration-300 ease-out
      cursor-pointer group
      ${onClick ? 'cursor-pointer' : ''}
    `}
  >
    {/* Animated background gradient */}
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

    {/* Glow effect */}
    <div className={`absolute -inset-1 bg-gradient-to-br ${color} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

    <div className="relative z-10 flex-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          {title}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
            trend === 'down' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {trend === 'up' ? <FaArrowUp className="w-3 h-3" /> :
             trend === 'down' ? <FaArrowDown className="w-3 h-3" /> :
             <FaMinus className="w-3 h-3" />}
            {trendValue}%
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h2 className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-white/60">...</span>
            </div>
          ) : (
            value
          )}
        </h2>
      </div>

      {subtitle && (
        <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>

    <div className={`relative z-10 p-4 rounded-2xl bg-gradient-to-br ${color} text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      {icon}
      {/* Icon glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
    </div>
  </div>
);

/* -------------------- TRAINER DASHBOARD -------------------- */
const TrainerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const trainerId = user?.id;
  const isMountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [filterRange, setFilterRange] = useState({ type: 'Today', range: null });

  const [stats, setStats] = useState(() => cache.trainerStats || {
    members: 0,
    todayCheckins: 0,
    workoutPlans: 0,
    dietPlans: 0,
  });

  const handleRangeChange = (type, range = null) => {
    setFilterRange({ type, range });
  };

  /* ---- LOAD DASHBOARD DATA ---- */
  useEffect(() => {
    if (!trainerId || !user) return;

    const loadDashboard = async () => {
      if (!cache.trainerStats && isMountedRef.current) {
        setLoading(true);
      }

      try {
        /* FETCH ASSIGNMENTS */
        const memberRes = await api.get(`/assignments?trainerUserId=${trainerId}`);
        const membersRaw = Array.isArray(memberRes.data)
          ? memberRes.data
          : memberRes.data?.data || memberRes.data?.assignments || [];

        console.log('[TrainerDashboard] Fetched assignments:', membersRaw.length, 'records');

        const activeMembers = membersRaw.filter(
          (m) => !m.status || (m.status || "").toLowerCase() === "active"
        );

        const uniqueMembers = Array.from(
          new Map(
            activeMembers.map((m) => [m.userId || m.user_id, m])
          ).values()
        );

        console.log('[TrainerDashboard] Active unique members:', uniqueMembers.length);
        setAssignedMembers(uniqueMembers);
        const assignedMemberIds = uniqueMembers.map(m => String(m.userId || m.user_id));

        let workoutCount = 0;
        let dietCount = 0;
        let checkinCount = 0;

        try {
          const workoutRes = await api.get(`/workouts?trainerId=${encodeURIComponent(trainerId)}`);
          const workoutData = workoutRes.data;
          const workoutsRaw = Array.isArray(workoutData) ? workoutData : workoutData?.data || [];
          workoutCount = workoutsRaw.length;
        } catch (e) {
          console.error("Workout fetch error:", e);
        }

        try {
          const dietRes = await api.get(`/diet-plans?trainerId=${encodeURIComponent(trainerId)}`);
          const dietData = dietRes.data;
          const dietsRaw = Array.isArray(dietData) ? dietData : dietData?.data || [];
          dietCount = dietsRaw.length;
        } catch (e) {
          console.error("Diet fetch error:", e);
        }

        try {
          const checkinRes = await api.get(`/attendance?trainerId=${trainerId}`);
          const attendanceData = Array.isArray(checkinRes.data) ? checkinRes.data : [];
          const today = dayjs().format('YYYY-MM-DD');
          checkinCount = attendanceData.filter(a => 
            dayjs(a.date || a.check_in).format('YYYY-MM-DD') === today &&
            (a.status || '').toLowerCase().includes('present')
          ).length;
        } catch (e) {
          console.error("Checkin fetch error:", e);
        }

        const newStats = {
          members: safeNumber(uniqueMembers.length),
          todayCheckins: safeNumber(checkinCount),
          workoutPlans: safeNumber(workoutCount),
          dietPlans: safeNumber(dietCount),
        };

        setStats(newStats);
        cache.trainerStats = newStats;

      } catch (err) {
        console.error("Dashboard error:", err);
        if (isMountedRef.current) {
          toast.error("Failed to load dashboard");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    isMountedRef.current = true;
    loadDashboard();
    return () => {
      isMountedRef.current = false;
    };
  }, [trainerId, user]);

  /* ---- ATTENDANCE CHART DATA ---- */
  const [checkinData, setCheckinData] = useState([]);

  useEffect(() => {
    const loadWeeklyAttendance = async () => {
      const daysToFetch = Array.from({ length: 7 }, (_, i) => 6 - i);
      
      try {
        const attendancePromises = daysToFetch.map(async (i) => {
          const date = dayjs().subtract(i, "day");
          const dateStr = date.format("YYYY-MM-DD");
          const dayData = {
            day: date.format("ddd"),
            checkins: 0,
          };

          try {
            const res = await api.get('/attendance', { params: { date: dateStr } });
            const records = res.data || [];
            dayData.checkins = records.filter(r => (r.status || '').toLowerCase().includes('present')).length;
          } catch {
            console.log("No attendance data for:", dateStr);
          }
          return dayData;
        });

        const results = await Promise.all(attendancePromises);
        setCheckinData(results);
      } catch (err) {
        console.error("Error loading weekly attendance:", err);
      }
    };

    loadWeeklyAttendance();
  }, [trainerId]);

  /* ---- LOADING STATE ---- */
  if (loading && !cache.trainerStats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 min-h-screen">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-2xl shadow-orange-500/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-2xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2 animate-pulse">Loading Trainer Dashboard</p>
          <p className="text-slate-400 text-sm animate-pulse">Fetching your statistics...</p>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  /* ---- MAIN UI ---- */
  return (
    <div className="p-0 space-y-8 relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* ANIMATED BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* HEADER WITH FILTER */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gradient-to-r from-white/10 to-white/5 p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
              <FaChartLine className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Trainer Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Manage your assigned members & track progress</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <FaCheckCircle className="w-4 h-4" />
              <span>Live Data</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <FaClock className="w-4 h-4" />
              <span>Last updated: {dayjs().format('HH:mm')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105">
            <FaSync className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105">
            <FaDownload className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Members"
          value={loading ? "..." : stats.members}
          icon={<FaUsers />}
          color="from-blue-500 to-cyan-500"
          trend="up"
          trendValue="5"
          subtitle="Active members"
          isLoading={loading}
        />
        <StatCard
          title="Today's Check-ins"
          value={loading ? "..." : stats.todayCheckins}
          icon={<FaCalendarCheck />}
          color="from-emerald-500 to-teal-500"
          trend="up"
          trendValue="12"
          subtitle="Members present"
          isLoading={loading}
        />
        <StatCard
          title="Workout Plans"
          value={loading ? "..." : stats.workoutPlans}
          icon={<FaDumbbell />}
          color="from-purple-500 to-pink-500"
          trend="up"
          trendValue="3"
          subtitle="Active plans"
          isLoading={loading}
        />
        <StatCard
          title="Diet Plans"
          value={loading ? "..." : stats.dietPlans}
          icon={<FaClipboardList />}
          color="from-orange-500 to-amber-500"
          trend="up"
          trendValue="8"
          subtitle="Diet programs"
          isLoading={loading}
        />
      </div>

      {/* WEEKLY ATTENDANCE CHART */}
      <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/15 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FaFire className="text-orange-500" /> Weekly Check-ins
            </h3>
            <p className="text-sm text-slate-400 mt-1">Member attendance over the past week</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={checkinData}>
              <defs>
                <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="checkins" 
                stroke="#f97316" 
                fillOpacity={1} 
                fill="url(#colorCheckins)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ASSIGNED MEMBERS TABLE */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaUsers className="text-blue-500" /> Assigned Members ({assignedMembers.length})
        </h3>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-lg">

          {/* DESKTOP TABLE */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-160 w-full text-sm text-gray-200">

              <thead className="bg-white/20 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">S No</th>
                  <th className="px-6 py-4 text-left font-semibold">Member</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Mobile</th>
                  <th className="px-6 py-4 text-left font-semibold">Plan</th>
                  <th className="px-6 py-4 text-left font-semibold">Start Date</th>
                  <th className="px-6 py-4 text-left font-semibold">End Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {assignedMembers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <FaBell className="w-8 h-8 text-white/30" />
                        <p>No members assigned yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assignedMembers.map((m, ind) => (
                    <tr
                      key={m.id || ind}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">{ind + 1}</td>
                      <td className="px-6 py-4 font-medium text-white">
                        {m.username || m.user_name || "No Name"}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {m.userEmail || m.user_email || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {m.userMobile || m.user_mobile || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-orange-400 font-semibold">
                          {formatText(m.planName || m.plan_name || "-")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {m.planStartDate ? formatText(new Date(m.planStartDate).toLocaleDateString()) : "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {m.planEndDate ? formatText(new Date(m.planEndDate).toLocaleDateString()) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
                          {m.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="sm:hidden space-y-3 p-4">
            {assignedMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FaBell className="w-8 h-8 mx-auto mb-3 text-white/30" />
                <p>No members assigned yet</p>
              </div>
            ) : (
              assignedMembers.map((m, ind) => (
                <div
                  key={m.id || ind}
                  className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {formatText(m.username || m.user_name || "No Name")}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {m.userEmail || m.user_email || "-"}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p><span className="text-white">Plan:</span> {m.planName || m.plan_name || "-"}</p>
                    <p><span className="text-white">Mobile:</span> {m.userMobile || m.user_mobile || "-"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;

   