import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader 
} from '@mui/material';
import { styled } from '@mui/material/styles';

import api from '../services/api';


const Root = styled('div')({
  flexGrow: 1,
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StyledCard = styled(Card)({
  height: '100%',
});

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    data: null,
    error: null,
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Replace with actual API endpoint
        const response = await api.get('/dashboard');
        console.log('Dashboard API response:', response);
        setDashboardData({
          loading: false,
          data: response.data,
          error: null,
        });
      } catch (error) {
        setDashboardData({
          loading: false,
          data: null,
          error: 'Failed to load dashboard data',
        });
        console.error('Dashboard data fetch error:', error);
      }
        
    };
    
    // Simulate API call for now
    setTimeout(() => {
      setDashboardData({
        loading: false,
        data: {
          // Sample data - replace with actual data structure
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
      });
    }, 1000);
    
    // Uncomment to use real API
     fetchDashboardData();
  }, []);
  
  if (dashboardData.loading) {
    return <Typography>Loading dashboard data...</Typography>;
  }
  
  if (dashboardData.error) {
    return <Typography color="error">{dashboardData.error}</Typography>;
  }
  
  const { stats, recentActivity } = dashboardData.data;
  
  return (
    <Root>
      <Typography variant="h4" sx={{ marginBottom: 3 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <StyledCardHeader title="Total Users" />
            <CardContent>
              <Typography variant="h3">{stats.totalUsers}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <StyledCardHeader title="Active Users" />
            <CardContent>
              <Typography variant="h3">{stats.activeUsers}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <StyledCardHeader title="Transactions" />
            <CardContent>
              <Typography variant="h3">{stats.totalTransactions}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <StyledCardHeader title="Revenue" />
            <CardContent>
              <Typography variant="h3">${stats.revenue.toLocaleString()}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {recentActivity.map((activity) => (
              <div key={activity.id}>
                <Typography>
                  {activity.user} - {activity.type} - {new Date(activity.timestamp).toLocaleString()}
                </Typography>
              </div>
            ))}
          </StyledPaper>
        </Grid>
      </Grid>
    </Root>
  );
};

export default DashboardPage;
