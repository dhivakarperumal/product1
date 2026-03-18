import React, { useEffect, useState } from "react";
import AddressForm from "./AddressForm";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";

const UserAddresses = () => {
  const { user } = useAuth();
  const uid = user?.id;

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAddress, setEditAddress] = useState(null);
  // toggled whenever we need to reload addresses (after add/edit/delete)
  const [refreshFlag, setRefreshFlag] = useState(false);

  useEffect(() => {
    if (!uid) return;

    const fetchAddresses = async () => {
      try {
        const res = await api.get(`/addresses/user/${uid}`);
        setAddresses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("failed to load addresses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [uid, refreshFlag]);

  if (loading) {
    return <div className="p-10 text-center text-red-500">LOADING...</div>;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setEditAddress(null);
          setShowForm(true);
        }}
        className="bg-red-600 px-4 py-2 rounded"
      >
        ➕ Add Address
      </button>

      {showForm && (
        <AddressForm
          editAddress={editAddress}
          onClose={() => {
            setShowForm(false);
            // reload the list after the form closes
            setRefreshFlag((f) => !f);
            toast.success("Address saved");
          }}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-gray-900 border border-red-500/30 rounded-xl p-5 text-white"
          >
            <h3 className="font-bold text-red-500">{addr.name}</h3>

            <p className="text-sm">{addr.address}</p>
            <p className="text-sm text-gray-400">
              {addr.city}, {addr.state} - {addr.zip}
            </p>
            <p className="text-sm text-gray-400">{addr.country}</p>
            <p className="text-sm mt-2">📞 {addr.phone}</p>

            <div className="flex gap-4 mt-3">
              <button
                onClick={() => {
                  setEditAddress(addr);
                  setShowForm(true);
                }}
                className="text-sm text-red-400 hover:underline"
              >
                ✏ Edit
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm("Delete this address?")) return;
                  try {
                    await api.delete(`/addresses/${addr.id}`);
                    setAddresses(addresses.filter((a) => a.id !== addr.id));
                  } catch (err) {
                    console.error("failed to delete address", err);
                  }
                }}
                className="text-sm text-red-400 hover:underline"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAddresses;