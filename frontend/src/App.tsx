import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import HomePage from './pages/public/HomePage';
import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';
import VolunteerApplication from './pages/public/VolunteerApplication';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCataloguePage from './pages/admin/AdminCataloguePage';
import ManageVolunteers from './pages/admin/ManageVolunteers';
import BoxManagementPage from './pages/admin/BoxManagementPage';
import ItemDetailsPage from './pages/admin/ItemDetailsPage';
import RequestsPage from './pages/admin/RequestsPage';
import CataloguePage from './pages/public/CataloguePage';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className='w-full flex-1'>
              <Routes >
                {/* --- Public Routes --- */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/catalogue" element={<CataloguePage />} />
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/volunteer_management" element={<VolunteerApplication />} />
                {/* Box management not complete, currently set to HomePage route*/}

                {/* --- Admin Routes --- */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/catalogue"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminCataloguePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/catalogue/:id"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
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
                    <ProtectedRoute requiredRole="ADMIN">
                      <BoxManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/requests"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <RequestsPage />
                    </ProtectedRoute>
                  }
                />

                {/* --- Catch-all 404 Route --- */}
                {/* <Route path="*" element={<NotFoundPage />} /> */}
              </Routes>
            </main>
          </div>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;