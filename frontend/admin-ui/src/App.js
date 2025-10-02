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

import { checkAuth } from './store/actions/authActions'

const theme = createTheme({
palette: {
primary: { main: '#4caf50' },
secondary: { main: '#ff9800' },
background: { default: '#f4f6f8' }
},
typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }
})

const PrivateRoute = () => {
const { isAuthenticated, loading } = useSelector(state => state.auth)

if (loading) {
return <div>Loading...</div>
}

return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function App() {
const dispatch = useDispatch()

useEffect(() => {
dispatch(checkAuth())
}, [dispatch])

return (
<BrowserRouter>
<ThemeProvider theme={theme}>
<CssBaseline />
<Routes>
<Route path="/login" element={<LoginPage />} />
<Route element={<PrivateRoute />}>
<Route element={<MainLayout />}>
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/profile" element={<ProfilePage />} />
<Route index element={<Navigate to="/dashboard" replace />} />
<Route path="*" element={<NotFoundPage />} />
</Route>
</Route>
</Routes>
</ThemeProvider>
</BrowserRouter>
)
}

export default App