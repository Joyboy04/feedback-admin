import React, { useEffect, useState } from 'react';
import { db, getDocs, collection, doc, getDoc } from '../../../firebase';
import { CButton, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol } from '@coreui/react';
import { getAuth } from 'firebase/auth';
import CIcon from '@coreui/icons-react';
import { cilReload, cilList } from '@coreui/icons';

const BarangKeluarTabel = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;

  const calculateSummary = (rawData) => {
    const periodeMap = {};

    rawData.forEach((item) => {
      const periode = item.periode || '-';
      const controlSystem = item.controlSystem || '-';
      const status = item.status || 'Open';

      if (!periodeMap[periode]) {
        periodeMap[periode] = {};
      }

      if (!periodeMap[periode][controlSystem]) {
        periodeMap[periode][controlSystem] = {
          totalFeedback: 0,
          issueOpen: 0,
          issueClose: 0,
        };
      }

      periodeMap[periode][controlSystem].totalFeedback += 1;

      if (status === 'Open') {
        periodeMap[periode][controlSystem].issueOpen += 1;
      } else if (status === 'Close') {
        periodeMap[periode][controlSystem].issueClose += 1;
      }
    });

    const result = Object.keys(periodeMap).map((periode) => {
      const systems = periodeMap[periode];

      const controlSystemRows = Object.keys(systems).map((systemName) => {
        const item = systems[systemName];

        const progress =
          item.totalFeedback > 0
            ? Math.round((item.issueClose / item.totalFeedback) * 100)
            : 0;

        return {
          controlSystem: systemName,
          totalFeedback: item.totalFeedback,
          issueOpen: item.issueOpen,
          issueClose: item.issueClose,
          progress,
        };
      });

      const totalFeedback = controlSystemRows.reduce((sum, item) => sum + item.totalFeedback, 0);
      const issueOpen = controlSystemRows.reduce((sum, item) => sum + item.issueOpen, 0);
      const issueClose = controlSystemRows.reduce((sum, item) => sum + item.issueClose, 0);

      const totalProgress =
        totalFeedback > 0
          ? Math.round((issueClose / totalFeedback) * 100)
          : 0;

      return {
        periode,
        totalRow: {
          controlSystem: 'Total feedback',
          totalFeedback,
          issueOpen,
          issueClose,
          progress: totalProgress,
        },
        detailRows: controlSystemRows,
      };
    });

    return result.sort((a, b) => {
      const numA = parseInt(a.periode, 10);
      const numB = parseInt(b.periode, 10);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      return String(a.periode).localeCompare(String(b.periode));
    });
  };

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

            const rawData = querySnapshot.docs.map((docSnapshot) => {
              const docData = docSnapshot.data();

              return {
                id: docSnapshot.id,
                periode: docData.periode || '',
                controlSystem: docData.controlSystem || '',
                status: docData.status || 'Open',
              };
            });

            const summary = calculateSummary(rawData);
            setSummaryData(summary);
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

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-success text-white">
        <CRow className="align-items-center">
          <CCol xs="auto">
            <h5 className="mb-0">
              <CIcon icon={cilList} className="me-2" />
              Feedback Summary ({summaryData.length} Periode)
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
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: '300px' }}
          >
            <div className="text-center">
              <CSpinner color="success" />
              <p className="mt-3 text-muted">Loading summary...</p>
            </div>
          </div>
        ) : summaryData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-bordered align-middle mb-0">
              <thead>
                <tr>
                  <th
                    className="text-center align-middle"
                    style={{ backgroundColor: '#e9ecef', minWidth: '120px' }}
                  >
                    Periode
                  </th>
                  <th
                    className="text-center align-middle"
                    style={{ backgroundColor: '#e9ecef', minWidth: '180px' }}
                  >
                    Control System
                  </th>
                  <th
                    className="text-center align-middle"
                    style={{ backgroundColor: '#e9ecef', minWidth: '140px' }}
                  >
                    Jumlah Feedback
                  </th>
                  <th
                    className="text-center align-middle"
                    style={{ backgroundColor: '#e9ecef', minWidth: '120px' }}
                  >
                    Issue Open
                  </th>
                  <th
                    className="text-center align-middle"
                    style={{ backgroundColor: '#e9ecef', minWidth: '120px' }}
                  >
                    Issue Close
                  </th>
                  <th
                    className="text-center align-middle"
                    style={{ backgroundColor: '#e9ecef', minWidth: '160px' }}
                  >
                    Progress (0-100%)
                  </th>
                </tr>
              </thead>

              <tbody>
                {summaryData.map((periodeItem, index) => {
                  const rows = [periodeItem.totalRow, ...periodeItem.detailRows];
                  const rowSpanCount = rows.length;

                  return rows.map((row, rowIndex) => (
                    <tr key={`${index}-${rowIndex}`}>
                      {rowIndex === 0 && (
                        <td
                          rowSpan={rowSpanCount}
                          className="text-center align-middle fw-semibold"
                        >
                          {periodeItem.periode}
                        </td>
                      )}

                      <td className={rowIndex === 0 ? 'fw-bold' : ''}>
                        {row.controlSystem}
                      </td>
                      <td className={`text-center ${rowIndex === 0 ? 'fw-bold' : ''}`}>
                        {row.totalFeedback}
                      </td>
                      <td className={`text-center ${rowIndex === 0 ? 'fw-bold' : ''}`}>
                        {row.issueOpen}
                      </td>
                      <td className={`text-center ${rowIndex === 0 ? 'fw-bold' : ''}`}>
                        {row.issueClose}
                      </td>
                      <td className={`text-center ${rowIndex === 0 ? 'fw-bold' : ''}`}>
                        {row.progress}%
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5">
            <h6 className="text-muted">No summary data to display</h6>
            <p className="text-muted small">Start by adding feedback detail first.</p>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default BarangKeluarTabel;