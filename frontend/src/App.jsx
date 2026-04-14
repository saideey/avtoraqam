import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';
import MyOffers from './pages/MyOffers';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminListings from './pages/admin/Listings';
import AdminOffers from './pages/admin/Offers';
import AdminStatistics from './pages/admin/Statistics';
import AdminRegions from './pages/admin/Regions';
import AdminAuditLog from './pages/admin/AuditLog';
import AdminPromotions from './pages/admin/Promotions';
import AdminPayments from './pages/admin/Payments';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Admin routes — own layout, no Navbar/Footer */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin', 'superadmin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="listings" element={<AdminListings />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="regions" element={<AdminRegions />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="featured" element={<AdminPromotions />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="statistics" element={<AdminStatistics />} />
        <Route path="audit" element={<AdminAuditLog />} />
      </Route>

      {/* Public routes — with Navbar/Footer */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/listings" element={<Home />} />
                <Route path="/listings/:id" element={<ListingDetail />} />

                <Route
                  path="/create-listing"
                  element={
                    <ProtectedRoute>
                      <CreateListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-listing/:id"
                  element={
                    <ProtectedRoute>
                      <EditListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute>
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-offers"
                  element={
                    <ProtectedRoute>
                      <MyOffers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

export default App;
