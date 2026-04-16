import React from 'react';
import BarangKeluarForm from './BarangKeluarForm';
import BarangKeluarTabel from './BarangKeluarTabel';

const BarangKeluar = () => {
  return (
    <div className="container-fluid p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Table Section */}
      <div>
        <BarangKeluarTabel />
      </div>
    </div>
  );
};

export default BarangKeluar;