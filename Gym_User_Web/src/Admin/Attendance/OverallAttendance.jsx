

import { useEffect, useState, useMemo } from "react";
import { Search, Download, Users, CheckCircle, XCircle, MapPin, Calendar, RefreshCcw, Save, Check, Clock } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";

/* ================= CONFIG ================= */
const GYM_LOCATION = {
  lat: 12.479724, // Tirupattur Gym Location
  lng: 78.573769,
  radius: 1000, // 1km radius
  name: "Tirupattur Gym Main Office"
};

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ status }) => {
  const map = {
    Present: "bg-green-500/20 text-green-400",
    Absent: "bg-red-500/20 text-red-400",
    Late: "bg-yellow-500/20 text-yellow-400",
    "On Leave": "bg-blue-500/20 text-blue-400",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${map[status] || "bg-white/10 text-white/60"}`}>
      {status}
    </span>
  );
};

const OverallAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [attendanceStates, setAttendanceStates] = useState({}); // { staffId: boolean }
  const [showMarkModal, setShowMarkModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dateRange, setDateRange] = useState({ type: 'Today', range: null }); // Default to Today
  const [loading, setLoading] = useState(false);
  const [savingMulti, setSavingMulti] = useState(false);

  // Geo Location States
  const [locationStatus, setLocationStatus] = useState("idle");
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    loadAttendanceData();
    loadStaffMembers();
  }, [dateRange, date]); // Reload when date or range changes

  /* ---------------- DISTANCE CALCULATION ---------------- */
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c * 1000; // Distance in meters
  };

  /* ---------------- DATA FETCHING ---------------- */
  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      // If filtering by a specific date, pass it. Otherwise fetch all and filter in frontend
      let url = '/attendance';
      if (dateRange.type === 'Today' || dateRange.type === 'Yesterday') {
        const d = dateRange.type === 'Today' ? dayjs() : dayjs().subtract(1, 'day');
        url += `?date=${d.format("YYYY-MM-DD")}`;
      }
      
      const res = await api.get(url);
      setAttendanceData(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    try {
      // Fetch all users to allow marking attendance for anyone (Staff or Members)
      const res = await api.get('/users');
      const allUsers = res.data || [];
      
      // Filter to only include Trainers
      const trainers = allUsers.filter(u => 
        u.role?.toLowerCase() === 'trainer' || 
        u.role?.toLowerCase() === 'staff'
      );
      
      // Map to consistent format
      const formatted = trainers.map(u => ({
        id: u.id,
        name: u.username || u.email || "Trainer",
        email: u.email,
        role: u.role || 'Trainer'
      }));

      setStaffMembers(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    }
  };

  /* ---------------- GEOLOCATION LOGIC ---------------- */
  const verifyLocation = () => {
    setLocationStatus("checking");
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setLocationStatus("failed");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        
        // Auto-mark based on distance
        const dist = getDistance(latitude, longitude, GYM_LOCATION.lat, GYM_LOCATION.lng);
        const isAtGym = dist <= GYM_LOCATION.radius;

        const newStates = {};
        staffMembers.forEach(s => {
          newStates[s.id] = isAtGym;
        });
        setAttendanceStates(newStates);

        try {
          const resProxy = await api.get(`/attendance/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          setLocationName(resProxy.data.display_name || (isAtGym ? GYM_LOCATION.name : "External Location"));
          setLocationStatus("verified");
          if (isAtGym) {
            toast.success(`Verified at Gym Location! Staff auto-marked as Present.`);
          } else {
            toast.warning(`Outside Gym Area (${Math.round(dist)}m away). Staff auto-marked as Absent.`);
          }
        } catch (err) {
          setLocationName(isAtGym ? GYM_LOCATION.name : "External Location");
          setLocationStatus("verified");
        }
      },
      () => {
        toast.error("Location access denied.");
        setLocationStatus("failed");
      },
      { enableHighAccuracy: true }
    );
  };

  /* ---------------- MARK ATTENDANCE ---------------- */
  const handleSaveAll = async () => {
    if (locationStatus !== "verified") {
      return toast.error("Please verify location first!");
    }

    setSavingMulti(true);
    try {
      const promises = staffMembers.map(async (staff) => {
        const isPresent = attendanceStates[staff.id] || false;
        const statusText = isPresent ? "Present" : "Absent";
        
        const payload = {
          memberId: staff.id,
          status: statusText,
          role: staff.role, // Added role to payload
          date: date,
          lat: currentCoords?.lat || null,
          lng: currentCoords?.lng || null,
          locationName: locationName || null,
        };
        return api.post('/attendance', payload);
      });

      await Promise.all(promises);
      toast.success("Attendance updated successfully");
      setShowMarkModal(false);
      loadAttendanceData();
    } catch (err) {
      console.error(err);
      toast.error("Error saving attendance");
    } finally {
      setSavingMulti(false);
    }
  };

  /* ---------------- HELPERS ---------------- */
  const filteredRecords = useMemo(() => {
    const trainersOnly = attendanceData.filter(r => {
      // Only show trainers or staff
      const isTrainer = 
        r.role?.toLowerCase() === 'trainer' || 
        r.role?.toLowerCase() === 'staff';
      return isTrainer;
    });

    // 1. Date Filter
    let rangeFiltered = trainersOnly;
    if (dateRange.type !== 'All Time') {
      // Map check_in to 'date' if 'date' field is missing or inconsistent
      const dataWithUnifiedDate = trainersOnly.map(r => ({
        ...r,
        recordDate: r.date || r.check_in
      }));
      rangeFiltered = filterByDateRange(dataWithUnifiedDate, 'recordDate', dateRange.type, dateRange.range);
    }

    // 2. Search & Status
    return rangeFiltered.filter(r => {
      const name = r.name || r.email || "Unknown";
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceData, searchTerm, statusFilter, dateRange]);

  const stats = useMemo(() => {
    const present = filteredRecords.filter(r => r.status === "Present").length;
    const absent = filteredRecords.filter(r => r.status === "Absent").length;
    return { present, absent, total: filteredRecords.length };
  }, [filteredRecords]);

  const downloadCSV = () => {
    if (!filteredRecords.length) return toast.error("No data to download");
    let csv = "Name,Role,Status,Log Time,Location\n";
    filteredRecords.forEach(r => {
      csv += `"${r.name}","${r.role || 'Staff'}","${r.status}","${r.check_in ? dayjs(r.check_in).format("h:mm A") : '-'}","${r.location_name || '-'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${date}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen p-6 text-white space-y-8 bg-transparent">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent italic">
            TRAINER ATTENDANCE
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2 font-medium">
            <Users className="w-5 h-5 text-orange-500" /> Trainer Management • {staffMembers.length} Active Trainers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter 
            initialRange="Today"
            onRangeChange={(type, range) => setDateRange({ type, range })} 
          />
          
          <button
            onClick={() => setShowMarkModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-red-600/20 flex items-center gap-3"
          >
            <CheckCircle className="w-6 h-6" /> Mark Today
          </button>
          
          <button
            onClick={downloadCSV}
            className="p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-orange-500"
            title="Download CSV"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Logs", val: stats.total, color: "blue", icon: Users },
          { label: "Present Today", val: stats.present, color: "green", icon: CheckCircle },
          { label: "Absent Today", val: stats.absent, color: "red", icon: XCircle },
        ].map((s, idx) => (
          <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex items-center justify-between group hover:border-orange-500/50 transition-all">
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-1">{s.label}</p>
              <h3 className={`text-5xl font-black ${s.color === "green" ? "text-green-400" : s.color === "red" ? "text-red-400" : "text-white"}`}>
                {s.val}
              </h3>
            </div>
            <s.icon className={`w-12 h-12 opacity-20 group-hover:opacity-100 transition-all text-${s.color}-500`} />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
         <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all shadow-sm"
            />
         </div>

         <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {["All", "Present", "Absent"].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  statusFilter === f ? "bg-orange-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {/* TABLE */}
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] hide-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
              <tr>
                <th className="px-10 py-6">Staff Member</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-32 text-gray-500 animate-pulse font-bold tracking-widest uppercase">Initializing Database...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-32 text-gray-600 italic font-medium">No records matching criteria for this date.</td></tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition group">
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-xs">
                             {r.name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-black group-hover:text-orange-400 transition-colors uppercase text-sm tracking-tight">{r.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold">{r.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40">
                          {r.role || 'Staff'}
                       </span>
                    </td>
                    <td className="px-10 py-6 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                           <MapPin className={`w-4 h-4 ${r.lat ? 'text-green-500' : 'text-white/10'}`} />
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase leading-none">{r.location_name || 'No GPS'}</p>
                              <p className="text-[10px] font-bold text-gray-600 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {r.check_in ? dayjs(r.check_in).format("h:mm A") : "-"}</p>
                           </div>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHECKLIST MODAL */}
      {showMarkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setShowMarkModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#0d0e12] border border-white/20 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
             <div className="bg-gradient-to-br from-red-600 to-orange-500 p-10 flex justify-between items-center">
                <div>
                   <h3 className="text-3xl font-black text-white italic">STAFF CHECKLIST</h3>
                   <p className="text-white/80 mt-1 uppercase text-xs font-black tracking-widest">{dayjs(date).format("DD MMMM YYYY")}</p>
                </div>
                <button onClick={() => setShowMarkModal(false)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition">
                   <XCircle className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-8 hide-scrollbar">
                {/* LOCATION VERIFIER */}
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Auto-Detect Presence</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${locationStatus === 'verified' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-600'}`}>
                         {locationStatus === 'verified' ? 'Location Confirmed' : 'Waiting for GPS'}
                      </span>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={verifyLocation}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase text-xs transition-all ${
                           locationStatus === 'verified' 
                           ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                           : "bg-orange-500 text-white hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20"
                        }`}
                      >
                         {locationStatus === 'checking' ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                         {locationStatus === 'verified' ? 'Sync Location Again' : 'Verify My Location'}
                      </button>
                   </div>
                   
                   <div className="flex flex-col gap-3 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase">Trainer Current Location</p>
                          <p className="text-xs font-bold text-white truncate max-w-[300px]">
                            {locationName || (locationStatus === "checking" ? "Fetching..." : "Not Verified")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-px bg-white/5 w-full" />
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase">Gym Office Location</p>
                          <p className="text-xs font-bold text-white uppercase italic">{GYM_LOCATION.name}</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] px-2">Daily Attendance Roster</p>
                   {staffMembers.length === 0 ? (
                     <div className="text-center py-10 text-gray-600 italic">Finding staff members...</div>
                   ) : (
                     staffMembers.map(member => {
                       const isChecked = attendanceStates[member.id] || false;
                       return (
                         <div 
                           key={member.id} 
                           onClick={() => setAttendanceStates({...attendanceStates, [member.id]: !isChecked})}
                           className={`flex items-center justify-between p-5 rounded-3xl border transition-all cursor-pointer group ${
                             isChecked 
                               ? "bg-green-500/10 border-green-500/30" 
                               : "bg-white/5 border-white/5 hover:border-white/20"
                           }`}
                         >
                            <div className="flex items-center gap-5">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${isChecked ? "bg-green-500 text-white scale-110" : "bg-white/10 text-gray-400"}`}>
                                  {member.name?.charAt(0) || "S"}
                               </div>
                               <div>
                                  <p className={`font-black uppercase tracking-tight transition-colors ${isChecked ? "text-green-400" : "text-white group-hover:text-orange-400"}`}>{member.name}</p>
                                  <p className="text-[10px] text-gray-500 font-bold uppercase">{member.role || 'Staff'}</p>
                               </div>
                            </div>
                            
                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                               isChecked ? "bg-green-500 border-green-500 scale-125 shadow-lg shadow-green-500/40" : "bg-transparent border-white/10"
                            }`}>
                               {isChecked && <Check className="w-5 h-5 text-white" />}
                            </div>
                         </div>
                       );
                     })
                   )}
                </div>
             </div>

             <div className="p-10 bg-white/5 border-t border-white/10 flex gap-6">
                <button 
                  type="button" 
                  onClick={() => setShowMarkModal(false)} 
                  className="px-8 py-5 text-gray-500 font-black uppercase text-xs tracking-widest hover:text-white transition"
                >
                  Close
                </button>
                <button 
                  type="button" 
                  disabled={savingMulti || locationStatus !== "verified"}
                  onClick={handleSaveAll}
                  className={`flex-1 py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    locationStatus === "verified" 
                    ? "bg-gradient-to-r from-red-600 to-orange-500 shadow-red-600/30" 
                    : "bg-gray-800 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {savingMulti ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {savingMulti ? "Finalizing..." : "Save Staff Records"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallAttendance;
