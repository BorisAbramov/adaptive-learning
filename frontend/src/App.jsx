import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { getMe } from './store/index.js'

import Layout from './components/layout/Layout.jsx'
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx'
import { DashboardPage, CoursesPage, CourseDetailPage, ModulePage } from './pages/Pages.jsx'
import Spinner from './components/common/Spinner.jsx'

const ProtectedRoute = ({ children }) => {
  const { user, initialized } = useSelector(s => s.auth)
  if (!initialized) return <Spinner fullScreen />
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, initialized } = useSelector(s => s.auth)
  if (!initialized) return <Spinner fullScreen />
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      dispatch(getMe())
    } else {
      dispatch({ type: 'auth/setInitialized' })
    }
  }, [dispatch])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="courses"   element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="courses/:courseId/modules/:moduleId" element={<ModulePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
