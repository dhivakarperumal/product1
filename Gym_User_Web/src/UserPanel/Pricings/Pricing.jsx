import React, { useEffect, useState } from "react";
import PageContainer from "../../Components/PageContainer";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import cache from "../../cache";

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [availableDurations, setAvailableDurations] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState("ALL");

  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  /* ================= FETCH PLANS ================= */
  useEffect(() => {
    const fetchPlans = async () => {
      if (cache.plans) {
        setServices(cache.plans);
      }

      try {
        const res = await api.get("/plans");
        const plans = Array.isArray(res.data) ? res.data : [];

        setServices(plans);
        cache.plans = plans;

        const durations = [
          ...new Set(plans.map((p) => p.duration || p.duration_months)),
        ];
        setAvailableDurations(durations);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlans();
  }, []);

  /* ================= FILTER ================= */
  const filtered =
    selectedDuration === "ALL"
      ? services
      : services.filter(
          (s) =>
            (s.duration || s.duration_months) === selectedDuration
        );

  /* ================= ACTIVE PLAN ================= */
  useEffect(() => {
    if (!user?.id) {
      setCheckingPlan(false);
      return;
    }

    const check = async () => {
      try {
        const res = await api.get(`/memberships/user/${user.id}`);
        const active = res.data?.some((p) => p.status === "active");
        setHasActivePlan(active);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingPlan(false);
      }
    };

    check();
  }, [user]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden">

      {/* ================= FILTER ================= */}
      <div className="my-10 overflow-x-auto">
        <div className="flex gap-4 px-4 max-w-full overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedDuration("ALL")}
            className={`px-6 py-2 rounded-full text-sm transition ${
              selectedDuration === "ALL"
                ? "bg-orange-500 text-black "
                : "border border-orange-500 text-orange-400"
            }`}
          >
            ALL
          </button>

          {availableDurations.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`px-6 py-2 rounded-full text-sm transition ${
                selectedDuration === d
                  ? "bg-orange-500 text-black shadow-[0_0_15px_orange]"
                  : "border border-orange-500 text-orange-400"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* ================= CARDS ================= */}
      <PageContainer>
        <div className="grid md:grid-cols-3 gap-8">
          {filtered.map((service, index) => {
            const price = service.final_price ?? service.price;
            const original = service.price;

            return (
              <div
                key={service.id}
                
                
                className="
                  relative rounded-2xl p-[1px]
                  bg-gradient-to-br from-orange-500/60 via-transparent to-orange-500/60
                "
              >
                <div className="bg-black rounded-2xl p-7 h-full flex flex-col">

                  {/* TITLE */}
                  <h3 className="text-orange-500 text-2xl font-semibold mb-2">
                    {service.name}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                    {service.description}
                  </p>

                  {/* PRICE */}
                  <div className="mb-6">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-orange-400 drop-shadow-[0_0_10px_orange]">
                        ₹{price}
                      </span>
                      <span className="text-gray-400 text-sm">
                        / {service.duration || "month"}
                      </span>
                    </div>

                    {original && original !== price && (
                      <div className="text-gray-500 line-through text-sm mt-1">
                        ₹{original}
                      </div>
                    )}
                  </div>

                  {/* FEATURES */}
                  <ul className="flex-1 space-y-3 text-sm text-gray-300">
                    {(service.facilities || []).filter((_, i) => i < 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_orange]"></span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* BUTTON */}
                  <button
                    disabled={hasActivePlan || checkingPlan}
                    onClick={() => {
                      if (!user) return navigate("/login");

                      if (hasActivePlan) {
                        alert("Already active plan");
                        return;
                      }

                      navigate("/user/buynow", {
                        state: { plan: service },
                      });
                    }}
                    className={`
                      mt-8 py-3 rounded-full font-semibold transition
                      ${
                        hasActivePlan
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_20px_orange]"
                      }
                    `}
                  >
                    {hasActivePlan ? "PLAN ACTIVE" : "CHOOSE PLAN"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
};

export default Pricing;