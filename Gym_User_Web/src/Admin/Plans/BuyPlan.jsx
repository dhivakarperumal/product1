import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../../api";

const MEMBERS_API = "/members";
const PLANS_API = "/plans";
const MEMBERSHIP_API = "/memberships";

const BuyPlanadmin = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [sessionTime, setSessionTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const createInitialForm = () => ({
    phone: "",
    email: "",
    address: "",
    height: "",
    weight: "",
    bmi: "",
    startDate: today,
    endDate: "",
    paymentMode: "cash",
  });

  const [form, setForm] = useState(createInitialForm());

  const resetBuyPlanForm = () => {
    setSelectedUser(null);
    setSelectedPlan(null);
    setSelectedTrainer(null);
    setSessionTime("");
    setForm(createInitialForm());
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get(MEMBERS_API);
      console.log('Fetched members from API:', res.data);
      console.log('Sample member fields:', res.data?.[0] ? Object.keys(res.data[0]) : 'No members');
      setMembers(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load members");
    }
  };

  // ================= FETCH MEMBERS =================
  useEffect(() => {
    fetchMembers();
  }, []);

  // ================= FETCH PLANS =================
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get(PLANS_API);
        setPlans((res.data || []).filter((p) => p.active));
      } catch (err) {
        console.error(err);
        alert("Failed to load plans");
      }
    };

    fetchPlans();
  }, []);

  // ================= FETCH TRAINERS =================
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/staff", { params: { role: "trainer" } });
        const data = res.data || [];
        const normalized = Array.isArray(data)
          ? data.map((t) => ({ id: t.id, name: t.name || t.username || "Trainer" }))
          : [];
        setTrainers(normalized);
      } catch (err) {
        console.error(err);
        alert("Failed to load trainers");
      }
    };

    fetchTrainers();
  }, []);

  // ================= CALCULATE BMI =================
  useEffect(() => {
    const h = parseFloat(form.height);
    const w = parseFloat(form.weight);
    if (h > 0 && w > 0) {
      const bmiVal = (w / ((h / 100) * (h / 100))).toFixed(2);
      setForm(prev => ({ ...prev, bmi: bmiVal }));
    }
  }, [form.height, form.weight]);

  // ================= CALCULATE END DATE =================
  useEffect(() => {
    if (!selectedPlan) return;

    const durationMonths = parseInt(selectedPlan.duration) || 0;

    const start = new Date(today);
    const end = new Date(start);

    end.setMonth(start.getMonth() + durationMonths);

    setForm((prev) => ({
      ...prev,
      startDate: today,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [selectedPlan]);

  // ================= AOS =================
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  // ================= WHATSAPP =================
  const sendWhatsApp = () => {
    if (!selectedUser || !selectedPlan) return;
    const phone = selectedUser.phone?.replace(/\D/g, "");
    if (!phone) return;

    const messageLines = [
      "Gym Membership Activated",
      "",
      `Name: ${selectedUser.name}`,
      `Phone: ${form.phone}`,
      "",
      `Plan: ${selectedPlan.name}`,
      `Duration: ${selectedPlan.duration} Months`,
      "",
      `Start Date: ${form.startDate}`,
      `End Date: ${form.endDate}`,
      "",
      `Paid: ₹${selectedPlan.finalPrice ?? selectedPlan.final_price}`,
      `Mode: ${form.paymentMode}`,
      "",
      `Height: ${form.height}`,
      `Weight: ${form.weight}`,
      `BMI: ${form.bmi}`,
      "",
      "Status: Active",
      "",
      "Thank you for joining",
    ];

    const url = `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(messageLines.join("\n"))}`;
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      newWindow.location.href = url;
      return;
    }
    window.location.href = url;
  };

  // ================= ASSIGN PLAN =================
  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlan) {
      alert("Select member and plan");
      return;
    }

    setIsSubmitting(true);

    console.log('=== ASSIGN PLAN DEBUG ===');
    console.log('selectedUser:', selectedUser);
    console.log('selectedPlan:', selectedPlan);
    console.log('selectedUser.id:', selectedUser.id, 'type:', typeof selectedUser.id);
    console.log('selectedPlan.id:', selectedPlan.id, 'type:', typeof selectedPlan.id);

    if (selectedUser.status === "active" && selectedUser.plan) {
      alert("Member already has active plan");
      return;
    }

    try {
      // ===== SAVE MEMBERSHIP HISTORY =====
      const membershipData = {
        userId: selectedUser.user_id || selectedUser.u_id || null,
        memberId: selectedUser.id,
        member_id: selectedUser.member_id || null,
        planId: selectedPlan.id,
        plan_id: selectedPlan.plan_id || null,
        planName: selectedPlan.name,
        price: parseFloat(selectedPlan.finalPrice ?? selectedPlan.final_price),
        pricePaid: parseFloat(selectedPlan.finalPrice ?? selectedPlan.final_price),
        duration: parseInt(selectedPlan.duration, 10),
        startDate: form.startDate,
        endDate: form.endDate,
        paymentMode: form.paymentMode,
        status: "active",
      };

      await api.post("/memberships", membershipData);

      // ===== UPDATE MEMBER =====
      const updatedMember = {
        name: selectedUser.name,
        phone: form.phone,
        email: form.email,
        gender: selectedUser.gender || "",
        height: form.height,
        weight: form.weight,
        bmi: form.bmi,
        plan: selectedPlan.name,
        duration: selectedPlan.duration,
        joinDate: form.startDate,
        expiryDate: form.endDate,
        status: "active",
        photo: selectedUser.photo || "",
        notes: selectedUser.notes || "",
        address: form.address,
      };

      // ===== OPTIONAL ASSIGN TRAINER =====
      if (selectedTrainer) {
        // Use user_id from users table, not member id
        const userId = selectedUser.user_id || selectedUser.u_id || null;
        const planId = selectedPlan.id;

        // Validate IDs before creating assignment (check for null/undefined)
        if (!userId || !planId) {
          console.warn("Invalid userId or planId for assignment", { 
            userId, 
            planId, 
            selectedUser, 
            selectedPlan 
          });
          console.warn("Skipping trainer assignment due to missing IDs");
        } else {
          const assignPayload = {
            userId: userId,
            username: selectedUser.username || selectedUser.name || "",
            userEmail: selectedUser.userEmail || selectedUser.email || "",
            planId: planId,
            planName: selectedPlan.name,
            planDuration: selectedPlan.duration,
            planStartDate: form.startDate,
            planEndDate: form.endDate,
            planPrice: selectedPlan.finalPrice ?? selectedPlan.final_price,
            trainerId: selectedTrainer,
            trainerName:
              trainers.find((t) => t.id === selectedTrainer)?.name || "",
            trainerSource: "staff",
            status: "active",
            sessionTime: sessionTime || null,
          };
          console.log('Sending assignment payload:', assignPayload);
          try {
            await api.post("/assignments", { assignments: [assignPayload] });
          } catch (assignErr) {
            console.error('Trainer assignment failed:', assignErr);
            alert(`Trainer assignment warning: ${assignErr?.response?.data?.error || assignErr?.message}`);
          }
        }
      }

      // create or update member with assigned plan
      try {
        if (selectedUser.id) {
          await api.put(`${MEMBERS_API}/${selectedUser.id}`, updatedMember);
        } else {
          // If no gym_member record exists, we create one
          await api.post(MEMBERS_API, updatedMember);
        }
      } catch (error) {
        const errMsg =
          error?.response?.data?.message || error?.response?.data?.error || error?.message || "Plan assign failed";
        console.error('Member update error:', errMsg);
        alert(`Member update error: ${errMsg}`);
        // Continue anyway - membership is already created
      }

      alert("Plan assigned successfully");

      resetBuyPlanForm();
      fetchMembers();
      sendWhatsApp();
    } catch (err) {
      setIsSubmitting(false);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Plan save failed";
      alert(`Error: ${errorMsg}`);
    }
  };

  return (
    <div className="text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Assign Plan</h1>

      <div className="grid md:grid-cols-2 gap-10">

        {/* LEFT FORM */}
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          {/* SELECT MEMBER */}
          <select
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg border border-white/10"
            value={selectedUser ? `${selectedUser.source}-${selectedUser.id || selectedUser.u_id}` : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setSelectedUser(null);
                return;
              }
              const [source, idStr] = val.split('-');
              const id = Number(idStr);
              const user = members.find(
                (m) => m.source === source && (m.id === id || m.u_id === id)
              );

              setSelectedUser(user);

              if (user) {
                console.log('Selected member object:', user);
                console.log('Address value:', user.address);
                setForm((prev) => ({
                  ...prev,
                  phone: user.phone || "",
                  email: user.email || "",
                  address: user.address || "",
                  height: user.height || "",
                  weight: user.weight || "",
                  bmi: user.bmi || "",
                }));
              }
            }}
          >
            <option value="">Select Member</option>

            {(() => {
              const seenPhones = new Set();
              return members
                .filter((m) => {
                  // 1. Skip if already has active plan
                  const hasPlan = m.status === "active" && m.plan;
                  if (hasPlan) return false;
                  
                  // 2. Skip duplicates by phone
                  if (seenPhones.has(m.phone)) return false;
                  seenPhones.add(m.phone);
                  
                  return true;
                })
                .map((m) => {
                  const uniqueKey = `${m.source}-${m.id || m.u_id}`;
                  return (
                    <option key={uniqueKey} value={uniqueKey}>
                      {m.name || "Unknown"} ({m.phone})
                    </option>
                  );
                });
            })()}
          </select>

          {/* PHONE */}
          <input
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            value={form.phone}
            placeholder="Phone"
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          {/* EMAIL */}
          <input
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            value={form.email}
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          {/* ADDRESS */}
          <textarea
            className="w-full p-3 mb-4 bg-gray-900 rounded-lg"
            value={form.address}
            placeholder="Address"
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />

          {/* HEIGHT WEIGHT BMI */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              className="p-3 bg-gray-900 rounded-lg"
              placeholder="Height"
              value={form.height}
              onChange={(e) =>
                setForm({ ...form, height: e.target.value })
              }
            />

            <input
              className="p-3 bg-gray-900 rounded-lg"
              placeholder="Weight"
              value={form.weight}
              onChange={(e) =>
                setForm({ ...form, weight: e.target.value })
              }
            />

            <input
              className="p-3 bg-gray-900 rounded-lg"
              placeholder="BMI"
              value={form.bmi}
              onChange={(e) =>
                setForm({ ...form, bmi: e.target.value })
              }
            />
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={form.startDate}
              readOnly
              className="p-3 bg-gray-900 rounded-lg"
            />

            <input
              type="date"
              value={form.endDate}
              readOnly
              className="p-3 bg-gray-900 rounded-lg"
            />
          </div>

          {/* PAYMENT */}
          <select
            className="w-full p-3 bg-gray-900 rounded-lg mt-4"
            value={form.paymentMode}
            onChange={(e) =>
              setForm({ ...form, paymentMode: e.target.value })
            }
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </select>

          {/* TRAINER */}
          <select
            className="w-full p-3 bg-gray-900 rounded-lg mt-4"
            value={selectedTrainer || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedTrainer(val === "" ? null : Number(val));
            }}
          >
            <option value="">Select Trainer (optional)</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* SESSION TIME */}
          <input
            type="time"
            className="w-full p-3 bg-gray-900 rounded-lg mt-4"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAssignPlan}
              disabled={isSubmitting || !selectedUser || !selectedPlan}
              className={`mt-5 w-full py-3 rounded-lg text-white ${isSubmitting || !selectedUser || !selectedPlan ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Plan '}₹
              {selectedPlan
                ? selectedPlan.finalPrice ?? selectedPlan.final_price
                : 0}
            </button>

            <button
              type="button"
              onClick={resetBuyPlanForm}
              className="w-full py-3 border border-white/20 rounded-lg text-white bg-slate-800 hover:bg-slate-700"
            >
              Reset Form
            </button>
          </div>
        </div>

        {/* RIGHT PLAN SELECT */}
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          <h2 className="text-xl mb-4">Select Plan</h2>

          <select
            className="w-full p-3 bg-gray-900 rounded-lg mb-4"
            defaultValue=""
            onChange={(e) => {
              const plan = plans.find(
                (p) => p.id === Number(e.target.value)
              );
              setSelectedPlan(plan);
            }}
          >
            <option value="">Select Plan</option>

            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.duration} months - ₹
                {p.finalPrice ?? p.final_price}
              </option>
            ))}
          </select>

          {selectedPlan && (
            <div className="p-4 border border-red-400 rounded-lg">
              <h3 className="font-bold text-lg">
                {selectedPlan.name}
              </h3>

              <p>Duration: {selectedPlan.duration} months</p>

              <p>
                Price ₹
                {selectedPlan.finalPrice ??
                  selectedPlan.final_price}
              </p>

              <p className="text-gray-300 text-sm mt-2">
                {selectedPlan.description}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyPlanadmin;