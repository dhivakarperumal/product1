import React, { useEffect, useState, useRef } from "react";
import api from "../../api";
import dayjs from "dayjs";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { resolveUserId } from "../../utils/userUtils";
import { Dumbbell, Salad, ShoppingCart, CreditCard, Flame, Clock, CheckCircle2, AlertCircle, TrendingUp, Calendar } from "lucide-react";

/* ---------- CACHE ---------- */
const dashboardCache = {};

/* ---------- HELPERS ---------- */
const formatDate = (date) =>
  date ? dayjs(date).format("DD MMM YYYY") : "-";

const normalizeStatus = (status) => {
  if (!status) return "OrderPlaced";
  const clean = status.toLowerCase().replace(/[\s_-]+/g, "");

  if (clean.includes("deliver")) return "Delivered";
  if (clean.includes("out")) return "OutForDelivery";
  if (clean.includes("ship")) return "Shipped";
  if (clean.includes("pack")) return "Packing";
  if (clean.includes("process")) return "Processing";

  return "OrderPlaced";
};

const isTodayOrder = (order) => {
  const orderDate = dayjs(order.created_at || order.createdAt || order.date || order.orderDate);
  return orderDate.isValid() && orderDate.isSame(dayjs(), "day");
};

const matchesCurrentUser = (item, user, resolvedUserId, resolvedUserEmail) => {
  if (!item) return false;

  const candidateIds = [
    item.member_id,
    item.user_id,
    item.memberId,
    item.userId,
    item.member_uuid,
    item.memberUuid,
    item.user_uuid,
    item.userUuid,
  ]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());

  if (resolvedUserId && candidateIds.includes(String(resolvedUserId).toLowerCase())) {
    return true;
  }

  const email = (item.member_email || item.email || "").toString().toLowerCase();
  if (resolvedUserEmail && email === resolvedUserEmail) {
    return true;
  }

  return false;
};

/* ---------- MAIN ---------- */
const Dashboard = () => {
  const { user } = useAuth();
  const resolvedUserId = resolveUserId(user);
  const isMountedRef = useRef(true);

  // 🔄 Initialize state from cache if available
  const [dashboardData, setDashboardData] = useState(() => {
    if (resolvedUserId && dashboardCache[resolvedUserId]) {
      return dashboardCache[resolvedUserId];
    }
    return {
      userPlan: null,
      todayWorkout: [],
      todayDiet: {},
      orders: [],
    };
  });

  // ✅ Define fetchData function inline to avoid React Compiler warnings
  // (Defined inline to avoid setState warnings)

  // ✅ Fetch fresh data
  useEffect(() => {
    if (!resolvedUserId) return;

    const abortController = new AbortController();
    isMountedRef.current = true;

    const fetchDashboardData = async (signal, cacheKey) => {
      try {
        const [planRes, workoutRes, dietRes, orderRes] =
          await Promise.all([
            api.get(`/memberships/user/${resolvedUserId}`, { signal }),
            api.get("/workouts", { signal }),
            api.get("/diet-plans", { signal }),
            api.get(`/orders/user/${resolvedUserId}`, { signal }),
          ]);

        const today = dayjs();
        let plan = null;
        let workout = [];
        let diet = {};
        let orderList = [];

        /* PLAN */
        let plans = planRes.data?.memberships || planRes.data || [];
        if (plans && !Array.isArray(plans) && typeof plans === 'object') {
          plans = [plans];
        }
        plans = Array.isArray(plans) ? plans : [];

        const normalizePlanDate = (planItem, key1, key2) => {
          const value = planItem?.[key1] ?? planItem?.[key2];
          return value ? dayjs(value) : null;
        };

        const isPlanActive = (planItem) => {
          if (!planItem) return false;
          const status = String(planItem.status || planItem.plan_status || '').toLowerCase();
          if (status === 'active') return true;

          const endDate = normalizePlanDate(planItem, 'endDate', 'end_date');
          return endDate?.isValid() && endDate.isAfter(dayjs());
        };

        const sortByEndDate = (a, b) => {
          const aEnd = normalizePlanDate(a, 'endDate', 'end_date')?.valueOf() || 0;
          const bEnd = normalizePlanDate(b, 'endDate', 'end_date')?.valueOf() || 0;
          return bEnd - aEnd;
        };

        const activePlans = plans.filter(isPlanActive).sort(sortByEndDate);
        plan = activePlans[0] || plans.sort(sortByEndDate)[0] || null;

        if (plan) {
          plan.planName =
            plan.planName ||
            plan.plan_name ||
            plan.name ||
            plan.title ||
            plan.plan_title ||
            'Plan';
          plan.startDate =
            plan.startDate ||
            plan.start_date ||
            plan.planStartDate ||
            plan.plan_start_date ||
            plan.createdAt ||
            plan.created_at ||
            null;
          plan.endDate =
            plan.endDate ||
            plan.end_date ||
            plan.planEndDate ||
            plan.plan_end_date ||
            null;
        }

        /* WORKOUT */
        const resolvedUserEmail = user?.email?.toString().toLowerCase() || "";
        const myWorkout = workoutRes.data.find((w) =>
          matchesCurrentUser(w, user, resolvedUserId, resolvedUserEmail)
        );

        if (myWorkout?.days) {
          const base = dayjs(myWorkout.created_at);
          Object.entries(myWorkout.days).forEach(([day, ex]) => {
            const date = base.add(
              Number(day.replace("Day", "")) - 1,
              "day"
            );
            if (date.isSame(today, "day")) workout = ex || [];
          });
        }

        /* DIET */
        const myDiet = dietRes.data.find((d) =>
          matchesCurrentUser(d, user, resolvedUserId, resolvedUserEmail)
        );

        if (myDiet?.days) {
          const base = dayjs(myDiet.created_at);
          Object.entries(myDiet.days).forEach(([day, meal]) => {
            const date = base.add(
              Number(day.replace("Day", "")) - 1,
              "day"
            );
            if (date.isSame(today, "day")) diet = meal || {};
          });
        }

        /* ORDERS */
        const activeOrders = (orderRes.data || []).filter(
          (o) => normalizeStatus(o.status) !== "Delivered"
        );

        orderList = activeOrders.filter(isTodayOrder);

        if (isMountedRef.current) {
          setDashboardData({
            userPlan: plan,
            todayWorkout: workout,
            todayDiet: diet,
            orders: orderList,
          });

          dashboardCache[cacheKey] = {
            userPlan: plan,
            todayWorkout: workout,
            todayDiet: diet,
            orders: orderList,
          };
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.log(err);
        }
      }
    };

    const cacheKey = resolvedUserId;
    fetchDashboardData(abortController.signal, cacheKey);

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [resolvedUserId, user?.email]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 text-white space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-orange-400 via-pink-500 to-violet-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">{dayjs().format("dddd, MMMM D, YYYY")}</p>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="ACTIVE PLAN"
          value={
            dashboardData.userPlan?.planName ||
            dashboardData.userPlan?.plan_name ||
            dashboardData.userPlan?.name ||
            dashboardData.userPlan?.title ||
            dashboardData.userPlan?.plan_title ||
            dashboardData.userPlan?.planId ||
            dashboardData.userPlan?.plan_id ||
            "No Plan"
          }
          sub={`${formatDate(dashboardData.userPlan?.startDate)} → ${formatDate(dashboardData.userPlan?.endDate)}`}
          icon={<CreditCard size={24} />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          borderColor="border-blue-500/30"
        />

        <StatCard
          title="TODAY DIET"
          value={Object.keys(dashboardData.todayDiet).length}
          sub="Meals"
          icon={<Salad size={24} />}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          borderColor="border-green-500/30"
        />

        <StatCard
          title="TODAY WORKOUT"
          value={dashboardData.todayWorkout.length}
          sub="Exercises"
          icon={<Dumbbell size={24} />}
          color="bg-gradient-to-br from-pink-500 to-rose-600"
          borderColor="border-pink-500/30"
        />

        <StatCard
          title="TODAY ORDERS"
          value={dashboardData.orders.length}
          sub="Active Today"
          icon={<ShoppingCart size={24} />}
          color="bg-gradient-to-br from-orange-500 to-amber-600"
          borderColor="border-orange-500/30"
        />
      </div>

      {/* ================= ACTIVE PLAN PROGRESS ================= */}
      {dashboardData.userPlan && (
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-linear-to-br from-slate-900/80 via-blue-950/30 to-slate-950/80 p-6 sm:p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Your Active Plan</h3>
                <p className="text-sm text-gray-400 mt-1">{dashboardData.userPlan?.planName || 'Membership Plan'}</p>
              </div>
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 border border-blue-500/30">
                <TrendingUp className="text-blue-400" size={24} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Plan Duration</span>
                <span className="text-blue-400 font-semibold">
                  {dayjs(dashboardData.userPlan?.startDate).format('MMM DD')} - {dayjs(dashboardData.userPlan?.endDate).format('MMM DD')}
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-800 border border-blue-500/20 overflow-hidden">
                {(() => {
                  const start = dayjs(dashboardData.userPlan?.startDate);
                  const end = dayjs(dashboardData.userPlan?.endDate);
                  const now = dayjs();
                  const totalDays = end.diff(start, 'day');
                  const elapsedDays = now.diff(start, 'day');
                  const percentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
                  return (
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  );
                })()}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>Started: {formatDate(dashboardData.userPlan?.startDate)}</span>
                <span>Ends: {formatDate(dashboardData.userPlan?.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DIET + WORKOUT ================= */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* DIET CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-linear-to-br from-slate-900/80 via-green-950/30 to-slate-950/80 p-6 shadow-2xl shadow-green-500/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-r from-green-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Today's Diet</h2>
                <p className="text-xs text-gray-400 mt-1">{Object.keys(dashboardData.todayDiet).length} meal plan</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 border border-green-500/30">
                <Salad className="text-green-400" size={20} />
              </div>
            </div>

            {Object.keys(dashboardData.todayDiet).length ? (
              <div className="space-y-3">
                {Object.entries(dashboardData.todayDiet).map(([meal, val], idx) => {
                  const item = typeof val === "object" ? val : { food: val };
                  const mealIcons = {
                    'Morning': '🌅',
                    'Breakfast': '🥞',
                    'Lunch': '🍽️',
                    'Afternoon': '☕',
                    'Dinner': '🌙',
                    'Evening': '🌆'
                  };

                  return (
                    <div key={meal} className="group relative overflow-hidden rounded-2xl border border-green-500/10 bg-green-500/5 p-4 transition duration-300 hover:border-green-500/30 hover:bg-green-500/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{mealIcons[meal] || '🍽️'}</span>
                            <h4 className="font-semibold text-green-300">{meal}</h4>
                            {item.time && <span className="text-xs text-gray-500 ml-auto">{item.time}</span>}
                          </div>
                          <p className="text-sm text-gray-300">{item.food || "-"}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                            {item.calories && <span className="flex items-center gap-1"><Flame size={14} className="text-orange-400" /> {item.calories} cal</span>}
                            {item.quantity && <span>Qty: {item.quantity}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-500/30 bg-white/5 p-8 text-center">
                <Salad className="mx-auto text-gray-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No Diet Assigned Today</p>
              </div>
            )}
          </div>
        </div>

        {/* WORKOUT CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-linear-to-br from-slate-900/80 via-pink-950/30 to-slate-950/80 p-6 shadow-2xl shadow-pink-500/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-r from-pink-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Today's Workout</h2>
                <p className="text-xs text-gray-400 mt-1">{dashboardData.todayWorkout.length} exercise{dashboardData.todayWorkout.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 border border-pink-500/30">
                <Dumbbell className="text-pink-400" size={20} />
              </div>
            </div>

            {dashboardData.todayWorkout.length ? (
              <div className="space-y-3">
                {dashboardData.todayWorkout.map((ex, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-2xl border border-pink-500/10 bg-pink-500/5 p-4 transition duration-300 hover:border-pink-500/30 hover:bg-pink-500/10">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-pink-300">{ex.name}</h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Sets</span>
                          <span className="font-semibold text-white">{ex.sets || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Reps</span>
                          <span className="font-semibold text-white">{ex.count || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-500" />
                          <span className="text-gray-400">{ex.time || "-"}</span>
                        </div>
                      </div>
                      {ex.type && <p className="text-xs text-gray-400 uppercase tracking-wide">{ex.type}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-500/30 bg-white/5 p-8 text-center">
                <Dumbbell className="mx-auto text-gray-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">Rest Day - Take it Easy!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= ORDERS ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-linear-to-br from-slate-900/80 via-orange-950/30 to-slate-950/80 p-6 sm:p-8 shadow-2xl shadow-orange-500/10 backdrop-blur-xl">
        <div className="absolute inset-0 bg-linear-to-r from-orange-500/10 via-transparent to-transparent opacity-50" />
        <div className="relative">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="text-orange-400" size={28} />
                Today's Orders
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                {dashboardData.orders.length > 0 
                  ? `${dashboardData.orders.length} order${dashboardData.orders.length !== 1 ? 's' : ''} placed today` 
                  : 'Active orders placed today'}
              </p>
            </div>
            {dashboardData.orders.length > 0 && (
              <div className="inline-flex items-center gap-3 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 animate-pulse"></span>
                {dashboardData.orders.length} order{dashboardData.orders.length !== 1 ? 's' : ''} active
              </div>
            )}
          </div>

          {dashboardData.orders.length ? (
            <div className="grid gap-3 sm:gap-4">
              {dashboardData.orders.map((order, idx) => (
                <div
                  key={order.id || order.order_id}
                  className="group relative overflow-hidden rounded-2xl border border-orange-500/10 bg-linear-to-br from-orange-500/5 to-orange-500/0 p-5 transition duration-300 hover:border-orange-500/40 hover:bg-orange-500/10"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-orange-500/20 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-orange-300/70 font-semibold">Order #{order.order_id || order.orderId}</p>
                            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">₹{order.total ?? order.amount ?? 0}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">{order.product_name || order.note || "Order details"}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                          <Calendar size={14} />
                          {dayjs(order.created_at || order.createdAt).format("ddd, MMM D • HH:mm")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap
                          ${
                            normalizeStatus(order.status) === 'Delivered'
                              ? 'border border-green-400/50 bg-green-500/20 text-green-200'
                              : normalizeStatus(order.status) === 'OutForDelivery'
                              ? 'border border-blue-400/50 bg-blue-500/20 text-blue-200'
                              : normalizeStatus(order.status) === 'Shipped'
                              ? 'border border-purple-400/50 bg-purple-500/20 text-purple-200'
                              : 'border border-orange-400/50 bg-orange-500/20 text-orange-200'
                          }
                        `}>
                          {normalizeStatus(order.status) === 'Delivered' && <CheckCircle2 size={14} />}
                          {normalizeStatus(order.status) === 'OutForDelivery' && <TrendingUp size={14} />}
                          {normalizeStatus(order.status) !== 'Delivered' && normalizeStatus(order.status) !== 'OutForDelivery' && <AlertCircle size={14} />}
                          {normalizeStatus(order.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-orange-500/20 bg-orange-500/5 p-8 sm:p-12 text-center">
              <ShoppingCart className="mx-auto text-orange-400/50 mb-3" size={40} />
              <p className="text-gray-300 text-sm font-medium">No active orders for today</p>
              <p className="text-gray-500 text-xs mt-2">Place an order to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

/* ---------- UI COMPONENTS ---------- */

const StatCard = ({ title, value, sub, icon, color, borderColor }) => (
  <div className={`group relative overflow-hidden rounded-3xl border ${borderColor || 'border-white/10'} bg-linear-to-br from-slate-900/80 to-slate-950/80 p-6 shadow-2xl shadow-black/30 transition duration-500 hover:-translate-y-1 hover:border-opacity-100 backdrop-blur-xl`}>
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-orange-400 via-pink-500 to-violet-500 opacity-50 blur-xl`} />
    
    <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" style={{
      background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)`
    }} />
    
    <div className="relative space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-[0.15em]">
            {title}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{value}</h2>
          <p className="text-xs text-gray-500 mt-2">{sub}</p>
        </div>
        <div className={`ml-auto shrink-0 grid h-16 w-16 place-items-center rounded-2xl ${color} shadow-lg shadow-black/25 border border-white/10`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  </div>
);