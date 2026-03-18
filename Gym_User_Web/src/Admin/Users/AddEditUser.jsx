import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { db } from "../../firebase";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const AddEditUser = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const auth = getAuth();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
    role: "staff",
    active: true,
  });

  useEffect(() => {
    if (isEdit) {
      const loadUser = async () => {
        try {
          const snap = await getDoc(doc(db, "users", id));
          if (!snap.exists()) {
            toast.error("User not found");
            navigate(-1);
            return;
          }
          setForm((prev) => ({
            ...prev,
            ...snap.data(),
            password: "", // Don't load password
          }));
        } catch (err) {
          console.error("Error loading user:", err);
          toast.error("Failed to load user");
        }
      };
      loadUser();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.displayName?.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!form.username?.trim()) {
      newErrors.username = "Username is required";
    }

    if (!form.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!isEdit && !form.password?.trim()) {
      newErrors.password = "Password is required for new users";
    } else if (!isEdit && form.password?.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.role?.trim()) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        // Update existing user
        await updateDoc(doc(db, "users", id), {
          displayName: form.displayName,
          username: form.username,
          email: form.email,
          role: form.role,
          active: form.active,
          updatedAt: serverTimestamp(),
        });
        toast.success("User updated successfully");
      } else {
        // Create new user with auth
        const cred = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

        // Create user document in Firestore
        await addDoc(collection(db, "users"), {
          uid: cred.user.uid,
          displayName: form.displayName,
          username: form.username,
          email: form.email,
          role: form.role,
          active: form.active,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast.success("User created successfully");
      }

      setTimeout(() => navigate("/admin/users"), 800);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const ErrorText = ({ field }) =>
    errors[field] ? (
      <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
    ) : null;

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-white/95 text-gray-800 placeholder-gray-400 border border-white/40 shadow-lg shadow-black/10 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#0B3C8A] focus:border-white transition-all duration-200 ease-in-out disabled:bg-white/60 disabled:cursor-not-allowed";

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-6">
        {isEdit ? "Edit User" : "Add User"}
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Display Name */}
        <div>
          <label className="text-sm font-medium">Display Name *</label>
          <input
            type="text"
            name="displayName"
            placeholder="Enter full name"
            value={form.displayName}
            onChange={handleChange}
            className={`${inputClass} ${
              errors.displayName ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
          <ErrorText field="displayName" />
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-medium">Username *</label>
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            value={form.username}
            onChange={handleChange}
            className={`${inputClass} ${
              errors.username ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
          <ErrorText field="username" />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium">Email *</label>
          <input
            type="email"
            name="email"
            placeholder="Enter email address"
            value={form.email}
            onChange={handleChange}
            disabled={isEdit}
            className={`${inputClass} ${
              errors.email ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
          <ErrorText field="email" />
        </div>

        {/* Password (only for add) */}
        {!isEdit && (
          <div>
            <label className="text-sm font-medium">Password *</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password (min 6 characters)"
              value={form.password}
              onChange={handleChange}
              className={`${inputClass} ${
                errors.password ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
            <ErrorText field="password" />
          </div>
        )}

        {/* Role */}
        <div>
          <label className="text-sm font-medium">Role *</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={`${inputClass} ${
              errors.role ? "border-red-500 focus:ring-red-500" : ""
            }`}
          >
            <option value="">Select role</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="staff">Staff</option>
            <option value="patient">Patient</option>
          </select>
          <ErrorText field="role" />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3 pt-6">
          <label className="text-sm font-medium">Active Status</label>
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
            className="w-5 h-5 rounded"
          />
          <span className="text-sm text-gray-600">
            {form.active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Actions */}
        <div className="col-span-2 flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border px-6 py-2 rounded hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditUser;
