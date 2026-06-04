import { createContext, useContext, useEffect, useState } from "react";
import cache from "../cache";

// simple auth context backed by localStorage (backend JWT)
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // read from localStorage once on mount
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const normalizedRole = String(u.role || "").toLowerCase();
        setUser({ ...u, role: normalizedRole });
        setRole(normalizedRole || null);
      }
    } catch (err) {
      console.error("failed to parse stored user", err);
      localStorage.removeItem("user");
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    const normalizedUserData = {
      ...userData,
      role: String(userData.role || "").toLowerCase(),
    };

    localStorage.setItem("user", JSON.stringify(normalizedUserData));
    if (token) localStorage.setItem("token", token);
    setUser(normalizedUserData);
    setRole(normalizedUserData.role || null);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
    cache.clear();
  };

  const profileName =
    user?.profileName ||
    user?.name ||
    user?.displayName ||
    user?.username ||
    "Admin";

  const email = user?.email || "";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        profileName,
        email,
        userProfile: user,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
