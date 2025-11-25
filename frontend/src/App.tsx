import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomePage from './pages/public/HomePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageVolunteers from './pages/admin/ManageVolunteers';
import VolunteerApplication from './pages/public/VolunteerApplication';
import SecureRoute from './components/SecureRoute.tsx';


const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* <Layout> */}
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
              <Route path="volunteer-sign-up" element={<VolunteerApplication />}/>
            {/* --- Admin Routes --- */}
            <Route element={<SecureRoute />} >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/volunteers" element={<ManageVolunteers />} />
            </Route>
            {/* --- Catch-all 404 Route --- */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        {/* </Layout> */}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;