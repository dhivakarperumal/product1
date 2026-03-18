import { useEffect, useState } from "react";
import TrainersCard from "./TrainersCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import api from "../api";
import cache from "../cache";

import "swiper/css";
import PageContainer from "./PageContainer";

export default function TrainerSwiper() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      if (cache.trainers) {
        setTrainers(cache.trainers);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const response = await api.get("/staff");
        setTrainers(response.data);
        cache.trainers = response.data;
      } catch (err) {
        console.error("Failed to fetch trainers", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  if (loading) return null; // keeps UI clean

  return (
    <section className="bg-[#05060c] py-15">
      <PageContainer>
        <div>
          {/* Heading */}
          <div className="text-center mb-14">
            <p className="text-orange-400 tracking-widest mb-2">OUR TEAM</p>
            <h2 className="text-white text-4xl md:text-5xl font-bold">
              Expert Trainers
            </h2>
          </div>

          {/* Swiper */}
          <Swiper
            modules={[Autoplay]}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            loop={true}
            spaceBetween={25}
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {trainers.map((trainer, index) => (
              <SwiperSlide
                key={trainer.id}
                className="mt-5"
              >
                <TrainersCard trainer={trainer} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </PageContainer>
    </section>
  );
}
