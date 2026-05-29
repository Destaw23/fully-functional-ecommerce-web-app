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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <SalesChart />
                </div>
                <div className="lg:col-span-1">
                  <Reports />
                </div>
              </div>
            </div>
          }
        />

        {/* Product Catalog */}
        <Route path="products" element={<ProductManagement />} />
        <Route path="product/new" element={<ProductForm />} />
        <Route path="product/:id" element={<ProductForm />} />

        {/* Categories */}
        <Route path="categories" element={<CategoryManagement />} />

        {/* Order Log Transactions */}
        <Route path="orders" element={<OrderManagement />} />

        {/* Accounts Directory */}
        <Route path="users" element={<UserManagement />} />
      </Routes>
    </AdminLayout>
  );
}
