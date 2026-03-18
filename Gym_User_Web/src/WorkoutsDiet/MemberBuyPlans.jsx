import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/PrivateRouter/AuthContext";
import api from "../../src/api";
import { Trash2 } from "lucide-react";

const MemberSBuyPlans = ({ preFetchedPlans }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState(preFetchedPlans || []);
  const [loading, setLoading] = useState(!preFetchedPlans);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/products");
        const list = Array.isArray(res.data) ? res.data : [];
        setFeaturedProducts(list.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchFeatured();

    if (!user?.id || preFetchedPlans) return;

    const fetchMemberships = async () => {
      try {
        const res = await api.get(`/memberships/user/${user.id}`);

        setPlans(res.data || []);
      } catch (err) {
        console.error("Failed to fetch memberships", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [user, preFetchedPlans]);

const handleDelete = async (plan) => {
  const confirmDelete = window.confirm("Delete this plan?");
  if (!confirmDelete) return;

  try {
    await api.delete(`/memberships/${plan.id}`);

    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
  } catch (err) {
  console.log(err.response?.data);
  alert("Delete failed");
}
  
};

  return (
    <>
      <div className="bg-black text-white min-h-screen py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-red-500">
            My Plans
          </h2>

          <p className="text-gray-400 mt-2">
            Your purchased membership plans
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-4 bg-gray-800 w-32 mb-4 rounded"></div>
              <div className="h-2 bg-gray-800 w-48 rounded"></div>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center p-12 bg-gray-900/50 rounded-2xl border border-red-500/10 max-w-2xl mx-auto">
            <h2 className="text-xl text-red-500 font-bold">
              No Active Plans
            </h2>
            <p className="text-gray-400 mt-2">
              Unlock your full potential with our premium membership plans.
            </p>
            <button
              onClick={() => navigate("/pricing")}
              className="mt-6 bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-bold transition shadow-lg shadow-red-600/20"
            >
              🚀 Explore Plans
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 px-4">
            {plans.map((plan) => {
              const price = Number(plan.pricePaid || 0);
              const start = new Date(plan.startDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
              const end = new Date(plan.endDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
              const isExpired = new Date(plan.endDate) < new Date();

              return (
                <div
                  key={plan.id}
                  className="group relative bg-gradient-to-br from-gray-900 to-black border border-red-500/20 p-8 rounded-2xl transition hover:border-red-500/40 shadow-xl"
                >
                  <button
                    onClick={() => handleDelete(plan)}
                    className={`absolute top-6 right-6 p-2 rounded-full transition ${isExpired
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
                        : "text-gray-700 cursor-not-allowed opacity-30"
                      }`}
                    title={isExpired ? "Remove expired plan" : "Active plans cannot be deleted"}
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-white group-hover:text-red-500 transition">
                      {plan.planName}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${isExpired
                        ? "bg-gray-800 text-gray-400"
                        : "bg-red-600 text-white animate-pulse"
                        }`}
                    >
                      {isExpired ? "EXPIRED" : plan.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">₹{price.toLocaleString("en-IN")}</span>
                      <span className="text-sm text-gray-400">/ {plan.duration}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Started On</p>
                        <p className="text-sm text-gray-200">{start}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Expires On</p>
                        <p className="text-sm text-gray-200">{end}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FEATURED PRODUCTS SECTION ("products all show") */}
        <div className="mt-24 px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white">Supplements & Gear</h3>
              <p className="text-gray-400 text-sm">Boost your performance with our top-rated products</p>
            </div>
            <button 
              onClick={() => navigate("/products")}
              className="text-red-500 font-bold hover:underline text-sm"
            >
              View Shop
            </button>
          </div>
          
          {/* We'll just show a couple of placeholders or fetch them if needed */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  onClick={() => navigate("/products")}
                  className="bg-gray-900/40 border border-white/5 p-4 rounded-xl text-center cursor-pointer hover:border-red-500/30 transition group"
                >
                  <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 overflow-hidden">
                    <img 
                      src={prod.image || prod.images?.[0] || "https://via.placeholder.com/150"} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      alt={prod.name}
                    />
                  </div>
                  <p className="text-sm font-bold text-white truncate">{prod.name}</p>
                  <p className="text-xs text-red-500 font-black mt-1">
                    ₹{prod.offer_price || prod.offerPrice || prod.mrp || "0"}
                  </p>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900/40 border border-white/5 p-4 rounded-xl text-center">
                  <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 animate-pulse"></div>
                  <div className="h-3 bg-gray-800 w-2/3 mx-auto mb-2 rounded"></div>
                  <div className="h-2 bg-gray-800 w-1/3 mx-auto rounded"></div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </>
  );
};

export default MemberSBuyPlans;