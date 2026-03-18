import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import PricingCard from "./PricingCard";
import cache from "../cache";
import PageContainer from "./PageContainer";

export default function PricingSwiper() {
  const [services, setServices] = useState([]);
  const [duration, setDuration] = useState("monthly");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  /* ---------------- FETCH PLANS ---------------- */
  useEffect(() => {
    const fetchPlans = async () => {
      if (cache.plans) {
        setServices(cache.plans);
      }

      try {
        const response = await api.get("/plans");
        const plans = Array.isArray(response.data) ? response.data : [];
        setServices(plans);
        cache.plans = plans;
      } catch (err) {
        console.error("Failed to fetch plans:", err);
        if (!cache.plans) setServices([]);
      }
    };

    fetchPlans();
  }, []);

  /* ---------------- CHECK ACTIVE PLAN ---------------- */
  useEffect(() => {
    if (!user || !user.id) {
      setHasActivePlan(false);
      setCheckingPlan(false);
      return;
    }

    const checkActivePlan = async () => {
      try {
        const response = await api.get(`/memberships/user/${user.id}`);
        const activePlan = response.data?.some((plan) => plan.status === "active");
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

  /* ---------------- FILTER BY DURATION ---------------- */
  const filteredPlans = services;

  return (
    <section className="bg-black text-white py-24 pr-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-red-500">
          Membership Plans
        </h2>
        <p className="text-white/60 mt-3">
          Choose the perfect plan for your fitness journey
        </p>
      </div>

      {/* SWIPER */}
      <PageContainer>
        <div className="">
          <Swiper
            key={filteredPlans.length}
            modules={[Autoplay]}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            spaceBetween={30}
            loop={filteredPlans.length > 1}
            centeredSlides={filteredPlans.length > 2}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 1.2 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {filteredPlans.map((service, index) => (
              <SwiperSlide key={service.id} className="!h-auto flex">
                <PricingCard
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
                      alert(
                        "You already have an active plan. Please wait until it expires.",
                      );
                      return;
                    }

                    navigate("/buy-plan", {
                      state: { plan: selected },
                    });
                  }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </PageContainer>
    </section>
  );
}
