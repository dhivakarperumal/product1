import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { FaArrowLeft } from "react-icons/fa";

/* ---------------- CONSTANTS ---------------- */

const bloodGroups = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

import api from "../../api";

// Note: backend should provide staff endpoints. Frontend will POST/PUT to `/staff`.

/* ---------------- COMPONENT ---------------- */
const inputClass = "w-full bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white placeholder-slate-400 shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"


const AddEditStaff = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const generateEmployeeId = async () => {
    try {
      const res = await api.get('/staff/generate-employee-id');
      if (res.data && res.data.employeeId) return res.data.employeeId;
    } catch (err) {
      console.warn('generateEmployeeId api failed, falling back', err?.message);
    }

    // fallback: timestamp-based id
    return `EMP${String(Date.now()).slice(-6)}`;
  };

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    employeeId: "",
    role: "",
    department: "",
    gender: "",
    bloodGroup: "",
    dob: "",
    joiningDate: "",
    qualification: "",
    experience: "",
    shift: "",
    salary: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    status: "active",
    timeIn: "",
    timeOut: "",

    photo: "",
    aadharDoc: "",
    idDoc: "",
    certificateDoc: "",
  });

  const [previewFile, setPreviewFile] = useState(null);

  // Helper function to format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    if (typeof dateValue === 'string') {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
      // If it has time component or other format, parse and extract date part
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    }
    return "";
  };

  /* ---------------- LOAD STAFF (EDIT ONLY) ---------------- */

  useEffect(() => {
    const initialize = async () => {
      if (!isEdit) return;
      try {
        const res = await api.get(`/staff/${id}`);
        const data = res.data;
        if (!data) {
          toast.error('Staff not found');
          navigate(-1);
          return;
        }

        // Map backend snake_case to frontend camelCase
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          employeeId: data.employee_id || "",
          role: data.role || "",
          department: data.department || "",
          gender: data.gender || "",
          bloodGroup: data.blood_group || "",
          dob: formatDateForInput(data.dob),
          joiningDate: formatDateForInput(data.joining_date),
          qualification: data.qualification || "",
          experience: data.experience || "",
          shift: data.shift || "",
          salary: data.salary || "",
          address: data.address || "",
          emergencyName: data.emergency_name || "",
          emergencyPhone: data.emergency_phone || "",
          status: data.status || "active",
          timeIn: data.time_in ? data.time_in.slice(0, 5) : "",
          timeOut: data.time_out ? data.time_out.slice(0, 5) : "",
          photo: data.photo || "",
          aadharDoc: data.aadhar_doc || "",
          idDoc: data.id_doc || "",
          certificateDoc: data.certificate_doc || "",
          password: "",
        }));
      } catch (err) {
        console.error('Error loading staff:', err);
        toast.error('Failed to load staff details');
      }
    };

    initialize();
  }, [id, isEdit, navigate]);

  /* ---------------- INPUT HANDLER WITH AUTO-POPULATION ---------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-populate username from email
    if (name === "email") {
      const usernameFromEmail = value.split("@")[0];
      setForm((prev) => ({
        ...prev,
        [name]: value,
        username: usernameFromEmail, // Auto-set username from email
      }));
    }
    // Auto-populate password from phone number
    else if (name === "phone") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        password: value, // Auto-set password from phone number
      }));
    }
    else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* ---------------- FILE UPLOAD ---------------- */

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isDoc = file.type.includes('document') || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (isImage) {
        // Compress images to ~600KB. 
        // Note: DB columns MUST be MEDIUMTEXT or LONGTEXT to handle this correctly.
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.6, 
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });

        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        setForm((prev) => ({ ...prev, [field]: base64 }));
        toast.success("Image uploaded (compressed)");
      } else if (isPdf || isDoc) {
        // For documents, we don't compress but we must limit size to prevent DB truncation
        if (file.size > 1.5 * 1024 * 1024) { // 1.5MB Limit
          return toast.error("Document too large. Max 1.5MB allowed.");
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          setForm((prev) => ({ ...prev, [field]: base64 }));
          toast.success("Document uploaded");
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Format not supported. Use Image, PDF, or Word.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed");
    }
  };

  const openPreview = (file, fileName) => {
    setPreviewFile({ data: file, name: fileName });
  };

  /* ---------------- VALIDATION FUNCTION ---------------- */

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!form.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation (only for new staff)
    if (!isEdit) {
      if (!form.password?.trim()) {
        newErrors.password = "Password is required";
      } else if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    // Phone validation
    if (!form.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    // Username validation (auto-filled but check)
    if (!form.username?.trim()) {
      newErrors.username = "Username is required";
    }

    // Role validation
    if (!form.role?.trim()) {
      newErrors.role = "Role is required";
    }

    // Department validation
    if (!form.department?.trim()) {
      newErrors.department = "Department is required";
    }

    // Salary validation
    if (!form.salary?.trim()) {
      newErrors.salary = "Salary is required";
    } else if (isNaN(form.salary) || form.salary <= 0) {
      newErrors.salary = "Please enter a valid salary amount";
    }

    // Shift validation (optional)
    // if (!form.shift?.trim()) {
    //   newErrors.shift = "Shift is required";
    // }

    // Gender validation
    if (!form.gender?.trim()) {
      newErrors.gender = "Gender is required";
    }

    // Blood Group validation (optional)
    // if (!form.bloodGroup?.trim()) {
    //   newErrors.bloodGroup = "Blood group is required";
    // }

    // Date of Birth validation (optional)
    if (form.dob?.trim()) {
      const dobDate = new Date(form.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 18) {
        newErrors.dob = "Staff must be at least 18 years old";
      }
    }

    // Joining Date validation (optional)
    // if (!form.joiningDate?.trim()) {
    //   newErrors.joiningDate = "Joining Date is required";
    // }

    // Address validation (optional)
    if (form.address?.trim() && form.address.length < 3) {
      newErrors.address = "Address must be at least 3 characters";
    }

    // Time In validation (optional)
    // if (!form.timeIn?.trim()) {
    //   newErrors.timeIn = "Time In is required";
    // }

    // Time Out validation (optional)
    if (form.timeIn && form.timeOut && form.timeOut <= form.timeIn) {
      newErrors.timeOut = "Time Out must be after Time In";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- SUBMIT WITH VALIDATION ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      let staffData = { ...form };

      // Generate Employee ID only for new staff when submitting
      if (!isEdit && !form.employeeId) {
        const empId = await generateEmployeeId();
        staffData.employeeId = empId;
      }

      const {
        password,
        photo,
        aadharDoc,
        idDoc,
        certificateDoc,
        ...finalStaffData
      } = staffData;

      // Map frontend camelCase to backend snake_case
      const payload = {
        ...finalStaffData,
        employee_id: finalStaffData.employeeId,
        blood_group: finalStaffData.bloodGroup,
        joining_date: finalStaffData.joiningDate,
        emergency_name: finalStaffData.emergencyName,
        emergency_phone: finalStaffData.emergencyPhone,
        time_in: finalStaffData.timeIn,
        time_out: finalStaffData.timeOut,
        aadhar_doc: aadharDoc || null,
        id_doc: idDoc || null,
        certificate_doc: certificateDoc || null,
        photo: photo || null,
        // include password if creating new user; backend may handle auth creation
        password: !isEdit ? password : undefined,
      };

      try {
        if (isEdit) {
          await api.put(`/staff/${id}`, payload);
          toast.success('Staff updated successfully');
        } else {
          await api.post('/staff', payload);
          toast.success('Staff added successfully');
        }
        setTimeout(() => navigate('/admin/staff'), 800);
      } catch (err) {
        console.error(err);
        throw err;
      }

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save staff");
    } finally {
      setLoading(false);
    }
  };


  /* ---------------- UI ---------------- */

  const ErrorText = ({ field }) =>
    errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field]}</p> : null;

  const PreviewModal = () => {
    if (!previewFile) return null;

    const isImage = previewFile.data.startsWith('data:image');
    const isPdf = previewFile.data.startsWith('data:application/pdf');

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
            <h3 className="text-lg font-semibold">{previewFile.name}</h3>
            <button onClick={() => setPreviewFile(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
          </div>
          <div className="p-4 flex items-center justify-center min-h-[400px]">
            {isImage ? (
              <img src={previewFile.data} alt="Preview" className="max-w-full max-h-[70vh] rounded" />
            ) : isPdf ? (
              <iframe src={previewFile.data} className="w-full h-[70vh] rounded border" />
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">📄 Document Preview</p>
                <a href={previewFile.data} download={previewFile.name} className="text-blue-600 hover:underline">
                  Download Document
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-semibold text-white">
            {isEdit ? "Edit Staff Member" : "Add New Staff Member"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-8">

              {/* BASIC INFORMATION */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-6">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      name="name"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.name ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="name" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={form.email}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="email" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      name="phone"
                      placeholder="Enter phone number"
                      value={form.phone}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.phone ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="phone" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username
                    </label>
                    <input
                      name="username"
                      placeholder="Auto-generated from email"
                      value={form.username}
                      onChange={handleChange}
                      className={`${inputClass} bg-slate-950/50`}
                      readOnly
                    />
                    <ErrorText field="username" />
                  </div>

                  {!isEdit && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Auto-generated from phone number"
                        value={form.password}
                        onChange={handleChange}
                        className={`${inputClass} bg-slate-950/50 ${errors.password ? "border-red-500 focus:ring-red-500" : ""}`}
                        readOnly
                      />
                      <p className="text-xs text-slate-400 mt-1">Login credentials will be set to the phone number</p>
                      <ErrorText field="password" />
                    </div>
                  )}
                </div>
              </div>

              {/* WORK DETAILS */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-6">Work Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Employee ID
                    </label>
                    <input
                      name="employeeId"
                      placeholder="Auto-generated on submit"
                      value={form.employeeId}
                      onChange={handleChange}
                      className={`${inputClass} bg-slate-950/50`}
                      readOnly
                    />
                    <ErrorText field="employeeId" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.role ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    >
                      <option value="" className="bg-slate-950 text-slate-400">Select role</option>
                      <option value="trainer" className="bg-slate-950 text-white">Trainer</option>
                      <option value="personal_trainer" className="bg-slate-950 text-white">Personal Trainer</option>
                      <option value="gym_manager" className="bg-slate-950 text-white">Gym Manager</option>
                      <option value="receptionist" className="bg-slate-950 text-white">Receptionist</option>
                      <option value="nutritionist" className="bg-slate-950 text-white">Nutritionist</option>
                      <option value="security" className="bg-slate-950 text-white">Security</option>
                    </select>
                    <ErrorText field="role" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Department *
                    </label>
                    <input
                      name="department"
                      placeholder="Enter department"
                      value={form.department}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.department ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="department" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Salary *
                    </label>
                    <input
                      type="number"
                      name="salary"
                      placeholder="Enter salary"
                      value={form.salary}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.salary ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="salary" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Shift *
                    </label>
                    <input
                      name="shift"
                      placeholder="Enter shift (e.g., Morning, Evening)"
                      value={form.shift}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.shift ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="shift" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={form.joiningDate}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.joiningDate ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="joiningDate" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Time In *
                    </label>
                    <input
                      type="time"
                      name="timeIn"
                      value={form.timeIn}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.timeIn ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="timeIn" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Time Out *
                    </label>
                    <input
                      type="time"
                      name="timeOut"
                      value={form.timeOut}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.timeOut ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="timeOut" />
                  </div>
                </div>
              </div>

              {/* PERSONAL DETAILS */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-6">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.gender ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    >
                      <option value="" className="bg-slate-950 text-slate-400">Select gender</option>
                      <option value="Male" className="bg-slate-950 text-white">Male</option>
                      <option value="Female" className="bg-slate-950 text-white">Female</option>
                      <option value="Other" className="bg-slate-950 text-white">Other</option>
                    </select>
                    <ErrorText field="gender" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Blood Group *
                    </label>
                    <select
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.bloodGroup ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    >
                      <option value="" className="bg-slate-950 text-slate-400">Select blood group</option>
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg} className="bg-slate-950 text-white">
                          {bg}
                        </option>
                      ))}
                    </select>
                    <ErrorText field="bloodGroup" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.dob ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="dob" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Qualification
                    </label>
                    <input
                      name="qualification"
                      placeholder="Enter qualification"
                      value={form.qualification}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      placeholder="Enter experience in years"
                      value={form.experience}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      placeholder="Enter full address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      className={`${inputClass} resize-none ${errors.address ? "border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    <ErrorText field="address" />
                  </div>
                </div>
              </div>

              {/* EMERGENCY CONTACT */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-6">Emergency Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      name="emergencyName"
                      placeholder="Enter emergency contact name"
                      value={form.emergencyName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      name="emergencyPhone"
                      placeholder="Enter emergency contact phone"
                      value={form.emergencyPhone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* DOCUMENTS */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-6">Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "photo")}
                      className={inputClass}
                    />
                    {form.photo && (
                      <div className="mt-2 flex gap-2 items-center">
                        {form.photo.startsWith('data:image') ? (
                          <img src={form.photo} alt="Photo preview" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="p-2 bg-white/5 rounded border border-white/10 text-xs text-slate-400">
                            Invalid Photo Data
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openPreview(form.photo, "photo.jpg")}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Aadhar Card
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, "aadharDoc")}
                      className={inputClass}
                    />
                    {form.aadharDoc && (
                      <div className="mt-2 flex gap-2 items-center">
                        {form.aadharDoc.startsWith('data:image') ? (
                          <img src={form.aadharDoc} alt="Aadhar preview" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="p-2 bg-white/5 rounded border border-white/10 text-xs text-slate-400">📄 Aadhar Doc</div>
                        )}
                        <button
                          type="button"
                          onClick={() => openPreview(form.aadharDoc, "aadhar")}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      ID Proof
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, "idDoc")}
                      className={inputClass}
                    />
                    {form.idDoc && (
                      <div className="mt-2 flex gap-2 items-center">
                        {form.idDoc.startsWith('data:image') ? (
                          <img src={form.idDoc} alt="ID Proof preview" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="p-2 bg-white/5 rounded border border-white/10 text-xs text-slate-400">📄 ID Proof</div>
                        )}
                        <button
                          type="button"
                          onClick={() => openPreview(form.idDoc, "idproof")}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Certificate
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, "certificateDoc")}
                      className={inputClass}
                    />
                    {form.certificateDoc && (
                      <div className="mt-2 flex gap-2 items-center">
                        {form.certificateDoc.startsWith('data:image') ? (
                          <img src={form.certificateDoc} alt="Certificate preview" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="p-2 bg-white/5 rounded border border-white/10 text-xs text-slate-400">📄 Certificate</div>
                        )}
                        <button
                          type="button"
                          onClick={() => openPreview(form.certificateDoc, "certificate")}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex justify-end gap-4 pt-8 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  {isEdit ? "Update Staff" : "Save Staff"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <PreviewModal />
    </div>
  );
};

export default AddEditStaff;
