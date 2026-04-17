import React, { useEffect, useState } from "react";
import PageContainer from "../../Components/PageContainer";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import cache from "../../cache";
import { useAdminFilter, buildAdminFilteredUrl } from "../../utils/useAdminFilter";

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [availableDurations, setAvailableDurations] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { adminId, isFiltered, loading: adminLoading } = useAdminFilter();

  /* ================= FETCH PLANS ================= */
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchPlans = async () => {
      // For filtered view (members), don't use cache to ensure fresh data
      const cacheKey = isFiltered ? null : "plans";
      
      if (cacheKey && cache[cacheKey]) {
        setServices(cache[cacheKey]);
        return; // Use cache and exit
      }

      try {
        // Build URL with admin filter if member
        const url = buildAdminFilteredUrl("/plans", adminId);
        
        const res = await api.get(url, {
          signal: abortController.signal
        });
        const plans = Array.isArray(res.data) ? res.data : [];

        setServices(plans);
        if (cacheKey) {
          cache[cacheKey] = plans; // Cache only if not filtered
        }

        const durations = [
          ...new Set(plans.map((p) => p.duration || p.duration_months)),
        ];
        setAvailableDurations(durations);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error(err);
        }
      }
    };

    // Wait for admin filter to load before fetching
    if (adminLoading) {
      return;
    }
    
    fetchPlans();
    
    return () => abortController.abort();
  }, [adminId, isFiltered, adminLoading]);

  /* ================= FILTER ================= */
  const filtered = services.filter((s) => {
    // Duration filter
    const duration = String(s.duration || s.duration_months || "");
    const durationMatch = selectedDuration === "ALL" || duration === String(selectedDuration);
    
    // Price range filter
    const price = Number(s.final_price ?? s.price ?? 0);
    const priceMatch = price >= priceRange.min && price <= priceRange.max;
    
    // Category filter
    const categoryMatch = selectedCategory === "ALL" || 
      (s.category && String(s.category).toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (s.type && String(s.type).toLowerCase().includes(selectedCategory.toLowerCase()));
    
    // Search filter
    const searchMatch = searchTerm === "" || 
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return durationMatch && priceMatch && categoryMatch && searchMatch;
  }).sort((a, b) => {
    const priceA = Number(a.final_price ?? a.price ?? 0);
    const priceB = Number(b.final_price ?? b.price ?? 0);
    return priceA - priceB;
  });
  
  // Get unique categories
  const availableCategories = [
    ...new Set(
      services
        .map((s) => s.category || s.type)
        .filter(Boolean)
        .map(String)
    ),
  ];

  /* ================= ACTIVE PLAN ================= */
  useEffect(() => {
    if (!user?.id) {
      setCheckingPlan(false);
      return;
    }

    const abortController = new AbortController();
    
    const check = async () => {
      try {
        const res = await api.get(`/memberships/user/${user.id}`, {
          signal: abortController.signal
        });
        const active = res.data?.some((p) => p.status === "active");
        setHasActivePlan(active);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error(err);
        }
      } finally {
        setCheckingPlan(false);
      }
    };

    check();
    return () => abortController.abort();
  }, [user?.id]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden">

      {/* ================= FILTER SECTION ================= */}
      <div className="my-10 space-y-4">
        {/* Search Bar */}
        <div className="px-4">
          <input
            type="text"
            placeholder="Search plans by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Duration Filter */}
        <div className="overflow-x-auto">
          <div className="flex gap-4 px-4 max-w-full overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedDuration("ALL")}
              className={`px-6 py-2 rounded-full text-sm transition whitespace-nowrap ${
                selectedDuration === "ALL"
                  ? "bg-orange-500 text-black"
                  : "border border-orange-500 text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              All Duration
            </button>

            {availableDurations.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`px-6 py-2 rounded-full text-sm transition whitespace-nowrap ${
                  selectedDuration === d
                    ? "bg-orange-500 text-black shadow-[0_0_15px_orange]"
                    : "border border-orange-500 text-orange-400 hover:bg-orange-500/10"
                }`}
              >
                {d} months
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="px-4 flex gap-4 items-center flex-wrap">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 rounded-full text-sm border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Filters
          </button>
          
          {showAdvanced && (
            <>
              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Price Range Filter */}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  className="w-24 px-2 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                  placeholder="Min price"
                />
                <span className="text-white/40">-</span>
                <input
                  type="number"
                  min="0"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  className="w-24 px-2 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                  placeholder="Max price"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setSelectedDuration("ALL");
                  setSelectedCategory("ALL");
                  setPriceRange({ min: 0, max: 10000 });
                  setSearchTerm("");
                }}
                className="px-3 py-2 rounded-lg text-sm bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition"
              >
                Reset All
              </button>
            </>
          )}
        </div>

        {/* Results Count */}
        <div className="px-4 text-sm text-white/60">
          Showing <span className="text-orange-400 font-semibold">{filtered.length}</span> plan{filtered.length !== 1 ? "s" : ""}
          {services.length > filtered.length && ` out of ${services.length}`}
        </div>
      </div>

      {/* ================= CARDS ================= */}
      <PageContainer>
        <div className="grid md:grid-cols-3 gap-8">
          {filtered.map((service, index) => {
            const price = service.final_price ?? service.price;
            const original = service.price;

            return (
              <div
                key={service.id}
                
                
                className="
                  relative rounded-2xl p-[1px]
                  bg-gradient-to-br from-orange-500/60 via-transparent to-orange-500/60
                "
              >
                <div className="bg-black rounded-2xl p-7 h-full flex flex-col">

                  {/* TITLE */}
                  <h3 className="text-orange-500 text-2xl font-semibold mb-2">
                    {service.name}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                    {service.description}
                  </p>

                  {/* PRICE */}
                  <div className="mb-6">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-orange-400 drop-shadow-[0_0_10px_orange]">
                        ₹{price}
                      </span>
                      <span className="text-gray-400 text-sm">
                        / {service.duration || "month"}
                      </span>
                    </div>

                    {original && original !== price && (
                      <div className="text-gray-500 line-through text-sm mt-1">
                        ₹{original}
                      </div>
                    )}
                  </div>

                  {/* FEATURES */}
                  <ul className="flex-1 space-y-3 text-sm text-gray-300">
                    {(service.facilities || []).filter((_, i) => i < 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_orange]"></span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* BUTTON */}
                  <button
                    disabled={hasActivePlan || checkingPlan}
                    onClick={() => {
                      if (!user) return navigate("/login");

                      if (hasActivePlan) {
                        alert("Already active plan");
                        return;
                      }

                      navigate("/user/buynow", {
                        state: { plan: service },
                      });
                    }}
                    className={`
                      mt-8 py-3 rounded-full font-semibold transition
                      ${
                        hasActivePlan
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_20px_orange]"
                      }
                    `}
                  >
                    {hasActivePlan ? "PLAN ACTIVE" : "CHOOSE PLAN"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
};

export default Pricing;