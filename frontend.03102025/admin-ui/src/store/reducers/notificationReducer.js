import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  },
  filters: {
    type: '',
    status: '',
    startDate: '',
    endDate: ''
  },
  unreadCount: 0
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    fetchNotificationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNotificationsSuccess: (state, action) => {
      state.loading = false;
      state.notifications = action.payload.notifications || action.payload;
      state.pagination = action.payload.pagination || state.pagination;
      state.unreadCount = action.payload.unreadCount || 0;
      state.error = null;
    },
    fetchNotificationsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    markNotificationReadStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    markNotificationReadSuccess: (state, action) => {
      state.loading = false;
      const index = state.notifications.findIndex(n => n._id === action.payload._id);
      if (index !== -1) {
        state.notifications[index] = action.payload;
      }
      state.unreadCount = Math.max(0, state.unreadCount - 1);
      state.error = null;
    },
    markNotificationReadFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    markAllNotificationsReadStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    markAllNotificationsReadSuccess: (state) => {
      state.loading = false;
      state.notifications = state.notifications.map(n => ({ ...n, read: true }));
      state.unreadCount = 0;
      state.error = null;
    },
    markAllNotificationsReadFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteNotificationStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteNotificationSuccess: (state, action) => {
      state.loading = false;
      state.notifications = state.notifications.filter(n => n._id !== action.payload);
      state.error = null;
    },
    deleteNotificationFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    sendNotificationStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    sendNotificationSuccess: (state, action) => {
      state.loading = false;
      state.notifications.unshift(action.payload);
      state.error = null;
    },
    sendNotificationFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
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
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  markNotificationReadStart,
  markNotificationReadSuccess,
  markNotificationReadFailure,
  markAllNotificationsReadStart,
  markAllNotificationsReadSuccess,
  markAllNotificationsReadFailure,
  deleteNotificationStart,
  deleteNotificationSuccess,
  deleteNotificationFailure,
  sendNotificationStart,
  sendNotificationSuccess,
  sendNotificationFailure,
  setFilters,
  clearError
} = notificationSlice.actions;

export default notificationSlice.reducer;