import React, { useEffect, useState } from "react";
import api from "../../api";
import dayjs from "dayjs";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { Dumbbell, ClipboardList, ShoppingCart, CreditCard } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  const [userPlan, setUserPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState([]);
  const [todayDiet, setTodayDiet] = useState({});
  const [orders, setOrders] = useState([]);

  const formatDate = (date) => dayjs(date).format("DD MMM YYYY");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [planRes, workoutRes, dietRes, orderRes] = await Promise.all([
        api.get(`/memberships?userId=${user.id}`),
        api.get("/workouts"),
        api.get("/diet-plans"),
        api.get(`/orders/user/${user.id}`),
      ]);

      const plans = planRes.data?.memberships || planRes.data;
      const active = plans.find(p => new Date(p.endDate) > new Date());
      setUserPlan(active || plans[0]);

      const today = dayjs();

      const myWorkout = workoutRes.data.find(w => w.member_email === user.email);
      if (myWorkout) {
        const base = dayjs(myWorkout.created_at);
        Object.entries(myWorkout.days).forEach(([day, ex]) => {
          const date = base.add(Number(day.replace("Day", "")) - 1, "day");
          if (date.isSame(today, "day")) setTodayWorkout(ex);
        });
      }

      const myDiet = dietRes.data.find(d => d.member_email === user.email);
      if (myDiet) {
        const base = dayjs(myDiet.created_at);
        Object.entries(myDiet.days).forEach(([day, meal]) => {
          const date = base.add(Number(day.replace("Day", "")) - 1, "day");
          if (date.isSame(today, "day")) setTodayDiet(meal);
        });
      }

      const todayOrders = orderRes.data.filter(o =>
        dayjs(o.created_at).isSame(today, "day")
      );

      setOrders(todayOrders);

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c2f5c] via-[#2a2d55] to-[#1e2045] text-white p-8">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome back 👋</p>
      </div>

      {/* ===== TOP SECTION ===== */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ===== ACTIVE PLAN (LEFT) ===== */}
        <Card title="Active Plan" icon={"💳"}>
          {userPlan ? (
            <>
              <p className="text-xl font-semibold">
                {userPlan.planName}
              </p>
              <p className="text-blue-400 font-bold">
                ₹{userPlan.pricePaid}
              </p>
              <p className="text-sm text-gray-400">
                {formatDate(userPlan.startDate)} →{" "}
                {formatDate(userPlan.endDate)}
              </p>
            </>
          ) : (
            <p className="text-gray-400">No active plan</p>
          )}
        </Card>

        {/* ===== RIGHT SIDE (WORKOUT + DIET STACK) ===== */}
        <div className="flex flex-col gap-6">

          {/* WORKOUT */}
          <Card title="Today Workout" icon={"🏋️"}>
            {todayWorkout.length ? (
              todayWorkout.map((ex, i) => (
                <div key={i} className="mb-2">
                  <p className="font-medium">{ex.name}</p>
                  <p className="text-sm text-gray-400">{ex.time}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Rest day 😴</p>
            )}
          </Card>

          {/* DIET */}
          <Card title="Today Diet" icon={"🥗"}>
            {Object.keys(todayDiet).length ? (
              Object.entries(todayDiet).map(([meal, val]) => (
                <div key={meal} className="mb-2">
                  <p className="font-medium">{meal}</p>
                  <p className="text-sm text-gray-400">
                    {val.food} ({val.quantity})
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No diet today</p>
            )}
          </Card>

        </div>
      </div>

      {/* ===== ORDERS SUMMARY ===== */}
      <div className="mt-6">
        <Card title="Orders Summary" icon={"📦"}>
          <p className="text-2xl font-bold text-purple-300">
            {orders.length}
          </p>
          <p className="text-sm text-gray-400">
            Orders placed today
          </p>
        </Card>
      </div>

      {/* ===== TODAY ORDERS FULL WIDTH ===== */}
      <div className="mt-6">
        <Card title="Today Orders" icon={"🛒"}>
          {orders.length ? (
            orders.map((o) => (
              <div
                key={o.id}
                className="mb-3 border-b border-white/10 pb-2"
              >
                <p className="font-semibold text-purple-300">
                  {o.order_id}
                </p>
                <p className="text-sm text-gray-400">
                  ₹{o.total}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(o.created_at)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No orders today</p>
          )}
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;

/* ===== COMPONENTS ===== */

const StatCard = ({ title, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:scale-105 transition">
    <p className="text-gray-400 text-sm">{title}</p>
    <h2 className="text-2xl font-bold mt-1">{value}</h2>
  </div>
);

const Card = ({ title, icon, children }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
        {icon}
      </div>
      <h2 className="font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);