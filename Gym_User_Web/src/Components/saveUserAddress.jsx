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
 * Non-blocking: silently fails if user doesn't exist yet
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
    // Silently ignore if user doesn't exist (404) - address can be saved later
    if (err.response?.status === 404) {
      console.warn("User not found in database yet. Address save skipped (non-blocking).");
      return;
    }
    if (err.response?.data?.message?.includes("exists")) {
      throw new Error("DUPLICATE_ADDRESS");
    }
    // For other errors, log but don't block checkout
    console.warn("Address save failed (non-blocking):", err.message);
  }
};