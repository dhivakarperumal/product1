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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  /* ================= GET SPECIALTIES ================= */
  const availableSpecialties = [
    ...new Set(
      trainers
        .map((t) => t.specialty || t.specialization)
        .filter(Boolean)
        .map(String)
    ),
  ];

  /* ================= FILTER TRAINERS ================= */
  const filteredTrainers = trainers.filter((trainer) => {
    // Search filter
    const searchMatch = searchTerm === "" ||
      (trainer.name && trainer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trainer.email && trainer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trainer.phone && trainer.phone.includes(searchTerm)) ||
      (trainer.specialty && trainer.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trainer.specialization && trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Specialty filter
    const specialtyMatch = selectedSpecialty === "ALL" ||
      (trainer.specialty && String(trainer.specialty).toLowerCase() === selectedSpecialty.toLowerCase()) ||
      (trainer.specialization && String(trainer.specialization).toLowerCase() === selectedSpecialty.toLowerCase());
    
    return searchMatch && specialtyMatch;
  });

  return (
    <div className="p-6 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Meet Our Trainers</h1>
        <p className="text-white/60">Professional fitness coaches ready to guide your fitness journey</p>
      </div>

      {/* ================= FILTER SECTION ================= */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Search trainers by name, email, specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Specialty Filter */}
        {availableSpecialties.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedSpecialty("ALL")}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                selectedSpecialty === "ALL"
                  ? "bg-orange-500 text-black"
                  : "border border-orange-500 text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              All Specialties
            </button>
            {availableSpecialties.map((specialty) => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                  selectedSpecialty === specialty
                    ? "bg-orange-500 text-black shadow-lg"
                    : "border border-white/20 text-white/70 hover:border-orange-500 hover:text-orange-400"
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-white/60">
          Showing <span className="text-orange-400 font-semibold">{filteredTrainers.length}</span> trainer{filteredTrainers.length !== 1 ? "s" : ""}
          {trainers.length > filteredTrainers.length && ` (filtered from ${trainers.length})`}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            <p className="text-white/60">Loading trainers...</p>
          </div>
        </div>
      ) : filteredTrainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredTrainers.map((trainer, index) => (
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
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-white/70 mb-2">No trainers match your search</p>
          <p className="text-sm text-white/50 mb-4">Try adjusting your filters or search term</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedSpecialty("ALL");
            }}
            className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Trainers;