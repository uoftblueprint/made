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
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCataloguePage from './pages/admin/AdminCataloguePage';
import CataloguePage from './pages/public/CataloguePage';
import VolunteerApplication from './pages/public/VolunteerApplication';


const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/volunteer_application" element={<VolunteerApplication />} />

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

            {/* --- Catch-all 404 Route --- */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;