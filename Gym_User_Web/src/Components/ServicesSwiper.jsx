import { useEffect, useState } from "react";
import api from "../api";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import ServiceCard from "./ServicesCard";
import PageContainer from "./PageContainer";
import cache from "../cache";

export default function ServiceSwiper() {
  const [services, setServices] = useState([]);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      if (cache.services) {
        setServices(cache.services);
      }

      try {
        const response = await api.get("/services");
        setServices(response.data);
        cache.services = response.data;
      } catch (err) {
        console.error("Failed to fetch services:", err);
      }
    };

    fetchServices();
  }, []);

  return (
    <section className="bg-[#05060c] py-15">
      <PageContainer>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-red-500 tracking-widest">
            OUR SERVICES
          </h2>
          <p className="text-white/60 text-sm mt-2">
            Personalized fitness for every goal
          </p>
        </div>

        <Swiper
          key={services.length}
          modules={[Autoplay]}
          loop={services.length > 1}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          spaceBetween={30}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
          className="px-4 md:px-12"
        >
          {services.map((item, index) => (
            <SwiperSlide key={item.id} className="pb-6">
              <ServiceCard item={item} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </PageContainer>
    </section>
  );
}
