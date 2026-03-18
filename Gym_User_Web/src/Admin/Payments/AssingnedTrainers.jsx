import { useEffect, useState } from "react";
import api from "../../api"; // backend HTTP client
import cache from "../../cache";
import { Users, Dumbbell, Mail, Phone, Calendar, AlertCircle, Search, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";

const AssingnedTrainers = () => {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, assigned, unassigned
  const [viewMode, setViewMode] = useState("card"); // card, table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });

  /* ================= FETCH MEMBERSHIPS ================= */
  useEffect(() => {
    const fetchMembers = async () => {
      if (cache.adminAssignmentsMembers) {
        setMembers(cache.adminAssignmentsMembers);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get("/memberships");
        const membershipsData = Array.isArray(res.data) ? res.data : [];
 
        const usersData = membershipsData.map((m) => ({
          uid: m.userId || `m_${m.id}`,
          membershipId: m.id,
          username: m.username || m.userName || "No Name",
          email: m.email || m.userEmail || "",
          userEmail: m.userEmail || m.email || "",
          workoutCount: 0, 
          dietCount: 0,
          plans: [{
            id: m.id.toString(),
            planName: m.planName,
            duration: m.duration,
            startDate: m.startDate,
            endDate: m.endDate,
            pricePaid: m.pricePaid,
          }],
          source: "memberships",
        }));

        setMembers(usersData);
        cache.adminAssignmentsMembers = usersData;
      } catch (error) {
        console.error("Error fetching memberships:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  /* ================= FETCH TRAINERS ================= */
  useEffect(() => {
    const fetchTrainers = async () => {
      if (cache.adminTrainers) {
        setTrainers(cache.adminTrainers);
      }
      try {
        const res = await api.get("/staff", { params: { role: "trainer" } });
        const trainers = Array.isArray(res.data) ? res.data : [];
        const normalized = trainers.map((t) => ({
          id: t.id.toString(),
          name: t.name || t.username || "Trainer",
          email: t.email || "",
          source: "staff",
        }));
        setTrainers(normalized);
        cache.adminTrainers = normalized;
      } catch (err) {
        console.error("Error fetching trainers:", err);
      }
    };

    fetchTrainers();
  }, []);

  /* ================= FETCH TRAINER ASSIGNMENTS ================= */
  useEffect(() => {
    const fetchAssignments = async () => {
      if (cache.adminAssignments) {
        setAssignments(cache.adminAssignments);
      }
      try {
        const res = await api.get("/assignments");
        const assignData = {};
        (Array.isArray(res.data) ? res.data : []).forEach((a) => {
          const userId = a.userId?.toString();
          if (!assignData[userId]) assignData[userId] = [];
          assignData[userId].push(a);
        });
        setAssignments(assignData);
        cache.adminAssignments = assignData;
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    fetchAssignments();
  }, []);



  /* ================= ASSIGN / REASSIGN TRAINER ================= */
 const assignTrainer = async () => {
  if (selectedUsers.length === 0) {
    alert("Select at least one member");
    return;
  }

  if (!selectedTrainer) {
    alert("Select a trainer");
    return;
  }

  const trainer = trainers.find((t) => t.id === selectedTrainer);
  if (!trainer) {
    alert("Trainer not found");
    return;
  }

  const safeTrainerName = trainer.name || trainer.username || trainer.email || "Trainer";

  setAssigning(true);
  try {
    const payload = [];
    for (const member of members.filter((m) => selectedUsers.includes(m.uid))) {
      for (const plan of member.plans) {
        payload.push({
          userId: member.uid,
          username: member.username || "No Name",
          userEmail: member.email || "",
          planId: plan.id,
          planName: plan.planName,
          planDuration: plan.duration,
          planStartDate: plan.startDate,
          planEndDate: plan.endDate,
          planPrice: plan.pricePaid,
          trainerId: trainer.id,
          trainerName: safeTrainerName,
          trainerSource: trainer.source || "staff",
          status: "active",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await api.post("/assignments", { assignments: payload });

    alert("Trainer assigned / reassigned successfully");
    setShowAssignModal(false);
    setSelectedUsers([]);
    setSelectedTrainer("");

    // refresh assignments list
    const res = await api.get("/assignments");
    const assignData = {};
    (Array.isArray(res.data) ? res.data : []).forEach((a) => {
      const userId = a.userId?.toString();
      if (!assignData[userId]) assignData[userId] = [];
      assignData[userId].push(a);
    });
    setAssignments(assignData);
    cache.adminAssignments = assignData;
  } catch (err) {
    console.error(err);
    alert("Assignment failed");
  } finally {
    setAssigning(false);
  }
};

  /* ================= FILTER & SEARCH LOGIC ================= */
  const filteredMembers = members.filter((m) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      m.username?.toLowerCase().includes(searchLower) ||
      m.email?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Filter type
    let matchesType = true;
    if (filterType === "assigned") {
      matchesType = assignments[m.uid] && assignments[m.uid].length > 0;
    } else if (filterType === "unassigned") {
      matchesType = !assignments[m.uid] || assignments[m.uid].length === 0;
    }

    if (!matchesType) return false;

    // Date Range Filter (using startDate of first plan)
    const firstPlanDate = (m.plans || []).length > 0 ? m.plans[0].startDate : null;
    return filterByDateRange([{ date: firstPlanDate }], 'date', dateRange.type, dateRange.range).length > 0;
  });

  // 📄 PAGINATION LOGIC
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-white" dir="ltr">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Assign Trainers</h1>
          <p className="text-gray-400 text-sm mt-1">Manage trainer assignments for members with active plans</p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold"
        >
          <Dumbbell size={20} />
          Assign New Trainer
        </button>
      </div>

      {/* SEARCH AND FILTER */}
     <div className="mb-8">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    
    {/* 🔍 Search Bar — Left */}
    <div className="relative w-full md:w-1/3">
      <Search className="absolute left-4 top-3 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* 🎛 Filter Buttons — Right */}
    <div className="flex flex-wrap gap-3 justify-start md:justify-end items-center">
      <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />
      <button
        onClick={() => handleFilterChange("all")}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          filterType === "all"
            ? "bg-orange-500 text-white"
            : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
        }`}
      >
        All Members
      </button>

      <button
        onClick={() => handleFilterChange("assigned")}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          filterType === "assigned"
            ? "bg-green-500 text-white"
            : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
        }`}
      >
        ✓ Assigned
      </button>

      <button
        onClick={() => handleFilterChange("unassigned")}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          filterType === "unassigned"
            ? "bg-red-500 text-white"
            : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
        }`}
      >
        ✗ Not Assigned
      </button>

      {/* 🖥 View Toggle */}
      <div className="flex bg-white/10 p-1 rounded-xl border border-white/20 ml-0 md:ml-4">
        <button
          onClick={() => setViewMode("card")}
          className={`p-2 rounded-lg transition ${
            viewMode === "card" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
          }`}
          title="Card View"
        >
          <LayoutGrid size={20} />
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`p-2 rounded-lg transition ${
            viewMode === "table" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
          }`}
          title="Table View"
        >
          <List size={20} />
        </button>
      </div>
    </div>

  </div>
</div>


      {/* MEMBERS WITH TRAINERS */}
      <div className="grid gap-6">
        {loading && !cache.adminAssignmentsMembers ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Mapping Personnel</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No members found
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No matching members found
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedData.map((m) => (
              <div
                key={m.uid}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:border-white/40 transition backdrop-blur-lg"
              >
                {/* MEMBER HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{m.username || "No Name"}</p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-400 mt-1">
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          {m.email || "No Email"}
                        </div>
                        {m.userEmail && m.userEmail !== m.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span className="underline">{m.userEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm">
                    <div className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                      <span className="text-blue-300 font-medium">Plans: {m.plans?.length || 0}</span>
                    </div>
                    <div className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                      <span className="text-purple-300 font-medium">W: {m.workoutCount || 0}</span>
                    </div>
                    <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                      <span className="text-green-300 font-medium">D: {m.dietCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* ASSIGNED TRAINERS */}
                {assignments[m.uid] && assignments[m.uid].length > 0 ? (
                  <div className="space-y-3">
                    {assignments[m.uid].map((assign) => (
                      <div
                        key={assign.id}
                        className="bg-white/5 border border-green-400/30 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                            <Dumbbell size={18} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-green-300">{assign.trainerName || "Trainer"}</p>
                            <p className="text-xs text-gray-400">
                              {assign.planName} • {assign.planDuration}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-cyan-300">₹ {assign.planPrice}</p>
                            <p className="text-[10px] text-gray-500">{new Date(assign.planEndDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">No Trainer Assigned</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ================= TABLE VIEW ================= */
          <div className="overflow-x-auto bg-white/5 rounded-2xl border border-white/20 backdrop-blur-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/10 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Member</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Trainer</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Plan</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Dates</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedData.map((m) => {
                  const assigned = assignments[m.uid] || [];
                  return (
                    <tr key={m.uid} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{m.username}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        {assigned.length > 0 ? (
                          assigned.map((a) => (
                            <div key={a.id} className="text-green-300 font-medium">
                              {a.trainerName}
                            </div>
                          ))
                        ) : (
                          <span className="text-red-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {m.plans?.map((p) => (
                          <div key={p.id}>
                            <p className="text-blue-300 font-medium">{p.planName}</p>
                            <p className="text-[10px] text-gray-500">{p.duration} • ₹{p.pricePaid}</p>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        {m.plans?.map((p) => (
                          <div key={p.id} className="text-[10px] text-gray-400">
                            <div>S: {new Date(p.startDate).toLocaleDateString()}</div>
                            <div>E: {new Date(p.endDate).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black ${
                          assigned.length > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {assigned.length > 0 ? "Assigned" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 📄 PAGINATION UI */}
        {filteredMembers.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-white/10">
            <div className="text-sm text-gray-400">
              Showing <span className="text-white font-medium">{startIndex + 1}</span> to{" "}
              <span className="text-white font-medium">
                {Math.min(startIndex + itemsPerPage, filteredMembers.length)}
              </span>{" "}
              of <span className="text-white font-medium">{filteredMembers.length}</span> members
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ================= ASSIGN POPUP ================= */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/70 z-9999 flex items-center justify-center p-4" dir="ltr">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-3xl shadow-2xl">
            
            {/* 🔹 TITLE */}
            <h2 className="text-2xl font-bold mb-6 text-center">Assign Trainer</h2>

            {/* 🔹 MEMBER SELECT */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Members (Only members with active plans):</label>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 bg-black/20 rounded-xl p-3 border border-white/10">
                {members.filter((m) => (m.plans?.length || 0) > 0 && (!assignments[m.uid] || assignments[m.uid].length === 0)).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No unassigned members with plans found</p>
                ) : (
                  members
                    .filter((m) => (m.plans?.length || 0) > 0 && (!assignments[m.uid] || assignments[m.uid].length === 0))
                    .map((m) => (
                    <label
                      key={m.uid}
                      className="flex items-start gap-3 bg-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition border border-white/10"
                    >
                      <input
                        type="checkbox"
                        className="accent-orange-500 mt-1 shrink-0"
                        disabled={assigning}
                        checked={selectedUsers.includes(m.uid)}
                        onChange={(e) => {
                          setSelectedUsers((prev) =>
                            e.target.checked
                              ? [...new Set([...prev, m.uid])]
                              : prev.filter((id) => id !== m.uid)
                          );
                        }}
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-semibold text-white">{m.username || "No Name"}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                        <p className="text-xs text-cyan-400 mt-1">
                          {m.plans?.length || 0} plans
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* 🔹 SELECTED COUNT */}
            {selectedUsers.length > 0 && (
              <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg px-4 py-3 mb-6 text-sm">
                <p className="text-orange-300 font-semibold">Selected {selectedUsers.length} member(s)</p>
              </div>
            )}

            {/* 🔹 TRAINER SELECT */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Trainer:</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                disabled={assigning}
                className={`w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  assigning ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="">-- Select Trainer --</option>
                {trainers.length === 0 ? (
                  <option disabled>No trainers available</option>
                ) : (
                  trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.username} 
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 🔹 ACTION BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
                className="flex-1 px-4 py-3 bg-gray-500/30 rounded-lg text-white hover:bg-gray-500/40 transition font-medium disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={assignTrainer}
                disabled={assigning || !selectedTrainer || selectedUsers.length === 0}
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white font-medium transition hover:shadow-lg ${
                  assigning || !selectedTrainer || selectedUsers.length === 0
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
              >
                {assigning ? "Assigning..." : "Assign Trainer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssingnedTrainers;
