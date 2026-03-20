import { useEffect, useState } from "react";
import api from "../../api";
import TrainersCard from "../../Components/TrainersCard"; // adjust if needed
import cache from "../../cache";
import AOS from "aos";
import "aos/dist/aos.css";

/* ================= IMAGE HELPER ================= */
const makeImageUrl = (img) => {
  if (!img) return null;

  if (img.startsWith("http") || img.startsWith("data:")) return img;

  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
  if (maybeBase64 && img.length > 50) {
    return `data:image/webp;base64,${img}`;
  }

  const base = import.meta.env.VITE_API_URL || window.location.origin;
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchTrainers = async () => {
      // ✅ cache first
      if (cache.trainers) {
        setTrainers(cache.trainers);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get("/staff", {
          signal: abortController.signal
        });

        const mapped = (res.data || []).map((t) => ({
          ...t,
          photo: makeImageUrl(t.photo), // 🔥 fix image here
        }));

        setTrainers(mapped);
        cache.trainers = mapped;
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error("Failed to load trainers:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
    return () => abortController.abort();
  }, []);

  /* ================= AOS ================= */
  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  return (
    <div className="p-6  min-h-screen">
      {/* HEADER */}
      {/* <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Trainers</h1>
        <p className="text-white/60">
          Meet your professional fitness coaches
        </p>
      </div> */}

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            <p className="text-white/60">Loading trainers...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {trainers.map((trainer, index) => (
            <div
              key={trainer.id}
              data-aos="fade-up"
              data-aos-delay={(index % 4) * 100}
              className="w-full"
            >
              <TrainersCard trainer={trainer} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trainers;