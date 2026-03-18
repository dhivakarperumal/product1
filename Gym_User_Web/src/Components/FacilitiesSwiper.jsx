import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import FacilityCard from "./FacilityCard";
import PageContainer from "./PageContainer";
import api from "../api";
import cache from "../cache";

export default function FacilitiesSwiper() {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    const fetchFacilities = async () => {
      if (cache.facilities) {
        setFacilities(cache.facilities);
      }

      try {
        const res = await api.get("/facilities");
        const data = res.data || [];
        setFacilities(data);
        cache.facilities = data;
      } catch (error) {
        console.error("Failed to load facilities", error);
      }
    };

    fetchFacilities();
  }, []);

  return (
    <section className="bg-[#05060c] py-5">
      <PageContainer>
        <div className="text-center mb-14">
          <p className="text-red-500 tracking-widest mb-2">OUR FACILITIES</p>
          <h2 className="text-white text-4xl md:text-5xl font-bold">
            Premium Training Zones
          </h2>
        </div>

        <Swiper
          key={facilities.length}
          modules={[Autoplay]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          spaceBetween={20}
          loop={facilities.length > 1}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="px-4"
        >
          {facilities.map((item, index) => (
            <SwiperSlide key={item.id} className="!h-auto flex min-w-0 mt-3">
              <FacilityCard item={item} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </PageContainer>
    </section>
  );
}