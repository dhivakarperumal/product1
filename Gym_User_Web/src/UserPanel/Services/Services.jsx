import React, { useEffect, useState } from "react";
import { Briefcase, Star, Phone, Users, Clock, ChevronRight, X } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(res.data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      // Mock data for demo
      setServices([
        {
          id: 1,
          name: "Personal Training",
          description: "One-on-one personalized fitness coaching",
          price: "₹500/session",
          duration: "60 minutes",
          rating: 4.8,
          trainer: "John Doe",
          features: ["Custom Workout Plans", "Nutrition Guidance", "Progress Tracking", "Flexible Timing"],
        },
        {
          id: 2,
          name: "Nutrition Counseling",
          description: "Professional diet planning and nutritional guidance",
          price: "₹1,000/session",
          duration: "45 minutes",
          rating: 4.7,
          trainer: "Sarah Johnson",
          features: ["Meal Planning", "Calorie Counting", "Supplement Advice", "Follow-up Support"],
        },
        {
          id: 3,
          name: "Group Classes",
          description: "Dynamic group fitness classes for all levels",
          price: "₹200/class",
          duration: "60 minutes",
          rating: 4.6,
          trainer: "Multiple Trainers",
          features: ["Zumba", "CrossFit", "Yoga", "Pilates", "Cardio Kickboxing"],
        },
        {
          id: 4,
          name: "Injury Recovery",
          description: "Specialized rehabilitation and injury recovery programs",
          price: "₹800/session",
          duration: "60 minutes",
          rating: 4.9,
          trainer: "Dr. Mike Smith",
          features: ["Assessment", "Recovery Plans", "Pain Management", "Return to Fitness"],
        },
        {
          id: 5,
          name: "Sports Performance",
          description: "Training for athletes and sports enthusiasts",
          price: "₹1,200/session",
          duration: "90 minutes",
          rating: 4.9,
          trainer: "Alex Thompson",
          features: ["Sport-Specific Training", "Strength & Conditioning", "Agility Work", "Mental Coaching"],
        },
        {
          id: 6,
          name: "Corporate Wellness",
          description: "On-site fitness programs for corporate clients",
          price: "Custom Pricing",
          duration: "Flexible",
          rating: 4.7,
          trainer: "Team Lead",
          features: ["Desk Workouts", "Stress Management", "Team Building", "Health Seminars"],
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
          <p className="text-white">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">Our Services</h2>
        <p className="text-white/60 mt-1">
          Explore our professional fitness and wellness services
        </p>
      </div>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition cursor-pointer"
            onClick={() => setSelectedService(service)}
          >
            {/* SERVICE CARD */}
            <div className="p-6">
              {/* HEADER */}
              <div className="flex items-start justify-between mb-3">
                <Briefcase className="w-6 h-6 text-orange-500" />
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-white">{service.rating}</span>
                </div>
              </div>

              {/* TITLE & DESCRIPTION */}
              <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
              <p className="text-white/60 text-sm mb-4">{service.description}</p>

              {/* INFO */}
              <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="w-4 h-4 text-orange-500" />
                  {service.duration}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Users className="w-4 h-4 text-orange-500" />
                  {service.trainer}
                </div>
                <div className="text-lg font-bold text-orange-400">{service.price}</div>
              </div>

              {/* FEATURES */}
              <div className="flex flex-wrap gap-1 mb-4">
                {service.features?.slice(0, 2).map((feature, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                    {feature}
                  </span>
                ))}
                {service.features?.length > 2 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                    +{service.features.length - 2} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-white/50">Click for details</span>
                <ChevronRight className="w-4 h-4 text-orange-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SERVICE DETAILS MODAL */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedService.name}</h2>
                <p className="text-white/60 mt-2">{selectedService.description}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* SERVICE INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white/60 text-xs mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Duration
                </p>
                <p className="text-white font-semibold">{selectedService.duration}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Trainer
                </p>
                <p className="text-white font-semibold">{selectedService.trainer}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Rating
                </p>
                <p className="text-white font-semibold flex items-center gap-1">
                  {selectedService.rating}
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Price</p>
                <p className="text-2xl font-bold text-orange-400">{selectedService.price}</p>
              </div>
            </div>

            {/* FEATURES */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">What's Included</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedService.features?.map((feature, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Briefcase className="w-3 h-3 text-orange-400" />
                    </div>
                    <span className="text-white text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BOOKING SECTION */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6">
              <p className="text-white/80 text-sm mb-4">
                Ready to get started? Book a session with us today and transform your fitness journey!
              </p>
              <button className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:scale-105 transition">
                Book Now
              </button>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedService(null)}
              className="w-full px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
