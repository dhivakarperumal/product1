import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
import { saveUserAddress } from "./saveUserAddress";

const initialState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

const AddressForm = ({ editAddress, onClose }) => {
  const { user } = useAuth();
  const uid = user?.id;
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editAddress) setForm(editAddress);
  }, [editAddress]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  if (!uid) return;

  setLoading(true);
  setError("");

  try {
    await saveUserAddress(uid, form, editAddress?.id);
    // close the modal first so update isn't blocked
    onClose();
    toast.success("Address saved successfully");
  } catch (err) {
    console.error("AddressForm save error:", err);
    // check for duplicate error thrown by helper
    if (err.message === "DUPLICATE_ADDRESS") {
      setError("This address already exists.");
    } else if (err.response?.data?.error) {
      // server provided error object or message
      const msg = typeof err.response.data.error === 'string'
        ? err.response.data.error
        : err.response.data.error.message || err.response.data.error;
      setError(msg || "Something went wrong.");
    } else {
      setError("Something went wrong.");
    }
  } finally {
    setLoading(false);
  }
};
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-red-500/30 rounded-xl p-5 text-white space-y-3"
    >
      <h2 className="text-red-500 font-bold text-lg">
        {editAddress ? "Edit Address" : "Add Address"}
      </h2>

      {Object.keys(initialState).map((key) => (
        <input
          key={key}
          name={key}
          value={form[key]}
          onChange={handleChange}
          placeholder={key.toUpperCase()}
          required={key !== "email"}
          className="w-full bg-black border border-gray-700 p-2 rounded"
        />
      ))}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          disabled={loading}
          className="bg-red-600 px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="border px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddressForm;