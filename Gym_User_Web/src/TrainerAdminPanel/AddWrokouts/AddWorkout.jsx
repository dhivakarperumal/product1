import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useAuth } from "../../PrivateRouter/AuthContext";

import api from "../../api";
import { Search, Users, CheckSquare, Square, X, RefreshCw } from "lucide-react";

const inputClass =
  "w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3.5 text-white text-sm";

const workoutTypes = [
  "Weight Training",
  "Cardio",
  "Yoga / Stretching",
  "HIIT",
  "Bodyweight",
  "Warm Up",
  "Cool Down",
  "Rest Day",
];

const AddWorkout = () => {
    const { user } = useAuth();
  // ensure numeric comparison for trainer id
  const trainerId = user ? Number(user.id) : undefined;
  const trainerName = user?.username || "Trainer";
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = !!id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    memberId: "",
    memberName: "",
    memberEmail: "",
    memberMobile: "",
    level: "Beginner",
    durationWeeks: "",
  });

  const [days, setDays] = useState({
    Day1: [{ time: "", type: "Weight Training", name: "", sets: "", count: "", media: "", mediaType: "url" }],
  });
  
  // For debugging - show all assignments
  const [allAssignments, setAllAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- FETCH MEMBERS/USERS ---------------- */
  useEffect(() => {
    if (!user || (!user.id && !user.username && !user.email)) {
      console.log("Waiting for user authentication...", user);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);

        // Server-side filter by trainer's user ID — avoids the users.id vs staff.id mismatch
        const aRes = await api.get(`/assignments?trainerUserId=${user.id}`);
        const aData = aRes.data;
        const assignments = Array.isArray(aData)
          ? aData
          : aData.data || aData.assignments || [];

        const assignedMembers = assignments.map((a) => ({
          id: String(a.userId || a.user_id),
          name: a.username || a.user_name || "Member",
          planName: a.planName || a.plan_name || "Plan",
          email: a.userEmail || a.user_email || "",
          mobile: a.userMobile || a.user_mobile || "",
          source: "assign",
        }));

        console.log("🔍 Assigned members list:", assignedMembers.length);
        setMembers(assignedMembers);
        setAllAssignments(assignments);
      } catch (err) {
        console.error("❌ Error fetching members/users:", err);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user]);

  /* ---------------- FETCH WORKOUT IF EDIT ---------------- */
  useEffect(() => {
    if (!isEditMode) return;

    const fetchWorkout = async () => {
      try {
        const res = await api.get(`/workouts/${id}`);
        const data = res.data;
        setForm({
          memberId: data.member_id,
          memberName: data.member_name,
          level: data.level,
          durationWeeks: data.duration_weeks,
        });
        setDays(data.days || { Day1: [{ time: "", name: "" }] });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load workout");
        navigate("/trainer/alladdworkouts");
      }
    };

    fetchWorkout();
  }, [id]);

  /* ---------------- ADD DAY ---------------- */
  const addDay = () => {
    const nextDay = `Day${Object.keys(days).length + 1}`;
    setDays({
      ...days,
      [nextDay]: [{ time: "", type: "Weight Training", name: "", sets: "", count: "", media: "", mediaType: "url" }],
    });
  };

  /* ---------------- ADD EXERCISE ---------------- */
  const addExercise = (dayKey) => {
    setDays({
      ...days,
      [dayKey]: [...days[dayKey], { time: "", type: "Weight Training", name: "", sets: "", count: "", media: "", mediaType: "url" }],
    });
  };

  /* ---------------- UPDATE EXERCISE ---------------- */
  const updateExercise = (dayKey, index, field, value) => {
    const updated = [...days[dayKey]];
    updated[index][field] = value;

    setDays({
      ...days,
      [dayKey]: updated,
    });
  };

  /* ---------------- REMOVE EXERCISE ---------------- */
  const removeExercise = (dayKey, index) => {
    const updated = [...days[dayKey]];
    updated.splice(index, 1);

    setDays({
      ...days,
      [dayKey]:
        updated.length > 0 ? updated : [{ time: "", type: "Weight Training", name: "", sets: "", count: "", media: "", mediaType: "url" }],
    });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditMode && selected.size === 0) {
      toast.error("Please select at least one member");
      return;
    }
    if (isEditMode && !form.memberId) {
      toast.error("Member ID is missing");
      return;
    }
    setSubmitting(true);
    try {
      if (isEditMode) {
        const payload = {
          trainerId,
          trainerName,
          memberId: form.memberId,
          memberName: form.memberName,
          memberEmail: form.memberEmail,
          memberMobile: form.memberMobile,
          level: form.level,
          durationWeeks: Number(form.durationWeeks),
          days,
          status: "active",
        };
        await api.put(`/workouts/${id}`, payload);
        toast.success("Workout Updated ✅");
        navigate("/trainer/alladdworkouts");
      } else {
        // Bulk Create
        const selectedMembers = members.filter((m) => selected.has(m.id));
        let successCount = 0;
        let failCount = 0;

        for (const m of selectedMembers) {
          try {
            const payload = {
              trainerId,
              trainerName,
              memberId: m.id,
              memberName: m.name,
              memberEmail: m.email,
              memberMobile: m.mobile,
              level: form.level,
              durationWeeks: Number(form.durationWeeks),
              days,
              status: "active",
            };
            await api.post(`/workouts`, payload);
            successCount++;
          } catch (err) {
            console.error(`Failed for member ${m.name}:`, err);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Created workout for ${successCount} member(s) 💪`);
        }
        if (failCount > 0) {
          toast.error(`Failed to create for ${failCount} member(s)`);
        }
        
        if (successCount > 0) {
          navigate("/trainer/alladdworkouts");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- SELECTION HELPERS ---------------- */
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.mobile || "").includes(q)
    );
  });

  const toggleOne = (mId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mId)) next.delete(mId);
      else next.add(mId);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const allSelected = filteredMembers.length > 0 && selected.size === filteredMembers.length;

  /* ---------------- FILE UPLOAD HANDLER ---------------- */
  const handleFileUpload = async (dayKey, index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let result;
      if (file.type.startsWith("image/")) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
        });
        result = await imageCompression.getDataUrlFromFile(compressed);
      } else if (file.type.startsWith("video/")) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error("Video too large (max 20MB). Please use a URL instead.");
          return;
        }
        result = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      } else {
        toast.error("Unsupported file type");
        return;
      }

      updateExercise(dayKey, index, "media", result);
      toast.success("File uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };


  return (
    <div className="min-h-screen p-6 text-white">
      
      

      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">

        <h2 className="text-2xl font-bold mb-6">
          {isEditMode
            ? "Update Workout Schedule"
            : "Create Workout Schedule"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* MEMBER SELECTION */}
          {!isEditMode ? (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users size={18} className="text-orange-400" />
                  Select Members ({selected.size} / {members.length})
                </label>
                <div 
                  onClick={selectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition border border-white/5"
                >
                  {allSelected ? (
                    <CheckSquare size={16} className="text-orange-400" />
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/60 text-white text-sm border border-white/10 focus:ring-1 focus:ring-orange-500 outline-none"
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
                    <RefreshCw size={16} className="animate-spin" />
                    Loading members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm">
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const isSelected = selected.has(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleOne(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                          isSelected ? "bg-orange-500/20 border-orange-500/50" : "bg-white/5 border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-orange-400 shrink-0" />
                        ) : (
                          <Square size={18} className="text-white/20 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-[10px] text-white/40 truncate">
                            {[m.email, m.planName].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-semibold mb-2">Member</label>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg opacity-80">
                <Users size={18} className="text-white/40" />
                <div>
                  <p className="text-sm font-medium">{form.memberName || "Selected Member"}</p>
                  <p className="text-xs text-white/40">{form.memberEmail || "No Email"}</p>
                </div>
              </div>
              <p className="text-yellow-400 text-[10px] mt-2 italic">
                (Member cannot be changed in edit mode)
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Training Level</label>
              <select
                className={inputClass}
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: e.target.value })
                }
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Duration (Weeks)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="e.g. 12"
                value={form.durationWeeks}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationWeeks: e.target.value,
                  })
                }
              />
            </div>

          </div>

          {/* DAYS */}
          {Object.keys(days).map((dayKey) => (
            <div key={dayKey} className="bg-black/40 p-4 rounded-xl">
              <h3 className="font-semibold mb-4 text-orange-400 border-b border-white/10 pb-2">
                {dayKey}
              </h3>

              {days[dayKey].map((item, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-4 shadow-inner"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Time Slot */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Time Slot</label>
                      <input
                        type="time"
                        className={inputClass}
                        value={item.time}
                        onChange={(e) =>
                          updateExercise(dayKey, index, "time", e.target.value)
                        }
                      />
                    </div>

                    {/* Workout Type */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Type</label>
                      <select
                        className={inputClass}
                        value={item.type}
                        onChange={(e) =>
                          updateExercise(dayKey, index, "type", e.target.value)
                        }
                      >
                        {workoutTypes.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Exercise Name */}
                    <div className="space-y-1 lg:col-span-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Exercise Name</label>
                      <input
                        className={inputClass}
                        placeholder="e.g. Bench Press"
                        value={item.name}
                        onChange={(e) =>
                          updateExercise(dayKey, index, "name", e.target.value)
                        }
                      />
                    </div>

                    {/* Sets */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Sets</label>
                      <input
                        type="number"
                        className={inputClass}
                        placeholder="No. of Sets"
                        value={item.sets}
                        onChange={(e) =>
                          updateExercise(dayKey, index, "sets", e.target.value)
                        }
                      />
                    </div>

                    {/* Count/Reps */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Count / Reps</label>
                      <input
                        className={inputClass}
                        placeholder="e.g. 12 reps / 30s"
                        value={item.count}
                        onChange={(e) =>
                          updateExercise(dayKey, index, "count", e.target.value)
                        }
                      />
                    </div>

                    {/* Media Type & Input */}
                    <div className="space-y-1 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Exercise Media (Image/Video)</label>
                        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                          <button
                            type="button"
                            onClick={() => updateExercise(dayKey, index, "mediaType", "url")}
                            className={`px-3 py-1 text-[10px] rounded-md transition ${item.mediaType === 'url' ? 'bg-orange-500 text-white' : 'text-white/40'}`}
                          >
                            URL
                          </button>
                          <button
                            type="button"
                            onClick={() => updateExercise(dayKey, index, "mediaType", "upload")}
                            className={`px-3 py-1 text-[10px] rounded-md transition ${item.mediaType === 'upload' ? 'bg-orange-500 text-white' : 'text-white/40'}`}
                          >
                            Upload
                          </button>
                        </div>
                      </div>

                      {item.mediaType === 'url' ? (
                        <input
                          className={inputClass}
                          placeholder="Paste image or video URL (YouTube, MP4, JPG, etc.)"
                          value={item.media}
                          onChange={(e) =>
                            updateExercise(dayKey, index, "media", e.target.value)
                          }
                        />
                      ) : (
                        <div className="relative group">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleFileUpload(dayKey, index, e)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={inputClass + " flex items-center justify-center border-dashed border-2 hover:border-orange-500/50 transition"}>
                             <span className="text-white/40 text-xs">Click to upload Image or Video (Max 20MB for video)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media Preview if content exists */}
                  {item.media && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                         <div className="text-[10px] text-orange-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          Media attached
                        </div>
                        <button
                          type="button"
                          onClick={() => updateExercise(dayKey, index, "media", "")}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          Clear Media
                        </button>
                      </div>
                      
                      <div className="relative w-full aspect-video max-w-sm overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        {item.media.startsWith('data:video') || item.media.match(/\.(mp4|webm|ogg)$/i) || item.media.includes('youtube.com') || item.media.includes('youtu.be') ? (
                          item.media.includes('youtube.com') || item.media.includes('youtu.be') ? (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40">
                              YouTube Preview Disabled in Editor
                            </div>
                          ) : (
                            <video src={item.media} className="w-full h-full object-cover" controls />
                          )
                        ) : (
                          <img src={item.media} alt="Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => removeExercise(dayKey, index)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-500/10"
                    >
                      <X size={14} /> Remove Exercise
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addExercise(dayKey)}
                className="text-sm text-orange-400 mt-2"
              >
                + Add Exercise
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addDay}
            className="px-4 py-2 bg-gray-800 rounded-lg"
          >
            + Add Day
          </button>

          <div className="text-right">
            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center gap-2 ml-auto ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 transition'}`}
            >
              {submitting && <RefreshCw size={18} className="animate-spin" />}
              {submitting ? "Processing..." : (isEditMode ? "Update Program" : "Save Program")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddWorkout;


