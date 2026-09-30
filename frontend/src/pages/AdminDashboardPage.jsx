import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardStats from '../components/admin/DashboardStats';
import SalesChart from '../components/admin/SalesChart';
import Reports from '../components/admin/Reports';
import ProductManagement from '../components/admin/ProductManagement';
import ProductForm from '../components/admin/ProductForm';
import CategoryManagement from '../components/admin/CategoryManagement';
import OrderManagement from '../components/admin/OrderManagement';
import UserManagement from '../components/admin/UserManagement';
import StoreManagement from '../components/admin/StoreManagement';
import DeliveryTracking from '../components/admin/DeliveryTracking';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <Routes>
        {/* Redirect empty subroute to stats dashboard */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        
        {/* Dashboard Overview */}
        <Route
          path="dashboard"
          element={
            <div className="space-y-8">
              <DashboardStats />
              <SalesChart />
              <Reports />
            </div>
          }
        />


        {/* Stores Management */}
        <Route path="stores" element={<StoreManagement />} />

        {/* Product Catalog */}
        <Route path="products" element={<ProductManagement />} />
        <Route path="product/new" element={<ProductForm />} />
        <Route path="product/:id" element={<ProductForm />} />

        {/* Categories */}
        <Route path="categories" element={<CategoryManagement />} />

        {/* Order Log Transactions */}
        <Route path="orders" element={<OrderManagement />} />

        {/* Delivery Tracking */}
        <Route path="delivery" element={<DeliveryTracking />} />

        {/* Accounts Directory */}
        <Route path="users" element={<UserManagement />} />
      </Routes>
    </AdminLayout>
  );
}
