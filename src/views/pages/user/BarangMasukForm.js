import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { db, addDoc, collection } from '../../../firebase';
import emailjs from '@emailjs/browser';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormText,
  CInputGroup,
  CInputGroupText,
  CFormFeedback,
  CRow,
  CCol,
  CSpinner,
  CFormSelect,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilFile, cilCheckAlt, cilX } from '@coreui/icons';

const BarangMasukForm = () => {
  const [periode, setPeriode] = useState('');
  const [controlSystem, setControlSystem] = useState('');
  const [equipment, setEquipment] = useState('');
  const [problem, setProblem] = useState('');
  const [solusi, setSolusi] = useState('');
  const [status, setStatus] = useState('Open');
  const [progress, setProgress] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!periode.trim()) {
      newErrors.periode = 'Periode is required';
    }
    if (!controlSystem.trim()) {
      newErrors.controlSystem = 'Control System is required';
    }
    if (!equipment.trim()) {
      newErrors.equipment = 'Equipment is required';
    }
    if (!problem.trim()) {
      newErrors.problem = 'Problem is required';
    }
    if (!solusi.trim()) {
      newErrors.solusi = 'Solusi is required';
    }
    if (!status.trim()) {
      newErrors.status = 'Status is required';
    }
    if (progress === '' || progress < 0 || progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100';
    }
    if (!image) {
      newErrors.image = 'Image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'File too large!',
          text: 'Image size must be less than 5MB',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Invalid file!',
          text: 'Please upload an image file',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
        setErrors({ ...errors, image: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const sendTelegramNotification = async (barangData) => {
    try {
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

      const message = `
📢 <b>NOTIFIKASI FEEDBACK BARU</b>

📅 <b>Periode:</b> ${barangData.periode}
🖥️ <b>Control System:</b> ${barangData.controlSystem}
⚙️ <b>Equipment:</b> ${barangData.equipment}
🚨 <b>Problem:</b> ${barangData.problem}
🛠️ <b>Solusi:</b> ${barangData.solusi}
📌 <b>Status:</b> ${barangData.status}
📊 <b>Progress:</b> ${barangData.progress}%
👤 <b>Input By:</b> ${barangData.createdBy}
⏰ <b>Waktu:</b> ${new Date(barangData.createdAt).toLocaleString('id-ID')}
🆔 <b>ID:</b> <code>${barangData.id}</code>

<i>Silakan cek sistem untuk melihat detail feedback</i>
      `;

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Telegram notification failed');
      }

      console.log('✅ Telegram notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Telegram notification error:', error);
      throw error;
    }
  };

  const sendEmailNotification = async (barangData) => {
    try {
      const templateParams = {
        to_email: import.meta.env.VITE_NOTIFICATION_EMAIL,
        periode: barangData.periode,
        control_system: barangData.controlSystem,
        equipment: barangData.equipment,
        problem: barangData.problem,
        solusi: barangData.solusi,
        status: barangData.status,
        progress: barangData.progress,
        created_by: barangData.createdBy,
        created_at: new Date(barangData.createdAt).toLocaleString('id-ID'),
        item_id: barangData.id,
        dashboard_link: `${window.location.origin}/admin/feedback-detail`,
      };

      const response = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('✅ Email notification sent successfully:', response.status);
      return true;
    } catch (error) {
      console.error('❌ Email notification error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        title: 'Validation Error!',
        text: 'Please fill in all required fields correctly',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    try {
      setLoading(true);

      const docRef = await addDoc(collection(db, 'barang-masuk'), {
        periode: periode.trim(),
        controlSystem: controlSystem.trim(),
        equipment: equipment.trim(),
        problem: problem.trim(),
        solusi: solusi.trim(),
        status: status,
        progress: parseInt(progress),
        image: image,
        createdAt: new Date().toISOString(),
        createdBy: '',
      });

      console.log('✅ Document added with ID:', docRef.id);

      const barangData = {
        id: docRef.id,
        periode: periode.trim(),
        controlSystem: controlSystem.trim(),
        equipment: equipment.trim(),
        problem: problem.trim(),
        solusi: solusi.trim(),
        status: status,
        progress: parseInt(progress),
        createdBy: '',
        createdAt: new Date().toISOString(),
      };

      let notificationsSent = {
        telegram: false,
        email: false,
      };

      try {
        await sendTelegramNotification(barangData);
        notificationsSent.telegram = true;
      } catch (telegramError) {
        console.error('Telegram failed:', telegramError);
      }

      try {
        await sendEmailNotification(barangData);
        notificationsSent.email = true;
      } catch (emailError) {
        console.error('Email failed:', emailError);
      }

      let successMessage = 'Feedback Detail added successfully!';
      if (notificationsSent.telegram && notificationsSent.email) {
        successMessage += '\n✅ Notifications sent to Telegram & Email';
      } else if (notificationsSent.telegram) {
        successMessage += '\n✅ Notification sent to Telegram\n⚠️ Email failed';
      } else if (notificationsSent.email) {
        successMessage += '\n✅ Notification sent to Email\n⚠️ Telegram failed';
      } else {
        successMessage += '\n⚠️ Notifications could not be sent (check configuration)';
      }

      Swal.fire({
        title: 'Success!',
        text: successMessage,
        icon: 'success',
        confirmButtonText: 'OK',
      });

      setPeriode('');
      setControlSystem('');
      setEquipment('');
      setProblem('');
      setSolusi('');
      setStatus('Open');
      setProgress('');
      setImage(null);
      setImagePreview(null);
      setErrors({});
    } catch (err) {
      console.error('❌ Error adding document:', err);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to add Feedback Detail: ' + err.message,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-primary text-white">
        <h5 className="mb-0">
          <CIcon icon={cilFile} className="me-2" />
          Input Feedback Detail
        </h5>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="periode" className="fw-bold">
                Periode <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="periode"
                type="text"
                placeholder="Enter periode"
                value={periode}
                onChange={(e) => {
                  setPeriode(e.target.value);
                  setErrors({ ...errors, periode: '' });
                }}
                isInvalid={!!errors.periode}
                disabled={loading}
              />
              {errors.periode && <CFormFeedback invalid>{errors.periode}</CFormFeedback>}
            </CCol>

            <CCol md={6}>
              <CFormLabel htmlFor="controlSystem" className="fw-bold">
                Control System <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="controlSystem"
                type="text"
                placeholder="Enter control system"
                value={controlSystem}
                onChange={(e) => {
                  setControlSystem(e.target.value);
                  setErrors({ ...errors, controlSystem: '' });
                }}
                isInvalid={!!errors.controlSystem}
                disabled={loading}
              />
              {errors.controlSystem && <CFormFeedback invalid>{errors.controlSystem}</CFormFeedback>}
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="equipment" className="fw-bold">
                Equipment <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="equipment"
                type="text"
                placeholder="Enter equipment"
                value={equipment}
                onChange={(e) => {
                  setEquipment(e.target.value);
                  setErrors({ ...errors, equipment: '' });
                }}
                isInvalid={!!errors.equipment}
                disabled={loading}
              />
              {errors.equipment && <CFormFeedback invalid>{errors.equipment}</CFormFeedback>}
            </CCol>

            <CCol md={3}>
              <CFormLabel htmlFor="status" className="fw-bold">
                Status <span className="text-danger">*</span>
              </CFormLabel>
              <CFormSelect
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setErrors({ ...errors, status: '' });
                }}
                isInvalid={!!errors.status}
                disabled={loading}
              >
                <option value="Open">Open</option>
                <option value="Close">Close</option>
              </CFormSelect>
              {errors.status && <CFormFeedback invalid>{errors.status}</CFormFeedback>}
            </CCol>

            <CCol md={3}>
              <CFormLabel htmlFor="progress" className="fw-bold">
                Progress (%) <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="progress"
                type="number"
                placeholder="0 - 100"
                value={progress}
                onChange={(e) => {
                  setProgress(e.target.value);
                  setErrors({ ...errors, progress: '' });
                }}
                isInvalid={!!errors.progress}
                disabled={loading}
                min="0"
                max="100"
              />
              {errors.progress && <CFormFeedback invalid>{errors.progress}</CFormFeedback>}
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="problem" className="fw-bold">
                Problem <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="problem"
                type="text"
                placeholder="Enter problem"
                value={problem}
                onChange={(e) => {
                  setProblem(e.target.value);
                  setErrors({ ...errors, problem: '' });
                }}
                isInvalid={!!errors.problem}
                disabled={loading}
              />
              {errors.problem && <CFormFeedback invalid>{errors.problem}</CFormFeedback>}
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="solusi" className="fw-bold">
                Solusi <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="solusi"
                type="text"
                placeholder="Enter solusi"
                value={solusi}
                onChange={(e) => {
                  setSolusi(e.target.value);
                  setErrors({ ...errors, solusi: '' });
                }}
                isInvalid={!!errors.solusi}
                disabled={loading}
              />
              {errors.solusi && <CFormFeedback invalid>{errors.solusi}</CFormFeedback>}
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="image" className="fw-bold">
                Upload Image <span className="text-danger">*</span>
              </CFormLabel>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilFile} />
                </CInputGroupText>
                <CFormInput
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  isInvalid={!!errors.image}
                  disabled={loading}
                />
              </CInputGroup>
              {errors.image && (
                <CFormFeedback invalid style={{ display: 'block' }}>
                  {errors.image}
                </CFormFeedback>
              )}
              <CFormText className="d-block mt-2">
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </CFormText>
            </CCol>
          </CRow>

          {imagePreview && (
            <CRow className="mb-3">
              <CCol md={12}>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Image Preview</h6>
                    <CButton
                      color="danger"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={loading}
                    >
                      <CIcon icon={cilX} className="me-1" />
                      Remove
                    </CButton>
                  </div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-fluid rounded"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>
              </CCol>
            </CRow>
          )}

          <CRow>
            <CCol md={12}>
              <CButton
                color="primary"
                type="submit"
                disabled={loading}
                className="w-100 fw-bold"
              >
                {loading ? (
                  <>
                    <CSpinner
                      component="span"
                      size="sm"
                      className="me-2"
                      aria-hidden="true"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilCheckAlt} className="me-2" />
                    Submit Feedback Detail
                  </>
                )}
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default BarangMasukForm;