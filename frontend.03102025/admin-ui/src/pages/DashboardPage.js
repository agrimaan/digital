import React, { useEffect, useState } from 'react'
import { Grid, Paper, Typography, Card, CardContent, CardHeader } from '@mui/material'
import { styled } from '@mui/material/styles'
import { getDashboardData } from '../services/dashboardApi'

const Root = styled('div')({ flexGrow: 1 })
const StyledPaper = styled(Paper)(({ theme }) => ({ padding: theme.spacing(2), height: '100%' }))
const StyledCard = styled(Card)({ height: '100%' })
const StyledCardHeader = styled(CardHeader)(({ theme }) => ({ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }))

function DashboardPage() {
const [state, setState] = useState({ loading: true, data: null, error: null })

useEffect(() => {
let mounted = true
;(async () => {
try {
const data = await getDashboardData()
console.log('Dashboard data:', data);
if (mounted) setState({ loading: false, data, error: null })
} catch (e) {
if (mounted) setState({ loading: false, data: null, error: 'Failed to load dashboard data' })
}
})()
return () => { mounted = false }
}, [])

if (state.loading) return <Typography sx={{ p: 2 }}>Loading dashboard data...</Typography>
if (state.error) return <Typography sx={{ p: 2 }} color="error">{state.error}</Typography>

const stats = state.data?.stats || { totalUsers: 0, activeUsers: 0, totalTransactions: 0, revenue: 0 }
const recentActivity = state.data?.recentActivity || []

return (
<Root>
<Typography variant="h4" sx={{ mb: 3 }}>Dashboard</Typography>
<Grid container spacing={3}>
<Grid item xs={12} sm={6} md={3}>
<StyledCard>
<StyledCardHeader title="Total Users" />
<CardContent><Typography variant="h3">{stats.totalUsers}</Typography></CardContent>
</StyledCard>
</Grid>
<Grid item xs={12} sm={6} md={3}>
<StyledCard>
<StyledCardHeader title="Active Users" />
<CardContent><Typography variant="h3">{stats.activeUsers}</Typography></CardContent>
</StyledCard>
</Grid>
<Grid item xs={12} sm={6} md={3}>
<StyledCard>
<StyledCardHeader title="Transactions" />
<CardContent><Typography variant="h3">{stats.totalTransactions}</Typography></CardContent>
</StyledCard>
</Grid>
<Grid item xs={12} sm={6} md={3}>
<StyledCard>
<StyledCardHeader title="Revenue" />
<CardContent><Typography variant="h3">${Number(stats.revenue || 0).toLocaleString()}</Typography></CardContent>
</StyledCard>
</Grid>
<Grid item xs={12}>
<StyledPaper>
<Typography variant="h6" gutterBottom>Recent Activity</Typography>
{recentActivity.length === 0
? <Typography>No recent activity</Typography>
: recentActivity.map(a => (
<Typography key={a.id}>
{a.user} - {a.type} - {new Date(a.timestamp).toLocaleString()}
</Typography>
))
}
</StyledPaper>
</Grid>
</Grid>
</Root>
)
}

export default DashboardPage