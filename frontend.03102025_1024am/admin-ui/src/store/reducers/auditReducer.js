import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  auditLogs: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  },
  filters: {
    userId: '',
    action: '',
    startDate: '',
    endDate: ''
  },
  exportLoading: false
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    fetchAuditLogsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAuditLogsSuccess: (state, action) => {
      state.loading = false;
      state.auditLogs = action.payload.auditLogs || action.payload;
      state.pagination = action.payload.pagination || state.pagination;
      state.error = null;
    },
    fetchAuditLogsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    exportAuditLogsStart: (state) => {
      state.exportLoading = true;
      state.error = null;
    },
    exportAuditLogsSuccess: (state) => {
      state.exportLoading = false;
      state.error = null;
    },
    exportAuditLogsFailure: (state, action) => {
      state.exportLoading = false;
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
  fetchAuditLogsStart,
  fetchAuditLogsSuccess,
  fetchAuditLogsFailure,
  exportAuditLogsStart,
  exportAuditLogsSuccess,
  exportAuditLogsFailure,
  setFilters,
  clearError
} = auditSlice.actions;

export default auditSlice.reducer;