import React, { useEffect, useState } from "react";
import { MapPin, Wifi, Clock, Phone, Mail, DollarSign, ChevronRight } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await api.get("/facilities");
      setFacilities(res.data || []);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toast.error("Failed to load facilities");
      // Mock data for demo
      setFacilities([
        {
          id: 1,
          name: "Gym Equipment",
          description: "State-of-the-art fitness equipment for all levels",
          amenities: ["Dumbbells", "Treadmills", "Benches", "Barbells"],
        },
        {
          id: 2,
          name: "Swimming Pool",
          description: "Olympic-size swimming pool with expert coaching",
          amenities: ["Olympic Pool", "Swimming Classes", "Life Guards"],
        },
        {
          id: 3,
          name: "Yoga Studio",
          description: "Peaceful space for yoga and meditation classes",
          amenities: ["Yoga Mats", "Professional Instructors", "Meditation Room"],
        },
        {
          id: 4,
          name: "Sauna & Spa",
          description: "Relax and rejuvenate in our sauna and spa facilities",
          amenities: ["Sauna", "Steam Room", "Massage Therapy"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">Gym Facilities</h2>
        <p className="text-white/60 mt-1">
          Explore all our amazing facilities and amenities
        </p>
      </div>

      {/* FACILITIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition cursor-pointer"
            onClick={() => setSelectedFacility(facility)}
          >
            {/* FACILITY CARD */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{facility.name}</h3>
                  <p className="text-white/60 text-sm mt-1">{facility.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-500" />
              </div>

              {/* AMENITIES */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/80 uppercase">Key Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {facility.amenities?.slice(0, 3).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-400"
                    >
                      {amenity}
                    </span>
                  ))}
                  {facility.amenities?.length > 3 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/60">
                      +{facility.amenities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FACILITY DETAILS MODAL */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedFacility.name}</h2>
                <p className="text-white/60 mt-2">{selectedFacility.description}</p>
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* AMENITIES LIST */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Available Amenities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedFacility.amenities?.map((amenity, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Wifi className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-white">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FACILITY INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-white/60 text-sm">Operating Hours</p>
                  <p className="text-white font-semibold">6 AM - 11 PM Daily</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-white/60 text-sm">Contact</p>
                  <p className="text-white font-semibold">+91 XXXXX XXXXX</p>
                </div>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedFacility(null)}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:scale-105 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facilities;