import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useDispatch, useSelector } from 'react-redux'
import CssBaseline from '@mui/material/CssBaseline'

import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import UserManagement from './components/admin/UserManagement'

import { checkAuth } from './store/actions/authActions'

const theme = createTheme({
palette: {
primary: { main: '#4caf50' },
secondary: { main: '#ff9800' },
background: { default: '#f4f6f8' }
},
typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
})
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
const PrivateRoute = () => {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
const { isAuthenticated, loading } = useSelector(state => state.auth)
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
if (loading) {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
return <div>Loading...</div>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
}
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
}
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
function App() {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
const dispatch = useDispatch()
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
useEffect(() => {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
dispatch(checkAuth())
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
}, [dispatch])
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
return (
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<BrowserRouter>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<ThemeProvider theme={theme}>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<CssBaseline />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Routes>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route path="/login" element={<LoginPage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route element={<PrivateRoute />}>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route element={<MainLayout />}>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route path="/dashboard" element={<DashboardPage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route path="/profile" element={<ProfilePage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route path="/users" element={<UserManagement />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route index element={<Navigate to="/dashboard" replace />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
<Route path="*" element={<NotFoundPage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
</Route>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
</Route>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
</Routes>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
</ThemeProvider>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
</BrowserRouter>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
)
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
}
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
export default App
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
