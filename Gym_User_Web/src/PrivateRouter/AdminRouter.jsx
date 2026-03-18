import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "../Admin/AdminPanel";

// Import admin components
import Dashboard from "../Admin/Dashboard/Dashboard";
import Users from "../Admin/Users/Users";
import Members from "../Admin/Members/Members";
import Staff from "../Admin/Staff/Staffs";
import Equipment from "../Admin/Equipment/Equipment";
import Products from "../Admin/Products/Products";
import Plans from "../Admin/Plans/Plans";
import Facilities from "../Admin/Fecilieties/Facilities";
import Orders from "../Admin/Orders/Orders";
import Payments from "../Admin/Payments/Payments";
import Billing from "../Admin/Billing/Billing";
import Reports from "../Admin/Reports/Reports";
import Enquiry from "../Admin/Enquiry/Enquiry";

const AdminRouter = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="members" element={<Members />} />
        <Route path="staff" element={<Staff />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="products" element={<Products />} />
        <Route path="plansall" element={<Plans />} />
        <Route path="fecilities" element={<Facilities />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payments" element={<Payments />} />
        <Route path="billing" element={<Billing />} />
        <Route path="reports" element={<Reports />} />
        <Route path="enquiry" element={<Enquiry />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRouter;