import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import dayjs from "dayjs";

import api from "../../api";
import { Search, Users, CheckSquare, Square, X, RefreshCw } from "lucide-react";

const inputClass =
  "w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3.5 text-white text-sm";

const meals = ["Morning", "Breakfast", "Lunch", "Evening", "Dinner"];

const normalizeMemberId = (value) => {
  if (value === undefined || value === null) return null;
  return String(value).trim();
};

const getDietExpiry = (diet) => {
  const createdAt = new Date(diet.created_at || diet.createdAt || null);
  if (Number.isNaN(createdAt.getTime())) return null;
  const days = Number(diet.duration || diet.duration_days || diet.durationDays || 1) || 1;
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
};

const getSuggestedDietTitle = (weight) => {
  const w = Number(weight);
  if (!w || w <= 0) return "General Fitness";
  if (w < 60) return "High Protein Bulk";
  if (w < 75) return "Lean Muscle Building";
  if (w < 90) return "General Fitness";
  return "Weight Loss Strategy";
};

const getTargetCalories = (weight, title) => {
  const w = Number(weight) || 70;
  let target = Math.round(w * 28);
  if (/weight loss/i.test(title)) target = Math.round(w * 24);
  if (/keto/i.test(title)) target = Math.round(w * 26);
  if (/bulk/i.test(title)) target = Math.round(w * 30);
  return Math.max(1300, target);
};

const getMealTemplate = (title) => {
  const lower = title?.toLowerCase() || "";
  if (lower.includes("keto")) {
    return {
      Morning: "Almonds & Black Coffee",
      Breakfast: "Egg Omelette with Spinach",
      Lunch: "Grilled Chicken Salad",
      Evening: "Avocado & Cottage Cheese",
      Dinner: "Salmon with Broccoli",
    };
  }
  if (lower.includes("bulk") || lower.includes("muscle")) {
    return {
      Morning: "Peanut Butter Toast",
      Breakfast: "Oats with Banana & Eggs",
      Lunch: "Chicken Rice Bowl",
      Evening: "Greek Yogurt & Berries",
      Dinner: "Lean Beef with Veggies",
    };
  }
  if (lower.includes("weight loss")) {
    return {
      Morning: "Fruit & Almonds",
      Breakfast: "Vegetable Oatmeal",
      Lunch: "Turkey Salad",
      Evening: "Cucumber & Hummus",
      Dinner: "Grilled Fish and Greens",
    };
  }
  return {
    Morning: "Mixed Nuts & Fruit",
    Breakfast: "Poha with Vegetables",
    Lunch: "Grilled Chicken Salad",
    Evening: "Yogurt & Seeds",
    Dinner: "Paneer/Soy Veg Stir Fry",
  };
};

const generateDietDays = (weight, duration, title) => {
  const totalCalories = getTargetCalories(weight, title);
  const mealRatio = {
    Morning: 0.1,
    Breakfast: 0.25,
    Lunch: 0.35,
    Evening: 0.1,
    Dinner: 0.2,
  };
  const template = getMealTemplate(title);
  const days = {};
  const count = Number(duration) >= 1 ? Number(duration) : 1;

  for (let i = 1; i <= count; i += 1) {
    const dayKey = `Day${i}`;
    days[dayKey] = {};

    Object.keys(mealRatio).forEach((meal) => {
      const calories = Math.round(totalCalories * mealRatio[meal]);
      let quantity = "1 serving";
      if (meal === "Breakfast") quantity = "1 bowl";
      if (meal === "Lunch") quantity = "1 plate";
      if (meal === "Dinner") quantity = "1 bowl";
      if (meal === "Morning" || meal === "Evening") quantity = "1 portion";

      days[dayKey][meal] = {
        food: template[meal],
        quantity,
        calories: String(calories),
        time: meal === "Morning" ? "07:00" : meal === "Breakfast" ? "08:30" : meal === "Lunch" ? "13:00" : meal === "Evening" ? "17:00" : "20:00",
      };
    });
  }

  return days;
};

const foodCaloriesMap = {
  "almonds": 160,
  "black coffee": 5,
  "egg omelette": 180,
  "spinach": 25,
  "grilled chicken salad": 320,
  "avocado": 240,
  "cottage cheese": 120,
  "salmon": 250,
  "broccoli": 55,
  "peanut butter toast": 300,
  "oats with banana & eggs": 420,
  "chicken rice bowl": 520,
  "greek yogurt & berries": 200,
  "lean beef with veggies": 450,
  "fruit & almonds": 280,
  "vegetable oatmeal": 260,
  "turkey salad": 310,
  "cucumber & hummus": 150,
  "grilled fish and greens": 340,
  "mixed nuts & fruit": 320,
  "poha with vegetables": 290,
  "paneer/soy veg stir fry": 380,
  "apple": 95,
  "dates": 279,
  "banana": 105,
  "oats": 180,
  "rice": 206,
  "salad": 120,
  "yogurt": 120,
  "hummus": 70,
  "toast": 75,
  "fish": 220,
  "beef": 250,
  "chicken": 240,
  "paneer": 260,
};

const foodSuggestions = [
  "Apple",
  "Dates",
  "Oats with Banana & Eggs",
  "Chicken Rice Bowl",
  "Greek Yogurt & Berries",
  "Grilled Chicken Salad",
  "Fruit & Almonds",
  "Vegetable Oatmeal",
  "Turkey Salad",
  "Cucumber & Hummus",
  "Grilled Fish and Greens",
  "Salmon with Broccoli",
  "Paneer/Soy Veg Stir Fry",
  "Black Coffee",
  "Almonds",
  "Egg Omelette",
  "Spinach",
  "Avocado",
  "Cottage Cheese",
  "Mixed Nuts & Fruit",
  "Poha with Vegetables",
  "Peanut Butter Toast",
];

const normalizeFoodName = (food) =>
  String(food || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[,;&]/g, ",");

const parseQuantityValue = (quantity) => {
  if (!quantity) return 1;
  const numeric = String(quantity).trim().match(/[0-9]*\.?[0-9]+/);
  if (numeric) {
    return Number(numeric[0]) || 1;
  }
  if (/half/i.test(quantity)) return 0.5;
  return 1;
};

const estimateCaloriesForMeal = (food, quantity) => {
  const normalized = normalizeFoodName(food);
  if (!normalized) return "";
  const quantityValue = parseQuantityValue(quantity);
  const items = normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0) return "";

  let total = 0;
  items.forEach((item) => {
    if (foodCaloriesMap[item]) {
      total += foodCaloriesMap[item];
      return;
    }
    if (item.includes("apple")) {
      total += 95;
      return;
    }
    if (item.includes("date")) {
      total += 140;
      return;
    }
    if (item.includes("banana")) {
      total += 105;
      return;
    }
    if (item.includes("oat")) {
      total += 180;
      return;
    }
    if (item.includes("chicken")) {
      total += 240;
      return;
    }
    if (item.includes("rice")) {
      total += 220;
      return;
    }
    if (item.includes("fish") || item.includes("salmon")) {
      total += 250;
      return;
    }
    if (item.includes("beef") || item.includes("paneer") || item.includes("soy")) {
      total += 320;
      return;
    }
    if (item.includes("salad")) {
      total += 120;
      return;
    }
    if (item.includes("yogurt")) {
      total += 120;
      return;
    }
    if (item.includes("hummus")) {
      total += 70;
      return;
    }
    total += 180;
  });

  return String(Math.round(total * quantityValue));
};

const getSuggestedDietPlan = (weight, duration, title) => {
  const finalTitle = title || getSuggestedDietTitle(weight);
  return {
    title: finalTitle,
    days: generateDietDays(weight, duration, finalTitle),
  };
};

/* ---------- GENERATE SINGLE DAY ---------- */
const generateMealItem = (label) => ({
  food: "",
  quantity: "",
  calories: "",
  time: "",
});

const generateSingleDay = () => {
  const day = {};
  meals.forEach((meal) => {
    day[meal] = generateMealItem(meal);
  });
  return day;
};

const AddDietPlans = () => {
  const { user } = useAuth();

  const trainerId = Number(user?.id || 0);
  const trainerName = user?.username || "";
  const trainerEmail = user?.email || "";

  const { id } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allAssignments, setAllAssignments] = useState([]);
  const [blockedMembers, setBlockedMembers] = useState({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    memberId: "",
    memberName: "",
    memberEmail: "",
    memberMobile: "",
    memberWeight: "",
    title: "",
    totalCalories: "",
    duration: 1,
    days: {
      Day1: generateSingleDay(),
      Day2: generateSingleDay(),
    },
  });
  const [autoTotalCalories, setAutoTotalCalories] = useState(true);

  /* ================= FETCH MEMBERS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);

        // Server-side filter — avoids users.id vs staff.id mismatch
        const res = await api.get(`/assignments?trainerUserId=${user.id}`);
        const data = res.data;

        const assignments = Array.isArray(data)
          ? data
          : data.data || data.assignments || [];

        const formatted = assignments.map((d, index) => {
          const fallbackId = d.memberId || d.member_id || d.membershipId || d.membership_id || d.userId || d.user_id || d.id || index;
          return {
            id: String(fallbackId),
            memberId: String(d.memberId || d.member_id || d.membershipId || d.membership_id || d.userId || d.user_id || d.id || fallbackId),
            userId: String(d.userId || d.user_id || ""),
            name: d.username || d.user_name || "Member",
            email: d.userEmail || d.user_email || "",
            mobile: d.userMobile || d.user_mobile || "",
            weight: d.weight || d.userWeight || d.memberWeight || d.member_weight || d.user_weight || "",
            planName: d.planName || d.plan_name || "Plan",
          };
        });

        setMembers(formatted);
        setAllAssignments(assignments);

        const dietRes = await api.get(`/diet-plans?trainerId=${encodeURIComponent(user.id)}`);
        const dietData = Array.isArray(dietRes.data)
          ? dietRes.data
          : dietRes.data.data || dietRes.data.diet_plans || [];
        setBlockedMembers(getActiveMemberBlocks(dietData));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user]);

  const getMemberBlockExpiry = (member) => {
    return (
      blockedMembers[normalizeMemberId(member.id)] ||
      blockedMembers[normalizeMemberId(member.memberId)] ||
      blockedMembers[normalizeMemberId(member.userId)]
    );
  };

  const isMemberBlocked = (member) => Boolean(getMemberBlockExpiry(member));

  const getActiveMemberBlocks = (diets) => {
    const now = Date.now();
    const blocks = {};

    diets.forEach((diet) => {
      const expiry = getDietExpiry(diet);
      if (!expiry || expiry.getTime() <= now) return;

      const keys = [diet.member_id, diet.memberId, diet.user_id, diet.userId]
        .map(normalizeMemberId)
        .filter(Boolean);

      keys.forEach((key) => {
        const existing = blocks[key];
        if (!existing || expiry.getTime() > existing.getTime()) {
          blocks[key] = expiry;
        }
      });
    });

    return blocks;
  };

  /* ================= AUTO CALCULATE CALORIES ================= */
  useEffect(() => {
    if (!autoTotalCalories) return;
    let total = 0;

    Object.values(form.days).forEach((day) => {
      Object.values(day).forEach((meal) => {
        total += Number(meal.calories || 0);
      });
    });

    setForm((prev) => ({
      ...prev,
      totalCalories: total,
    }));
  }, [form.days, autoTotalCalories]);

  /* ================= LOAD DIET FOR EDIT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchDiet = async () => {
      try {
        const res = await api.get(`/diet-plans/${id}`);
        const data = res.data;

        const memberId = data.memberId || data.member_id;
        const memberName = data.memberName || data.member_name;

        const fixedDays = {};

        Object.keys(data.days || {}).forEach((dayKey) => {
          fixedDays[dayKey] = {};

          meals.forEach((meal) => {
            const mealData = data.days[dayKey][meal];

            if (typeof mealData === "string") {
              fixedDays[dayKey][meal] = {
                food: mealData,
                quantity: "",
                calories: "",
              };
            } else {
              fixedDays[dayKey][meal] = {
                food: mealData?.food || "",
                quantity: mealData?.quantity || "",
                calories: mealData?.calories || "",
                time: mealData?.time || "",
              };
            }
          });
        });

        setForm({
          memberId,
          memberName,
          memberEmail: data.memberEmail || data.member_email || "",
          memberMobile: data.memberMobile || data.member_mobile || "",
          memberWeight: data.memberWeight || data.member_weight || "",
          title: data.title || "",
          totalCalories: data.totalCalories || data.total_calories || "",
          duration: data.duration || 1,
          days: fixedDays,
          createdAt: data.created_at,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load diet");
      }
    };

    fetchDiet();
  }, [id]);

  /* ================= HANDLE MEAL CHANGE ================= */
  const handleMealChange = (day, meal, field, value) => {
    setForm((prev) => {
      const updatedMeal = {
        ...prev.days[day][meal],
        [field]: value,
      };

      if (field === "food" || field === "quantity") {
        const estimated = estimateCaloriesForMeal(
          field === "food" ? value : updatedMeal.food,
          field === "quantity" ? value : updatedMeal.quantity
        );
        updatedMeal.calories = estimated;
      }

      return {
        ...prev,
        days: {
          ...prev.days,
          [day]: {
            ...prev.days[day],
            [meal]: updatedMeal,
          },
        },
      };
    });
  };

  /* ================= ADD DAY ================= */
  const handleAddDay = () => {
    const count = Object.keys(form.days).length;

    if (count >= 60) {
      toast.error("Maximum 60 days allowed");
      return;
    }

    const newKey = `Day${count + 1}`;

    setForm((prev) => ({
      ...prev,
      duration: count + 1,
      days: {
        ...prev.days,
        [newKey]: generateSingleDay(),
      },
    }));
  };

  /* ================= REMOVE DAY ================= */
  const handleRemoveDay = () => {
    const count = Object.keys(form.days).length;

    if (count <= 1) {
      toast.error("Minimum 1 day required");
      return;
    }

    const lastKey = `Day${count}`;

    const updated = { ...form.days };
    delete updated[lastKey];

    setForm((prev) => ({
      ...prev,
      duration: count - 1,
      days: updated,
    }));
  };

  const handleAddMealRow = (day, afterMeal) => {
    setForm((prev) => {
      const dayMeals = prev.days[day] || {};
      const matching = Object.keys(dayMeals).filter((key) => key.startsWith(`${afterMeal}_Extra`));
      const extraIndex = matching.length + 1;
      const newKey = `${afterMeal}_Extra${extraIndex}`;

      return {
        ...prev,
        days: {
          ...prev.days,
          [day]: {
            ...dayMeals,
            [newKey]: generateMealItem(`${afterMeal} Extra ${extraIndex}`),
          },
        },
      };
    });
  };

  const handleRemoveMealRow = (day, mealKey) => {
    setForm((prev) => {
      const dayMeals = { ...prev.days[day] };
      delete dayMeals[mealKey];

      return {
        ...prev,
        days: {
          ...prev.days,
          [day]: dayMeals,
        },
      };
    });
  };

  const getSortedMealKeys = (dayMeals) =>
    Object.keys(dayMeals || {}).sort((a, b) => {
      const [baseA] = a.split("_Extra");
      const [baseB] = b.split("_Extra");
      const indexA = meals.indexOf(baseA);
      const indexB = meals.indexOf(baseB);

      if (indexA !== indexB) return indexA - indexB;
      if (a === baseA) return -1;
      if (b === baseB) return 1;

      const extraA = Number(a.split("_Extra")[1]) || 0;
      const extraB = Number(b.split("_Extra")[1]) || 0;
      return extraA - extraB;
    });

  /* ================= COPY DAY 1 TO ALL ================= */
  const handleCopyDay1ToAll = () => {
    if (Object.keys(form.days).length <= 1) {
      toast.error("Add more days first");
      return;
    }

    const day1Data = form.days["Day1"];
    const getDeepCopy = () => JSON.parse(JSON.stringify(day1Data));

    setForm((prev) => {
      const updatedDays = { ...prev.days };
      Object.keys(updatedDays).forEach((dayKey) => {
        if (dayKey !== "Day1") {
          updatedDays[dayKey] = getDeepCopy();
        }
      });
      return { ...prev, days: updatedDays };
    });
    toast.success("Day 1 copied to all days");
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id && selected.size === 0) {
      toast.error("Please select at least one member");
      return;
    }
    if (id && !form.memberId) {
      toast.error("Member ID is missing");
      return;
    }
    if (!form.title) {
      toast.error("Please fill required fields (Diet Title)");
      return;
    }

    const hasFood = Object.values(form.days).some((day) =>
      Object.values(day).some((meal) => meal.food.trim() !== "")
    );

    if (!hasFood) {
      toast.error("Add at least one food item");
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        const payload = {
          trainerId,
          trainerName,
          trainerSource: user?.role || "trainer",
          memberId: form.memberId,
          memberName: form.memberName,
          memberEmail: form.memberEmail,
          memberMobile: form.memberMobile,
          memberWeight: form.memberWeight,
          title: form.title,
          totalCalories: Number(form.totalCalories) || 0,
          duration: form.duration,
          days: form.days,
          status: "active",
        };
        await api.put(`/diet-plans/${id}`, payload);
        toast.success("Diet Plan Updated 🥗");
        setTimeout(() => navigate("/trainer/alladddietplans"), 1200);
      } else {
        // Bulk Create
        const selectedMembers = members.filter((m) => selected.has(m.id) && !isMemberBlocked(m));
        if (selectedMembers.length === 0) {
          toast.error("No valid members selected for diet plan creation.");
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const m of selectedMembers) {
          try {
            const memberWeight = m.weight || form.memberWeight || 70;
            const payloadTitle = form.title || getSuggestedDietTitle(memberWeight);
            const payload = {
              trainerId,
              trainerName,
              trainerSource: user?.role || "trainer",
              memberId: m.memberId || m.id,
              memberName: m.name,
              memberEmail: m.email,
              memberMobile: m.mobile,
              memberWeight,
              title: payloadTitle,
              totalCalories: Number(form.totalCalories) || getTargetCalories(memberWeight, payloadTitle),
              duration: form.duration,
              days: form.days,
              status: "active",
            };
            await api.post(`/diet-plans`, payload);
            successCount++;
          } catch (err) {
            console.error(`Failed for member ${m.name}:`, err);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Created diet plan for ${successCount} member(s) 🥗💪`);
        }
        if (failCount > 0) {
          toast.error(`Failed for ${failCount} member(s)`);
        }

        if (successCount > 0) {
          setTimeout(() => navigate("/trainer/alladddietplans"), 1200);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving diet");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= SELECTION HELPERS ================= */
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.mobile || "").includes(q)
    );
  });

  const eligibleMembers = filteredMembers.filter((m) => !isMemberBlocked(m));
  const blockedCount = filteredMembers.filter((m) => isMemberBlocked(m)).length;

  const toggleOne = (member) => {
    if (isMemberBlocked(member)) {
      toast.error("This member already has an active diet plan. Add the next diet plan only after the current duration completes.");
      return;
    }

    const alreadySelected = selected.has(member.id);

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(member.id)) {
        next.delete(member.id);
      } else {
        next.add(member.id);
      }
      return next;
    });

    if (!alreadySelected) {
      const { title, days } = getSuggestedDietPlan(
        member.weight || form.memberWeight || 70,
        form.duration,
        form.title
      );
      setForm((prev) => ({
        ...prev,
        memberId: member.memberId,
        memberName: member.name,
        memberEmail: member.email,
        memberMobile: member.mobile,
        memberWeight: member.weight || member.memberWeight || prev.memberWeight,
        title: prev.title || title,
        days,
      }));
      setAutoTotalCalories(true);
    } else if (selected.size === 1) {
      setForm((prev) => ({
        ...prev,
        memberId: "",
        memberName: "",
        memberEmail: "",
        memberMobile: "",
        memberWeight: "",
        title: "",
        days: {
          Day1: generateSingleDay(),
          Day2: generateSingleDay(),
        },
        totalCalories: 0,
      }));
      setAutoTotalCalories(true);
    }
  };

  const selectAll = () => {
    if (selected.size === eligibleMembers.length && eligibleMembers.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligibleMembers.map((m) => m.id)));
    }
  };

  const allSelected = eligibleMembers.length > 0 && selected.size === eligibleMembers.length;

  if (loading || !trainerId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const baseDate =
    id && form.createdAt
      ? dayjs(form.createdAt)
      : dayjs();

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">

        <h2 className="text-2xl font-bold mb-6">
          {id ? "Edit Diet Plan" : "Create Custom Diet Plan"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* MEMBER SELECTION */}
          {!id ? (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users size={18} className="text-emerald-400" />
                  Select Members ({selected.size} / {eligibleMembers.length})
                </label>
                <div
                  onClick={selectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition border border-white/5"
                >
                  {allSelected ? (
                    <CheckSquare size={16} className="text-emerald-400" />
                  ) : (
                    <Square size={16} className="text-white/20" />
                  )}
                  <span className="text-xs font-medium text-white/70">
                    {allSelected ? "Deselect All" : "Select All"}
                  </span>
                </div>
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/60 text-white text-sm border border-white/10 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Member List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-emerald-400" />
                    Loading members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm">
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const blockedExpiry = getMemberBlockExpiry(m);
                    const isBlocked = Boolean(blockedExpiry);
                    const isSelected = selected.has(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => !isBlocked && toggleOne(m)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition border ${isBlocked ? "bg-red-500/10 border-red-500/20 cursor-not-allowed" : isSelected ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer"}`}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-emerald-400 shrink-0" />
                        ) : (
                          <Square size={18} className="text-white/20 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-2">
                            {m.name}
                            {m.weight && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">({m.weight}kg)</span>}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {[m.email, m.planName].filter(Boolean).join(" • ")}
                          </p>
                          {isBlocked && blockedExpiry && (
                            <p className="text-[10px] text-red-300 mt-1">
                              Blocked until {dayjs(blockedExpiry).format("DD MMM YYYY")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {blockedCount > 0 && (
                <p className="text-xs text-white/50">
                  {blockedCount} member(s) are currently blocked because they have an active diet plan. You can add a new diet only after the current duration ends.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-semibold mb-2">Member</label>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg opacity-80">
                <Users size={18} className="text-white/40" />
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {form.memberName || "Selected Member"}
                    {form.memberWeight && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">({form.memberWeight}kg)</span>}
                  </p>
                  <p className="text-xs text-white/40">{form.memberEmail || "No Email"}</p>
                </div>
              </div>
              <p className="text-yellow-400 text-[10px] mt-2 italic">
                (Member cannot be changed in edit mode)
              </p>
            </div>
          )}

          {/* TOP FIELDS: TITLE, CALORIES, DAYS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-white/50 ml-1">Diet Plan Title</label>
              <select
                className={`${inputClass} [&>option]:text-black`}
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              >
                <option value="" disabled>Select Diet Plan Title...</option>
                <option value="Weight Loss Strategy">Weight Loss Strategy</option>
                <option value="High Protein Bulk">High Protein Bulk</option>
                <option value="Keto Diet Plan">Keto Diet Plan</option>
                <option value="Lean Muscle Building">Lean Muscle Building</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Endurance & Stamina">Endurance & Stamina</option>
                <option value="Vegan Plan">Vegan Plan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Total Calories (Auto)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="Total Calories"
                value={form.totalCalories}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, totalCalories: e.target.value }));
                  setAutoTotalCalories(false);
                }}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Member Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="Weight"
                value={form.memberWeight}
                onChange={(e) => setForm(p => ({ ...p, memberWeight: e.target.value }))}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Duration (Days)</label>
              <div className={`${inputClass} flex items-center justify-between bg-black/60`}>
                <span>{Object.keys(form.days).length} Days</span>
                <div className="flex gap-2">
                  <button type="button" onClick={handleRemoveDay} className="text-red-400 hover:text-red-300 font-bold px-1">-</button>
                  <button type="button" onClick={handleAddDay} className="text-emerald-400 hover:text-emerald-300 font-bold px-1">+</button>
                </div>
              </div>
            </div>
          </div>

          <datalist id="diet-food-options">
            {foodSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          {/* DAYS */}
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">

            {Object.keys(form.days)
              .sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)))
              .map((day) => (
                <div
                  key={day}
                  className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
  {(() => {
    const dayIndex = Number(day.replace("Day", "")) - 1;
    const date = dayjs(baseDate).add(dayIndex, "day");

    return (
      <>
        {/* LEFT SIDE (DATE) */}
        <h3 className="font-semibold text-emerald-400">
          {date.format("DD MMM YYYY")}
          <span className="text-xs text-white/40 ml-2">
            ({date.format("dddd")})
          </span>
        </h3>

        {/* RIGHT SIDE (BUTTON) */}
        {day === "Day1" && Object.keys(form.days).length > 1 && (
          <button
            type="button"
            onClick={handleCopyDay1ToAll}
            className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition"
          >
            Copy to All Days
          </button>
        )}
      </>
    );
  })()}
</div>

                 

                  {getSortedMealKeys(form.days[day] || {}).map((meal) => {
                      const mealData = form.days[day][meal];
                      const baseMeal = meal.replace(/_Extra.*$/, "");
                      const label = baseMeal;
                      return (
                        <div key={meal} className="grid grid-cols-1 md:grid-cols-6 items-center gap-3">
                          {/* Meal Label */}
                          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-3.5 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                            <span>{label}</span>
                            <div className="flex items-center gap-2">
                              {meal.includes("_Extra") ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMealRow(day, meal)}
                                  className="p-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-300 hover:bg-red-500/20 transition"
                                  aria-label="Remove extra row"
                                >
                                  <X size={12} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddMealRow(day, baseMeal)}
                                  className="text-[10px] px-2 py-1 bg-white/10 border border-white/10 rounded-md hover:bg-white/15 transition"
                                >
                                  +
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Timing first */}
                          <input
                            type="time"
                            className={inputClass}
                            placeholder="Timing"
                            value={mealData?.time || ""}
                            onChange={(e) =>
                              handleMealChange(day, meal, "time", e.target.value)
                            }
                          />

                          {/* Food */}
                          <input
                            className={`${inputClass} md:col-span-2`}
                            list="diet-food-options"
                            placeholder="Food Item(s), comma separated"
                            value={mealData?.food || ""}
                            onChange={(e) =>
                              handleMealChange(day, meal, "food", e.target.value)
                            }
                            autoComplete="off"
                            spellCheck="false"
                          />

                          {/* Quantity */}
                          <input
                            className={inputClass}
                            placeholder="Qty e.g. 1 bowl"
                            value={mealData?.quantity || ""}
                            onChange={(e) =>
                              handleMealChange(day, meal, "quantity", e.target.value)
                            }
                            autoComplete="off"
                            spellCheck="false"
                          />

                          {/* Calories */}
                          <input
                            type="number"
                            className={inputClass}
                            placeholder="Kcal"
                            value={mealData?.calories || ""}
                            onChange={(e) =>
                              handleMealChange(day, meal, "calories", e.target.value)
                            }
                          />
                        </div>
                      );
                    })}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleAddMealRow(day, "Dinner")}
                      className="text-xs font-semibold bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/15 transition"
                    >
                      + Add Row
                    </button>
                  </div>

                </div>
              ))}

          </div>

          {/* SUBMIT */}
          <div className="flex justify-end">

            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 flex items-center gap-2 hover:scale-105 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting && <RefreshCw size={18} className="animate-spin" />}
              {submitting ? "Processing..." : (id ? "Update Diet Plan" : "Save Diet Plan")}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default AddDietPlans;