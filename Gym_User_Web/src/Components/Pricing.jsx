import React, { useEffect, useState } from "react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import AOS from "aos";
import PricingCard from "./PricingCard";
import cache from "../cache";

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [availableDurations, setAvailableDurations] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState("ALL");
  

  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  /* 🔥 Fetch Plans */
  useEffect(() => {
    const fetchPlans = async () => {
      if (cache.plans) {
        setServices(cache.plans);
        const durations = [...new Set(cache.plans.map((p) => p.duration || p.duration_months).filter(Boolean))];
        setAvailableDurations(durations);
      }

      try {
        const response = await api.get("/plans");
        const plans = Array.isArray(response.data) ? response.data : [];

        setServices(plans);
        cache.plans = plans;

        const durations = [
          ...new Set(plans.map((p) => p.duration || p.duration_months).filter(Boolean)),
        ];
        setAvailableDurations(durations);
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      }
    };

    fetchPlans();
  }, []);

  /* 🔥 Filter Plans */
  const filteredServices =
    selectedDuration === "ALL"
      ? services
      : services.filter((service) => (service.duration || service.duration_months) === selectedDuration);

  /* 🔥 AOS */
  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  /* 🔥 Active Plan Check */
  useEffect(() => {
    if (!user || !user.id) {
      setHasActivePlan(false);
      setCheckingPlan(false);
      return;
    }

    const checkActivePlan = async () => {
      try {
        const response = await api.get(`/memberships/user/${user.id}`);
        const activePlan = response.data?.some(
          (plan) => plan.status === "active"
        );

        setHasActivePlan(!!activePlan);
      } catch (err) {
        console.error("Failed to check active plan:", err);
        setHasActivePlan(false);
      } finally {
        setCheckingPlan(false);
      }
    };

    checkActivePlan();
  }, [user]);

  return (
    <div className="bg-black text-white">
      <PageHeader
        title="Pricing"
        subtitle="Flexible plans designed for every fitness goal and lifestyle"
        bgImage="https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=1600&q=80"
      />

      {/* 🔥 Duration Filter */}
      <div className="my-10 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 w-max mx-auto">
          <button
            onClick={() => setSelectedDuration("ALL")}
            className={`px-8 py-2 rounded-full text-sm tracking-widest transition
              ${
                selectedDuration === "ALL"
                  ? "bg-red-600 text-white"
                  : "border border-red-500/40 text-white/70 hover:bg-red-600/20"
              }`}
          >
            ALL
          </button>

          {availableDurations.map((duration) => (
            <button
              key={duration}
              onClick={() => setSelectedDuration(duration)}
              className={`px-8 py-2 rounded-full text-sm tracking-widest transition
                ${
                  selectedDuration === duration
                    ? "bg-red-600 text-white"
                    : "border border-red-500/40 text-white/70 hover:bg-red-600/20"
                }`}
            >
              {duration.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 🔥 Pricing Cards */}
      <PageContainer>
        <section className="pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredServices.map((service, index) => (
            <PricingCard
              key={service.id}
              service={service}
              index={index}
              hasActivePlan={hasActivePlan}
              checkingPlan={checkingPlan}
              onChoose={(selected) => {
                if (!user) {
                  navigate("/login", {
                    state: { message: "Please login to purchase a plan" },
                  });
                  return;
                }

                if (hasActivePlan) {
                  alert("You already have an active plan.");
                  return;
                }

                navigate("/buy-plan", { state: { plan: selected } });
              }}
            />
          ))}
        </section>

        {/* 🔥 CTA */}
        <section className="py-20 text-center border-t border-red-500/20">
          <h2 className="text-3xl font-bold mb-6">
            Save More With Long-Term Plans
          </h2>

          <p className="text-white/70 mb-8">
            Yearly plans offer the best value and consistency.
          </p>

          <button
            onClick={() => navigate("/contact")}
            className="bg-red-600 hover:bg-red-700 transition px-12 py-4 rounded-full tracking-widest font-semibold cursor-pointer"
          >
            CONTACT US
          </button>
        </section>
      </PageContainer>
    </div>
  );
};

export default Pricing;
