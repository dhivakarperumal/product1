import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";

const ServiceDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchService();
  }, [slug]);

  const fetchService = async () => {
    try {
      const res = await api.get("/services");
      const found = res.data.find((s) => s.slug === slug);
      setService(found || null);
    } catch (err) {
      console.log("Service detail error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAME IMAGE LOGIC
  const getImageUrl = (service) => {
    const img = service?.hero_image || service?.heroImage;

    if (!img) return null;

    if (img.startsWith("data:image")) return img;

    if (img.length > 1000 && !img.startsWith("http")) {
      return `data:image/jpeg;base64,${img}`;
    }

    if (img.startsWith("http")) return img;

    return `https://mygym.qtechx.com/${img}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Service not found
      </div>
    );
  }

  const imageUrl = getImageUrl(service);

return (
  <div className="min-h-screen px-6 py-8">

    {/* 🔥 TOP SECTION */}
    <div className="grid lg:grid-cols-2 gap-10 items-start mb-12">
      
      {/* 🖼 IMAGE LEFT WITH TITLE */}
      <div className="relative rounded-3xl overflow-hidden group">
        <img
          src={imageUrl || "/logo_dark.png"}
          alt={service.title}
          className="w-full h-[420px] object-cover group-hover:scale-105 transition duration-500"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/40" />

        {/* 🔥 TITLE ON IMAGE */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <h1 className="text-orange-500 text-3xl md:text-4xl font-extrabold leading-tight">
            {service.title}
          </h1>
        </div>
      </div>

      {/* 📄 RIGHT SIDE CONTENT */}
      
      <div className="flex flex-col justify-center">
         <h1 className="text-white text-2xl md:text-3xl pb-3 font-extrabold leading-tight">
            {service.title}
          </h1>
        {/* SHORT DESC */}
        <p className="text-gray-400 text-sm mb-5 leading-6">
          {service.short_desc}
        </p>

        {/* MAIN DESCRIPTION */}
        <p className="text-gray-300 leading-7 mb-8 text-justify">
          {service.description}
        </p>

      </div>
    </div>

    {/* 🔥 POINTS */}
    <div className="max-w-6xl">
      <h2 className="text-xl font-bold text-orange-500 mb-6">
        What's Included
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(service.points) &&
          service.points.map((point, index) => (
            <div
              key={index}
              className="
                flex items-center gap-4
                p-4 rounded-2xl
                bg-black text-white
                border border-gray-800
                hover:border-orange-500 transition
              "
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                ✓
              </div>

              <p className="text-sm text-gray-300 leading-6">
                {point}
              </p>
            </div>
          ))}
      </div>
    </div>
  </div>
);
};

export default ServiceDetails;