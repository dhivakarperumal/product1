import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import PricingCard from "../../Components/PricingCard";

const BuyNow = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profileName } = useAuth();

  const plan = state?.plan;

  const today = new Date().toISOString().split("T")[0];

  const price = Number(plan?.final_price || 0);

  const [form, setForm] = useState({
    name: profileName || user?.username || "",
    email: user?.email || "",
    phone: "",
    address: "",
    startDate: today,
    endDate: "",
  });

  /* ================= PAGE PROTECTION ================= */

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { message: "Please login to purchase a plan" },
      });
    }

    if (!plan) {
      navigate("/pricing");
    }
  }, [user, plan, navigate]);

  /* ================= FETCH USER PROFILE ================= */

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/users/${user.id}`);

        if (res.data) {
          setForm((prev) => ({
            ...prev,
            phone: res.data.mobile || "",
            name: res.data.username || prev.name,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchUserProfile();
  }, [user]);

  /* ================= CALCULATE END DATE ================= */

  const getDaysFromDuration = (duration) => {
    const number = parseInt(duration);
    return number * 30;
  };

  useEffect(() => {
    if (!plan) return;

    const days = getDaysFromDuration(plan.duration);

    const start = new Date(form.startDate);
    const end = new Date(start);

    end.setDate(start.getDate() + days);

    setForm((prev) => ({
      ...prev,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [form.startDate, plan]);

  /* ================= LOAD RAZORPAY ================= */

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  /* ================= PAYMENT ================= */

  const handlePayment = async () => {
    if (!form.address) {
      alert("Please enter valid mobile number and address");
      return;
    }

    const razorpayLoaded = await loadRazorpay();

    if (!razorpayLoaded) {
      alert("Razorpay SDK failed to load");
      return;
    }

    const options = {
      key: "rzp_test_2ORD27rb7vGhwj",
      amount: price * 100,
      currency: "INR",
      name: "Gym Membership",
      description: plan?.name || "Membership",

      handler: async (response) => {
        try {
          await api.post("/memberships", {
            userId: user.id,
            planId: plan.id,
            planName: plan.name,
            pricePaid: price,
            duration: plan.duration,
            startDate: form.startDate,
            endDate: form.endDate,
            paymentId: response.razorpay_payment_id,
            status: "active",
          });

          navigate("/account", {
            state: { tab: "plans" },
          });

        } catch (err) {
          console.error("Plan save error:", err);
          alert("Payment successful but failed to save plan.");
        }
      },

      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone,
      },

      theme: {
        color: "#dc2626",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (!plan) {
    return (
      <div className="text-white text-center p-10">
        Plan not found. Please return to pricing page.
      </div>
    );
  }

  return (
    <>
      <div className="text-white min-h-screen px-3">
       

          <div className="py-10">

            <h1 className="text-3xl font-bold mb-6">
              Buy Membership Plan
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

              {/* FORM */}

              <div>

                <div className="bg-black/80 border border-orange-500/40 rounded-2xl p-6">

                  <p className="text-white/60 mb-3 text-sm">
                    Enter your details to complete enrollment
                  </p>

                  <div className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">

                      <input
                        value={form.name}
                        readOnly
                        className="p-3 bg-gray-900 rounded-lg"
                      />

                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={form.phone}
                        maxLength={10}
                        className="p-3 bg-gray-900 rounded-lg"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, phone: value });
                        }}
                      />

                    </div>

                    <input
                      value={form.email}
                      readOnly
                      className="w-full p-3 bg-gray-900 rounded-lg"
                    />

                    <textarea
                      placeholder="Address"
                      rows={3}
                      value={form.address}
                      className="w-full p-3 bg-gray-900 rounded-lg"
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />

                    <div className="grid grid-cols-2 gap-4">

                      <input
                        type="date"
                        min={today}
                        value={form.startDate}
                        className="p-3 bg-gray-900 rounded-lg"
                        onChange={(e) =>
                          setForm({
                            ...form,
                            startDate: e.target.value,
                          })
                        }
                      />

                      <input
                        type="date"
                        value={form.endDate}
                        readOnly
                        className="p-3 bg-gray-900 rounded-lg"
                      />

                    </div>

                    {/* PLAN PRICE */}

                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Plan Price</p>

                      <p className="text-2xl font-bold text-orange-500">
                        ₹{price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* PAY BUTTON */}

                    <button
                      onClick={handlePayment}
                      className="w-full mt-6 bg-orange-600 hover:bg-orange-700 py-3 rounded-full font-semibold"
                    >
                      Pay ₹{price.toLocaleString("en-IN")}
                    </button>

                  </div>

                </div>

              </div>

              {/* PLAN CARD */}

              <div className="flex justify-center">

                <PricingCard
                  service={plan}
                  index={0}
                  hasActivePlan={false}
                  checkingPlan={false}
                  onChoose={() => {}}
                />

              </div>

            </div>

          </div>

       
      </div>
    </>
  );
};

export default BuyNow;