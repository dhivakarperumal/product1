import React, { useEffect, useState } from "react";
import {
  FaStar,
  FaTrash,
  FaPlus,
  FaArrowLeft,
  FaImage,
  FaCheckCircle,
  FaSearch,
  FaEdit,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import api from "../../api";

/* ================= STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30";

const ReviewsSettings = () => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    rating: 0,
    message: "",
    image: "",
  });

  /* ================= FETCH ================= */
  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      toast.error('Failed to load reviews');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  /* ================= IMAGE ================= */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () =>
        setForm((p) => ({ ...p, image: reader.result }));
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("Image upload failed");
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.rating) {
      toast.error("Please select rating");
      return;
    }

    try {
      if (editId) {
        await api.put(`/reviews/${editId}`, {
          name: form.name,
          rating: Number(form.rating),
          message: form.message,
          image: form.image,
        });
        toast.success("Review updated");
      } else {
        await api.post('/reviews', {
          name: form.name,
          rating: Number(form.rating),
          message: form.message,
          image: form.image,
          status: 0,
        });
        toast.success("Review added");
      }

      setForm({ name: "", rating: 0, message: "", image: "" });
      setEditId(null);
      setShowModal(false);
      fetchReviews();
    } catch (err) {
      console.error('Error saving review:', err);
      toast.error(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleEdit = (r) => {
    setEditId(r.id);
    setForm({
      name: r.name,
      rating: r.rating,
      message: r.message,
      image: r.image || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Deleted");
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error("Failed to delete review");
    }
  };

  const toggleStatus = async (review) => {
    try {
      await api.put(`/reviews/${review.id}`, {
        name: review.name,
        rating: review.rating,
        message: review.message,
        image: review.image,
        status: !review.status,
      });

      fetchReviews();
    } catch (err) {
      console.error("Error updating review status:", err);
      toast.error("Failed to update review status");
    }
  };
  
  const filtered = reviews.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-white">

      {/* HEADER */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
      >
        <FaArrowLeft /> Back
      </button>

      {/* SEARCH + ADD */}
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="relative w-full max-w-sm">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search member feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${glassInput} pl-11`}
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-3 rounded-xl text-white font-semibold
bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition shadow-lg"
        >
          <FaPlus className="inline mr-2" />
          Add Review
        </button>
      </div>

      {/* LIST */}
      <div className="grid gap-4">
        {filtered.map((r) => (
          <div key={r.id} className={`${glassCard} p-5 flex gap-4`}>

            {/* IMAGE */}
            {r.image ? (
              <img
                src={r.image}
                className="w-16 h-16 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <FaImage className="text-gray-400" />
              </div>
            )}

            {/* CONTENT */}
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar
                        key={i}
                        className={
                          i <= r.rating
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-3 items-center">
                  {/* APPROVE / PENDING */}
                  <button
                    onClick={() => toggleStatus(r)}
                    title={r.status ? "Approved" : "Pending"}
                    className={`
      p-2 rounded-lg transition
      border border-white/20 backdrop-blur-md
      ${r.status
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                      }
    `}
                  >
                    <FaCheckCircle className="text-lg" />
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => handleEdit(r)}
                    title="Edit Review"
                    className="
      p-2 rounded-lg
      bg-yellow-500/80 hover:bg-yellow-500
      text-white transition
      shadow
    "
                  >
                    <FaEdit />
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() => handleDelete(r.id)}
                    title="Delete Review"
                    className="
      p-2 rounded-lg
      bg-red-500/80 hover:bg-red-500
      text-white transition
      shadow
    "
                  >
                    <FaTrash />
                  </button>
                </div>

              </div>

              <p className="text-sm text-gray-300 mt-2">
                {r.message}
              </p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400">
            No gym reviews found
          </p>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className={`${glassCard} w-full max-w-md p-6 space-y-4`}
          >
            <h3 className="text-lg font-semibold">
              {editId ? "Edit Review" : "Add Gym Review"}
            </h3>

            <input
              placeholder="Member name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={glassInput}
              required
            />

            <input type="file" accept="image/*" onChange={handleImageUpload} />

            {form.image && (
              <img
                src={form.image}
                className="w-20 h-20 rounded-full"
              />
            )}

            {/* RATING */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <FaStar
                  key={i}
                  onClick={() => setForm({ ...form, rating: i })}
                  className={`cursor-pointer text-2xl ${i <= form.rating
                    ? "text-yellow-400"
                    : "text-gray-500"
                    }`}
                />
              ))}
            </div>

            <textarea
              placeholder="Member feedback"
              rows={3}
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              className={glassInput}
              required
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20"
              >
                Cancel
              </button>
              <button className="px-8 py-3 rounded-xl text-white font-semibold
bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition shadow-lg">
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReviewsSettings;
