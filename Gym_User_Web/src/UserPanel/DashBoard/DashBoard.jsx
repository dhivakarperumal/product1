import React, { useEffect, useState, useRef } from "react";
import api from "../../api";
import dayjs from "dayjs";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { Dumbbell, Salad, ShoppingCart, CreditCard } from "lucide-react";

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

const resolveUserId = (user) => {
  return (
    user?.id ||
    user?.userId ||
    user?.user_id ||
    user?.memberId ||
    user?.member_id ||
    null
  );
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
        const myWorkout = workoutRes.data.find(
          (w) =>
            w.member_email?.toLowerCase() === user.email?.toLowerCase() ||
            Number(w.member_id) === Number(user.id)
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
        const myDiet = dietRes.data.find(
          (d) =>
            d.member_email?.toLowerCase() === user.email?.toLowerCase() ||
            Number(d.member_id) === Number(user.id)
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
  }, [user?.id, user?.email]);

  return (
    <div className="min-h-screen p-6 text-white space-y-8">

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

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
          icon={<CreditCard />}
          color="bg-blue-500"
        />

        <StatCard
          title="TODAY DIET"
          value={Object.keys(dashboardData.todayDiet).length}
          sub="Meals"
          icon={<Salad />}
          color="bg-green-500"
        />

        <StatCard
          title="TODAY WORKOUT"
          value={dashboardData.todayWorkout.length}
          sub="Exercises"
          icon={<Dumbbell />}
          color="bg-pink-500"
        />

        <StatCard
          title="TODAY ORDERS"
          value={dashboardData.orders.length}
          sub="Active Today"
          icon={<ShoppingCart />}
          color="bg-orange-500"
        />
      </div>

      {/* ================= DIET + WORKOUT ================= */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* DIET TABLE */}
        <div className="bg-white/5 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Today's Diet</h2>

          {Object.keys(dashboardData.todayDiet).length ? (
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="text-left py-2">Meal</th>
                  <th className="text-left py-2">Food</th>
                  <th className="text-left py-2">Calories</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Qty</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(dashboardData.todayDiet).map(([meal, val]) => {
                  const item = typeof val === "object" ? val : { food: val };

                  return (
                    <tr key={meal} className="border-b border-white/5">
                      <td className="py-2 text-green-400 font-medium">{meal}</td>
                      <td className="py-2">{item.food || "-"}</td>
                      <td className="py-2">{item.calories || "-"}</td>
                      <td className="py-2">{item.time || "-"}</td>
                      <td className="py-2">{item.quantity || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">No Diet Assigned</p>
          )}
        </div>

        {/* WORKOUT TABLE */}
        <div className="bg-white/5 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Today's Workout</h2>

          {dashboardData.todayWorkout.length ? (
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="text-left py-2">Exercise</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Sets</th>
                  <th className="text-left py-2">Reps</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>

              <tbody>
                {dashboardData.todayWorkout.map((ex, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 text-orange-400 font-medium">
                      {ex.name}
                    </td>
                    <td className="py-2">{ex.type || "-"}</td>
                    <td className="py-2">{ex.sets || "-"}</td>
                    <td className="py-2">{ex.count || "-"}</td>
                    <td className="py-2 text-gray-400">
                      {ex.time || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">Rest Day</p>
          )}
        </div>
      </div>

      {/* ================= ORDERS ================= */}
      <div className="bg-slate-950/80 border border-white/10 p-6 rounded-3xl shadow-2xl shadow-black/40 backdrop-blur-xl animate-fade-in-up">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Today's Orders
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Only active orders placed today are shown here.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {dashboardData.orders.length} order(s) updated today
          </div>
        </div>

        {dashboardData.orders.length ? (
          <div className="mt-6 grid gap-4">
            {dashboardData.orders.map((order) => (
              <div
                key={order.id || order.order_id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-950/80 p-5 shadow-2xl shadow-orange-500/10 transition duration-500 hover:-translate-y-1 hover:border-orange-400/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent opacity-0 transition duration-700 group-hover:opacity-100" />
                <div className="relative flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">
                      #{order.order_id || order.orderId}
                    </p>
                    <h3 className="text-lg font-bold text-white">
                      ₹{order.total ?? order.amount ?? 0}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {order.product_name || order.note || "Order details"}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className="rounded-full border border-orange-400/15 bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-200 shadow-sm shadow-orange-500/10">
                      {normalizeStatus(order.status)}
                    </span>
                    <p className="text-xs text-gray-500">
                      {dayjs(order.created_at || order.createdAt).format("ddd, MMM D • HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-gray-400">
            No active orders for today.
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;

/* ---------- UI ---------- */

const StatCard = ({ title, value, sub, icon, color }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85 p-6 shadow-2xl shadow-black/30 transition duration-500 hover:-translate-y-1 hover:border-orange-400/30 animate-fade-in-up">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 opacity-50 blur-xl" />
    <div className="relative space-y-3">
      <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">
        {title}
      </p>
      <h2 className="text-3xl font-bold text-white">{value}</h2>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
    <div className={`ml-auto grid h-14 w-14 place-items-center rounded-3xl ${color} shadow-lg shadow-black/25`}>
      {icon}
    </div>
  </div>
);