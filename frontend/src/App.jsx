import React, { useContext } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Store } from './context/Store';

// Components & Routes
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import DeliveryRoute from './components/layout/DeliveryRoute';

// Screens
import HomeScreen from './pages/HomeScreen';
import ProductScreen from './pages/ProductScreen';
import CartScreen from './pages/CartScreen';
import SigninScreen from './pages/SigninScreen';
import ShippingAddressScreen from './pages/ShippingAddressScreen';
import SignupScreen from './pages/SignupScreen';
import PaymentMethodScreen from './pages/PaymentMethodScreen';
import PlaceOrderScreen from './pages/PlaceOrderScreen';
import OrderScreen from './pages/OrderScreen';
import OrderHistoryScreen from './pages/OrderHistoryScreen';
import ProfileScreen from './pages/ProfileScreen';
import SearchScreen from './pages/SearchScreen';
import WishlistScreen from './pages/WishlistScreen';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ForgetPasswordScreen from './pages/ForgetPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import MapScreen from './pages/MapScreen';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';

// Stores & Vendor Screens
import StoresScreen from './pages/StoresScreen';
import StoreDetailScreen from './pages/StoreDetailScreen';
import VendorDashboardScreen from './pages/VendorDashboardScreen';

export default function App() {
  const { state } = useContext(Store);
  const { fullBox } = state;

  return (
    <BrowserRouter>
      <div className={`min-h-screen flex flex-col relative ${fullBox ? 'h-screen overflow-hidden' : ''}`}>
        <ToastContainer
          position="bottom-center"
          limit={1}
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          theme="colored"
        />

        <Header />

        <main className="page-container flex-grow py-8 sm:py-10 relative animate-fade-in">
          <Routes>
            {/* Public Pathways */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/product/:slug" element={<ProductScreen />} />
            <Route path="/stores" element={<StoresScreen />} />
            <Route path="/store/:slug" element={<StoreDetailScreen />} />
            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute>
                  <VendorDashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/signin" element={<SigninScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
            <Route path="/forget-password" element={<ForgetPasswordScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />

            {/* Protected Customer Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <MapScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/:id"
              element={
                <ProtectedRoute>
                  <OrderScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/wishlist" element={<WishlistScreen />} />
            <Route
              path="/orderhistory"
              element={
                <ProtectedRoute>
                  <OrderHistoryScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/shipping" element={<ShippingAddressScreen />} />
            <Route path="/payment" element={<PaymentMethodScreen />} />
            <Route path="/placeorder" element={<PlaceOrderScreen />} />

            {/* Protected Delivery Route */}
            <Route
              path="/delivery"
              element={
                <DeliveryRoute>
                  <DeliveryDashboardPage />
                </DeliveryRoute>
              }
            />

            {/* Protected Admin Console Route */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
