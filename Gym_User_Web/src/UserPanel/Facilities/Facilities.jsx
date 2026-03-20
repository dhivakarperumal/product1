import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MapPin, Wifi, Clock, Phone, Mail, DollarSign, ChevronRight, X } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

// Image URL builder with fallback
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

const FacilityCard = ({ facility, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = makeImageUrl(facility.image || facility.heroImage);

  // Pre-defined gradient backgrounds for each facility
  const gradientMap = {
    1: "from-red-600/40 via-purple-600/30 to-black/80",
    2: "from-orange-600/40 via-red-600/30 to-black/80",
    3: "from-cyan-600/40 via-blue-600/30 to-black/80",
    4: "from-purple-600/40 via-pink-600/30 to-black/80",
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-red-600/30 hover:border-red-600/70 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
      onClick={onClick}
    >
      {/* IMAGE CONTAINER */}
      <div className={`relative h-72 overflow-hidden bg-gradient-to-br ${gradientMap[facility.id] || 'from-red-600/40 to-black/80'}`}>
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Image - Only show if URL exists */}
        {imageUrl && !imageError && (
          <img
            src={imageUrl}
            alt={facility.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.warn(`Failed to load image for ${facility.name}`);
              setImageError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            crossOrigin="anonymous"
          />
        )}

        {/* Icon/Text Fallback */}
        <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-70 transition-opacity">
          <Wifi className="w-16 h-16 text-white/30" />
        </div>

        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70"></div>
      </div>

      {/* CONTENT CONTAINER */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {/* TITLE */}
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors line-clamp-2">
          {facility.name}
        </h3>

        {/* DESCRIPTION */}
        <p className="text-white/80 text-sm mb-4 line-clamp-2">
          {facility.description}
        </p>

        {/* VIEW DETAILS LINK */}
        <div className="flex items-center justify-between">
          <span className="text-red-500 text-sm font-semibold uppercase tracking-wider">
            View Details
          </span>
          <div className="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center group-hover:bg-red-500 transition-colors">
            <ChevronRight className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    fetchFacilities(abortController.signal);
    return () => abortController.abort();
  }, []);

  const fetchFacilities = useCallback(async (signal) => {
    try {
      const res = await api.get("/facilities", { signal });
      const mappedData = (res.data || []).map((item) => ({
        id: item.id,
        name: item.title,
        description: item.shortDesc,
        image: item.heroImage,
        slug: item.slug,
        amenities: item.amenities || [],
        hours: item.hours,
        contact: item.contact,
      }));

      setFacilities(mappedData);
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error("Error fetching facilities:", error);
      }
      // Mock data for demo - using placeholder URLs
      setFacilities([
        {
          id: 1,
          name: "Functional Training Arena",
          description: "Our strength training area is designed for muscle building and power training with professional equipment and guided workout programs.",
          image: "https://via.placeholder.com/800x600/b91c1c/ffffff?text=Functional+Training",
          amenities: ["Functional Equipment", "Training Stations", "Expert Coaches", "Group Classes"],
          hours: "6 AM - 11 PM",
          contact: "+91 XXXXX XXXXX",
        },
        {
          id: 2,
          name: "Strength Training Area",
          description: "This arena is designed for dynamic and explosive training sessions that improve speed, mobility, coordination, and athletic performance using bodyweight and free...",
          image: "https://via.placeholder.com/800x600/ea580c/ffffff?text=Strength+Training",
          amenities: ["Dumbbells", "Barbells", "Weight Machines", "Benches"],
          hours: "6 AM - 11 PM",
          contact: "+91 XXXXX XXXXX",
        },
        {
          id: 3,
          name: "Cardio Zone",
          description: "State-of-the-art cardio equipment for endurance training and conditioning with advanced fitness tracking systems.",
          image: "https://via.placeholder.com/800x600/0891b2/ffffff?text=Cardio+Zone",
          amenities: ["Treadmills", "Cyclists", "Rowing Machines", "Ellipticals"],
          hours: "6 AM - 11 PM",
          contact: "+91 XXXXX XXXXX",
        },
        {
          id: 4,
          name: "Yoga & Meditation",
          description: "Peaceful space for yoga and meditation classes with experienced instructors and serene environment.",
          image: "https://via.placeholder.com/800x600/a855f7/ffffff?text=Yoga+Meditation",
          amenities: ["Yoga Mats", "Professional Instructors", "Meditation Room", "Classes"],
          hours: "6 AM - 9 PM",
          contact: "+91 XXXXX XXXXX",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Gym Facilities</h1>
        <p className="text-white/70 text-lg">
          Explore our world-class fitness facilities and amenities
        </p>
      </div>

      {/* FACILITIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {facilities.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            onClick={() => setSelectedFacility(facility)}
          />
        ))}
      </div>

      {/* FACILITY DETAILS MODAL */}
      {selectedFacility && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedFacility(null)}
        >
          <div
            className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] border border-red-600/30 rounded-3xl overflow-hidden w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL IMAGE */}
            <div className="relative h-80 overflow-hidden bg-gradient-to-br from-red-900/20 to-black">
              {/* Loading State */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/70 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                </div>
              )}

              {/* Image */}
              {makeImageUrl(selectedFacility.image) && (
                <img
                  src={makeImageUrl(selectedFacility.image)}
                  alt={selectedFacility.name}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  crossOrigin="anonymous"
                />
              )}

              {/* Fallback Gradient */}
              {!makeImageUrl(selectedFacility.image) && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/40 via-purple-600/30 to-black/80"></div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c29] via-transparent to-transparent"></div>

              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedFacility(null)}
                className="absolute top-4 right-4 p-2 bg-red-600/20 hover:bg-red-600 rounded-full transition-colors border border-red-600"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-8 space-y-6">
              {/* TITLE & DESCRIPTION */}
              <div>
                <h2 className="text-4xl font-bold text-white mb-3">{selectedFacility.name}</h2>
                <p className="text-white/80 text-lg leading-relaxed">{selectedFacility.description}</p>
              </div>

              {/* AMENITIES */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Key Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedFacility.amenities?.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-600/20 rounded-xl flex items-center gap-3 hover:border-red-600/50 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                      <span className="text-white font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* INFO GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-600/20 rounded-lg border border-red-600/30">
                    <Clock className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Operating Hours</p>
                    <p className="text-white font-semibold text-lg">{selectedFacility.hours || "6 AM - 11 PM"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-600/20 rounded-lg border border-red-600/30">
                    <Phone className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Contact</p>
                    <p className="text-white font-semibold text-lg">{selectedFacility.contact || "+91 XXXXX XXXXX"}</p>
                  </div>
                </div>
              </div>

              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedFacility(null)}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATIONS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Facilities;