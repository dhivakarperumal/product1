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
const inputClass = "mt-1 w-full  rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"


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
          dob: data.dob || "",
          joiningDate: data.joining_date || "",
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

    // Employee ID validation (only for edit mode - auto-generated for new staff)
    if (isEdit && !form.employeeId?.trim()) {
      newErrors.employeeId = "Employee ID is required";
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

    // Shift validation
    if (!form.shift?.trim()) {
      newErrors.shift = "Shift is required";
    }

    // Gender validation
    if (!form.gender?.trim()) {
      newErrors.gender = "Gender is required";
    }

    // Blood Group validation
    if (!form.bloodGroup?.trim()) {
      newErrors.bloodGroup = "Blood group is required";
    }

    // Date of Birth validation
    if (!form.dob?.trim()) {
      newErrors.dob = "Date of Birth is required";
    } else {
      const dobDate = new Date(form.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 18) {
        newErrors.dob = "Staff must be at least 18 years old";
      }
    }

    // Joining Date validation
    if (!form.joiningDate?.trim()) {
      newErrors.joiningDate = "Joining Date is required";
    }

    // Address validation
    if (!form.address?.trim()) {
      newErrors.address = "Address is required";
    } else if (form.address.length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    // Time In validation
    if (!form.timeIn?.trim()) {
      newErrors.timeIn = "Time In is required";
    }

    // Time Out validation
    if (!form.timeOut?.trim()) {
      newErrors.timeOut = "Time Out is required";
    } else if (form.timeIn && form.timeOut <= form.timeIn) {
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

     <div className="">
              <div>
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
                >
                  <FaArrowLeft /> Back
                </button>
              </div>
    <div className="w-full p-5 max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] border-white/10 rounded-2xl shadow-2xl p-8">
      <h3 className="text-lg font-semibold mb-6">
        {isEdit ? "Edit Staff" : "Add Staff"}
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">


        <div>
          <label className="text-sm font-medium">Name *</label>
          <input name="name" placeholder="Enter Name" value={form.name} onChange={handleChange}
            className={`${inputClass} ${errors.name ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="name" />
        </div>
        {/* USERNAME */}
        <div>
          <label className="text-sm font-medium">Username (Auto from Email)</label>
          <input name="username" placeholder="Auto-populated from email" value={form.username} onChange={handleChange}
            className={`${inputClass} ${errors.username ? "border-red-500 focus:ring-red-500" : ""}`} disabled readOnly />
          <ErrorText field="username" />
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-sm font-medium">Email *</label>
          <input name="email" placeholder="Enter Email Address" value={form.email} onChange={handleChange}
            className={`${inputClass} ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="email" />
        </div>

        {/* PASSWORD (ADD ONLY) */}
        {!isEdit && (
          <div>
            <label className="text-sm font-medium">
              Password <span className="text-xs text-gray-300">(set equal to phone number)</span>
            </label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Auto-populated from phone"
              className={`${inputClass} ${errors.password ? "border-red-500 focus:ring-red-500" : ""}`} disabled readOnly />
            <p className="text-xs text-gray-400 mt-1">Login credentials for the staff account will use this value.</p>
            <ErrorText field="password" />
          </div>
        )}

        {/* PHONE */}
        <div>
          <label className="text-sm font-medium">Phone *</label>
          <input name="phone" placeholder="Enter Phone Number" value={form.phone} onChange={handleChange}
            className={`${inputClass} ${errors.phone ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="phone" />
        </div>

        {/* NAME */}
        <div>
          <label className="text-sm font-medium">Salary *</label>
          <input name="salary" placeholder="Enter Salary" value={form.salary} onChange={handleChange}
            className={`${inputClass} ${errors.salary ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="salary" />
        </div>

        {/* SHIFT */}
        <div>
          <label className="text-sm font-medium">Shift *</label>
          <input name="shift" placeholder="Enter Shift" value={form.shift} onChange={handleChange}
            className={`${inputClass} ${errors.shift ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="shift" />
        </div>

        {/* EMPLOYEE ID */}
        <div>
          <label className="text-sm font-medium">Employee ID * (Auto-generated on submit)</label>
          <input name="employeeId" value={form.employeeId} onChange={handleChange}
            placeholder="Will be generated when adding"
            className={`${inputClass} ${errors.employeeId ? "border-red-500 focus:ring-red-500" : ""}`} disabled readOnly />
          <ErrorText field="employeeId" />
        </div>

        {/* ROLE */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">
            Role *
          </label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={`${inputClass} text-white ${errors.role ? "border-red-500 focus:ring-red-500" : ""}`}
          >
            <option value="" className="text-gray-400 bg-[#0f172a]">
              Select role
            </option>

            <option value="trainer" className="text-black bg-white">
              Trainer
            </option>
            <option value="personal_trainer" className="text-black bg-white">
              Personal Trainer
            </option>
            <option value="gym_manager" className="text-black bg-white">
              Gym Manager
            </option>
            <option value="receptionist" className="text-black bg-white">
              Receptionist
            </option>
            <option value="nutritionist" className="text-black bg-white">
              Nutritionist
            </option>
            <option value="security" className="text-black bg-white">
              Security
            </option>
          </select>

          <ErrorText field="role" />
        </div>



        {/* DEPARTMENT */}
        <div>
          <label className="text-sm font-medium">Department *</label>
          <input name="department" placeholder="Enter Department" value={form.department} onChange={handleChange}
            className={`${inputClass} ${errors.department ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="department" />
        </div>

        {/* GENDER */}
        <div>
          <label className="text-sm font-medium">Gender *</label>
          <select name="gender" value={form.gender} onChange={handleChange}
            className={`${inputClass} text-white ${errors.gender ? "border-red-500 focus:ring-red-500" : ""}`}>
            <option className="text-gray-400 bg-[#0f172a]" value="">Select gender</option>
            <option className="text-gray-400 bg-[#0f172a]" >Male</option>
            <option className="text-gray-400 bg-[#0f172a]" >Female</option>
            <option className="text-gray-400 bg-[#0f172a]" >Other</option>
          </select>
          <ErrorText field="gender" />
        </div>

        {/* BLOOD GROUP */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">
            Blood Group *
          </label>

          <select
            name="bloodGroup"
            value={form.bloodGroup}
            onChange={handleChange}
            className={`${inputClass} text-white ${errors.bloodGroup ? "border-red-500 focus:ring-red-500" : ""
              }`}
          >
            {/* Placeholder */}
            <option value="" className="text-gray-400 bg-[#0f172a]">
              Select blood group
            </option>

            {/* Options */}
            {bloodGroups.map((bg) => (
              <option
                key={bg}
                value={bg}
                className="text-black bg-white"
              >
                {bg}
              </option>
            ))}
          </select>

          <ErrorText field="bloodGroup" />
        </div>


        {/* DOB */}
        <div>
          <label className="text-sm font-medium">Date of Birth *</label>
          <input type="date" name="dob" value={form.dob} onChange={handleChange}
            className={`${inputClass} ${errors.dob ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="dob" />
        </div>

        {/* JOINING DATE */}
        <div>
          <label className="text-sm font-medium">Joining Date *</label>
          <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleChange}
            className={`${inputClass} ${errors.joiningDate ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="joiningDate" />
        </div>

        {/* TIME IN */}
        <div>
          <label className="text-sm font-medium">Time In (HH:MM) *</label>
          <input type="time" name="timeIn" value={form.timeIn} onChange={handleChange}
            className={`${inputClass} ${errors.timeIn ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="timeIn" />
        </div>

        {/* TIME OUT */}
        <div>
          <label className="text-sm font-medium">Time Out (HH:MM) *</label>
          <input type="time" name="timeOut" value={form.timeOut} onChange={handleChange}
            className={`${inputClass} ${errors.timeOut ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="timeOut" />
        </div>

        {/* ADDRESS */}
        <div className="col-span-2">
          <label className="text-sm font-medium">Address *</label>
          <textarea name="address" placeholder="Enter Address" value={form.address} onChange={handleChange}
            className={`${inputClass} ${errors.address ? "border-red-500 focus:ring-red-500" : ""}`} />
          <ErrorText field="address" />
        </div>

        {/* PHOTO */}
        <div>
          <label className="text-sm font-medium">Photo</label>
          <input type="file" accept="image/*"
            onChange={(e) => handleFileUpload(e, "photo")}
            className={inputClass} />
          {form.photo && (
            <div className="mt-2 flex gap-2 items-center">
              {form.photo.startsWith('data:image') ? (
                <img src={form.photo} alt="Photo preview" className="h-24 rounded border border-gray-300" />
              ) : (
                <div className="p-2 bg-white/5 rounded border border-white/10 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Invalid Photo Data
                </div>
              )}
              <button type="button" onClick={() => openPreview(form.photo, "photo.jpg")}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                Preview
              </button>
            </div>
          )}
        </div>

        {/* AADHAR */}
        <div>
          <label className="text-sm font-medium">Aadhar (Image/PDF)</label>
          <input type="file" accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, "aadharDoc")}
            className={inputClass} />
          {form.aadharDoc && (
            <div className="mt-2 flex gap-2 items-center">
              {form.aadharDoc.startsWith('data:image') ? (
                <img src={form.aadharDoc} alt="Aadhar preview" className="h-24 rounded border border-gray-300" />
              ) : (
                <div className="p-2 bg-gray-100 rounded border border-gray-300 text-sm">📄 Aadhar Doc</div>
              )}
              <button type="button" onClick={() => openPreview(form.aadharDoc, "aadhar")}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                Preview
              </button>
            </div>
          )}
        </div>

        {/* ID */}
        <div>
          <label className="text-sm font-medium">ID Proof (Image/PDF)</label>
          <input type="file" accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, "idDoc")}
            className={inputClass} />
          {form.idDoc && (
            <div className="mt-2 flex gap-2 items-center">
              {form.idDoc.startsWith('data:image') ? (
                <img src={form.idDoc} alt="ID Proof preview" className="h-24 rounded border border-gray-300" />
              ) : (
                <div className="p-2 bg-gray-100 rounded border border-gray-300 text-sm">📄 ID Proof</div>
              )}
              <button type="button" onClick={() => openPreview(form.idDoc, "idproof")}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                Preview
              </button>
            </div>
          )}
        </div>

        {/* CERTIFICATE */}
        <div>
          <label className="text-sm font-medium">Certificate (Image/PDF)</label>
          <input type="file" accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, "certificateDoc")}
            className={inputClass} />
          {form.certificateDoc && (
            <div className="mt-2 flex gap-2 items-center">
              {form.certificateDoc.startsWith('data:image') ? (
                <img src={form.certificateDoc} alt="Certificate preview" className="h-24 rounded border border-gray-300" />
              ) : (
                <div className="p-2 bg-white/5 rounded border border-white/10 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  📄 Certificate Doc
                </div>
              )}
              <button type="button" onClick={() => openPreview(form.certificateDoc, "certificate")}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                Preview
              </button>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="col-span-2 flex justify-end gap-4 mt-6">
          <button type="button" onClick={() => navigate(-1)}
            className="border border-orange-400 px-6 py-2 rounded">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition-all shadow-lg">
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>

      </form>

      <PreviewModal />
    </div>
    </div>
  );
};

export default AddEditStaff;
