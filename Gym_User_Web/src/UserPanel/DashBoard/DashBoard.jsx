import React, { useEffect, useState } from "react";
import api from "../../api";
import dayjs from "dayjs";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  X,
  Dumbbell,
  Salad,
  ShoppingCart,
  CalendarDays,
  CreditCard,
} from "lucide-react";

const makeImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("data:")) return img;

  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
  if (maybeBase64 && img.length > 50) {
    return `data:image/webp;base64,${img}`;
  }

  const base = import.meta.env.VITE_API_URL || "";
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};

const ORDER_STEPS = [
  "OrderPlaced",
  "Processing",
  "Packing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
];

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

const Dashboard = () => {
  const { user } = useAuth();

  const [userPlan, setUserPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState([]);
  const [todayDiet, setTodayDiet] = useState({});
  const [todayOrders, setTodayOrders] = useState([]);
  const [popup, setPopup] = useState(null);

  const formatDate = (date) => date ? dayjs(date).format("DD MMM YYYY") : "-";

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

      const today = dayjs();

      const plans = planRes.data?.memberships || planRes.data || [];
      const active = plans.find(p => new Date(p.endDate) > new Date());
      setUserPlan(active || plans[0] || null);

      const myWorkout = workoutRes.data.find(w => 
        (w.member_email && user?.email && w.member_email.toLowerCase() === user.email.toLowerCase()) ||
        (w.member_id && Number(w.member_id) === Number(user.id))
      );
      if (myWorkout?.days) {
        const base = dayjs(myWorkout.created_at);
        Object.entries(myWorkout.days).forEach(([day, ex]) => {
          const date = base.add(Number(day.replace("Day", "")) - 1, "day");
          if (date.isSame(today, "day")) setTodayWorkout(ex || []);
        });
      }

      const myDiet = dietRes.data.find(d => 
        (d.member_email && user?.email && d.member_email.toLowerCase() === user.email.toLowerCase()) ||
        (d.member_id && Number(d.member_id) === Number(user.id))
      );
      if (myDiet?.days) {
        const base = dayjs(myDiet.created_at);
        Object.entries(myDiet.days).forEach(([day, meal]) => {
          const date = base.add(Number(day.replace("Day", "")) - 1, "day");
          if (date.isSame(today, "day")) setTodayDiet(meal || {});
        });
      }

      const activeOrders = (orderRes.data || []).filter(o => {
        return normalizeStatus(o.status) !== "Delivered";
      });

      setTodayOrders(activeOrders);

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen p-5 text-white space-y-8">

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <StatCard
          title="ACTIVE PLAN"
          value={userPlan?.planName || "No Plan"}
          sub={`${formatDate(userPlan?.startDate)} → ${formatDate(userPlan?.endDate)}`}
          icon={<CreditCard />}
          gradient="from-blue-500 to-cyan-500"
        />

        <StatCard
          title="TODAY DIET"
          value={Object.keys(todayDiet).length}
          sub="Meals"
          icon={<Salad />}
          gradient="from-green-500 to-emerald-500"
        />

        <StatCard
          title="TODAY WORKOUT"
          value={todayWorkout.length}
          sub="Exercises"
          icon={<Dumbbell />}
          gradient="from-pink-500 to-purple-500"
        />

      </div>

      {/* CARDS */}
      <div className="grid md:grid-cols-2 gap-6">

        <PremiumCard onClick={() => setPopup("diet")}>
          <Header icon={<Salad />} title="Today's Diet" />
          <h2 className="text-xl font-bold">
            {Object.keys(todayDiet).length ? "Meals Available" : "No Diet"}
          </h2>
          <DateText />
        </PremiumCard>

        <PremiumCard onClick={() => setPopup("workout")}>
          <Header icon={<Dumbbell />} title="Today's Workout" />
          <h2 className="text-xl font-bold">
            {todayWorkout.length ? `${todayWorkout.length} Exercises` : "Rest Day"}
          </h2>
          <DateText />
        </PremiumCard>

      </div>

      {/* ORDERS */}
      <div className="grid md:grid-cols-2 gap-6">
        {todayOrders.map(order => (
          <PremiumCard key={order.id} onClick={() => setPopup(order)}>
            <Header icon={<ShoppingCart />} title="Order" />
            <p className="font-bold text-purple-300">{order.order_id}</p>
            <p className="text-gray-400 text-sm">₹{order.total}</p>
          </PremiumCard>
        ))}
      </div>

      {/* POPUP */}
      {popup && (
        <Modal onClose={() => setPopup(null)}>

          {/* DIET */}
          {popup === "diet" && (
            <PopupContainer title="Today's Diet" icon={<Salad />}>
              {Object.entries(todayDiet).map(([meal, val]) => (
                <InnerCard key={meal}>
                  <p className="font-semibold text-green-400">{meal}</p>
                  <p className="text-sm">{typeof val === 'object' ? val?.food || '-' : val}</p>
                </InnerCard>
              ))}
            </PopupContainer>
          )}

          {/* WORKOUT */}
          {popup === "workout" && (
            <PopupContainer title="Workout" icon={<Dumbbell />}>
              {todayWorkout.map((ex, i) => (
                <InnerCard key={i}>
                  <p>{ex.name}</p>
                </InnerCard>
              ))}
            </PopupContainer>
          )}

          {/* ORDER (FIXED) */}
          {typeof popup === "object" && popup?.order_id && (
            <div>
              <h2 className="text-xl font-bold mb-4">Order Details</h2>
              <p>{popup.order_id}</p>
              <p>₹{popup.total}</p>
            </div>
          )}

        </Modal>
      )}

    </div>
  );
};

export default Dashboard;

/* UI COMPONENTS */

const StatCard = ({ title, value, sub, icon, gradient }) => (
  <div className="bg-white/5 p-6 rounded-2xl flex justify-between">
    <div>
      <p>{title}</p>
      <h2>{value}</h2>
      <p>{sub}</p>
    </div>
    <div>{icon}</div>
  </div>
);

const PremiumCard = ({ children, onClick }) => (
  <div onClick={onClick} className="p-6 bg-white/5 rounded-2xl cursor-pointer">
    {children}
  </div>
);

const Header = ({ icon, title }) => (
  <div className="flex gap-2">{icon} {title}</div>
);

const DateText = () => (
  <p>{dayjs().format("DD MMM YYYY")}</p>
);

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
    <div className="bg-black p-6 rounded-xl relative">
      <button onClick={onClose}><X /></button>
      {children}
    </div>
  </div>
);

const PopupContainer = ({ title, children }) => (
  <div>
    <h2>{title}</h2>
    {children}
  </div>
);

const InnerCard = ({ children }) => (
  <div className="p-3 bg-white/5 rounded">{children}</div>
);