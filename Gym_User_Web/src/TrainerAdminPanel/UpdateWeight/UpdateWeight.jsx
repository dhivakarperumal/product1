import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Users, Activity, Scale, Ruler, Percent, Save, RefreshCw, CheckSquare, Square } from "lucide-react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";

const inputClass = "w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-orange-500 outline-none transition";

const UpdateWeight = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [measurements, setMeasurements] = useState({
        weight: "",
        height: "",
        bmi: ""
    });

    useEffect(() => {
        if (!user?.id) return;
        fetchMembers();
    }, [user?.id]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/assignments?trainerUserId=${user.id}`);
            const data = Array.isArray(res.data) ? res.data : res.data.data || res.data.assignments || [];
            
            const list = data.map(m => ({
                id: m.userId || m.user_id || m.id,
                gmId: m.gymMemberId || m.gm_id || m.id, // Try to find the gym_members table reference
                name: m.username || m.user_name || m.memberName || "Member",
                email: m.userEmail || m.user_email || m.memberEmail || "",
                phone: m.userMobile || m.user_mobile || m.memberMobile || ""
            }));
            setMembers(list);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMember = async (member) => {
        setSelectedMember(member);
        try {
            // Fetch latest profile details including current measurements
            const res = await api.get(`/members/${member.gmId}`);
            const data = res.data;
            setMeasurements({
                weight: data.weight || "",
                height: data.height || "",
                bmi: data.bmi || ""
            });
        } catch (err) {
            console.error(err);
            toast.error("Could not fetch latest details");
        }
    };

    const calculateBMI = (weight, height) => {
        if (!weight || !height) return "";
        const hInMeters = height / 100;
        const bmi = (weight / (hInMeters * hInMeters)).toFixed(1);
        return bmi;
    };

    const handleMeasurementChange = (field, value) => {
        const newMeasurements = { ...measurements, [field]: value };
        if (field === 'weight' || field === 'height') {
            newMeasurements.bmi = calculateBMI(
                field === 'weight' ? Number(value) : Number(measurements.weight),
                field === 'height' ? Number(value) : Number(measurements.height)
            );
        }
        setMeasurements(newMeasurements);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedMember) return;
        
        setSubmitting(true);
        try {
            const fullMemberRes = await api.get(`/members/${selectedMember.gmId}`);
            const fullMember = fullMemberRes.data;

            const payload = {
                ...fullMember,
                weight: Number(measurements.weight),
                height: Number(measurements.height),
                bmi: Number(measurements.bmi)
            };

            await api.put(`/members/${selectedMember.gmId}`, payload);
            toast.success(`Measurements updated for ${selectedMember.name} 🚀`);
            setSelectedMember(null);
            setMeasurements({ weight: "", height: "", bmi: "" });
        } catch (err) {
            console.error(err);
            toast.error("Update failed");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search)
    );

    return (
        <div className="min-h-screen p-6 text-white max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-400">
                    <Activity size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Update Member Progress</h1>
                    <p className="text-white/50 text-sm">Track and update weight, height and BMI of your assigned members.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Member Selection List */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-fit max-h-[70vh] flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="text-orange-400" size={20} />
                        <h2 className="font-semibold">Your Members</h2>
                    </div>

                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm outline-none focus:border-orange-500/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {loading ? (
                            <div className="py-10 text-center text-white/30 flex flex-col items-center gap-2">
                                <RefreshCw className="animate-spin" size={24} />
                                <span className="text-xs uppercase tracking-widest">Fetching...</span>
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="py-10 text-center text-white/20 text-sm italic">No members found</div>
                        ) : (
                            filteredMembers.map(m => {
                                const isSelected = selectedMember?.id === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => handleSelectMember(m)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border flex items-center gap-3 ${
                                            isSelected 
                                            ? "bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/10" 
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                        }`}
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={18} className="text-orange-400 shrink-0" />
                                        ) : (
                                            <Square size={18} className="text-white/20 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm truncate">{m.name}</div>
                                            <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-semibold truncate">{m.phone || "No Phone"}</div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Update Panel */}
                <div className="lg:col-span-2">
                    {selectedMember ? (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-start border-b border-white/10 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xl uppercase tracking-tighter">
                                        {selectedMember.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{selectedMember.name}</h3>
                                        <p className="text-orange-400 text-xs font-semibold uppercase tracking-[0.2em]">{selectedMember.phone}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-white"
                                >
                                    Change Member
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                                        <Scale size={14} className="text-orange-400" /> Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className={inputClass}
                                        placeholder="Enter Weight"
                                        value={measurements.weight}
                                        onChange={(e) => handleMeasurementChange('weight', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                                        <Ruler size={14} className="text-orange-400" /> Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className={inputClass}
                                        placeholder="Enter Height"
                                        value={measurements.height}
                                        onChange={(e) => handleMeasurementChange('height', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                                        <Percent size={14} className="text-orange-400" /> BMI
                                    </label>
                                    <div className={`${inputClass} bg-black/60 flex items-center justify-between border-orange-500/20`}>
                                        <span className={`font-bold text-lg ${measurements.bmi ? 'text-orange-400' : 'text-white/20'}`}>
                                            {measurements.bmi || "0.0"}
                                        </span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] uppercase tracking-tighter text-white/30">Calculated</span>
                                            <span className="text-[8px] uppercase tracking-tighter text-white/30">Result</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-3 pt-6 border-t border-white/10 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 px-10 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 group"
                                    >
                                        {submitting ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                                        {submitting ? "Processing..." : "Submit Progress Update"}
                                    </button>
                                </div>
                            </form>
                            
                            <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 flex gap-4 items-center">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <Activity size={20} className="text-orange-400" />
                                </div>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    <span className="text-orange-400 font-semibold">Pro Tip:</span> Updating measurements regularly helps members track their fitness journey effectively and stay motivated.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-12 animate-pulse">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                <Users size={40} className="text-white/20" />
                            </div>
                            <h3 className="text-white font-semibold text-lg mb-2">Ready to Track Progress?</h3>
                            <p className="text-white/30 text-sm max-w-[280px]">Please select a member from the left panel to start updating their physical measurements.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateWeight;
