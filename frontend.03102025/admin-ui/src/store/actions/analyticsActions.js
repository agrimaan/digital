import axios from 'axios';
import { setAuthToken } from '../../utils/setAuthToken';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const ANALYTICS_ACTIONS = {
  FETCH_ANALYTICS_REQUEST: 'FETCH_ANALYTICS_REQUEST',
  FETCH_ANALYTICS_SUCCESS: 'FETCH_ANALYTICS_SUCCESS',
  FETCH_ANALYTICS_FAILURE: 'FETCH_ANALYTICS_FAILURE',
};

export const fetchAnalytics = (params = {}) => async (dispatch) => {
  try {
    dispatch({ type: ANALYTICS_ACTIONS.FETCH_ANALYTICS_REQUEST });
    
    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/analytics?${queryParams}`);
    
    dispatch({
      type: ANALYTICS_ACTIONS.FETCH_ANALYTICS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: ANALYTICS_ACTIONS.FETCH_ANALYTICS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch analytics',
    });
  }
};