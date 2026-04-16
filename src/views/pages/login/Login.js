import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebase'; 
import { getDoc, doc } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import { setUser } from '../../../redux/authSlice';  
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser } from '@coreui/icons';
import logo from 'src/assets/images/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch(); 
  const navigate = useNavigate(); 

  const handleLogin = () => {
    if (!email || !password) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in both fields',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const userRef = doc(db, 'users', user.uid);

          getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              const userRole = userData.role;  

              dispatch(setUser({
                uid: user.uid,
                email: user.email,
                role: userRole,
              }));

              // Success message and redirect based on user role
              Swal.fire({
                title: 'Success!',
                text: userRole === 'admin' ? 'Welcome Admin!' : 'Welcome User!',
                icon: 'success',
                confirmButtonText: 'OK',
              }).then(() => {
                if (userRole === 'admin') {
                  navigate('/admin'); 
                } else {
                  navigate('/user'); 
                }
              });
            } else {
              Swal.fire({
                title: 'Error!',
                text: 'No role found for this user',
                icon: 'error',
                confirmButtonText: 'Try Again',
              });
            }
          });
        })
        .catch((error) => {
          console.error('Login error:', error.code, error.message);
          let errorMessage = 'An error occurred. Please try again.';
          if (error.code === 'auth/invalid-email') {
            errorMessage = 'The email address is invalid. Please check your email.';
          } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'No user found with this email address.';
          } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'The password is incorrect. Please try again.';
          } else if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Email atau password salah, atau akun belum tersedia di Firebase Authentication.';
          } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Terlalu banyak percobaan login. Coba lagi beberapa saat.';
          } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Koneksi ke Firebase gagal. Cek internet atau konfigurasi project.';
          }

          Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Try Again',
          });
        });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={4}>
            <CCard className="shadow-sm">
              <CCardBody className="p-4">
                <div className="text-center">
                  <img src={logo} alt="Logo" height={45} />
                </div>
                <p className="text-center text-muted">Sign In to your account</p>
                <CForm>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </CInputGroup>
                  <CRow>
                    <CCol xs={6}>
                      <CButton color="primary" className="px-4 w-100" onClick={handleLogin}>
                        Login
                      </CButton>
                    </CCol>
                    <CCol xs={6} className="text-right">
                      <CButton color="link" className="px-0">
                        Forgot password?
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;
