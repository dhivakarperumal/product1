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

  // already full URL or base64
  if (img.startsWith("http") || img.startsWith("data:")) return img;

  // base64 without prefix
  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
  if (maybeBase64 && img.length > 50) {
    return `data:image/webp;base64,${img}`;
  }

  // fallback → backend URL
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

const OrderTimeline = ({ status }) => {
  const index = ORDER_STEPS.findIndex(
    s => s === normalizeStatus(status)
  );

  return (
    <div className="mt-6">
      <p className="text-sm mb-3 text-gray-400">Tracking</p>

      <div className="flex items-center justify-between">
        {ORDER_STEPS.map((step, i) => {
          const active = i <= index;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
                  ${active ? "bg-purple-500 text-white" : "bg-gray-700 text-gray-400"}
                `}>
                  {i + 1}
                </div>

                <p className="text-[10px] mt-1">
                  {step}
                </p>
              </div>

              {i !== ORDER_STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1
                  ${i < index ? "bg-purple-500" : "bg-gray-700"}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const [userPlan, setUserPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState([]);
  const [todayDiet, setTodayDiet] = useState({});
  const [todayOrders, setTodayOrders] = useState([]);

  const [popup, setPopup] = useState(null);

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

      const today = dayjs();

      const plans = planRes.data?.memberships || planRes.data;
      const active = plans.find(p => new Date(p.endDate) > new Date());
      setUserPlan(active || plans[0]);

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

      const activeOrders = orderRes.data.filter(o => {
        const status = normalizeStatus(o.status);
        return status !== "Delivered";
      });

      setTodayOrders(activeOrders);

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen p-5 text-white space-y-8">

      {/* ================= ROW 1 (MATCH IMAGE STYLE) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* ACTIVE PLAN */}
        <StatCard
          title="ACTIVE PLAN"
          value={userPlan?.planName || "No Plan"}
          sub={`${formatDate(userPlan?.startDate)} → ${formatDate(userPlan?.endDate)}`}
          icon={<CreditCard />}
          gradient="from-blue-500 to-cyan-500"
        />

        {/* TODAY DIET */}
        <StatCard
          title="TODAY DIET"
          value={Object.keys(todayDiet).length}
          sub="Meals"
          icon={<Salad />}
          gradient="from-green-500 to-emerald-500"
        />

        {/* TODAY WORKOUT */}
        <StatCard
          title="TODAY WORKOUT"
          value={todayWorkout.length}
          sub="Exercises"
          icon={<Dumbbell />}
          gradient="from-pink-500 to-purple-500"
        />

        {/* TODAY ORDERS */}
        {/* <StatCard
          title="TODAY ORDERS"
          value={todayOrders.length}
          sub="Orders"
          icon={<ShoppingCart />}
          gradient="from-orange-500 to-yellow-500"
        /> */}

      </div>

      {/* ================= ROW 2 ================= */}
      {/* ================= ROW 2 (DIRECT VIEW) ================= */}
<div className="grid lg:grid-cols-2 gap-6">

  {/* ===== DIET CARD ===== */}
  <div className="bg-gradient-to-br from-green-900/30 to-black border border-green-500/20 rounded-2xl p-6">

    <Header icon={<Salad />} title="Today's Diet" />

    {Object.keys(todayDiet).length ? (
      <div className="space-y-4 mt-4">
        {Object.entries(todayDiet).map(([meal, val]) => (
          <div
            key={meal}
            className="bg-black/40 border border-green-500/10 p-4 rounded-xl"
          >
            {/* TOP */}
            <div className="flex justify-between items-center">
              <p className="text-green-400 font-semibold">{meal}</p>
              <span className="text-xs text-gray-400">
                {val.time || "No time"}
              </span>
            </div>

            {/* FOOD */}
            <p className="text-sm text-gray-200 mt-2">
              {val.food}
            </p>

            {/* DETAILS */}
            <div className="flex justify-between mt-3 text-xs">
              <span className="text-gray-400">
                Qty: {val.quantity || "-"}
              </span>
              <span className="text-orange-400 font-semibold">
                {val.calories || 0} kcal
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState text="No Diet Plan Today" />
    )}
  </div>


  {/* ===== WORKOUT CARD ===== */}
  <div className="bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/20 rounded-2xl p-6">

    <Header icon={<Dumbbell />} title="Today's Workout" />

    {todayWorkout.length ? (
      <div className="space-y-4 mt-4">
        {todayWorkout.map((ex, i) => (
          <div
            key={i}
            className="bg-black/40 border border-purple-500/10 p-4 rounded-xl"
          >

            {/* TOP */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{ex.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {ex.type} • {ex.sets} sets • {ex.count} reps
                </p>
              </div>

              <span className="text-xs text-gray-400">
                {ex.time || ""}
              </span>
            </div>

            {/* IMAGE */}
            {ex.media && ex.mediaType?.includes("image") && (
              <img
                src={ex.media}
                alt=""
                className="w-full h-36 object-cover rounded-lg mt-3 border border-purple-500/20"
              />
            )}

          </div>
        ))}
      </div>
    ) : (
      <EmptyState text="Rest Day 💪" />
    )}
  </div>

</div>

      {/* ================= ROW 3 ================= */}
      <div className="grid md:grid-cols-2 gap-6">
        {todayOrders.map(order => (
          <PremiumCard key={order.id} onClick={() => setPopup(order)}>
            <Header icon={<ShoppingCart />} title="Order" />
            <p className="font-bold text-purple-300">{order.order_id}</p>
            <p className="text-gray-400 text-sm">₹{order.total}</p>
          </PremiumCard>
        ))}
      </div>

      {/* ================= POPUP ================= */}
      {popup && (
        <Modal onClose={() => setPopup(null)}>

          {popup === "diet" && (
            <PopupContainer title="Today's Diet" icon={<Salad />}>
              <div className="space-y-3">
                {Object.entries(todayDiet).map(([meal, val]) => (
                  <InnerCard key={meal}>

                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-green-400">{meal}</p>
                      <span className="text-xs text-gray-400">
                        {val.time || "No time"}
                      </span>
                    </div>

                    {/* FOOD */}
                    <p className="text-gray-200 text-sm">
                      {val.food}
                    </p>

                    {/* DETAILS ROW */}
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>Qty: {val.quantity || "-"}</span>
                      <span className="text-orange-400 font-semibold">
                        {val.calories || 0} kcal
                      </span>
                    </div>

                  </InnerCard>
                ))}
              </div>
            </PopupContainer>
          )}
          {/* WORKOUT */}
          {popup === "workout" && (
            <PopupContainer title="Today's Workout" icon={<Dumbbell />}>

              <div className="space-y-4">
                {todayWorkout.map((ex, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 p-4 rounded-xl"
                  >

                    {/* TOP */}
                    <div className="flex justify-between items-start">

                      <div>
                        <p className="font-semibold text-white">
                          {ex.name}
                        </p>

                        <p className="text-gray-400 text-sm mt-1">
                          {ex.type} · {ex.sets} sets · {ex.count} reps
                        </p>
                      </div>

                      <span className="text-xs text-gray-400">
                        {ex.time || "No time"}
                      </span>

                    </div>

                    {/* IMAGE */}
                    {ex.media && ex.mediaType?.includes("image") && (
                      <img
                        src={ex.media}
                        alt="exercise"
                        className="w-full h-40 object-cover rounded-lg mt-3"
                      />
                    )}

                  </div>
                ))}
              </div>

            </PopupContainer>
          )}

          {/* ORDER DETAILS */}
          {popup && typeof popup === "object" && popup.order_id && (
            <Modal onClose={() => setPopup(null)}>

              <div className="text-white">

                {/* HEADER */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text- text-xl font-bold">
                      Order Details
                    </h2>

                    <p className="mt-2 text-sm">
                      <span className="text-gray-400">Order ID:</span>{" "}
                      <span className="font-semibold">{popup.order_id}</span>
                    </p>
                  </div>

                  {/* STATUS BADGE */}
                  <span className="bg-purple-600 px-4 py-1 rounded-full text-sm font-semibold">
                    {normalizeStatus(popup.status)}
                  </span>
                </div>

                {/* ADDRESS */}
                {(() => {
                  const ship =
                    typeof popup.shipping === "string"
                      ? JSON.parse(popup.shipping || "{}")
                      : popup.shipping;

                  return ship && (
                    <div className="bg-black border border-purple-500/20 rounded-2xl p-5 mb-6">
                      <h3 className="text-purple-500 font-semibold mb-2">
                        Delivery Address
                      </h3>

                      <p className="font-semibold">{ship.name}</p>
                      <p className="text-gray-400 text-sm">{ship.email}</p>
                      <p className="text-gray-400 text-sm">{ship.phone}</p>
                      <p className="text-gray-400 text-sm">
                        {ship.address}, {ship.city}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {ship.state} - {ship.zip}
                      </p>
                    </div>
                  );
                })()}

                {/* TABLE HEADER */}
                <div className="bg-black border-b border-purple-500/30 grid grid-cols-3 p-3 text-sm font-semibold text-purple-500">
                  <span>Product</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                </div>

                {/* ITEMS */}
                <div className="divide-y divide-purple-500/20">
                  {popup.items?.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-3 items-center p-4"
                    >
                      {/* PRODUCT */}
                      <div className="flex items-center gap-3">
                        <img
                          src={makeImageUrl(item.image)}
                          className="w-12 h-12 rounded-lg object-cover border border-purple-500/20"
                          alt=""
                        />

                        <p className="text-sm font-semibold">
                          {item.product_name}
                        </p>
                      </div>

                      {/* QTY */}
                      <p className="text-center">{item.qty}</p>

                      {/* PRICE */}
                      <p className="text-right font-semibold">
                        ₹{item.price * item.qty}
                      </p>
                    </div>
                  ))}
                </div>

                {/* TOTAL */}
                <div className="flex justify-between mt-6 border-t border-purple-500/20 pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-purple-500 font-bold">
                    ₹{popup.total}
                  </span>
                </div>

                {/* TRACK TITLE */}
                <h3 className="text-center text-purple-500 mt-6 mb-4 font-semibold">
                  Track Order
                </h3>

                {/* TIMELINE */}
                <OrderTimeline status={popup.status} />

              </div>

            </Modal>
          )}

        </Modal>
      )}

    </div>
  );
};

export default Dashboard;

/* ================= COMPONENTS ================= */

const StatCard = ({ title, value, sub, icon, gradient }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center">

    <div>
      <p className="text-gray-300 text-sm tracking-wide">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
      <p className="text-gray-400 text-xs mt-1">{sub}</p>
    </div>

    <div className={`p-4 rounded-xl bg-gradient-to-br ${gradient}`}>
      {icon}
    </div>

  </div>
);

const PremiumCard = ({ children, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer p-6 rounded-2xl border border-white/10 
    bg-white/5 backdrop-blur-xl hover:scale-[1.02] transition"
  >
    {children}
  </div>
);

const Header = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-3 text-gray-400">
    {icon}
    <p>{title}</p>
  </div>
);

const DateText = () => (
  <p className="text-xs text-gray-200 mt-2 flex items-center gap-1">
    <CalendarDays size={14} /> {dayjs().format("DD MMM YYYY")}
  </p>
);

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/70 scrollbar-hide backdrop-blur-md flex items-center justify-center z-50 p-4">

    <div className="
      bg-gradient-to-br from-[#1a1a2e] to-[#16213e]
      border border-white/10
      rounded-2xl
      w-full max-w-2xl
      h-[85vh]   /* FIXED HEIGHT */
      flex flex-col
      relative
    ">

      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10"
      >
        <X />
      </button>

      {/* SCROLLABLE CONTENT */}
      <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
        {children}
      </div>

    </div>
  </div>
);

const PopupContainer = ({ title, icon, children }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
    {children}
  </div>
);

const InnerCard = ({ children }) => (
  <div className="bg-white/5 p-4 rounded-xl mb-3">
    {children}
  </div>
);


const InfoBox = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);