import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaMobileAlt, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaUserTie } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";

/* ================= STYLES ================= */
const glass =
  "bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden";

const glassCard =
  "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all";

const ViewStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/staff/${id}`);
        setStaff(res.data);
      } catch (err) {
        console.error("ViewStaff error:", err);
        toast.error("Failed to load staff details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse font-bold">Retrieving Profile</p>
      </div>
    );
  }

  if (!staff) return null;

  return (
    <div className="min-h-screen p-6 text-white bg-transparent">

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur border border-white/10 hover:bg-white/20 transition-all font-bold text-sm tracking-wide"
      >
        <FaArrowLeft className="text-orange-500" /> BACK TO STAFF
      </button>

      <div className={`max-w-6xl mx-auto ${glass}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3">

          {/* LEFT PANEL - Profile Header */}
          <div className="bg-gradient-to-br from-red-600/20 to-orange-500/20 p-10 flex flex-col items-center border-r border-white/10">
            <div className="relative group">
              {staff.photo ? (
                <img
                  src={staff.photo}
                  alt={staff.name}
                  className="h-48 w-48 rounded-[3rem] object-cover border-4 border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="h-48 w-48 rounded-[3rem] bg-white/5 flex items-center justify-center border-2 border-dashed border-white/20">
                  <FaUserTie className="text-7xl text-white/10" />
                </div>
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                {staff.role}
              </div>
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                {staff.name}
              </h2>
              <p className="text-orange-500 font-bold tracking-widest text-[10px] mt-1">
                ID: {staff.employee_id}
              </p>
            </div>

            <div className="w-full mt-10 space-y-4">
              <ProfileQuickLink icon={FaMobileAlt} label="MOBILE" value={staff.phone} />
              <ProfileQuickLink icon={FaEnvelope} label="EMAIL" value={staff.email} color="orange" />
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">ACCOUNT STATUS</p>
                <span className={`px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${staff.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {staff.status}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Detailed Info */}
          <div className="lg:col-span-2 p-10 space-y-10">
            
            <div className="grid md:grid-cols-2 gap-8">
              <InfoSection title="Work Schedule">
                <DataRow label="SHIFT" value={staff.shift} />
                <DataRow label="TIME IN" value={staff.time_in} />
                <DataRow label="TIME OUT" value={staff.time_out} />
                <DataRow label="SALARY" value={`₹${staff.salary}`} />
              </InfoSection>

              <InfoSection title="Experience">
                <DataRow label="DEPARTMENT" value={staff.department} />
                <DataRow label="EXPERIENCE" value={staff.experience} />
                <DataRow label="QUALIFICATION" value={staff.qualification} />
                <DataRow label="JOINED" value={staff.joining_date} />
              </InfoSection>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <InfoSection title="Personal Details">
                <DataRow label="GENDER" value={staff.gender} />
                <DataRow label="BLOOD GROUP" value={staff.blood_group} />
                <DataRow label="DOB" value={staff.dob} />
              </InfoSection>

              <InfoSection title="Emergency Contact" accent="red">
                <DataRow label="NAME" value={staff.emergency_name} />
                <DataRow label="PHONE" value={staff.emergency_phone} />
              </InfoSection>
            </div>

            <InfoSection title="Address & Location">
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <FaMapMarkerAlt className="text-2xl text-orange-500 shrink-0" />
                <p className="text-sm font-medium leading-relaxed text-white/80">{staff.address || "No address recorded"}</p>
              </div>
            </InfoSection>

            <InfoSection title="Identity Documents">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DocLink label="AADHAR CARD" file={staff.aadhar_doc} />
                <DocLink label="ID PROOF" file={staff.id_doc} />
                <DocLink label="CERTIFICATE" file={staff.certificate_doc} />
              </div>
            </InfoSection>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const ProfileQuickLink = ({ icon: Icon, label, value, color = "white" }) => (
  <div className="flex items-center gap-4 w-full p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
    <div className={`w-10 h-10 rounded-xl bg-${color === 'orange' ? 'orange' : 'white'}/10 flex items-center justify-center shrink-0`}>
      <Icon className={`text-${color === 'orange' ? 'orange' : 'white'}-500 text-lg`} />
    </div>
    <div className="overflow-hidden">
      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold truncate">{value || "N/A"}</p>
    </div>
  </div>
);

const InfoSection = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/80 mb-6 flex items-center gap-2">
      <div className="h-1 w-6 bg-orange-500 rounded-full" /> {title}
    </h3>
    <div className="grid gap-4">{children}</div>
  </div>
);

const DataRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5">
    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-white">{value || "—"}</span>
  </div>
);

const DocLink = ({ label, file }) => (
  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center gap-3 group hover:border-orange-500/50 transition-all cursor-pointer">
    {file ? (
       file.startsWith('data:image') ? (
         <img src={file} className="h-12 w-12 rounded object-cover opacity-50 group-hover:opacity-100 transition-all" alt={label} />
       ) : (
         <FaIdCard className="text-4xl text-white/20 group-hover:text-orange-500 transition-all" />
       )
    ) : (
      <FaIdCard className="text-4xl text-white/5" />
    )}
    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-all text-center leading-tight">
       {label}
    </span>
    {file && (
      <a href={file} download={`${label}.png`} className="text-[9px] font-black text-orange-500 uppercase hover:underline">Download</a>
    )}
  </div>
);

export default ViewStaff;
