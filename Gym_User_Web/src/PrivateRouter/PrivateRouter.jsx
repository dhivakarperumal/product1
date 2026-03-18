import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, role } = useAuth();

  if (user === undefined) {
    // still initializing
    return <div>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return (
      <div className="p-6 text-center text-red-600">
        You are not authorized to view this page
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
