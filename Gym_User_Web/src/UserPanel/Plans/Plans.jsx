import React, { useEffect, useState, useRef } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import cache from "../../cache";

const plansCache = {};

const Plans = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const isMountedRef = useRef(true);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    isMountedRef.current = true;

    const fetchPlans = async () => {
      if (!userId) return;

      // Show cached data immediately
      if (plansCache[userId]) {
        if (isMountedRef.current) {
          setPlans(plansCache[userId]);
          setHasError(false);
        }
      } else {
        if (isMountedRef.current) setLoading(true);
      }

      try {
        const res = await api.get(`/memberships?userId=${userId}`, {
          signal: abortController.signal
        });
        const fetchedPlans = Array.isArray(res.data)
          ? res.data
          : res.data?.memberships || [];

        if (isMountedRef.current) {
          setPlans(fetchedPlans);
          setHasError(false);
          setLoading(false);
          plansCache[userId] = fetchedPlans;
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Failed to fetch plans:", err);
          if (isMountedRef.current) {
            setLoading(false);
            if (!plansCache[userId]) {
              setHasError(true);
            }
          }
        }
      }
    };

    fetchPlans();

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [userId]);

  // Show loading only if no cached data
  if (loading && !plans.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60">Loading your plans...</p>
        </div>
      </div>
    );
  }

  if (hasError && !plans.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-white">Failed to load plans</p>
        </div>
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <CreditCard className="w-16 h-16 text-white/30 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Plans Yet</h2>
        <p className="text-white/60">Browse pricing plans to get started</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">My Plans</h2>
        <p className="text-white/60 mt-1">Your active memberships and plans</p>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => {
          const isActive = new Date(plan.endDate) > new Date();
          const daysLeft = dayjs(plan.endDate).diff(dayjs(), "day");

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl border backdrop-blur-xl transition ${
                isActive
                  ? "border-orange-500/50 bg-orange-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {plan.planName || plan.name || "Membership Plan"}
                    </h3>
                    {isActive && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Start Date</p>
                      <p className="text-white font-semibold">
                        {dayjs(plan.startDate).format("DD MMM YYYY")}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/60">End Date</p>
                      <p className="text-white font-semibold">
                        {dayjs(plan.endDate).format("DD MMM YYYY")}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/60">Duration</p>
                      <p className="text-white font-semibold">
                        {plan.duration || plan.duration_months || "-"} months
                      </p>
                    </div>

                    <div>
                      <p className="text-white/60">Price</p>
                      <p className="text-orange-400 font-semibold">
                        ₹{plan.price || plan.cost || "-"}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                      <Clock className="w-4 h-4" />
                      <span>{daysLeft} days remaining</span>
                    </div>
                  )}
                </div>

                <div
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    isActive
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isActive ? "Active" : "Expired"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;