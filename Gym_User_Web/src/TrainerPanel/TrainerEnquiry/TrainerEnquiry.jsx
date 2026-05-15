import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import api from "../../api";
import DateRangeFilter from "../../Admin/DateRangeFilter";
import { filterByDateRange } from "../../Admin/utils/dateUtils";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

const CustomDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.right - 200,
      width: "200px",
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/20 text-sm w-full"
      >
        <span>
          {options.find((opt) => opt.value === value)?.label || label}
        </span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-[#1e293b] border border-white/10 rounded-xl shadow-xl p-2"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  value === opt.value
                    ? "bg-orange-500 text-white"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

const TrainerEnquiry = () => {
  const { user, role } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [showForm, setShowForm] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    location: "",
    height: "",
    weight: "",
    bmi: "",
    status: "pending",
    planId: "",
    trainerId: "",
  });

  useEffect(() => {
    if (formData.height && formData.weight) {
      const h = parseFloat(formData.height) / 100;
      const w = parseFloat(formData.weight);
      if (h > 0) {
        const bmiVal = (w / (h * h)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi: bmiVal }));
      }
    } else {
      setFormData(prev => ({ ...prev, bmi: "" }));
    }
  }, [formData.height, formData.weight]);

  useEffect(() => {
    fetchEnquiries();
    fetchPlans();
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const response = await api.get('/staff');
      const data = Array.isArray(response.data) ? response.data : [];
      const trainerRows = data.filter((staff) =>
        String(staff.role || '').toLowerCase() === 'trainer'
      );

      let filteredTrainers = trainerRows;
      if (role?.toLowerCase() === 'trainer' && user) {
        const userId = String(user.id || user.userId || user.user_id || user.employee_id || user.employeeId || '').trim();
        const userEmail = String(user.email || '').toLowerCase().trim();
        const userName = String(user.username || user.name || '').toLowerCase().trim();

        const loginTrainerRows = trainerRows.filter((staff) => {
          const staffId = String(staff.id || '').trim();
          const staffEmployeeId = String(staff.employee_id || staff.employeeId || '').trim();
          const staffEmail = String(staff.email || '').toLowerCase().trim();
          const staffName = String(staff.username || staff.name || '').toLowerCase().trim();

          return (
            (userId && (staffId === userId || staffEmployeeId === userId)) ||
            (userEmail && staffEmail === userEmail) ||
            (userName && staffName === userName)
          );
        });

        if (loginTrainerRows.length > 0) {
          filteredTrainers = loginTrainerRows;
        }
      }

      setTrainers(filteredTrainers);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      setTrainers([]);
    }
  }, [role, user]);

  useEffect(() => {
    if (role?.toLowerCase() === 'trainer' && !user) return;
    fetchTrainers();
  }, [user, role, fetchTrainers]);

  const fetchEnquiries = async () => {
    try {
      setError(null);
      const response = await api.get('/enquiries');
      const data = Array.isArray(response.data) ? response.data : [];
      setEnquiries(data);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setError('Failed to load enquiries');
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans');
      const data = Array.isArray(response.data) ? response.data : [];
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedEnquiry) {
        await api.put(`/enquiries/${selectedEnquiry.id}`, formData);
        toast.success("Enquiry updated successfully");
      } else {
        await api.post('/enquiries', formData);
        toast.success("Enquiry created successfully");
      }
      fetchEnquiries();
      setShowForm(false);
      setSelectedEnquiry(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        location: "",
        height: "",
        weight: "",
        bmi: "",
        status: "pending",
        planId: "",
        trainerId: "",
      });
    } catch (error) {
      console.error('Error saving enquiry:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save enquiry';

      if (errorMessage.includes('Phone already exists for this admin')) {
        toast.error("Phone number already exists for this admin");
      } else if (errorMessage.includes('Email already exists for this admin')) {
        toast.error("Email address already exists for this admin");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const resolvePlanIdForEdit = (planId) => {
    if (!planId) return "";
    const resolvedPlan = plans.find(
      (plan) => String(plan.plan_id) === String(planId) || String(plan.id) === String(planId)
    );
    return resolvedPlan?.plan_id || String(planId);
  };

  const resolveTrainerIdForEdit = (trainerId) => {
    if (!trainerId) return "";
    const resolvedTrainer = trainers.find(
      (trainer) => String(trainer.employee_id) === String(trainerId) || String(trainer.id) === String(trainerId)
    );
    return resolvedTrainer?.employee_id || String(trainerId);
  };

  const resolveTrainerDisplay = (trainerId) => {
    if (!trainerId) return "Unassigned";
    const resolvedTrainer = trainers.find(
      (trainer) => String(trainer.employee_id) === String(trainerId) || String(trainer.id) === String(trainerId)
    );
    if (resolvedTrainer) {
      return resolvedTrainer.username || resolvedTrainer.name || resolvedTrainer.email || resolvedTrainer.employee_id || String(trainerId);
    }
    return String(trainerId);
  };

  const handleEdit = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setFormData({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone || "",
      subject: enquiry.subject || "",
      message: enquiry.message,
      location: enquiry.location || "",
      height: enquiry.height || "",
      weight: enquiry.weight || "",
      bmi: enquiry.bmi || "",
      status: enquiry.status || 'pending',
      planId: resolvePlanIdForEdit(enquiry.plan_id || enquiry.planId || ""),
      trainerId: resolveTrainerIdForEdit(enquiry.trainer_id || enquiry.trainerId || ""),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        await api.delete(`/enquiries/${id}`);
        fetchEnquiries();
        toast.success("Enquiry deleted successfully");
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        toast.error("Failed to delete enquiry");
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/enquiries/${id}/status`, { status });
      fetchEnquiries();
      toast.success(`Enquiry status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update enquiry status");
    }
  };

  const handleMoveToMembers = async (enquiry) => {
    if (!window.confirm('Convert this enquiry into a member?')) return;

    const phoneValue = enquiry.phone || enquiry.mobile || enquiry.mobile_number || enquiry.contact || '';
    const emailValue = enquiry.email || enquiry.email_address || enquiry.contact_email || '';
    const usernameValue = enquiry.name ? enquiry.name.replace(/\s+/g, '').toLowerCase() : '';

    if (!phoneValue || !emailValue) {
      toast.error('Conversion requires both phone and email. Please update the enquiry first.');
      return;
    }

    try {
      const memberData = {
        username: usernameValue,
        email: emailValue,
        mobile: phoneValue,
        password: phoneValue || 'password123',
        role: 'member',
        admin_id: user?.id || null,
      };

      await api.post('/auth/register-member', memberData);
      toast.success(`Member created successfully. Login using email/username/phone and password.`);
      await updateStatus(enquiry.id, 'completed');
    } catch (err) {
      console.error('Error moving to members:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create member';

      if (errorMessage.includes('Phone already exists')) {
        toast.error("Phone number already exists");
      } else if (errorMessage.includes('Email already exists') || errorMessage.includes('username already exists')) {
        toast.error("Email or username already exists");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || enquiry.status === statusFilter;
    if (!(matchesSearch && matchesStatus)) return false;

    return filterByDateRange([enquiry], 'created_at', dateRange.type, dateRange.range).length > 0;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'interested':
        return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      case 'call u later':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'extra':
        return <CheckCircle className="w-4 h-4 text-violet-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[2rem] bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Enquiry Management</h1>
              <p className="text-white/60 text-sm">Manage customer enquiries and convert to members</p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-medium transition-colors border border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20"
          >
            <Plus size={18} />
            Add Enquiry
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search enquiries by name, email, phone, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

              <CustomDropdown
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: "All Status", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Interested", value: "interested" },
                  { label: "Call U Later", value: "call u later" },
                  { label: "Extra", value: "extra" },
                  { label: "Completed", value: "completed" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-white">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">S.No</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Customer</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Phone</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Message</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Trainer</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Date</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries && filteredEnquiries.length > 0 ? (
                  filteredEnquiries.map((enquiry, ind) => (
                    <tr key={enquiry.id} className="border-b border-white/5 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{ind + 1}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white font-medium">{enquiry.name}</div>
                            <div className="text-gray-400 text-sm">{enquiry.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white">{enquiry.phone || 'No phone'}</td>
                        <td className="px-6 py-4 text-white">{enquiry.message || 'No message'}</td>
                        <td className="px-6 py-4 text-white">
                          <div>{enquiry.trainer_display_name || resolveTrainerDisplay(enquiry.trainer_id || enquiry.trainerId)}</div>
                        </td>
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          enquiry.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : enquiry.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {getStatusIcon(enquiry.status)}
                          {enquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(enquiry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(enquiry)}
                            className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-colors border border-blue-500/30"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => updateStatus(enquiry.id, 'completed')}
                            className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl transition-colors border border-green-500/30"
                            title="Mark Completed"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => updateStatus(enquiry.id, 'cancelled')}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors border border-red-500/30"
                            title="Mark Cancelled"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(enquiry.id)}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors border border-red-500/30"
                            title="Delete Enquiry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} className="opacity-30" />
                        <p className="text-lg font-medium">No enquiries found</p>
                        <p className="text-sm">Enquiries will appear here once submitted</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-x-hidden">
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-orange-500/50 rounded-[2rem] p-8 w-full max-w-full md:max-w-4xl mx-4 shadow-[0_40px_120px_rgba(0,0,0,0.35)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {selectedEnquiry ? 'View Enquiry Details' : 'Add New Enquiry'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedEnquiry(null);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      subject: "",
                      message: "",
                      location: "",
                      height: "",
                      weight: "",
                      bmi: "",
                      status: "pending",
                      planId: "",
                      trainerId: "",
                    });
                  }}
                  className="p-2 bg-slate-800/50 hover:bg-slate-800/70 rounded-xl transition-colors border border-white/10"
                >
                  <XCircle size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Message *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full min-h-30 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      placeholder="Enter enquiry details or message here"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      placeholder="e.g., Gym Branch Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Plan</label>
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    >
                      <option value="">Select Plan</option>
                      {plans.map((plan) => (
                        <option key={plan.plan_id || plan.id} value={plan.plan_id || plan.id}>
                          {plan.name || plan.title || plan.planName || 'Unnamed Plan'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Trainer</label>
                    <select
                      value={formData.trainerId || ""}
                      onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    >
                      <option value="">Select Trainer</option>
                      {trainers.map((trainer) => (
                        <option key={trainer.employee_id || trainer.id} value={trainer.employee_id || trainer.id}>
                          {trainer.username || trainer.name || trainer.email || 'Trainer'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    >
                      <option value="pending">Pending</option>
                      <option value="interested">Interested</option>
                      <option value="call u later">Call U Later</option>
                      <option value="extra">Extra</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      placeholder="Height in cm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      placeholder="Weight in kg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">BMI (Auto-calculated)</label>
                    <input
                      type="text"
                      value={formData.bmi}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/30 rounded-xl text-orange-400 font-bold focus:outline-none"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-medium transition-colors border border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20"
                  >
                    {selectedEnquiry ? 'Update Enquiry' : 'Create Enquiry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedEnquiry(null);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        subject: "",
                        message: "",
                        location: "",
                        height: "",
                        weight: "",
                        bmi: "",
                        status: "pending",
                        planId: "",
                        trainerId: "",
                      });
                    }}
                    className="flex-1 px-6 py-3 bg-slate-800/50 text-gray-300 hover:bg-slate-800/70 rounded-xl font-medium transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerEnquiry;
