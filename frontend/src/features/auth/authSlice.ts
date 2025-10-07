import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { setAlert } from '../alert/alertSlice';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  error: string | null;
}

// Helper to manage token
const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Async Thunks
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('No token found');
    }
    setAuthToken(token);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
      return res.data; // The payload will be { success: true, user: { ... } }
    } catch (err: any) {
      setAuthToken(null);
      return rejectWithValue('Invalid token');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (formData: any, { dispatch, rejectWithValue }) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      dispatch(setAlert({ message: 'Registration successful! Please log in.', type: 'success' }) as any);
      return null;
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        errors.forEach((error: any) => {
          dispatch(setAlert({ message: error.msg, type: 'error' }) as any);
        });
      }
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (formData: any, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      setAuthToken(res.data.token);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Invalid credentials');
    }
  }
);

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      setAuthToken(null);
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        // DEFINITIVE FIX: Check for the user object and the role *inside* the user object.
        if (action.payload && action.payload.user && action.payload.user.role) {
          state.isAuthenticated = true;
          state.user = action.payload.user; // Set the nested user object to the state
          state.token = localStorage.getItem('token');
        } else {
          // If the payload is malformed, treat it as a failure.
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          setAuthToken(null);
        }
        state.loading = false;
      })
      .addCase(loadUser.rejected, (state) => {
        setAuthToken(null);
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        setAuthToken(null);
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;