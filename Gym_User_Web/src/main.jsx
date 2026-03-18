import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import Home from "./Home/Home.jsx";

import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import Trainers from "./Components/Trainers.jsx";
import TrainerDetails from "./Components/TrainersDetails.jsx";
import FacilitiesSwiper from "./Components/FacilitiesSwiper.jsx";
import Contact from "./Components/Contact.jsx";
import Facilities from "./Components/Facilities.jsx";
import Account from "./Components/Account.jsx";
import FacilityDetail from "./Components/FacilityDetail.jsx";
import Pricing from "./Components/Pricing.jsx";
import BuyPlan from "./Components/BuyPlan.jsx";
import Products from "./Pages/Products.jsx";
import Cart from "./Components/Cart.jsx";
import Checkout from "./Components/Checkout.jsx";
import ProductDetails from "./Components/ProductDetails.jsx";
import Services from "./Components/Services.jsx";
import ServicesDetails from "./Components/ServicesDetails.jsx";
import ClassesTable from "./Components/ClassesTable.jsx";


// User Panel Components
import UserPanel from "./UserPanel/UserPanel.jsx";
import UsesDashboard from "./UserPanel/DashBoard/DashBoard.jsx";
import UserDiet from "./UserPanel/Diet/Diet.jsx";
import UserFacilities from "./UserPanel/Facilities/Facilities.jsx";
import UserPlans from "./UserPanel/Plans/Plans.jsx";
import UserPricing from "./UserPanel/Pricings/Pricing.jsx";
import UserWorkouts from "./UserPanel/Workouts/Workouts.jsx";
import UserProducts from "./UserPanel/Products/Products.jsx";
import UserProductDetails from "./UserPanel/Products/ProductDetails.jsx";
import UserCart from "./UserPanel/Products/Cart.jsx";
import UserCheckout from "./UserPanel/Products/Checkout.jsx";
import Orders from "./UserPanel/Orders/Orders.jsx";

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
      // { index: true, element: <Navigate to="/login" replace /> },
      { path: "/", element: <Home /> },
      { path: "/trainers", element: <Trainers /> },
      { path: "trainersdetails/:id", element: <TrainerDetails /> },
      { path: "facilities", element: <Facilities /> },
      { path: "account", element: <Account /> },
      { path: "facilities/:slug", element: <FacilityDetail /> },
      { path: "pricing", element: <Pricing /> },
      { path: "buy-plan", element: <BuyPlan /> },
      { path: "products", element: <Products /> },
      { path: "/cart", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/products/:id", element: <ProductDetails /> },
      { path: "/services", element: <Services /> },
      { path: "/services/:slug", element: <ServicesDetails /> },
      { path: "/calendar", element: <ClassesTable /> },
      { path: "/contact", element: <Contact /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ]
  },

  {
    path: "/user",
    element: (
      <PrivateRoute allowedRoles={["user"]}>
        <UserPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <UsesDashboard /> },
      { path: "diet", element: <UserDiet /> },
      { path: "facilities", element: <UserFacilities /> },
      { path: "plans", element: <UserPlans /> },
      { path: "pricing", element: <UserPricing /> },
      { path: "workouts", element: <UserWorkouts /> },
      { path: "products", element: <UserProducts /> },
      { path: "products", element: <UserProducts /> }, // All Products
      { path: "products/:id", element: <UserProductDetails /> }, // Details
      { path: "cart", element: <UserCart /> },
      { path: "checkout", element: <UserCheckout /> },
      { path: "orders", element: <Orders /> },
      { path: "pricing", element: <UserPricing /> },

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