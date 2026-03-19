import { useState, useEffect } from "react";
import { Heart, TrendingUp } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

const HealthSettings = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState([]);
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: userProfile?.age || "",
    fitnessGoal: userProfile?.fitnessGoal || "general",
  });

  useEffect(() => {
    fetchHealthMetrics();
  }, [user?.id]);

  const fetchHealthMetrics = async () => {
    try {
      const res = await api.get(`/users/${user?.id}/health-metrics`);
      setMetrics(res.data || []);
      if (res.data && res.data.length > 0) {
        const latest = res.data[0];
        setFormData({
          weight: latest.weight || "",
          height: latest.height || "",
          age: userProfile?.age || "",
          fitnessGoal: userProfile?.fitnessGoal || "general",
        });
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMetric = async (e) => {
    e.preventDefault();

    if (!formData.weight || !formData.height) {
      toast.error("Weight and Height are required");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/users/${user?.id}/health-metrics`, {
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        age: parseInt(formData.age) || null,
        fitnessGoal: formData.fitnessGoal,
      });
      toast.success("Health metrics updated successfully!");
      setFormData({ weight: "", height: "", age: formData.age, fitnessGoal: "general" });
      fetchHealthMetrics();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update metrics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">Health Metrics</h2>
        <p className="text-white/60 mt-1">
          Track and manage your fitness and health information
        </p>
      </div>

      {/* ADD/UPDATE METRICS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" /> Update Health Information
        </h3>

        <form onSubmit={handleAddMetric} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weight */}
            <div>
              <label className="text-sm font-semibold text-white/80 mb-2 block">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.1"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter weight"
                required
              />
            </div>

            {/* Height */}
            <div>
              <label className="text-sm font-semibold text-white/80 mb-2 block">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                step="0.1"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter height"
                required
              />
            </div>

            {/* Age */}
            <div>
              <label className="text-sm font-semibold text-white/80 mb-2 block">Age (years)</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter age"
              />
            </div>

            {/* Fitness Goal */}
            <div>
              <label className="text-sm font-semibold text-white/80 mb-2 block">Fitness Goal</label>
              <select
                name="fitnessGoal"
                value={formData.fitnessGoal}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="weight-loss">Weight Loss</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="maintain">Maintain Weight</option>
                <option value="endurance">Improve Endurance</option>
                <option value="flexibility">Increase Flexibility</option>
                <option value="general">General Fitness</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:scale-105 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Metrics"}
          </button>
        </form>
      </div>

      {/* METRICS HISTORY */}
      {metrics.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" /> Metrics History
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {metrics.map((metric, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-white/60">
                      {new Date(metric.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-white">Weight: <span className="font-bold text-orange-400">{metric.weight} kg</span></p>
                      <p className="text-white">Height: <span className="font-bold text-orange-400">{metric.height} cm</span></p>
                      {metric.age && <p className="text-white">Age: <span className="font-bold text-orange-400">{metric.age}</span></p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFO */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Health Tips</h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Regular updates help track your progress
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Measure weight at the same time each day
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Keep a record of your fitness journey
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Consult with trainers for personalized guidance
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HealthSettings;
