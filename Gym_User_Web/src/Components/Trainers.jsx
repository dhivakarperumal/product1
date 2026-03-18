import { useEffect, useState } from "react";
import api from "../api";

import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import TrainersCard from "./TrainersCard";
import AOS from "aos";
import "aos/dist/aos.css";
import cache from "../cache";

export default function Trainers() {
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
        console.error("Failed to load trainers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Trainers"
        subtitle="Certified trainers dedicated to your strength, health, and transformation"
        bgImage="https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="bg-[#05060c] py-15">
        <PageContainer>
          {loading ? (
            <div className="flex justify-center items-center py-20 min-h-[400px]">
              <p className="text-white/60 text-lg">Loading trainers...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trainers.map((trainer, index) => (
                <div
                  key={trainer.id}
                  data-aos="fade-up"
                  data-aos-delay={(index % 4) * 100}
                >
                  <TrainersCard trainer={trainer} />
                </div>
              ))}
            </div>
          )}
        </PageContainer>
      </section>
    </>
  );
}
