import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppSidebar, AppHeader, AppFooter } from '../components';


import AdminDashboard from '../views/pages/admin/AdminDashboard';
import BarangMasuk from '../views/pages/admin/BarangMasuk';
import BarangKeluar from '../views/pages/admin/BarangKeluar';
import ManageUser from '../views/pages/admin/ManageUser';

const AdminLayout = () => {
  return (
    <div className="user-layout">
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="feedback-detail" element={<BarangMasuk />} />
            <Route path="feedback-summary" element={<BarangKeluar />} />
            <Route path="manage-user" element={<ManageUser />} />

            <Route path="*" element={<h1>404 Not Found</h1>} />
          </Routes>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default AdminLayout;
