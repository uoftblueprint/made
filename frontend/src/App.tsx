import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';
import VolunteerApplication from './pages/public/VolunteerApplication';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCataloguePage from './pages/admin/AdminCataloguePage';
import ManageVolunteers from './pages/admin/ManageVolunteers';
import BoxManagementPage from './pages/admin/BoxManagementPage';
import BoxDetailsPage from './pages/admin/BoxDetailsPage';
import ItemDetailsPage from './pages/admin/ItemDetailsPage';
// RequestsPage kept for future volunteer-facing use
// import RequestsPage from './pages/admin/RequestsPage';
import CataloguePage from './pages/public/CataloguePage';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className='w-full flex-1 flex flex-col'>
              <Routes >
                {/* --- Public Routes --- */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/catalogue" element={<CataloguePage />} />
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/volunteer_management" element={<VolunteerApplication />} />

                {/* --- Admin Routes --- */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="VOLUNTEER">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/catalogue"
                  element={
                    <ProtectedRoute requiredRole="VOLUNTEER">
                      <AdminCataloguePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/catalogue/:id"
                  element={
                    <ProtectedRoute requiredRole="VOLUNTEER">
                      <ItemDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/volunteers"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <ManageVolunteers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/boxes"
                  element={
                    <ProtectedRoute requiredRole="VOLUNTEER">
                      <BoxManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/boxes/:id"
                  element={
                    <ProtectedRoute requiredRole="VOLUNTEER">
                      <BoxDetailsPage />
                    </ProtectedRoute>
                  }
                />
                {/* Requests page reserved for volunteer-facing use */}

                {/* --- Catch-all 404 Route --- */}
                {/* <Route path="*" element={<NotFoundPage />} /> */}
              </Routes>
              <Footer />
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;