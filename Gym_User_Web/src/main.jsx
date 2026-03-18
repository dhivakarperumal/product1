import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import Home from "./Home/Home.jsx";

import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";

// ✅ Lazy components
const Login = lazy(() => import("./Components/Login.jsx"));
const Register = lazy(() => import("./Components/Register.jsx"));

// Example protected pages
const AdminPanel = lazy(() => import("./Admin/AdminPanel.jsx"));
const Dashboard = lazy(() => import("./Admin/Dashboard/Dashboard.jsx"));

const TrainerAdminPanel = lazy(() =>
  import("./TrainerAdminPanel/TrainerAdminPanel.jsx")
);
const TrainerDashboard = lazy(() =>
  import("./TrainerAdminPanel/TrainerDashboard/TrainerDashboard.jsx")
);

// ✅ Router setup
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },

      // ✅ LOGIN ROUTE (important)
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },

  // ✅ Admin protected
  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <AdminPanel />
      </PrivateRoute>
    ),
    children: [{ index: true, element: <Dashboard /> }],
  },

  // ✅ Trainer protected
  {
    path: "/trainer",
    element: (
      <PrivateRoute allowedRoles={["trainer"]}>
        <TrainerAdminPanel />
      </PrivateRoute>
    ),
    children: [{ index: true, element: <TrainerDashboard /> }],
  },
]);

// ✅ Render
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <AuthProvider>
        {/* 🔔 Toast */}
        <Toaster position="top-left" />

        {/* ✅ REQUIRED for lazy */}
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);