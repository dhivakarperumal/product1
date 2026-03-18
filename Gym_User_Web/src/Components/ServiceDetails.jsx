import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TrainersCard from "./TrainersCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

export default function ServicesDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/services.json").then((r) => r.json()),
      fetch("/trainers.json").then((r) => r.json()),
    ])
      .then(([servicesData, trainersData]) => {
        const found = servicesData.find((s) => s.slug === slug);
        setService(found);

        const related = trainersData.filter((t) =>
          t.services?.some((s) => s.toLowerCase() === slug.toLowerCase()),
        );

        // 🔥 YOU MISSED THIS
        setTrainers(related);
      })
      .catch((err) => console.error(err));
  }, [slug]);

  if (!service) return null;

  return (
    <>
      <section className="bg-[#05060c] min-h-screen flex items-center py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-5 items-center">
            {/* LEFT CONTENT */}
            <div className="text-center lg:text-left">
              <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                {service.title.toUpperCase()}
              </h1>

              <p className="text-gray-300 max-w-md mx-auto lg:mx-0 leading-relaxed mb-10">
                {service.shortDesc}
              </p>

              <button
                onClick={() => navigate("/contact")}
                className="
            mx-auto lg:mx-0
            px-10 py-3 font-semibold rounded-md
            bg-gradient-to-r from-red-600 to-orange-500
            text-white tracking-wide
            shadow-[0_10px_30px_rgba(255,0,0,.35)]
            hover:scale-105 transition
            flex items-center gap-3 cursor-pointer
            "
              >
                CONTACT US
                <span className="text-xl">➜</span>
              </button>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-[80px] rounded-full"></div>

              <img
                src={service.heroImage}
                alt={service.title}
                className="
            relative rounded-3xl w-full
            h-[260px] sm:h-[340px] md:h-[420px] lg:h-[520px]
            object-cover shadow-2xl
            "
              />
            </div>
          </div>

          <div className="mt-10">
            {/* DESCRIPTION */}
            <div className="max-w-3xl mb-12">
              <h2 className="text-transparent bg-gradient-to-r from-white via-red-400 to-orange-400 bg-clip-text text-3xl font-extrabold mb-6">
                Fitness Tips & Techniques
              </h2>

              <p className="text-gray-300 leading-relaxed">
                {service.description}
              </p>
            </div>

            <div className="mt-20 grid lg:grid-cols-2 gap-10 items-start">
              {/* LEFT – POINTS */}
              <div className="space-y-4">
                {Array.isArray(service.points) &&
  service.points.map((point, index) => (
    <div
      key={index}
      className="
        flex items-start gap-4 p-3 rounded-2xl
        bg-white/5 border border-white/10
        backdrop-blur-sm
        hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(255,0,0,.15)]
        transition
      "
    >
      <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-gradient-to-r from-red-600 to-orange-500 rounded-lg text-white font-bold shadow-lg">
        ✓
      </div>

      <p className="text-gray-200 text-sm leading-relaxed">
        {point}
      </p>
    </div>
))}
              </div>

              {/* RIGHT – WHY JOIN US */}
              <div className="relative bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">
                {/* Glow */}
                <div className="absolute -inset-6 bg-red-500/20 blur-[60px] rounded-full"></div>

                <div className="relative">
                  <h2 className="text-transparent bg-gradient-to-r from-white via-red-400 to-orange-400 bg-clip-text text-3xl font-extrabold mb-6">
                    Why Choose Our Gym?
                  </h2>

                  <p className="text-gray-300 leading-relaxed text-sm">
                    Thank you for taking the time to learn more about our gym
                    and how we can help you achieve your fitness goals. With our
                    state-of-the-art facilities, expert personal training
                    services, diverse group fitness classes, nutritional
                    guidance, and supportive community, there's no limit to what
                    you can accomplish.
                    <br />
                    <br />
                    So why wait? Join us today and take the first step toward a
                    healthier, stronger, and happier you.
                  </p>

                  <button
                    onClick={() => navigate("/contact")}
                    className="
        mt-8 px-8 py-3 rounded-full text-sm font-semibold
        bg-gradient-to-r from-red-600 to-orange-500 text-white
        shadow-[0_0_25px_rgba(255,0,0,.4)]
        hover:scale-105 transition cursor-pointer
        "
                  >
                    Join Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            {/* TRAINERS */}
            {trainers.length > 0 && (
              <div className="mt-24">
                <h2 className="text-white text-3xl font-bold mb-10">
                  Trainers for this Service
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {trainers.map((trainer) => (
                    <TrainersCard key={trainer.id} trainer={trainer} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}