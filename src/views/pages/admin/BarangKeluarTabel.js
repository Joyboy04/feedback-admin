import React, { useEffect, useState } from 'react';
import { db, getDocs, collection, doc, getDoc } from '../../../firebase';
import { CButton, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol } from '@coreui/react';
import { getAuth } from 'firebase/auth';
import CIcon from '@coreui/icons-react';
import { cilReload, cilList, cilCloudDownload } from '@coreui/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FeedbackSummaryTable = () => {
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

          if (userData.role === 'admin') {
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

 const buildExportRows = () => {
  const rows = [];

  summaryData.forEach((periodeItem) => {
    rows.push({
      periode: periodeItem.periode,
      controlSystem: 'Total feedback',
      jumlahFeedback: periodeItem.totalRow.totalFeedback,
      issueOpen: periodeItem.totalRow.issueOpen,
      issueClose: periodeItem.totalRow.issueClose,
      progress: `${periodeItem.totalRow.progress}%`,
      isTotal: true,
    });

    periodeItem.detailRows.forEach((row) => {
      rows.push({
        periode: periodeItem.periode,
        controlSystem: row.controlSystem,
        jumlahFeedback: row.totalFeedback,
        issueOpen: row.issueOpen,
        issueClose: row.issueClose,
        progress: `${row.progress}%`,
        isTotal: false,
      });
    });
  });

  return rows;
};

 const handleDownloadExcel = () => {
 const rows = buildExportRows();

  const excelData = [
    ['Feedback Summary'],
    [],
    ['Periode', 'Control System', 'Jumlah Feedback', 'Issue Open', 'Issue Close', 'Progress (0-100%)'],
    ...rows.map((row) => [
      row.periode,
      row.controlSystem,
      row.jumlahFeedback,
      row.issueOpen,
      row.issueClose,
      row.progress,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
  ];

  let startRow = 3;
  let currentPeriode = rows.length > 0 ? rows[0].periode : null;
  let mergeStart = startRow;

  rows.forEach((row, index) => {
    const excelRowIndex = index + 3;

    if (row.periode !== currentPeriode) {
      if (excelRowIndex - 1 > mergeStart) {
        merges.push({
          s: { r: mergeStart, c: 0 },
          e: { r: excelRowIndex - 1, c: 0 },
        });
      }
      currentPeriode = row.periode;
      mergeStart = excelRowIndex;
    }
  });

  if (rows.length > 0) {
    const lastRow = rows.length + 2;
    if (lastRow > mergeStart) {
      merges.push({
        s: { r: mergeStart, c: 0 },
        e: { r: lastRow, c: 0 },
      });
    }
  }

  worksheet['!merges'] = merges;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback Summary');
  XLSX.writeFile(workbook, 'Feedback_Summary.xlsx');
};

  const handleDownloadPDF = () => {
  const pdf = new jsPDF('landscape');
  const rows = buildExportRows();

  pdf.setFontSize(16);
  pdf.text('Feedback Summary', 14, 15);

  pdf.setFontSize(10);
  pdf.text(`Total Periode: ${summaryData.length}`, 14, 22);

  autoTable(pdf, {
    startY: 28,
    head: [[
      'Periode',
      'Control System',
      'Jumlah Feedback',
      'Issue Open',
      'Issue Close',
      'Progress (0-100%)',
    ]],
    body: rows.map((row) => [
      row.periode,
      row.controlSystem,
      row.jumlahFeedback,
      row.issueOpen,
      row.issueClose,
      row.progress,
    ]),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center',
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [233, 236, 239],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'left', cellWidth: 45 },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 30 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = rows[data.row.index];

        if (row.isTotal) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [248, 249, 250];
        }
      }
    },
  });

  pdf.save('Feedback_Summary.pdf');
};

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-success text-white">
        <CRow className="align-items-center">
          <CCol xs="auto">
            <h5 className="mb-0">
              <CIcon icon={cilList} className="me-2" />
              Feedback Summary
            </h5>
          </CCol>
          <CCol className="text-end">
          <div className="d-flex justify-content-end gap-2">
            <CButton
              color="light"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={loading || summaryData.length === 0}
              className="d-flex align-items-center gap-2"
            >
              <CIcon icon={cilCloudDownload} />
              Excel
            </CButton>

            <CButton
              color="light"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={loading || summaryData.length === 0}
              className="d-flex align-items-center gap-2"
            >
              <CIcon icon={cilCloudDownload} />
              PDF
            </CButton>

            <CButton
              color="light"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="d-flex align-items-center gap-2"
            >
              <CIcon icon={cilReload} />
              Refresh
            </CButton>
          </div>
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

export default FeedbackSummaryTable;