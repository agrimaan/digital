import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Fetch notifications
export const fetchNotifications = (page = 1, limit = 10, filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: 'FETCH_NOTIFICATIONS_START' });
    const response = await axios.get(`${API_URL}/notifications`, {
      params: { page, limit, ...filters }
    });
    dispatch({ type: 'FETCH_NOTIFICATIONS_SUCCESS', payload: response.data });
  } catch (error) {
    dispatch({ type: 'FETCH_NOTIFICATIONS_FAILURE', payload: error.response?.data?.message || 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markNotificationAsRead = (id) => async (dispatch) => {
  try {
    dispatch({ type: 'MARK_NOTIFICATION_READ_START' });
    const response = await axios.put(`${API_URL}/notifications/${id}/read`);
    dispatch({ type: 'MARK_NOTIFICATION_READ_SUCCESS', payload: response.data });
  } catch (error) {
    dispatch({ type: 'MARK_NOTIFICATION_READ_FAILURE', payload: error.response?.data?.message || 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = () => async (dispatch) => {
  try {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ_START' });
    const response = await axios.put(`${API_URL}/notifications/mark-all-read`);
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ_SUCCESS', payload: response.data });
  } catch (error) {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ_FAILURE', payload: error.response?.data?.message || 'Failed to mark all notifications as read' });
  }
};

// Delete notification
export const deleteNotification = (id) => async (dispatch) => {
  try {
    dispatch({ type: 'DELETE_NOTIFICATION_START' });
    await axios.delete(`${API_URL}/notifications/${id}`);
    dispatch({ type: 'DELETE_NOTIFICATION_SUCCESS', payload: id });
  } catch (error) {
    dispatch({ type: 'DELETE_NOTIFICATION_FAILURE', payload: error.response?.data?.message || 'Failed to delete notification' });
  }
};

// Send notification
export const sendNotification = (notificationData) => async (dispatch) => {
  try {
    dispatch({ type: 'SEND_NOTIFICATION_START' });
    const response = await axios.post(`${API_URL}/notifications/send`, notificationData);
    dispatch({ type: 'SEND_NOTIFICATION_SUCCESS', payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({ type: 'SEND_NOTIFICATION_FAILURE', payload: error.response?.data?.message || 'Failed to send notification' });
    throw error;
  }
};