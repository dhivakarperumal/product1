import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../api";

const FacilityDetail = () => {
  const { slug } = useParams();

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await api.get(`/facilities/${slug}`);
        setFacility(response.data || null);
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      } catch (err) {
        console.error('Failed to fetch facility', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [slug]);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500 text-xl tracking-widest">
        LOADING FACILITY...
      </div>
    );
  }

  /* ---------------- ERROR / NOT FOUND ---------------- */
  if (error || !facility) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h2 className="text-3xl font-bold text-red-500 mb-4">
          Facility Not Found
        </h2>
        <Link
          to="/facilities"
          className="text-red-500 underline tracking-widest"
        >
          BACK TO FACILITIES
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-black text-white">
      {/* ✅ PAGE HEADER */}
      <PageHeader
        title={facility.title}
        subtitle={facility.shortDesc}
        bgImage={facility.heroImage}
      />

      {/* DESCRIPTION */}
      <PageContainer>
        <section data-aos="fade-up" className=" py-20">
          <h2 className="text-3xl font-bold mb-6 tracking-wide text-red-500">
            ABOUT THIS FACILITY
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            {facility.description}
          </p>
        </section>
      </PageContainer>

      {/* IMAGE GALLERY */}
      <PageContainer>
        <section className=" pb-20">
          <h2 className="text-3xl font-bold mb-10 tracking-wide text-red-500">
            FACILITY GALLERY
          </h2>

          <div
            data-aos="fade-up"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(facility.gallery || []).map((img, index) => (
              <div
                key={index}
                data-aos="zoom-in"
                data-aos-delay={index * 120}
                className="overflow-hidden rounded-xl group"
              >
                <img
                  src={img}
                  alt={`${facility.title} ${index + 1}`}
                  className="w-full h-64 object-cover
                           transform group-hover:scale-110
                           transition duration-700"
                />
              </div>
            ))}
          </div>
        </section>
      </PageContainer>

      {/* EQUIPMENT & WORKOUTS */}
      <section className="bg-[#0b0000] py-20">
        <PageContainer>
          <div className=" grid md:grid-cols-2 gap-12">
            {/* EQUIPMENTS */}
            <div data-aos="fade-right">
              <h3 className="text-2xl font-bold mb-6 text-red-500 tracking-wide">
                AVAILABLE EQUIPMENT
              </h3>
              <ul className="space-y-3 text-white/80">
                {(facility.equipments || []).map((eq, index) => (
                  <li key={index} className="border-b border-red-500/20 pb-2">
                    {eq}
                  </li>
                ))}
              </ul>
            </div>

            {/* WORKOUTS */}
            <div data-aos="fade-left">
              <h3 className="text-2xl font-bold mb-6 text-red-500 tracking-wide">
                SUPPORTED WORKOUTS
              </h3>
              <ul className="space-y-3 text-white/80">
                {(facility.workouts || []).map((workout, index) => (
                  <li key={index} className="border-b border-red-500/20 pb-2">
                    {workout}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* CTA */}
      <section data-aos="fade-up" className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-6 tracking-wide">
          START TRAINING TODAY
        </h2>
        <p className="text-white/70 mb-10">
          Train using professional equipment and expert-designed workout zones.
        </p>
        <Link
          to="/contact"
          className="inline-block bg-red-600 hover:bg-red-700
                     transition px-14 py-4 rounded-full
                     tracking-widest font-semibold shadow-xl"
        >
          JOIN THE GYM
        </Link>
      </section>
    </div>
  );
};

export default FacilityDetail;
