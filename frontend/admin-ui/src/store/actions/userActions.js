import axios from 'axios';
import { setAuthToken } from '../../utils/setAuthToken';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Action Types
export const USER_ACTIONS = {
  FETCH_USERS_REQUEST: 'FETCH_USERS_REQUEST',
  FETCH_USERS_SUCCESS: 'FETCH_USERS_SUCCESS',
  FETCH_USERS_FAILURE: 'FETCH_USERS_FAILURE',
  CREATE_USER_REQUEST: 'CREATE_USER_REQUEST',
  CREATE_USER_SUCCESS: 'CREATE_USER_SUCCESS',
  CREATE_USER_FAILURE: 'CREATE_USER_FAILURE',
  UPDATE_USER_REQUEST: 'UPDATE_USER_REQUEST',
  UPDATE_USER_SUCCESS: 'UPDATE_USER_SUCCESS',
  UPDATE_USER_FAILURE: 'UPDATE_USER_FAILURE',
  DELETE_USER_REQUEST: 'DELETE_USER_REQUEST',
  DELETE_USER_SUCCESS: 'DELETE_USER_SUCCESS',
  DELETE_USER_FAILURE: 'DELETE_USER_FAILURE',
  BULK_DELETE_USERS_REQUEST: 'BULK_DELETE_USERS_REQUEST',
  BULK_DELETE_USERS_SUCCESS: 'BULK_DELETE_USERS_SUCCESS',
  BULK_DELETE_USERS_FAILURE: 'BULK_DELETE_USERS_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Action Creators
export const fetchUsers = (params = {}) => async (dispatch) => {
  try {
    dispatch({ type: USER_ACTIONS.FETCH_USERS_REQUEST });
    
    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/users?${queryParams}`);
    
    dispatch({
      type: USER_ACTIONS.FETCH_USERS_SUCCESS,
      payload: {
        users: response.data.users,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
      },
    });
  } catch (error) {
    dispatch({
      type: USER_ACTIONS.FETCH_USERS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch users',
    });
  }
};

export const createUser = (userData) => async (dispatch) => {
  try {
    dispatch({ type: USER_ACTIONS.CREATE_USER_REQUEST });
    
    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    const response = await axios.post(`${API_URL}/users`, userData);
    
    dispatch({
      type: USER_ACTIONS.CREATE_USER_SUCCESS,
      payload: response.data.user,
    });
    
    return response.data;
  } catch (error) {
    dispatch({
      type: USER_ACTIONS.CREATE_USER_FAILURE,
      payload: error.response?.data?.message || 'Failed to create user',
    });
    throw error;
  }
};

export const updateUser = (userId, userData) => async (dispatch) => {
  try {
    dispatch({ type: USER_ACTIONS.UPDATE_USER_REQUEST });
    
    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    const response = await axios.put(`${API_URL}/users/${userId}`, userData);
    
    dispatch({
      type: USER_ACTIONS.UPDATE_USER_SUCCESS,
      payload: response.data.user,
    });
    
    return response.data;
  } catch (error) {
    dispatch({
      type: USER_ACTIONS.UPDATE_USER_FAILURE,
      payload: error.response?.data?.message || 'Failed to update user',
    });
    throw error;
  }
};

export const deleteUser = (userId) => async (dispatch) => {
  try {
    dispatch({ type: USER_ACTIONS.DELETE_USER_REQUEST });
    
    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    await axios.delete(`${API_URL}/users/${userId}`);
    
    dispatch({
      type: USER_ACTIONS.DELETE_USER_SUCCESS,
      payload: userId,
    });
  } catch (error) {
    dispatch({
      type: USER_ACTIONS.DELETE_USER_FAILURE,
      payload: error.response?.data?.message || 'Failed to delete user',
    });
    throw error;
  }
};

export const bulkDeleteUsers = (userIds) => async (dispatch) => {
  try {
    dispatch({ type: USER_ACTIONS.BULK_DELETE_USERS_REQUEST });
    
    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    await axios.post(`${API_URL}/users/bulk-delete`, { userIds });
    
    dispatch({
      type: USER_ACTIONS.BULK_DELETE_USERS_SUCCESS,
      payload: userIds,
    });
  } catch (error) {
    dispatch({
      type: USER_ACTIONS.BULK_DELETE_USERS_FAILURE,
      payload: error.response?.data?.message || 'Failed to delete users',
    });
    throw error;
  }
};

export const clearError = () => ({
  type: USER_ACTIONS.CLEAR_ERROR,
});