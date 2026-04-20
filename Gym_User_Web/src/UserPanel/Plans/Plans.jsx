import React, { useEffect, useState, useRef } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useAdminFilter, buildAdminFilteredUrl } from "../../utils/useAdminFilter";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import { resolveUserId } from "../../utils/userUtils";

const plansCache = {};

const Plans = () => {
  const { user } = useAuth();
  const userId = resolveUserId(user);
  const { adminId, loading: adminLoading } = useAdminFilter();
  const isMountedRef = useRef(true);

  const [memberships, setMemberships] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    isMountedRef.current = true;

    const fetchMemberships = async () => {
      if (!userId) return;

      if (plansCache[userId]) {
        if (isMountedRef.current) {
          setMemberships(plansCache[userId]);
          setHasError(false);
        }
      } else {
        if (isMountedRef.current) setLoading(true);
      }

      try {
        const res = await api.get(`/memberships/user/${userId}`, {
          signal: abortController.signal,
        });
        const fetchedMemberships = Array.isArray(res.data)
          ? res.data
          : res.data?.memberships || [];

        if (isMountedRef.current) {
          setMemberships(fetchedMemberships);
          setHasError(false);
          setLoading(false);
          plansCache[userId] = fetchedMemberships;
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Failed to fetch memberships:", err);
          if (isMountedRef.current) {
            setLoading(false);
            if (!plansCache[userId]) {
              setHasError(true);
            }
          }
        }
      }
    };

    fetchMemberships();

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || adminLoading || memberships.length > 0 || !adminId) return;

    const abortController = new AbortController();
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const url = buildAdminFilteredUrl("/plans", adminId);
        const res = await api.get(url, { signal: abortController.signal });
        const fetchedPlans = Array.isArray(res.data) ? res.data : [];

        if (isMountedRef.current) {
          setAvailablePlans(fetchedPlans);
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Failed to fetch available plans:", err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingPlans(false);
        }
      }
    };

    fetchPlans();

    return () => abortController.abort();
  }, [userId, adminId, adminLoading, memberships.length]);

  const hasMemberships = memberships.length > 0;
  const noData = !hasMemberships && !availablePlans.length && !loadingPlans;

  if (loading && !hasMemberships) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60">Loading your plans...</p>
        </div>
      </div>
    );
  }

  if (hasError && !hasMemberships) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-white">Failed to load plans</p>
        </div>
      </div>
    );
  }

  if (noData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <CreditCard className="w-16 h-16 text-white/30 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Plans Yet</h2>
        <p className="text-white/60">Browse pricing plans to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {hasMemberships ? (
        <>
          <div>
            <h2 className="text-3xl font-bold text-white">My Plans</h2>
            <p className="text-white/60 mt-1">Your active memberships and plans</p>
          </div>

          <div className="grid gap-6">
            {memberships.map((plan) => {
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
        </>
      ) : (
        <>
          <div>
            <h2 className="text-3xl font-bold text-white">Available Plans</h2>
            <p className="text-white/60 mt-1">Browse plans from your assigned admin</p>
          </div>

          {loadingPlans ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-white/60">Loading available plans...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {availablePlans.map((plan) => (
                <div key={plan.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{plan.name || "Plan"}</h3>
                    <span className="text-sm text-white/60">{plan.duration || plan.duration_months || "--"} months</span>
                  </div>

                  <p className="text-white/70 mb-4">{plan.description || "No description available."}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-4">
                    {plan.facilities?.length > 0 && (
                      <span>{plan.facilities.length} facilities included</span>
                    )}
                    {plan.trainer_included ? (
                      <span>Trainer included</span>
                    ) : (
                      <span>No trainer included</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Price</p>
                      <p className="text-2xl font-bold text-orange-400">₹{plan.final_price || plan.price || "0"}</p>
                    </div>
                    <div className="text-right text-sm text-white/50">
                      <p>{plan.discount ? `${plan.discount}% off` : "No discount"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Plans;
