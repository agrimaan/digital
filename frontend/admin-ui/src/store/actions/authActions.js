import axios from 'axios';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  authLoaded, 
  authError 
} from '../reducers/authReducer';
import { setAuthToken } from '../../utils/setAuthToken';

// Login user
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/admin/login`, { 
      email, 
      password 
    });

    dispatch(loginSuccess(res.data));
    
    // Set token in axios headers
    setAuthToken(res.data.token);
    
    return res.data;
  } catch (err) {
    dispatch(loginFailure(err.response?.data?.message || 'Login failed'));
    throw err;
  }
};

// Check if user is authenticated
export const checkAuth = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    dispatch(authError());
    return;
  }
  
  setAuthToken(token);
  
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
    dispatch(authLoaded(res.data));
  } catch (err) {
     // Handle 401 Unauthorized gracefully
     if (err.response?.status === 401) {
      localStorage.removeItem('token');
      setAuthToken(null);
    }
    dispatch(authError(err.response?.data?.message || 'Authentication failed'));
  }
};

// Logout user
export const logoutUser = () => (dispatch) => {
  dispatch(logout());
};
