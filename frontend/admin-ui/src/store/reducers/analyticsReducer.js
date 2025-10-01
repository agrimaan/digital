import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  analytics: {
    stats: {},
    charts: [],
    recentActivity: [],
    userGrowth: [],
    contentStats: {}
  },
  loading: false,
  error: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date().toISOString()
  },
  filters: {
    type: 'all',
    period: '30d'
  }
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    fetchAnalyticsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAnalyticsSuccess: (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
      state.error = null;
    },
    fetchAnalyticsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  fetchAnalyticsStart,
  fetchAnalyticsSuccess,
  fetchAnalyticsFailure,
  setDateRange,
  setFilters,
  clearError
} = analyticsSlice.actions;

export default analyticsSlice.reducer;