import axios from 'axios';
import {
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
  importContentFailure
} from '../reducers/contentReducer';

const API_URL = process.env.REACT_APP_API_URL;

// Fetch all content
export const fetchContent = (page = 1, limit = 10, search = '', type = '') => async (dispatch) => {
  try {
    dispatch(fetchContentStart());
    const response = await axios.get(`${API_URL}/content`, {
      params: { page, limit, search, type }
    });
    dispatch(fetchContentSuccess(response.data));
  } catch (error) {
    dispatch(fetchContentFailure(error.response?.data?.message || 'Failed to fetch content'));
  }
};

// Create new content
export const createContent = (contentData) => async (dispatch) => {
  try {
    dispatch(createContentStart());
    const response = await axios.post(`${API_URL}/content`, contentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    dispatch(createContentSuccess(response.data));
    return response.data;
  } catch (error) {
    dispatch(createContentFailure(error.response?.data?.message || 'Failed to create content'));
    throw error;
  }
};

// Update content
export const updateContent = (id, contentData) => async (dispatch) => {
  try {
    dispatch(updateContentStart());
    const response = await axios.put(`${API_URL}/content/${id}`, contentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    dispatch(updateContentSuccess(response.data));
    return response.data;
  } catch (error) {
    dispatch(updateContentFailure(error.response?.data?.message || 'Failed to update content'));
    throw error;
  }
};

// Delete content
export const deleteContent = (id) => async (dispatch) => {
  try {
    dispatch(deleteContentStart());
    await axios.delete(`${API_URL}/content/${id}`);
    dispatch(deleteContentSuccess(id));
  } catch (error) {
    dispatch(deleteContentFailure(error.response?.data?.message || 'Failed to delete content'));
    throw error;
  }
};

// Bulk delete content
export const bulkDeleteContent = (ids) => async (dispatch) => {
  try {
    dispatch(bulkDeleteContentStart());
    const response = await axios.post(`${API_URL}/content/bulk-delete`, { ids });
    dispatch(bulkDeleteContentSuccess(ids));
    return response.data;
  } catch (error) {
    dispatch(bulkDeleteContentFailure(error.response?.data?.message || 'Failed to bulk delete content'));
    throw error;
  }
};

// Export content
export const exportContent = (format = 'csv', filters = {}) => async (dispatch) => {
  try {
    dispatch(exportContentStart());
    const response = await axios.post(`${API_URL}/content/export`, { format, filters }, {
      responseType: 'blob'
    });
    dispatch(exportContentSuccess());
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `content-export.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  } catch (error) {
    dispatch(exportContentFailure(error.response?.data?.message || 'Failed to export content'));
    throw error;
  }
};

// Import content
export const importContent = (file, format = 'csv') => async (dispatch) => {
  try {
    dispatch(importContentStart());
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const response = await axios.post(`${API_URL}/content/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    dispatch(importContentSuccess(response.data));
    return response.data;
  } catch (error) {
    dispatch(importContentFailure(error.response?.data?.message || 'Failed to import content'));
    throw error;
  }
};