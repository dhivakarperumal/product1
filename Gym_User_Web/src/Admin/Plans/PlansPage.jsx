import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import cache from "../../cache";

import api from "../../api";
const API = `/plans`;

/* ================= STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30";

/* ================= COMPONENT ================= */
const PlansAll = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  const loadPlans = async () => {
    if (cache.plans) {
      setPlans(cache.plans.map((p) => ({ id: p.id, ...p })));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get(API);
      const data = res.data || [];
      const mappedData = data.map((p) => ({ id: p.id, ...p }));
      setPlans(mappedData);
      cache.plans = mappedData;
    } catch (err) {
      console.error(err);
      if (!cache.plans) toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  /* ================= TOGGLE STATUS ================= */
  const toggleStatus = async (id, active) => {
    try {
      const res = await api.put(`${API}/${id}`, { active: !active });
      
      if (res.status !== 200) {
        toast.error("Failed to update plan");
        return;
      }

      toast.success("Plan status updated ✅");
      loadPlans();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  /* ================= FILTER ================= */
  const filteredPlans = plans.filter((p) => {
    const matchSearch = p.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus =
      filter === "all" ||
      (filter === "active" && p.active) ||
      (filter === "inactive" && !p.active);

    return matchSearch && matchStatus;
  });

  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.active).length;

  return (
    <div className="min-h-screen  p-0 text-white space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

        <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
          Gym Membership Plans
        </h2>

        <button
          onClick={() => navigate("/admin/addplan")}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl text-white font-semibold
    bg-gradient-to-r from-orange-500 to-orange-600 
    hover:scale-105 transition shadow-lg flex items-center justify-center"
        >
          <FaPlus className="mr-2" />
          Add Plan
        </button>

      </div>


      {/* STATS */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className={`${glassCard} p-5`}>
          <p className="text-sm text-gray-300">Total Plans</p>
          <h3 className="text-3xl font-bold">{totalPlans}</h3>
        </div>

        <div className={`${glassCard} p-5`}>
          <p className="text-sm text-gray-300">Active Plans</p>
          <h3 className="text-3xl font-bold text-emerald-400">
            {activePlans}
          </h3>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div
        className={`${glassCard} p-4 flex flex-col md:flex-row items-center justify-between gap-4`}
      >
        {/* LEFT — SEARCH */}
        <div className="relative w-full md:w-1/3">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${glassInput} pl-11`}
          />
        </div>

        {/* RIGHT — FILTER */}
        <div className="w-full md:w-1/4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={glassInput}
          >
            <option value="all">All Plans</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>


      {/* PLANS LIST */}
      {loading && !cache.plans ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/5 rounded-3xl border border-white/10 mt-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Syncing Growth Tiers</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <p className="text-center text-gray-400">No plans found</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredPlans.map((p) => (
            <div key={p.id} className={`${glassCard} p-6 space-y-3`}>

              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{p.name}</h3>

                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold
                    ${p.active
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-gray-500/20 text-gray-400"
                    }`}
                >
                  {p.active ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-gray-300 text-sm">
                Duration: <span className="font-medium">{p.duration}</span>
              </p>

              <p className="text-gray-300 text-sm">
                Price: ₹{p.finalPrice ?? p.final_price ?? p.price}{" "}
                {p.discount > 0 && (
                  <span className="text-xs text-emerald-400">
                    ({p.discount}% OFF)
                  </span>
                )}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                {p.facilities?.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-1 rounded bg-white/10"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => navigate(`/admin/addplan/${p.id}`)}
                  className="p-2 rounded-lg bg-yellow-500/80 hover:bg-yellow-500"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => toggleStatus(p.id, p.active)}
                  className={`p-2 rounded-lg ${p.active
                      ? "bg-red-500/80 hover:bg-red-500"
                      : "bg-emerald-500/80 hover:bg-emerald-500"
                    }`}
                >
                  {p.active ? <FaToggleOff /> : <FaToggleOn />}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansAll;
