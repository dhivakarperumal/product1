import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";

const Services = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Service fetch error:", err.message);
      setServices([]);
    }
  };

  // ✅ SAME IMAGE LOGIC AS MOBILE APP
  const getImageUrl = (service) => {
    const img = service?.hero_image || service?.heroImage;

    if (!img) return null;

    // base64 already
    if (img.startsWith("data:image")) return img;

    // raw base64
    if (img.length > 1000 && !img.startsWith("http")) {
      return `data:image/jpeg;base64,${img}`;
    }

    // full url
    if (img.startsWith("http")) return img;

    // relative path
    return `https://mygym.qtechx.com/${img}`;
  };

  return (
    <div className="min-h-screen px-3 py-8">
      {/* EMPTY STATE */}
      {services.length === 0 && (
        <p className="text-center text-white/50 mt-20">
          No services available
        </p>
      )}

      {/* 🔥 GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
        {services.map((service, index) => {
          const imageUrl = getImageUrl(service);

          return (
            <div
              key={service.id || index}
              onClick={() => navigate(`/user/services/${service.slug}`)}
              className="
    relative cursor-pointer overflow-hidden rounded-3xl
    border border-orange-500/60 group
    hover:-translate-y-2 transition-all duration-300
    h-[330px]
  "
              style={{
                boxShadow: "0 0 30px rgba(255,60,0,0.4)",
              }}
            >
              {/* IMAGE */}
              <img
                src={imageUrl || "/logo_dark.png"}
                alt={service.title}
                className="
      w-full h-[280px] object-cover
      group-hover:scale-110 transition duration-500
    "
              />

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-black/30" />

              {/* CONTENT */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-black/85 border-t border-orange-500">
                {/* ✅ TITLE CLAMP */}
                <h3 className="text-white text-base font-bold truncate">
                  {service?.title || "Service"}
                </h3>

                <p className="text-white/60 text-xs mt-1">
                  {service?.slug}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/user/services/${service.slug}`);
                  }}
                  className="
        mt-3 px-4 py-2 rounded-full
        bg-orange-500 text-white text-xs font-semibold
        hover:scale-105 transition
      "
                >
                  EXPLORE
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Services;