import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/public/HomePage';
import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageVolunteers from './pages/admin/ManageVolunteers';
import VolunteerApplication from './pages/public/VolunteerApplication';
import SecureRoute from './components/SecureRoute.tsx';


const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
              <Route path="volunteer-sign-up" element={<VolunteerApplication />}/>            <Route path="/login" element={<LoginPage />} />
            <Route path="/logout" element={<LogoutPage />} />

            {/* --- Admin Routes --- */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            

            {/* --- Catch-all 404 Route --- */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;