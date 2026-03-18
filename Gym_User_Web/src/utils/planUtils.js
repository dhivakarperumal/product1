// Previous Firestore utilities have been replaced by simple API wrappers.
import api from "../api";

/**
 * Fetch all plan entries for a given user.
 * Backend route /api/members/:userId/plans should return an array of objects
 * with a `status` field so the client can determine active/inactive.
 */
export const getUserPlans = async (userId) => {
  if (!userId) return [];
  try {
    const res = await api.get(`/members/${userId}/plans`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("getUserPlans error", err);
    return [];
  }
};

export const getUserActivePlan = async (userId) => {
  const plans = await getUserPlans(userId);
  return plans.find((p) => p.status === "active") || null;
};

// stubbed legacy helpers
export const validateUserPlans = async () => true;
export const validatePlanReference = async () => true;

