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
import CataloguePage from './pages/public/CataloguePage';
import VolunteerManagement from './pages/admin/ManageVolunteers';
import HelloWorld from "./pages/HelloWorld"; // to be removed

const queryClient = new QueryClient();

const App: React.FC = () => {
  return <HelloWorld />; // to be removed
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className='mx-auto w-full lg:max-w-[90%] flex-1 '>
              <Routes >
                {/* --- Public Routes --- */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/catalogue" element={<CataloguePage />} />
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/volunteer_management" element={<VolunteerManagement />} />
                {/* Box management not complete, currently set to HomePage route*/ }

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
            </main>
          </div>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;