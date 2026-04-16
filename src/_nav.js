import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilArrowThickFromBottom,
  cilArrowThickToBottom,
  cilUser,  
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/admin/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: CNavTitle,
    name: 'Data Feedback',
  },
  {
    component: CNavItem,
    name: 'Feedback Detail',
    to: '/admin/feedback-detail',
    icon: <CIcon icon={cilArrowThickFromBottom} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Feedback Summary',
    to: '/admin/feedback-summary',
    icon: <CIcon icon={cilArrowThickToBottom} customClassName="nav-icon" />,
  },
  // New section for user management
  {
    component: CNavTitle,
    name: 'User Management',
  },
  {
    component: CNavItem,
    name: 'Manage Users',
    to: '/admin/manage-user',  // Route for managing users
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
]

export default _nav
