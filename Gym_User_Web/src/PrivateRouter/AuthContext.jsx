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
        setUser(u);
        setRole(u.role || null);
      }
    } catch (err) {
      console.error("failed to parse stored user", err);
      localStorage.removeItem("user");
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) localStorage.setItem("token", token);
    setUser(userData);
    setRole(userData.role || null);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
    cache.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
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
