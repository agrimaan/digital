import React, { useEffect, useState } from 'react'
import { Grid, Paper, Typography, Card, CardContent, CardHeader, CircularProgress, Box } from '@mui/material'
import api from '../services/api'

const DashboardPage = () => {
const [dashboardData, setDashboardData] = useState({
loading: true,
data: null,
error: null,
})

useEffect(() => {
const fetchDashboardData = async () => {
try {
const response = await api.get('/dashboard')
setDashboardData({
loading: false,
data: response.data,
error: null,
})
} catch (error) {
setDashboardData({
loading: false,
data: null,
error: 'Failed to load dashboard data',
})
console.error('Dashboard data fetch error:', error)
}
}

const t = setTimeout(() => {
  setDashboardData({
    loading: false,
    data: {
      stats: {
        totalUsers: 1250,
        activeUsers: 876,
        totalTransactions: 5432,
        revenue: 123456,
      },
      recentActivity: [
        { id: 1, type: 'login', user: 'John Doe', timestamp: '2023-06-15T10:30:00Z' },
        { id: 2, type: 'transaction', user: 'Jane Smith', timestamp: '2023-06-15T09:45:00Z' },
        { id: 3, type: 'signup', user: 'New User', timestamp: '2023-06-15T08:20:00Z' },
      ],
    },
    error: null,
  })
}, 800)

// fetchDashboardData()

return () => clearTimeout(t)


}, [])

if (dashboardData.loading) {
return (
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
<CircularProgress size={24} />
<Typography>Loading dashboard data...</Typography>
</Box>
)
}

if (dashboardData.error) {
return (
<Box sx={{ p: 3 }}>
<Typography color="error">{dashboardData.error}</Typography>
</Box>
)
}

const { stats, recentActivity } = dashboardData.data

const headerSx = theme => ({
bgcolor: theme.palette.primary.main,
color: theme.palette.primary.contrastText,
})

return (
<Box sx={{ flexGrow: 1 }}>
<Typography variant="h4" sx={{ mb: 3 }}>
Dashboard
</Typography>

  <Grid container spacing={3}>
    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Total Users" sx={headerSx} />
        <CardContent>
          <Typography variant="h3">{stats.totalUsers}</Typography>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Active Users" sx={headerSx} />
        <CardContent>
          <Typography variant="h3">{stats.activeUsers}</Typography>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Transactions" sx={headerSx} />
        <CardContent>
          <Typography variant="h3">{stats.totalTransactions}</Typography>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Revenue" sx={headerSx} />
        <CardContent>
          <Typography variant="h3">${stats.revenue.toLocaleString()}</Typography>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        {recentActivity.map(activity => (
          <Typography key={activity.id}>
            {activity.user} - {activity.type} - {new Date(activity.timestamp).toLocaleString()}
          </Typography>
        ))}
      </Paper>
    </Grid>
  </Grid>
</Box>
)
}