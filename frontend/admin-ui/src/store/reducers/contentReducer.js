import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  content: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  },
  filters: {
    search: '',
    type: ''
  },
  selectedContent: null,
  exportLoading: false,
  importLoading: false
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    // Fetch content
    fetchContentStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchContentSuccess: (state, action) => {
      state.loading = false;
      state.content = action.payload.content || action.payload;
      state.pagination = action.payload.pagination || state.pagination;
      state.error = null;
    },
    fetchContentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create content
    createContentStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createContentSuccess: (state, action) => {
      state.loading = false;
      state.content.unshift(action.payload);
      state.error = null;
    },
    createContentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update content
    updateContentStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateContentSuccess: (state, action) => {
      state.loading = false;
      const index = state.content.findIndex(item => item._id === action.payload._id);
      if (index !== -1) {
        state.content[index] = action.payload;
      }
      state.error = null;
    },
    updateContentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete content
    deleteContentStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteContentSuccess: (state, action) => {
      state.loading = false;
      state.content = state.content.filter(item => item._id !== action.payload);
      state.error = null;
    },
    deleteContentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Bulk delete
    bulkDeleteContentStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    bulkDeleteContentSuccess: (state, action) => {
      state.loading = false;
      state.content = state.content.filter(item => !action.payload.includes(item._id));
      state.error = null;
    },
    bulkDeleteContentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Export
    exportContentStart: (state) => {
      state.exportLoading = true;
      state.error = null;
    },
    exportContentSuccess: (state) => {
      state.exportLoading = false;
      state.error = null;
    },
    exportContentFailure: (state, action) => {
      state.exportLoading = false;
      state.error = action.payload;
    },

    // Import
    importContentStart: (state) => {
      state.importLoading = true;
      state.error = null;
    },
    importContentSuccess: (state, action) => {
      state.importLoading = false;
      state.error = null;
    },
    importContentFailure: (state, action) => {
      state.importLoading = false;
      state.error = action.payload;
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Set selected content
    setSelectedContent: (state, action) => {
      state.selectedContent = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  fetchContentStart,
  fetchContentSuccess,
  fetchContentFailure,
  createContentStart,
  createContentSuccess,
  createContentFailure,
  updateContentStart,
  updateContentSuccess,
  updateContentFailure,
  deleteContentStart,
  deleteContentSuccess,
  deleteContentFailure,
  bulkDeleteContentStart,
  bulkDeleteContentSuccess,
  bulkDeleteContentFailure,
  exportContentStart,
  exportContentSuccess,
  exportContentFailure,
  importContentStart,
  importContentSuccess,
  importContentFailure,
  setFilters,
  setSelectedContent,
  clearError
} = contentSlice.actions;

export default contentSlice.reducer;