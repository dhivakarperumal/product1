import React, { useEffect, useState } from "react";
import PageContainer from "../../Components/PageContainer";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import AOS from "aos";
import cache from "../../cache";

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [availableDurations, setAvailableDurations] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState("ALL");

  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ Fetch Plans
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
          ...new Set(
            plans.map((p) => p.duration || p.duration_months)
          ),
        ];
        setAvailableDurations(durations);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlans();
  }, []);

  // ✅ Filter
  const filtered =
    selectedDuration === "ALL"
      ? services
      : services.filter(
          (s) =>
            (s.duration || s.duration_months) === selectedDuration
        );

  // ✅ AOS
  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  // ✅ Check Active Plan
  useEffect(() => {
    if (!user?.id) {
      setCheckingPlan(false);
      return;
    }

    const check = async () => {
      try {
        const res = await api.get(`/memberships/user/${user.id}`);
        const active = res.data?.some(
          (p) => p.status === "active"
        );
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
    <div className=" text-white min-h-screen">

      {/* FILTER */}
      <div className="my-10 overflow-x-auto">
        <div className="flex gap-4 px-4 w-max mx-auto">
          <button
            onClick={() => setSelectedDuration("ALL")}
            className={`px-6 py-2 rounded-full ${
              selectedDuration === "ALL"
                ? "bg-red-600"
                : "border border-red-500"
            }`}
          >
            ALL
          </button>

          {availableDurations.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`px-6 py-2 rounded-full ${
                selectedDuration === d
                  ? "bg-red-600"
                  : "border border-red-500"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS */}
      <PageContainer>
        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((service, index) => (
            <div
              key={service.id}
              data-aos="fade-up"
              className="bg-[#0e1016] p-6 rounded-xl border border-red-500/40 flex flex-col"
            >
              <h3 className="text-red-500 text-xl mb-2">
                {service.name}
              </h3>

              <p className="text-sm text-gray-400 mb-3">
                {service.description}
              </p>

              {/* PRICE */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">
                  ₹{service.final_price ?? service.price}
                </span>
                <span className="text-sm text-gray-400">
                  / {service.duration || "month"}
                </span>
              </div>

              {/* FEATURES */}
              <ul className="text-sm text-gray-300 flex-1">
                {(service.facilities || []).slice(0, 4).map((f, i) => (
                  <li key={i}>• {f}</li>
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

                  navigate("/buy-plan", {
                    state: { plan: service },
                  });
                }}
                className="mt-4 bg-red-600 py-2 rounded"
              >
                {hasActivePlan ? "PLAN ACTIVE" : "CHOOSE"}
              </button>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
};

export default Pricing;