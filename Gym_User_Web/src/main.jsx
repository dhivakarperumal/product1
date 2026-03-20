import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import Home from "./Home/Home.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import { CartProvider } from "./CartContext.jsx";
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
import PersonalDetails from "./UserPanel/PersonalDetails.jsx";
import Notification from "./UserPanel/Notification.jsx";
import UserSettings from "./UserPanel/Settingss/Settings.jsx";
import UserProfileSettings from "./UserPanel/Settingss/ProfileSettings.jsx";
import UserSecuritySettings from "./UserPanel/Settingss/SecuritySettings.jsx";
import UserHealthSettings from "./UserPanel/Settingss/HealthSettings.jsx";
import UserNotificationSettings from "./UserPanel/Settingss/NotificationSettings.jsx";
import UserPrivacySettings from "./UserPanel/Settingss/PrivacySettings.jsx";
import UserServices from "./UserPanel/Services/Services.jsx";
import UserTrainers from "./UserPanel/Trainers/Trainers.jsx";
import BuyNow from "./UserPanel/Pricings/BuyNow.jsx";
import ServiceDetails from "./UserPanel/Services/ServiceDetails.jsx";

// ✅ Lazy components
const Login = lazy(() => import("./Components/Login.jsx"));
const Register = lazy(() => import("./Components/Register.jsx"));

// Example protected pages
const AdminPanel = lazy(() => import("./Admin/AdminPanel.jsx"));
const Dashboard = lazy(() => import("./Admin/Dashboard/Dashboard.jsx"));

// ✅ Admin Route Components
const AdminMembers = lazy(() => import("./Admin/Members/Members.jsx"));
const UserManagement = lazy(() => import("./Admin/Settingss/UserManagement.jsx"));
const ReviewsSettings = lazy(() => import("./Admin/Settingss/Review.jsx"));
const AddMembers = lazy(() => import("./Admin/Members/AddMembers.jsx"));
const AdminSendMessage = lazy(() => import("./Admin/Members/SendMessage.jsx"));
const AdminEnquiry = lazy(() => import("./Admin/Enquiry/Enquiry.jsx"));
const AdminOrders = lazy(() => import("./Admin/Orders/AllOrders.jsx"));
const OrderDetails = lazy(() => import("./Admin/Orders/OrderDetails.jsx"));
const AdminProducts = lazy(() => import("./Admin/Products/AllProducts.jsx"));
const AddProducts = lazy(() => import("./Admin/Products/AddProducts.jsx"));
const ProductDetail = lazy(() => import("./Admin/Products/ProductDetail.jsx"));
const StockDetails = lazy(() => import("./Admin/Products/Stockdetails.jsx"));
const AddStock = lazy(() => import("./Admin/Products/AddStock.jsx"));
const AdminPlans = lazy(() => import("./Admin/Plans/PlansPage.jsx"));
const AddPlan = lazy(() => import("./Admin/Plans/AddPlans.jsx"));
const BuyPlanAdmin = lazy(() => import("./Admin/Plans/BuyPlan.jsx"));
const AdminFacilities = lazy(() => import("./Admin/Fecilieties/Fecilitiesall.jsx"));
const AddFacilities = lazy(() => import("./Admin/Fecilieties/Addfecilities.jsx"));
const AdminStaff = lazy(() => import("./Admin/Staff/Staffs.jsx"));
const AddStaff = lazy(() => import("./Admin/Staff/AddStaff.jsx"));
const ViewStaff = lazy(() => import("./Admin/Staff/ViewStaff.jsx"));
const AssignedTrainers = lazy(() => import("./Admin/Staff/Memberattendance.jsx"));
const OverallAttendance = lazy(() => import("./Admin/Attendance/OverallAttendance.jsx"));
const MemberAttendance = lazy(() => import("./Admin/Staff/Memberattendance.jsx"));
const AdminEquipment = lazy(() => import("./Admin/Equipment/Equipment.jsx"));
const AddEquipment = lazy(() => import("./Admin/Equipment/AddEquipments.jsx"));
const AdminBilling = lazy(() => import("./Admin/Billing/Billing.jsx"));
const AdminPayments = lazy(() => import("./Admin/Payments/Payments.jsx"));
const CommenWorkoutDiet = lazy(() => import("./Admin/CommenWorkDiet/CommenWorkDiet.jsx"));
const AdminReports = lazy(() => import("./Admin/Reports/Reports.jsx"));
const Settings = lazy(() => import("./Admin/Settingss/Settings.jsx"));


const TrainerAdminPanel = lazy(() => import("./TrainerAdminPanel/TrainerAdminPanel.jsx"));
const TrainerDashboard = lazy(() => import("./TrainerAdminPanel/TrainerDashboard/TrainerDashboard.jsx"));
const AddWorkout = lazy(() => import("./TrainerAdminPanel/AddWrokouts/AddWorkout.jsx"));
const AllWorkouts = lazy(() => import("./TrainerAdminPanel/AddWrokouts/AllWorkouts.jsx"));
const AddDietPlans = lazy(() => import("./TrainerAdminPanel/DietPlans/AddDietPlans.jsx"));
const AllDietPlans = lazy(() => import("./TrainerAdminPanel/DietPlans/AllDietPlans.jsx"));
const TrainerOverallAttendance = lazy(() => import("./TrainerAdminPanel/TrainerAttendance/OverallAttendance.jsx"));
const TrainerReports = lazy(() => import("./TrainerAdminPanel/TrainerReports/Reports.jsx"));
const TrainerSendMessage = lazy(() => import("./TrainerAdminPanel/TrainerSendMessage/TrainerSendMessage.jsx"));
const AssingnedTrainers = lazy(() => import("./Admin/Payments/AssingnedTrainers.jsx"));
const GymWorkoutManager = lazy(() => import("./Admin/CommenWorkDiet/CommenWorkDiet.jsx"));
const UpdateWeight = lazy(() => import("./TrainerAdminPanel/UpdateWeight/UpdateWeight.jsx"));
const ProfileSettings = lazy(() => import("./TrainerAdminPanel/Settingss/ProfileSettings.jsx"));

// ✅ Router setup
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
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
      { path: "products/:id", element: <UserProductDetails /> }, // Details
      { path: "cart", element: <UserCart /> },
      { path: "checkout", element: <UserCheckout /> },
      { path: "orders", element: <Orders /> },
      { path: "profile", element: <PersonalDetails /> },
      { path: "notifications", element: <Notification /> },      
      { path: "services", element: <UserServices /> },
      { path: "trainers", element: <UserTrainers /> },
      { path: "buynow", element: <BuyNow /> },
      { path: "services/:slug", element: <ServiceDetails /> },
      
      // ✅ Settings routes
      { path: "settings", element: <UserSettings /> },
      { path: "settings/profile", element: <UserProfileSettings /> },
      { path: "settings/security", element: <UserSecuritySettings /> },
      { path: "settings/health", element: <UserHealthSettings /> },
      { path: "settings/notifications", element: <UserNotificationSettings /> },
      { path: "settings/privacy", element: <UserPrivacySettings /> },
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
    children: [
      { index: true, element: <Dashboard /> },
      
      // Members routes
      { path: "members", element: <AdminMembers /> },
      { path: "addmembers", element: <AddMembers /> },
      
      // Enquiry route
      { path: "enquiry", element: <AdminEnquiry /> },
      
      // Send Message route
      { path: "send-message", element: <AdminSendMessage /> },
      
      // Orders routes
      { path: "orders", element: <AdminOrders /> },
      { path: "orders/:id", element: <OrderDetails /> },
      
      
      // Products routes
      { path: "products", element: <AdminProducts /> },
      { path: "addproducts", element: <AddProducts /> },
      { path: "products/:id", element: <ProductDetail /> },
      
      // Stock routes
      { path: "stockdetails", element: <StockDetails /> },
      { path: "add-stock", element: <AddStock /> },
      
      // Plans routes
      { path: "plansall", element: <AdminPlans /> },
      { path: "addplan", element: <AddPlan /> },
      { path: "buyplanadmin", element: <BuyPlanAdmin /> },
      
      // Facilities routes
      { path: "fecilities", element: <AdminFacilities /> },
      { path: "addfecilities", element: <AddFacilities /> },
      
      // Staff routes
      { path: "staff", element: <AdminStaff /> },
      { path: "addstaff", element: <AddStaff /> },
      { path: "staff/:id", element: <ViewStaff /> },
      { path: "assignedtrainers", element: <AssignedTrainers /> },
      
      // Attendance routes
      { path: "overall-attendance", element: <OverallAttendance /> },
      { path: "member-attendance", element: <MemberAttendance /> },
      
      // Equipment routes
      { path: "equipment", element: <AdminEquipment /> },
      { path: "addequipment", element: <AddEquipment /> },
      
      // Billing route
      { path: "billing", element: <AdminBilling /> },
      
      // Payments route
      { path: "payments", element: <AdminPayments /> },
      
      // Workout & Diet route
      { path: "commenworkoutdiet", element: <CommenWorkoutDiet /> },
      
      // Reports route
      { path: "reports", element: <AdminReports /> },
    ],
  },

  // ✅ Trainer protected
  {
    path: "/trainer",
    element: (
      <PrivateRoute allowedRoles={["trainer"]}>
        <TrainerAdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <TrainerDashboard /> },
       { path: "reports", element: <TrainerReports /> },
      { path: "overall-attendance", element: <TrainerOverallAttendance /> },
      { path: "addworkouts", element: <AddWorkout /> },
      { path: "addworkouts/:id", element: <AddWorkout /> },
      { path: "alladdworkouts", element: <AllWorkouts /> },
      { path: "adddietplans", element: <AddDietPlans /> },
      { path: "adddietplans/:id", element: <AddDietPlans /> },
      { path: "alladddietplans", element: <AllDietPlans /> },
      { path: "update-weight", element: <UpdateWeight /> },
      { path: "send-message", element: <TrainerSendMessage /> },
      { path: "settings", element: <Settings /> },
      { path: "settings/profile", element: <ProfileSettings /> },
      { path: "settings/usermanagement", element: <UserManagement /> },
      { path: "settings/reviews", element: <ReviewsSettings /> },
      { path: "member-attendance", element: <MemberAttendance /> },
      
    ],
  },
]);

// ✅ Render
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <StrictMode>
      <GoogleOAuthProvider clientId="788596465962-h22auho4kp5sfnuc59udl0k10e8uu6ra.apps.googleusercontent.com">
        <AuthProvider>
          <CartProvider>
            {/* 🔔 Toast */}
            <Toaster position="top-left" />

            {/* ✅ REQUIRED for lazy */}
            <Suspense fallback={<div>Loading...</div>}>
              <RouterProvider router={router} />
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </StrictMode>
  </ErrorBoundary>
);