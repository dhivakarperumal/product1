import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Dumbbell, 
  Apple, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Target,
  TrendingUp 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";

const MemberComprehensiveView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [filterBy, setFilterBy] = useState("all"); // all, hasWorkout, hasDiet, both

  /* ============ FETCH ALL DATA ============ */
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch members/users
        const membersRes = await api.get("/users");
        const membersData = Array.isArray(membersRes.data) ? membersRes.data : [];
        
        // Fetch workouts
        const workoutsRes = await api.get("/workouts");
        const workoutsData = Array.isArray(workoutsRes.data) ? workoutsRes.data : [];
        
        // Fetch diet plans
        const dietRes = await api.get("/diet-plans");
        const dietData = Array.isArray(dietRes.data) ? dietRes.data : [];

        setMembers(membersData);
        setWorkouts(workoutsData);
        setDietPlans(dietData);
        
        console.log("✅ Loaded Members:", membersData.length);
        console.log("✅ Loaded Workouts:", workoutsData.length);
        console.log("✅ Loaded Diet Plans:", dietData.length);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  /* ============ GET MEMBER INFO ============ */
  const getMemberInfo = (memberId) => {
    return members.find(m => m.id === memberId || m.uuid === memberId);
  };

  /* ============ GET MEMBER WORKOUTS ============ */
  const getMemberWorkouts = (memberId) => {
    return workouts.filter(w => 
      w.member_id === memberId || 
      w.memberId === memberId ||
      w.member_uuid === memberId
    );
  };

  /* ============ GET MEMBER DIET PLANS ============ */
  const getMemberDietPlans = (memberId) => {
    return dietPlans.filter(d => 
      d.member_id === memberId || 
      d.memberId === memberId ||
      d.member_uuid === memberId
    );
  };

  /* ============ FILTER & SEARCH ============ */
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const name = member.full_name || member.username || member.email || "";
      const email = member.email || "";
      const phone = member.mobile || member.phone || "";
      
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                           email.toLowerCase().includes(search.toLowerCase()) ||
                           phone.includes(search);

      if (!matchesSearch) return false;

      const memberWorkouts = getMemberWorkouts(member.id || member.uuid);
      const memberDiets = getMemberDietPlans(member.id || member.uuid);

      if (filterBy === "hasWorkout") return memberWorkouts.length > 0;
      if (filterBy === "hasDiet") return memberDiets.length > 0;
      if (filterBy === "both") return memberWorkouts.length > 0 && memberDiets.length > 0;

      return true;
    });
  }, [members, search, filterBy, workouts, dietPlans]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading members and their programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ============ HEADER ============ */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-orange-500" />
            Member Profiles & Programs
          </h1>
          <p className="text-white/60">View all members with their assigned workouts and diet plans</p>
        </div>

        {/* ============ CONTROLS ============ */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Members ({members.length})</option>
            <option value="hasWorkout">With Workouts ({workouts.length > 0 ? members.filter(m => getMemberWorkouts(m.id || m.uuid).length > 0).length : 0})</option>
            <option value="hasDiet">With Diet Plans ({dietPlans.length > 0 ? members.filter(m => getMemberDietPlans(m.id || m.uuid).length > 0).length : 0})</option>
            <option value="both">Complete Programs ({workouts.length > 0 && dietPlans.length > 0 ? members.filter(m => getMemberWorkouts(m.id || m.uuid).length > 0 && getMemberDietPlans(m.id || m.uuid).length > 0).length : 0})</option>
          </select>
        </div>

        {/* ============ STATS ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{members.length}</p>
            <p className="text-sm text-white/60">Total Members</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{workouts.length}</p>
            <p className="text-sm text-white/60">Total Workouts</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{dietPlans.length}</p>
            <p className="text-sm text-white/60">Total Diet Plans</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-pink-400">{filteredMembers.length}</p>
            <p className="text-sm text-white/60">Matching Results</p>
          </div>
        </div>

        {/* ============ MEMBERS LIST ============ */}
        <div className="space-y-4">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/60">No members found matching your criteria</p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const memberId = member.id || member.uuid;
              const memberWorkouts = getMemberWorkouts(memberId);
              const memberDiets = getMemberDietPlans(memberId);
              const isExpanded = expandedMemberId === memberId;

              return (
                <div 
                  key={memberId}
                  className="bg-white/5 border border-white/10 rounded-lg overflow-hidden transition-all duration-300"
                >
                  {/* ========== MEMBER HEADER ========== */}
                  <button
                    onClick={() => setExpandedMemberId(isExpanded ? null : memberId)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 text-left space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center font-bold text-sm">
                          {(member.full_name || member.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{member.full_name || member.username || "Unknown"}</h3>
                          <p className="text-sm text-white/60 flex items-center gap-2">
                            <Mail className="w-3 h-3" /> {member.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-orange-400 font-semibold">
                          <Dumbbell className="w-4 h-4" /> {memberWorkouts.length}
                        </div>
                        <div className="text-xs text-white/50">Workouts</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                          <Apple className="w-4 h-4" /> {memberDiets.length}
                        </div>
                        <div className="text-xs text-white/50">Diets</div>
                      </div>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </button>

                  {/* ========== EXPANDED CONTENT ========== */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-black/20 px-6 py-4 space-y-6">
                      
                      {/* ---- MEMBER DETAILS ---- */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-white/80 flex items-center gap-2">
                          <User className="w-4 h-4" /> MEMBER DETAILS
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {member.phone || member.mobile ? (
                            <div className="flex items-start gap-2">
                              <Phone className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-white/60 text-xs">Phone</p>
                                <p className="font-medium">{member.phone || member.mobile}</p>
                              </div>
                            </div>
                          ) : null}
                          
                          {member.email ? (
                            <div className="flex items-start gap-2">
                              <Mail className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-white/60 text-xs">Email</p>
                                <p className="font-medium">{member.email}</p>
                              </div>
                            </div>
                          ) : null}
                          
                          {member.address ? (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-white/60 text-xs">Address</p>
                                <p className="font-medium">{member.address}</p>
                              </div>
                            </div>
                          ) : null}

                          {member.created_at || member.createdAt ? (
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-white/60 text-xs">Member Since</p>
                                <p className="font-medium">{new Date(member.created_at || member.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* ---- WORKOUTS SECTION ---- */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-white/80 flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-orange-400" /> ASSIGNED WORKOUTS ({memberWorkouts.length})
                        </h4>
                        {memberWorkouts.length === 0 ? (
                          <p className="text-sm text-white/50 italic">No workouts assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {memberWorkouts.map((workout) => (
                              <div key={workout.id} className="bg-white/5 border border-orange-500/30 rounded-lg p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold text-orange-300">{workout.category || "Unknown Category"}</p>
                                    <p className="text-xs text-white/60">{workout.level || "Level N/A"} • {workout.duration_weeks || workout.durationWeeks || 0} weeks</p>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded">
                                    {workout.status || "Active"}
                                  </span>
                                </div>
                                {workout.trainer_name || workout.trainerName ? (
                                  <p className="text-xs text-white/70">Trainer: <span className="text-cyan-300">{workout.trainer_name || workout.trainerName}</span></p>
                                ) : null}
                                {workout.goal ? (
                                  <p className="text-xs text-white/70">Goal: {workout.goal}</p>
                                ) : null}
                                <button
                                  onClick={() => navigate(`/admin/addworkouts/${workout.id}`)}
                                  className="text-xs mt-2 px-2 py-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 rounded transition-colors"
                                >
                                  View Details →
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ---- DIET PLANS SECTION ---- */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-white/80 flex items-center gap-2">
                          <Apple className="w-4 h-4 text-green-400" /> ASSIGNED DIET PLANS ({memberDiets.length})
                        </h4>
                        {memberDiets.length === 0 ? (
                          <p className="text-sm text-white/50 italic">No diet plans assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {memberDiets.map((diet) => (
                              <div key={diet.id} className="bg-white/5 border border-green-500/30 rounded-lg p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold text-green-300">{diet.title || "Unnamed Diet Plan"}</p>
                                    <p className="text-xs text-white/60">{diet.duration || 0} days • {diet.total_calories || diet.totalCalories || 0} kcal</p>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                                    {diet.status || "Active"}
                                  </span>
                                </div>
                                {diet.trainer_name || diet.trainerName ? (
                                  <p className="text-xs text-white/70">Trainer: <span className="text-cyan-300">{diet.trainer_name || diet.trainerName}</span></p>
                                ) : null}
                                <button
                                  onClick={() => navigate(`/admin/alladddietplans`)}
                                  className="text-xs mt-2 px-2 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded transition-colors"
                                >
                                  View Details →
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ---- ACTION BUTTONS ---- */}
                      <div className="flex gap-2 pt-4 border-t border-white/10">
                        <button
                          onClick={() => navigate('/admin/addworkouts')}
                          className="flex-1 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Dumbbell className="w-4 h-4" /> Add Workout
                        </button>
                        <button
                          onClick={() => navigate('/admin/adddietplans')}
                          className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Apple className="w-4 h-4" /> Add Diet Plan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberComprehensiveView;
