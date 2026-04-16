import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { db, addDoc, collection, getDocs, query, where } from '../../../firebase';
import emailjs from '@emailjs/browser';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormText,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt } from '@coreui/icons';

const BarangKeluarForm = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
    fetchItems();
  }, []);

  // Fetch items from goods collection
  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'barang-masuk'));
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        quantity: doc.data().quantity || 0,
      }));
      setItems(itemsList);
      console.log('Items fetched:', itemsList);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!selectedItem) {
      newErrors.selectedItem = 'Please select an item';
    }
    if (!quantity || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!notes.trim()) {
      newErrors.notes = 'Notes/Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send Telegram Notification
  const sendTelegramNotification = async (barangData) => {
    try {
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

      const message = `
🔔 <b>NOTIFIKASI BARANG KELUAR - PERLU APPROVAL</b>

📦 <b>Nama Item:</b> ${barangData.itemName}
📊 <b>Quantity Keluar:</b> ${barangData.quantity}
📝 <b>Keterangan:</b> ${barangData.notes}
👤 <b>Input By:</b> ${barangData.createdBy}
⏰ <b>Waktu:</b> ${new Date(barangData.createdAt).toLocaleString('id-ID')}
🆔 <b>ID:</b> <code>${barangData.id}</code>

<i>Silakan cek sistem untuk approval</i>
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

  // Send Email Notification
  const sendEmailNotification = async (barangData) => {
    try {
      const templateParams = {
        to_email: import.meta.env.VITE_NOTIFICATION_EMAIL,
        item_name: barangData.itemName,
        item_quantity: barangData.quantity,
        notes: barangData.notes,
        created_by: barangData.createdBy,
        created_at: new Date(barangData.createdAt).toLocaleString('id-ID'),
        item_id: barangData.id,
        dashboard_link: `${window.location.origin}/admin/feedback-summary`,
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

      // Get selected item details
      const selectedItemData = items.find(item => item.id === selectedItem);

      // Check if quantity is available
      if (parseInt(quantity) > selectedItemData.quantity) {
        Swal.fire({
          title: 'Insufficient Stock!',
          text: `Available quantity: ${selectedItemData.quantity}`,
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        setLoading(false);
        return;
      }

      // Add document to Firestore
      const docRef = await addDoc(collection(db, 'barang-keluar'), {
        itemId: selectedItem,
        itemName: selectedItemData.name,
        quantity: parseInt(quantity),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        createdBy: '',
        status: 'pending',
      });

      console.log('✅ Document added with ID:', docRef.id);

      const barangData = {
        id: docRef.id,
        itemName: selectedItemData.name,
        quantity: parseInt(quantity),
        notes: notes.trim(),
        createdBy: '',
        createdAt: new Date().toISOString(),
      };

      // Send both notifications
      let notificationsSent = {
        telegram: false,
        email: false,
      };

      // Try sending Telegram
      try {
        await sendTelegramNotification(barangData);
        notificationsSent.telegram = true;
      } catch (telegramError) {
        console.error('Telegram failed:', telegramError);
      }

      // Try sending Email
      try {
        await sendEmailNotification(barangData);
        notificationsSent.email = true;
      } catch (emailError) {
        console.error('Email failed:', emailError);
      }

      // Show success message
      let successMessage = 'Barang Keluar recorded successfully!';
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

      // Clear form after submission
      setSelectedItem('');
      setQuantity('');
      setNotes('');
      setErrors({});
      
      // Refresh items
      fetchItems();
    } catch (err) {
      console.error('❌ Error adding document:', err);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to record Barang Keluar: ' + err.message,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-success text-white">
        <h5 className="mb-0">
          <CIcon icon={cilCheckAlt} className="me-2" />
          Record Barang Keluar
        </h5>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          {/* Item Selection */}
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="item" className="fw-bold">
                Select Item <span className="text-danger">*</span>
              </CFormLabel>
              <CFormSelect
                id="item"
                value={selectedItem}
                onChange={(e) => {
                  setSelectedItem(e.target.value);
                  setErrors({ ...errors, selectedItem: '' });
                }}
                disabled={loading || items.length === 0}
                isInvalid={!!errors.selectedItem}
              >
                <option value="">Choose an item...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Stock: {item.quantity})
                  </option>
                ))}
              </CFormSelect>
              {errors.selectedItem && (
                <div className="text-danger small mt-1">{errors.selectedItem}</div>
              )}
            </CCol>
          </CRow>

          {/* Quantity */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="quantity" className="fw-bold">
                Quantity <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="quantity"
                type="number"
                placeholder="Enter quantity to remove"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrors({ ...errors, quantity: '' });
                }}
                isInvalid={!!errors.quantity}
                disabled={loading}
                min="1"
              />
              {errors.quantity && (
                <div className="text-danger small mt-1">{errors.quantity}</div>
              )}
            </CCol>
          </CRow>

          {/* Notes */}
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="notes" className="fw-bold">
                Notes / Reason <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="notes"
                type="text"
                placeholder="Why is this item leaving? (e.g., Sold, Damaged, etc)"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setErrors({ ...errors, notes: '' });
                }}
                isInvalid={!!errors.notes}
                disabled={loading}
              />
              {errors.notes && (
                <div className="text-danger small mt-1">{errors.notes}</div>
              )}
              <CFormText className="d-block mt-2">
                Provide a reason for the item removal
              </CFormText>
            </CCol>
          </CRow>

          {/* Submit Button */}
          <CRow>
            <CCol md={12}>
              <CButton
                color="success"
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
                    Recording...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilCheckAlt} className="me-2" />
                    Record Barang Keluar
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

export default BarangKeluarForm;
