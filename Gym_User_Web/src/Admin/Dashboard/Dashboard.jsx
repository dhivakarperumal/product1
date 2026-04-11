import React, { useEffect, useState, useRef } from "react";
import {
  FaCalendarCheck,
  FaDumbbell,
  FaFileInvoiceDollar,
  FaUserTie,
  FaTools,
  FaUsers,
  FaBox,
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaFilter,
  FaDownload,
  FaSync,
  FaStar,
  FaFire,
  FaTrophy,
  FaBullseye,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaShoppingCart,
  FaUserPlus,
  FaChartBar,
  FaChartPie,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaMinus
} from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import cache from "../../cache";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { getDateRangeBounds } from "../utils/dateUtils";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart
} from "recharts";

const statusClass = (status) => {
  switch (status) {
    case "delivered":
      return "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10";
    case "pending":
      return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10";
    case "cancelled":
      return "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10";
    case "processing":
      return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10";
    default:
      return "bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30 shadow-lg shadow-slate-500/10";
  }
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

/* ================= MINI CHART CARD ================= */
const MiniChartCard = ({ title, data, color, icon, value, subtitle }) => (
  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/15 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl bg-gradient-to-br ${color} text-white`}>
        {icon}
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
    <h4 className="text-sm font-semibold text-slate-300 mb-2">{title}</h4>
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color.split(' ')[1]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color.split(' ')[1]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color.split(' ')[1]}
            fillOpacity={1}
            fill={`url(#gradient-${title})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

/* ================= PROGRESS CARD ================= */
const ProgressCard = ({ title, value, maxValue, color, icon, percentage }) => (
  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/15 p-4 shadow-lg">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl bg-gradient-to-br ${color} text-white`}>
        {icon}
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">of {maxValue}</p>
      </div>
    </div>
    <h4 className="text-sm font-semibold text-slate-300 mb-2">{title}</h4>
    <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
      <div
        className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
    <p className="text-xs text-slate-400">{percentage}% Complete</p>
  </div>
);

/* -------------------- HELPERS -------------------- */

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* -------------------- DASHBOARD -------------------- */

export default function Dashboard() {
  const navigate = useNavigate();

  /* ---------- TOP STATS (GYM) ---------- */
  const [stats, setStats] = useState(() => cache.dashboardStats || {
    members: 0,
    checkinsToday: 0,
    activePlans: 0,
    pendingPayments: 0,
    trainers: 0,
    equipmentDue: 0,
    totalOrders: 0,
    totalProducts: 0,
    newMembersToday: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todayOrdersCount: 0
  });

  /* ---------- LOADING STATE ---------- */
  const isMountedRef = useRef(true);
  const [loading, setLoading] = useState(() => !cache.dashboardStats);

  /* ---------- FILTER STATE ---------- */
  const [filterRange, setFilterRange] = useState({ type: 'Today', range: null });

  const handleRangeChange = (type, range = null) => {
    setFilterRange({ type, range });
  };

  useEffect(() => {
    const fetchStats = async () => {
      // Only set loading if no cache exists
      if (!cache.dashboardStats && isMountedRef.current) {
        setLoading(true);
      }

      try {
        const [
          membersRes, 
          plansRes, 
          ordersRes, 
          staffRes, 
          equipmentRes, 
          productsRes,
          attendanceRes,
        ] = await Promise.all([
          api.get('/members').catch(() => ({ data: [] })),
          api.get('/plans').catch(() => ({ data: [] })),
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/staff').catch(() => ({ data: [] })),
          api.get('/equipment').catch(() => ({ data: [] })),
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/attendance').catch(() => ({ data: [] })),
        ]);

        const members = membersRes.data || [];
        const plans = (plansRes.data || []).filter(p => p.active);
        const orders = ordersRes.data || [];
        const staff = (staffRes.data || []).filter(s => s.status === 'active');
        const equipment = equipmentRes.data || [];
        const products = productsRes.data || [];
        const attendance = attendanceRes.data || [];

        // Determine date bounds
        const { start, end } = getDateRangeBounds(filterRange.type, filterRange.range);

        const filteredOrders = orders.filter(o => {
          const d = dayjs(o.created_at || o.createdAt);
          if (filterRange.type === 'All Time') return true;
          return (d.isAfter(start) || d.isSame(start)) && (d.isBefore(end) || d.isSame(end));
        });

        const filteredMembers = members.filter(m => {
          const d = dayjs(m.created_at || m.createdAt);
          if (filterRange.type === 'All Time') return true;
          return (d.isAfter(start) || d.isSame(start)) && (d.isBefore(end) || d.isSame(end));
        });

        const filteredAttendance = attendance.filter(a => {
          const d = dayjs(a.date || a.check_in);
          if (filterRange.type === 'All Time') return true;
          return (d.isAfter(start) || d.isSame(start)) && (d.isBefore(end) || d.isSame(end));
        });

        const newStats = {
          members: members.length,
          checkinsToday: filteredAttendance.filter(a => a.status.toLowerCase().includes('present')).length,
          activePlans: plans.length,
          pendingPayments: orders.filter(o => o.status === 'pending').length,
          trainers: staff.length,
          equipmentDue: equipment.length,
          totalOrders: orders.length,
          totalProducts: products.length,
          newMembersToday: filteredMembers.length,
          todayOrdersCount: filteredOrders.length,
          lowStockCount: products.filter(p => (p.stock || p.quantity || 0) < 5).length,
          expiringCount: 0 // Logic for expiring plans would go here
        };

        setStats(newStats);
        
        let rangeTotal = 0;
        const orderRows = filteredOrders.map((order, i) => {
          const amount = Number(order.total_amount || order.total_price || order.total || 0);
          rangeTotal += amount;
          const shipping = typeof order.shipping === 'string' ? JSON.parse(order.shipping || '{}') : (order.shipping || {});
          
          return {
            id: order.id,
            index: i + 1,
            customer: shipping.name || "Walk-in",
            phone: shipping.phone || "-",
            city: shipping.city || "-",
            amount,
            method: order.payment_method || order.paymentMethod || "Cash",
            status: order.status || "-",
            time: dayjs(order.created_at || order.createdAt).format("HH:mm")
          };
        });

        setTodayOrderAmount(rangeTotal);
        setTodayOrdersList(orderRows);

        // Update caches
        cache.dashboardStats = newStats;
        cache.adminMembers = members;
        cache.adminStaff = staffRes.data;
        cache.adminOrders = orders;
        cache.adminProducts = products;

      } catch (err) {
        console.error('Error fetching stats:', err);
        if (isMountedRef.current) {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    isMountedRef.current = true;
    fetchStats();
    return () => {
      isMountedRef.current = false;
    };
  }, [filterRange]);

  /* ---------- WEEKLY CHECK-IN CHART ---------- */
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
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
          };

          try {
            const res = await api.get('/attendance', { params: { date: dateStr } });
            const records = res.data || [];
            records.forEach((record) => {
              const status = record.status || '';
              if (status.toLowerCase().includes('present')) dayData.present++;
              else if (status.toLowerCase().includes('absent')) dayData.absent++;
              else if (status.toLowerCase().includes('late')) dayData.late++;
              else if (status.toLowerCase().includes('leave')) dayData.leave++;
            });
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
  }, []);



  /* ---------- REVENUE ---------- */
  const [revenueData, setRevenueData] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await api.get('/orders');
        const orders = res.data || [];

        const now = new Date();
        const months = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString("en", { month: "short" }),
          revenue: 0,
        }));

        let currentMonthTotal = 0;

        orders.forEach((order) => {
          // Only count paid orders
          if (order.status !== 'delivered' && order.status !== 'completed') return;

          const orderDate = new Date(order.created_at || order.createdAt);
          const monthIndex = orderDate.getMonth();
          const amount = Number(order.total_amount || order.total_price || order.total || 0);

          months[monthIndex].revenue += amount;

          if (monthIndex === now.getMonth()) {
            currentMonthTotal += amount;
          }
        });

        setRevenueData(months);
        setMonthlyTotal(currentMonthTotal);
      } catch {
        console.error('Error fetching revenue');
      }
    };

    fetchRevenue();
  }, []);



  // Today's orders unified above in fetchStats
  const [todayOrderAmount, setTodayOrderAmount] = useState(0);
  const [todayOrdersList, setTodayOrdersList] = useState([]);




  /* -------------------- UI -------------------- */
  if (loading && !cache.dashboardStats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 min-h-screen">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-2xl shadow-orange-500/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-2xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2 animate-pulse">Initializing Command Center</p>
          <p className="text-slate-400 text-sm animate-pulse">Loading gym analytics...</p>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 space-y-8 relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* ANIMATED BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* HEADER WITH FILTER */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gradient-to-r from-white/10 to-white/5 p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
              <FaChartLine className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Real-time insights into your gym's performance</p>
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
          <DateRangeFilter onRangeChange={handleRangeChange} />
        </div>
      </div>

      {/* ADVANCED STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={loading ? "..." : stats.members}
          icon={<FaUsers />}
          color="from-blue-500 to-cyan-500"
          trend="up"
          trendValue="12"
          subtitle="Active subscribers"
          onClick={() => navigate('/admin/members')}
          isLoading={loading}
        />
        <StatCard
          title={`${filterRange.type} Check-ins`}
          value={loading ? "..." : stats.checkinsToday}
          icon={<FaCalendarCheck />}
          color="from-emerald-500 to-teal-500"
          trend="up"
          trendValue="8"
          subtitle="Member visits"
          onClick={() => navigate('/admin/overall-attendance')}
          isLoading={loading}
        />
        <StatCard
          title="Active Plans"
          value={loading ? "..." : stats.activePlans}
          icon={<FaDumbbell />}
          color="from-purple-500 to-pink-500"
          trend="up"
          trendValue="5"
          subtitle="Available plans"
          onClick={() => navigate('/admin/plansall')}
          isLoading={loading}
        />
        <StatCard
          title="Revenue"
          value={loading ? "..." : `₹${monthlyTotal.toLocaleString("en-IN")}`}
          icon={<FaMoneyBillWave />}
          color="from-amber-500 to-orange-500"
          trend="up"
          trendValue="15"
          subtitle="This month"
          onClick={() => navigate('/admin/billing')}
          isLoading={loading}
        />
        <StatCard
          title="Available Trainers"
          value={loading ? "..." : stats.trainers}
          icon={<FaUserTie />}
          color="from-indigo-500 to-violet-500"
          trend="neutral"
          trendValue="0"
          subtitle="Certified staff"
          onClick={() => navigate('/admin/staff')}
          isLoading={loading}
        />
        <StatCard
          title="Total Products"
          value={loading ? "..." : stats.totalProducts}
          icon={<FaBox />}
          color="from-green-500 to-emerald-500"
          trend="up"
          trendValue="3"
          subtitle="In inventory"
          onClick={() => navigate('/admin/products')}
          isLoading={loading}
        />
        <StatCard
          title="Low Stock Alert"
          value={loading ? "..." : stats.lowStockCount}
          icon={<FaExclamationTriangle />}
          color="from-orange-500 to-red-500"
          trend="down"
          trendValue="2"
          subtitle="Items need restock"
          onClick={() => navigate('/admin/stockdetails')}
          isLoading={loading}
        />
        <StatCard
          title="New Members"
          value={loading ? "..." : stats.newMembersToday}
          icon={<FaUserPlus />}
          color="from-cyan-500 to-blue-500"
          trend="up"
          trendValue="6"
          subtitle={`${filterRange.type.toLowerCase()} registrations`}
          onClick={() => navigate('/admin/members')}
          isLoading={loading}
        />
      </div>

      {/* MINI CHARTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MiniChartCard
          title="Weekly Check-ins"
          data={checkinData.slice(-7).map(d => ({ value: d.present }))}
          color="from-emerald-500 to-green-600"
          icon={<FaCalendarCheck />}
          value={checkinData.slice(-7).reduce((sum, d) => sum + d.present, 0)}
          subtitle="This week"
        />
        <MiniChartCard
          title="Monthly Revenue"
          data={revenueData.slice(-6).map(d => ({ value: d.revenue }))}
          color="from-blue-500 to-indigo-600"
          icon={<FaChartBar />}
          value={`₹${monthlyTotal.toLocaleString("en-IN")}`}
          subtitle="Current month"
        />
        <MiniChartCard
          title="Order Volume"
          data={revenueData.slice(-6).map(d => ({ value: Math.floor(d.revenue / 100) }))}
          color="from-purple-500 to-pink-600"
          icon={<FaShoppingCart />}
          value={stats.todayOrdersCount}
          subtitle={`${filterRange.type.toLowerCase()} orders`}
        />
      </div>

      {/* ADVANCED CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ENHANCED ATTENDANCE CHART */}
        <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/8 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Weekly Attendance Analytics</h3>
              <p className="text-slate-400 text-sm">Member check-in patterns</p>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
              <FaChartLine className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={checkinData}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <YAxis tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  fill="url(#attendanceGradient)"
                  strokeWidth={3}
                  name="Present"
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Late"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
                <Bar
                  dataKey="absent"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  name="Absent"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ENHANCED REVENUE CHART */}
        <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/8 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Revenue Analytics</h3>
              <p className="text-slate-400 text-sm">Monthly performance overview</p>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
              <FaMoneyBillWave className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <div>
              <p className="text-sm text-slate-400">Current Month</p>
              <p className="text-2xl font-bold text-emerald-400">₹{monthlyTotal.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Growth</p>
              <div className="flex items-center gap-1 text-emerald-400">
                <FaArrowUp className="w-4 h-4" />
                <span className="font-semibold">+15.2%</span>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <YAxis tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, 'Revenue']}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  radius={[8, 8, 0, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PROGRESS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressCard
          title="Membership Goal"
          value={stats.members}
          maxValue={500}
          color="from-blue-500 to-cyan-500"
          icon={<FaBullseye />}
          percentage={Math.round((stats.members / 500) * 100)}
        />
        <ProgressCard
          title="Revenue Target"
          value={monthlyTotal}
          maxValue={100000}
          color="from-emerald-500 to-green-500"
          icon={<FaTrophy />}
          percentage={Math.round((monthlyTotal / 100000) * 100)}
        />
        <ProgressCard
          title="Trainer Utilization"
          value={stats.trainers}
          maxValue={20}
          color="from-purple-500 to-pink-500"
          icon={<FaFire />}
          percentage={Math.round((stats.trainers / 20) * 100)}
        />
      </div>

      {/* ENHANCED ORDERS TABLE */}
      <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/8 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Recent Orders</h3>
            <p className="text-slate-400">Latest transactions and customer activity</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
              <FaMoneyBillWave className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">₹{todayOrderAmount.toLocaleString("en-IN")}</span>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105"
            >
              View All Orders
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todayOrdersList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FaShoppingCart className="w-12 h-12 text-slate-500" />
                        <p className="text-slate-400 text-lg">No orders found</p>
                        <p className="text-slate-500 text-sm">Orders will appear here when customers make purchases</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  todayOrdersList.slice(0, 8).map((order, idx) => (
                    <tr
                      key={order.id}
                      className="hover:bg-white/5 transition-all duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-400">#{order.index}</span>
                          </div>
                          <span className="text-white font-semibold">{order.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{order.customer}</p>
                          <p className="text-slate-400 text-sm">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 font-bold text-lg">
                          ₹{order.amount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaClock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300">{order.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          {order.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/admin/orders`)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 opacity-0 group-hover:opacity-100"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4 p-4">
            {todayOrdersList.length === 0 ? (
              <div className="text-center py-8">
                <FaShoppingCart className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No orders found</p>
              </div>
            ) : (
              todayOrdersList.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10 p-4 hover:border-white/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{order.customer}</p>
                      <p className="text-slate-400 text-sm">{order.phone} • {order.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-lg">₹{order.amount.toLocaleString("en-IN")}</p>
                      <p className="text-slate-400 text-sm">{order.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">{order.method}</span>
                      <button
                        onClick={() => navigate(`/admin/orders`)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {todayOrdersList.length > 5 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold hover:shadow-lg hover:shadow-slate-500/30 transition-all duration-200 hover:scale-105"
            >
              View All {todayOrdersList.length} Orders
            </button>
          </div>
        )}
      </div>

{/* <AddressForm/> */}
    </div>
  );
}
