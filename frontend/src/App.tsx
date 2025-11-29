import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomePage from './pages/public/HomePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CataloguePage from './pages/public/CataloguePage';


const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* <Layout> */}
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogue" element={<CataloguePage/>} />

            {/* --- Admin Routes --- */}
            <Route path="/admin" element={<AdminDashboard />} />
      
            
            {/* --- Catch-all 404 Route --- */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        {/* </Layout> */}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;