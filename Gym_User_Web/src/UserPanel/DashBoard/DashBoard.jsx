import React, { useEffect, useState } from "react";
import api from "../../api";
import dayjs from "dayjs";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { Dumbbell, Salad, ShoppingCart, CreditCard } from "lucide-react";

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

/* ---------- MAIN ---------- */
const Dashboard = () => {
  const { user } = useAuth();

  const [userPlan, setUserPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState([]);
  const [todayDiet, setTodayDiet] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [planRes, workoutRes, dietRes, orderRes] =
        await Promise.all([
          api.get(`/memberships?userId=${user.id}`),
          api.get("/workouts"),
          api.get("/diet-plans"),
          api.get(`/orders/user/${user.id}`),
        ]);

      const today = dayjs();

      /* PLAN */
      const plans = planRes.data?.memberships || planRes.data || [];
      const active = plans.find(
        (p) => new Date(p.endDate) > new Date()
      );
      setUserPlan(active || plans[0] || null);

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
          if (date.isSame(today, "day")) setTodayWorkout(ex || []);
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
          if (date.isSame(today, "day")) setTodayDiet(meal || {});
        });
      }

      /* ORDERS */
      const activeOrders = (orderRes.data || []).filter(
        (o) => normalizeStatus(o.status) !== "Delivered"
      );
      setOrders(activeOrders);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen p-6 text-white space-y-8">

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          title="ACTIVE PLAN"
          value={userPlan?.planName || "No Plan"}
          sub={`${formatDate(userPlan?.startDate)} → ${formatDate(userPlan?.endDate)}`}
          icon={<CreditCard />}
          color="bg-blue-500"
        />

        <StatCard
          title="TODAY DIET"
          value={Object.keys(todayDiet).length}
          sub="Meals"
          icon={<Salad />}
          color="bg-green-500"
        />

        <StatCard
          title="TODAY WORKOUT"
          value={todayWorkout.length}
          sub="Exercises"
          icon={<Dumbbell />}
          color="bg-pink-500"
        />

        <StatCard
          title="ORDERS"
          value={orders.length}
          sub="Active"
          icon={<ShoppingCart />}
          color="bg-orange-500"
        />
      </div>

      {/* ================= DIET + WORKOUT ================= */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* DIET TABLE */}
        <div className="bg-white/5 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Today's Diet</h2>

          {Object.keys(todayDiet).length ? (
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="text-left py-2">Meal</th>
                  <th className="text-left py-2">Food</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(todayDiet).map(([meal, val]) => (
                  <tr key={meal} className="border-b border-white/5">
                    <td className="py-2 text-green-400">{meal}</td>
                    <td className="py-2">
                      {typeof val === "object" ? val?.food : val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">No Diet Assigned</p>
          )}
        </div>

        {/* WORKOUT TABLE */}
        <div className="bg-white/5 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Today's Workout</h2>

          {todayWorkout.length ? (
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="text-left py-2">Exercise</th>
                  <th className="text-left py-2">Sets/Reps</th>
                </tr>
              </thead>
              <tbody>
                {todayWorkout.map((ex, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2">{ex.name}</td>
                    <td className="py-2 text-gray-400">
                      {ex.sets || "-"} x {ex.reps || "-"}
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
      <div className="bg-white/5 p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Active Orders</h2>

        {orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-black/40 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-purple-300">
                    {order.order_id}
                  </p>
                  <p className="text-sm text-gray-400">
                    ₹{order.total}
                  </p>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                  {normalizeStatus(order.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No Active Orders</p>
        )}
      </div>

    </div>
  );
};

export default Dashboard;

/* ---------- UI ---------- */

const StatCard = ({ title, value, sub, icon, color }) => (
  <div className="bg-white/5 p-6 rounded-2xl flex justify-between items-center">
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>

    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
  </div>
);