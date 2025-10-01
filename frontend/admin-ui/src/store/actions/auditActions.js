import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Fetch audit logs
export const fetchAuditLogs = (page = 1, limit = 10, filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: 'FETCH_AUDIT_LOGS_START' });
    const response = await axios.get(`${API_URL}/audit-logs`, {
      params: { page, limit, ...filters }
    });
    dispatch({ type: 'FETCH_AUDIT_LOGS_SUCCESS', payload: response.data });
  } catch (error) {
    dispatch({ type: 'FETCH_AUDIT_LOGS_FAILURE', payload: error.response?.data?.message || 'Failed to fetch audit logs' });
  }
};

// Export audit logs
export const exportAuditLogs = (format = 'csv', filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: 'EXPORT_AUDIT_LOGS_START' });
    const response = await axios.post(`${API_URL}/audit-logs/export`, { format, filters }, {
      responseType: 'blob'
    });
    dispatch({ type: 'EXPORT_AUDIT_LOGS_SUCCESS' });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-export.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  } catch (error) {
    dispatch({ type: 'EXPORT_AUDIT_LOGS_FAILURE', payload: error.response?.data?.message || 'Failed to export audit logs' });
    throw error;
  }
};