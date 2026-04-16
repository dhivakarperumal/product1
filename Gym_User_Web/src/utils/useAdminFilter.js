import { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";

/**
 * Hook to get the admin ID that created the current member
 * This filters data so members only see items from their admin
 */
export const useAdminFilter = () => {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || user.role !== "member") {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchAdminId = async () => {
      try {
        // Fetch member profile to get created_by (admin UUID)
        const res = await api.get(`/members/${user.id}`, {
          signal: abortController.signal
        });

        if (res.data) {
          // created_by is the admin UUID who created this member
          const admin = res.data.created_by || res.data.adminId || res.data.admin_id;
          setAdminId(admin);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error("Failed to fetch member admin info:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminId();

    return () => abortController.abort();
  }, [user?.id, user?.role]);

  return {
    adminId,
    loading,
    isFiltered: user?.role === "member" && !!adminId,
  };
};

/**
 * Build query params for filtering by admin
 */
export const getAdminFilterParams = (adminId) => {
  if (!adminId) return "";
  return `?created_by=${encodeURIComponent(adminId)}`;
};

/**
 * Build query string with admin filter
 */
export const buildAdminFilteredUrl = (baseUrl, adminId) => {
  if (!adminId) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}created_by=${encodeURIComponent(adminId)}`;
};
