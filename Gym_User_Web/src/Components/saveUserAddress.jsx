import api from "../api";

export const buildAddressHash = (data) =>
  [
    data.name,
    data.phone,
    data.email,
    data.address,
    data.city,
    data.state,
    data.zip,
    data.country,
  ]
    .map((v) => (v || "").trim().toLowerCase())
    .join("|");

/**
 * SAVE USER ADDRESS (NO DUPLICATES)
 * Used by BOTH Checkout & AddressForm
 */
export const saveUserAddress = async (
  userId,
  addressData,
  addressId = null
) => {
  if (!userId) return;

  // ensure the payload includes user id
  const payload = { user_id: userId, ...addressData };

  try {
    if (addressId) {
      // Update existing address
      await api.put(`/addresses/${addressId}`, payload);
    } else {
      // Create new address
      await api.post("/addresses", payload);
    }
  } catch (err) {
    console.error("saveUserAddress error", err.response || err);
    if (err.response?.data?.message?.includes("exists")) {
      throw new Error("DUPLICATE_ADDRESS");
    }
    throw err;
  }
};