import React, { useEffect, useState } from 'react';
import { db, getDocs, collection, doc, getDoc } from '../../../firebase';
import { CButton, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol } from '@coreui/react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { getAuth } from 'firebase/auth';
import CIcon from '@coreui/icons-react';
import { cilReload, cilArrowTop } from '@coreui/icons';

const BarangMasukTabel = () => {
  const [barangMasukData, setBarangMasukData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const auth = getAuth();
  const user = auth.currentUser;

  const fetchData = async () => {
    if (user) {
      try {
        setLoading(true);
        setError(null);

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          if (userData.role === 'user') {
            console.log('Fetching from barang-masuk collection...');
            const querySnapshot = await getDocs(collection(db, 'barang-masuk'));
            console.log('Data received:', querySnapshot.docs);

            const data = querySnapshot.docs.map((docSnapshot) => {
              const docData = docSnapshot.data();

              return {
                id: docSnapshot.id,
                periode: docData.periode || '',
                controlSystem: docData.controlSystem || '',
                equipment: docData.equipment || '',
                problem: docData.problem || '',
                solusi: docData.solusi || '',
                status: docData.status || 'Open',
                progress: docData.progress || 0,
                image: docData.image || '',
                createdAt: docData.createdAt || '',
              };
            });

            console.log('Cleaned data:', data);
            setBarangMasukData(data);
          } else {
            setError('You do not have permission to view this data.');
          }
        } else {
          setError('User role not found.');
        }
      } catch (err) {
        console.error('Detailed error:', err);
        setError('Error fetching data: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError('You need to be logged in to access this data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="badge bg-warning text-dark">Open</span>;
      case 'Close':
        return <span className="badge bg-success">Close</span>;
      default:
        return <span className="badge bg-secondary">{status || '-'}</span>;
    }
  };

  const columns = [
    {
      name: 'Periode',
      selector: (row) => row.periode,
      sortable: true,
      minWidth: '120px',
      grow: 0,
      wrap: true,
      cell: (row) => <div className="py-2">{row.periode || '-'}</div>,
    },
    {
      name: 'Control System',
      selector: (row) => row.controlSystem,
      sortable: true,
      minWidth: '160px',
      grow: 1,
      wrap: true,
      cell: (row) => <div className="py-2">{row.controlSystem || '-'}</div>,
    },
    {
      name: 'Equipment',
      selector: (row) => row.equipment,
      sortable: true,
      minWidth: '150px',
      grow: 1,
      wrap: true,
      cell: (row) => <div className="py-2">{row.equipment || '-'}</div>,
    },
    {
      name: 'Problem',
      selector: (row) => row.problem,
      sortable: true,
      minWidth: '220px',
      grow: 2,
      wrap: true,
      cell: (row) => (
        <div
          className="py-2"
          style={{
            whiteSpace: 'normal',
            lineHeight: '1.45',
          }}
        >
          {row.problem || '-'}
        </div>
      ),
    },
    {
      name: 'Solusi',
      selector: (row) => row.solusi,
      sortable: true,
      minWidth: '220px',
      grow: 2,
      wrap: true,
      cell: (row) => (
        <div
          className="py-2"
          style={{
            whiteSpace: 'normal',
            lineHeight: '1.45',
          }}
        >
          {row.solusi || '-'}
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      sortable: true,
      minWidth: '100px',
      grow: 0,
      center: true,
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: 'Progress',
      selector: (row) => row.progress,
      sortable: true,
      minWidth: '100px',
      grow: 0,
      center: true,
      cell: (row) => <span className="badge bg-info">{row.progress}%</span>,
    },
    {
      name: 'Foto',
      minWidth: '100px',
      grow: 0,
      center: true,
      cell: (row) => (
        <div className="py-2 text-center">
          {row.image ? (
            <img
              src={row.image}
              alt={row.equipment || 'Foto'}
              className="rounded border"
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
              onClick={() => {
                Swal.fire({
                  title: row.equipment || 'Foto',
                  imageUrl: row.image,
                  imageWidth: 400,
                  imageAlt: row.equipment || 'Foto',
                  confirmButtonText: 'Close',
                });
              }}
            />
          ) : (
            <span className="text-muted small">No image</span>
          )}
        </div>
      ),
    },
  ];

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentData = barangMasukData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-primary text-white">
        <CRow className="align-items-center">
          <CCol xs="auto">
            <h5 className="mb-0">
              <CIcon icon={cilArrowTop} className="me-2" />
              Feedback Detail ({barangMasukData.length})
            </h5>
          </CCol>
          <CCol className="text-end">
            <CButton
              color="light"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="d-flex align-items-center gap-2 ms-auto"
            >
              <CIcon icon={cilReload} />
              Refresh
            </CButton>
          </CCol>
        </CRow>
      </CCardHeader>

      <CCardBody>
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error!</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-center">
              <CSpinner color="primary" />
              <p className="mt-3 text-muted">Loading data...</p>
            </div>
          </div>
        ) : barangMasukData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <DataTable
              columns={columns}
              data={currentData}
              pagination
              paginationServer
              paginationPerPage={rowsPerPage}
              paginationTotalRows={barangMasukData.length}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handleRowsPerPageChange}
              responsive
              highlightOnHover
              striped
              persistTableHead
              customStyles={{
                table: {
                  style: {
                    minWidth: '1300px',
                  },
                },
                headCells: {
                  style: {
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold',
                    color: '#333',
                    fontSize: '14px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    whiteSpace: 'normal',
                  },
                },
                rows: {
                  style: {
                    minHeight: '88px',
                    alignItems: 'stretch',
                  },
                },
                cells: {
                  style: {
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    verticalAlign: 'top',
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="text-center py-5">
            <h6 className="text-muted">No records to display</h6>
            <p className="text-muted small">Start by adding feedback detail.</p>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default BarangMasukTabel;