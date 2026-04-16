import React, { useEffect, useState } from 'react'
import { db, getDocs, collection } from '../../../firebase'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CWidgetStatsF,
  CSpinner,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilList,
  cilReload,
  cilWarning,
  cilCheckCircle,
  cilChartPie,
} from '@coreui/icons'
import { CChartDoughnut, CChartBar } from '@coreui/react-chartjs'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFeedback: 0,
    totalOpen: 0,
    totalClose: 0,
    averageProgress: 0,
  })
  const [controlSystemSummary, setControlSystemSummary] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const feedbackSnapshot = await getDocs(collection(db, 'barang-masuk'))
      const feedbackList = feedbackSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const totalFeedback = feedbackList.length
      const totalOpen = feedbackList.filter((item) => item.status === 'Open').length
      const totalClose = feedbackList.filter((item) => item.status === 'Close').length
      const averageProgress =
        totalFeedback > 0 ? Math.round((totalClose / totalFeedback) * 100) : 0

      const controlMap = {}

      feedbackList.forEach((item) => {
        const controlSystem = item.controlSystem || 'Unknown'

        if (!controlMap[controlSystem]) {
          controlMap[controlSystem] = 0
        }
        controlMap[controlSystem] += 1
      })

      const controlSystemData = Object.keys(controlMap).map((key) => ({
        label: key,
        value: controlMap[key],
      }))

      setStats({
        totalFeedback,
        totalOpen,
        totalClose,
        averageProgress,
      })
      setControlSystemSummary(controlSystemData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '400px' }}
      >
        <CSpinner color="success" />
      </div>
    )
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <CRow className="mb-4 align-items-center">
        <CCol>
          <h2 className="mb-0">Dashboard Feedback</h2>
          <p className="text-muted mb-0">
            Gambaran singkat kondisi feedback secara keseluruhan
          </p>
        </CCol>
        <CCol xs="auto">
          <CButton
            color="success"
            onClick={fetchDashboardData}
            className="d-flex align-items-center gap-2"
          >
            <CIcon icon={cilReload} />
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {/* Summary Cards */}
      <CRow xs={{ gutter: 4 }} className="mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilList} size="xl" />}
            title="Total Feedback"
            value={stats.totalFeedback.toString()}
            color="primary"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilWarning} size="xl" />}
            title="Issue Open"
            value={stats.totalOpen.toString()}
            color="warning"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilCheckCircle} size="xl" />}
            title="Issue Close"
            value={stats.totalClose.toString()}
            color="success"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilChartPie} size="xl" />}
            title="Average Progress"
            value={`${stats.averageProgress}%`}
            color="info"
          />
        </CCol>
      </CRow>

      {/* Row 2: Average Progress + Open vs Close */}
      <CRow xs={{ gutter: 4 }} className="mb-4">
        <CCol xs={12} md={6}>
        <CCard className="mb-4 h-100">
          <CCardHeader>
            <strong>Average Progress</strong>
          </CCardHeader>
          <CCardBody className="d-flex justify-content-center align-items-center">
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px', height: '220px' }}>
              <CChartDoughnut
                data={{
                  labels: ['Progress', 'Remaining'],
                  datasets: [
                    {
                      data: [stats.averageProgress, 100 - stats.averageProgress],
                      backgroundColor: ['#2eb85c', '#e9ecef'],
                      borderWidth: 0,
                      hoverOffset: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  rotation: -90,
                  circumference: 180,
                  cutout: '75%',
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `${context.label}: ${context.raw}%`
                        },
                      },
                    },
                  },
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '68%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '34px',
                    fontWeight: '700',
                    color: '#2eb85c',
                    lineHeight: '1',
                  }}
                >
                  {stats.averageProgress}%
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#6c757d',
                    marginTop: '6px',
                  }}
                >
                  Average Progress
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

        <CCol xs={12} md={6}>
          <CCard className="mb-4 h-100">
            <CCardHeader>
              <strong>Perbandingan Issue Open vs Close</strong>
            </CCardHeader>
            <CCardBody className="d-flex align-items-center justify-content-center">
              <div style={{ maxWidth: '350px', width: '100%' }}>
                <CChartDoughnut
                  data={{
                    labels: ['Issue Open', 'Issue Close'],
                    datasets: [
                      {
                        backgroundColor: ['#f9b115', '#2eb85c'],
                        data: [stats.totalOpen, stats.totalClose],
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Row 3: Feedback per Control System */}
      <CRow xs={{ gutter: 4 }}>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Feedback per Control System</strong>
            </CCardHeader>
            <CCardBody>
              <CChartBar
                data={{
                  labels: controlSystemSummary.map((item) => item.label),
                  datasets: [
                    {
                      label: 'Jumlah Feedback',
                      backgroundColor: '#321fdb',
                      data: controlSystemSummary.map((item) => item.value),
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default AdminDashboard