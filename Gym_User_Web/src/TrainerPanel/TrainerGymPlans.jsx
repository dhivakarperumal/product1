import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api";

const API = "/plans";

const TrainerGymPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get(API);
      const data = res.data || [];
      setPlans(data.map((plan) => ({ id: plan.id, ...plan })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load gym plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center text-white">
        <p className="text-lg">Loading gym plans…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
          <p className="text-sm uppercase tracking-[0.3em] text-orange-300/80">Gym Plan</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Membership Plans</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Browse the available gym plans. Trainers can view plan details here, but cannot add or edit plans from this panel.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-8 text-center text-slate-300">
              No plans available.
            </div>
          ) : (
            plans.map((plan) => {
              const price = plan.finalPrice ?? plan.final_price ?? plan.price ?? 0;
              const originalPrice = plan.price ?? plan.original_price ?? null;
              const duration = plan.duration || plan.duration_months || "1 Month";
              const features = plan.facilities || plan.features || [];
              const isActive = plan.active ?? true;

              return (
                <div
                  key={plan.id}
                  className="group overflow-hidden rounded-[28px] border border-orange-500/20 bg-slate-950/80 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] transition hover:-translate-y-1"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-orange-400">{plan.name}</h2>
                      <p className="mt-2 text-sm text-slate-400">{plan.subtitle || plan.description || "Gym membership plan"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-700/80 text-slate-300"}`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mb-8 rounded-3xl bg-black/70 p-6 text-center shadow-[inset_0_0_40px_rgba(249,115,22,0.12)]">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">{duration}</p>
                    <div className="mt-4 flex items-end justify-center gap-3">
                      <span className="text-5xl font-extrabold text-orange-400 drop-shadow-[0_0_18px_rgba(249,115,22,0.5)]">₹{price}</span>
                      <span className="text-sm text-slate-400">/ {typeof duration === "number" ? `${duration} Month${duration > 1 ? "s" : ""}` : duration}</span>
                    </div>
                    {originalPrice && originalPrice !== price && (
                      <p className="mt-3 text-sm text-slate-400 line-through">₹{originalPrice}</p>
                    )}
                  </div>

                  <ul className="space-y-3 text-slate-200">
                    {(features.length > 0 ? features : ["No plan features available"]).slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.35)]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerGymPlans;
