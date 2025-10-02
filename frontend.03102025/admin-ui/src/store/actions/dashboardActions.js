
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';



  export const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = api.get(`${process.env.REACT_APP_API_URL}/dashboards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
        return response.data.data;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } 
  };

  export const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/dashboard/users/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching user stats:', err);
      return null;
    }
  };

  export const fetchProductStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/dashboard/products/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching product stats:', err);
      return null;
    }
  };

  export const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/dashboard/orders/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching order stats:', err);
      return null;
    }
  };
    export const fetchRecentOrders = async () => {
        try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/dashboard/orders/recent', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
        } catch (err) {
        console.error('Error fetching recent orders:', err);
        return [];
        }
    };
    export const fetchTopProducts = async () => {
        try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/dashboard/products/top', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
        } catch (err) {
        console.error('Error fetching top products:', err);
        return [];
        }
    };
    export const fetchSalesOverTime = async () => {
        try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/dashboard/sales/overtime', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
        } catch (err) {
        console.error('Error fetching sales over time:', err);
        return [];
        }
    };