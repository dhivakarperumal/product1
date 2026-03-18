import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import { FiArrowRight } from "react-icons/fi";
import AOS from "aos";
import "aos/dist/aos.css";
import FacilityCard from "./FacilityCard";
import api from "../api";
import cache from "../cache";

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      if (cache.facilities) {
        setFacilities(cache.facilities);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get('/facilities');
        const data = res.data || [];
        setFacilities(data);
        cache.facilities = data;
      } catch (error) {
        console.error("Failed to load facilities", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Mapping Facilities</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black via-[#120000] to-black text-white">
      <PageHeader
        title="Facilities"
        subtitle="World-class gym equipment & training zones"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
      />

      {/* FACILITIES GRID */}
      <PageContainer>
        <section className="my-15">
          <div
            data-aos="fade-up"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {facilities.map((item, index) => (
              <FacilityCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          data-aos="fade-up"
          className="py-20 text-center border-t border-red-500/20"
        >
          <h2 className="text-3xl font-bold mb-6">
            Train With Professional Equipment
          </h2>
          <p className="text-white/70 mb-8">
            Build strength, burn fat, and improve performance using
            industry-grade gym equipment.
          </p>
          <button className="bg-red-600 hover:bg-red-700 transition px-12 py-4 rounded-full tracking-widest font-semibold shadow-xl">
            JOIN THE GYM
          </button>
        </section>
      </PageContainer>
    </div>
  );
};

export default Facilities;
