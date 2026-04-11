import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaCalendar,
  FaDollarSign,
  FaUsers,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import cache from "../../cache";

import api from "../../api";
const API = `/plans`;

/* ================= STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.25)]";
const glassInput =
  "bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white placeholder-slate-400 shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

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
  const inactivePlans = plans.length - activePlans;
  const avgPrice = plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + (p.finalPrice || p.final_price || p.price || 0), 0) / plans.length) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-xl">Loading plans…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className={`${glassCard} p-8`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/admin/addplan")}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                <FaPlus className="mr-2 h-4 w-4" /> Add Plan
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <FaCalendar className="h-8 w-8 text-orange-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total plans</p>
                  <p className="mt-2 text-3xl font-bold text-white">{totalPlans}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">All membership tiers.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <FaCheckCircle className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Active plans</p>
                  <p className="mt-2 text-3xl font-bold text-white">{activePlans}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Currently available.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <FaUsers className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Inactive plans</p>
                  <p className="mt-2 text-3xl font-bold text-white">{inactivePlans}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Temporarily disabled.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <FaDollarSign className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Avg price</p>
                  <p className="mt-2 text-3xl font-bold text-white">₹{avgPrice}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Average plan cost.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className={`${glassCard} overflow-hidden`}>
            <div className="border-b border-white/10 bg-slate-950/80 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-300/80">Membership plans</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Manage plans</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative w-full sm:w-72">
                    <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search plans..."
                      className={`pl-11 ${glassInput}`}
                    />
                  </div>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className={glassInput}>
                    <option value="all">All Plans</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default PlansAll;
