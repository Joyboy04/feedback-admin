import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppSidebar, AppHeader, AppFooter } from '../components';


import UserDashboard from '../views/pages/user/UserDashboard';
import BarangMasuk from '../views/pages/user/BarangMasuk';
import BarangKeluar from '../views/pages/user/BarangKeluar';

const UserLayout = () => {
  return (
    <div className="user-layout">
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <Routes>
            <Route index element={<UserDashboard />} />
            <Route path="dashboard" element={<UserDashboard />} />
              <Route path="feedback-detail" element={<BarangMasuk />} />
              <Route path="feedback-summary" element={<BarangKeluar />} />

              <Route path="*" element={<h1>404 Not Found</h1>} />
          </Routes>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default UserLayout;
