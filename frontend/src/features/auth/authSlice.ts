import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { setAlert } from '../alert/alertSlice';

// Types
interface User {
  id: string;
  name: string;
  lastnmae: string;
  email: string;
  role: string;
  fields?: string[];
  profileImage?: string;
  logistics?: {
    vehicleTypes: string[];
    serviceAreas: Array<{
      state: string;
      districts: string[];
    }>;
    capacity: {
      maxWeight: number;
      maxVolume: number;
    };
    services: string[];
    verified: boolean;
    rating: {
      average: number;
      count: number;
    };
  };
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

// Set auth token in headers
const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};


// Load user
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue(null);
    }
    setAuthToken(token);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
      return res.data;
    } catch (err: any) {
      setAuthToken(null);
      return rejectWithValue(err.response?.data?.message || 'Failed to load user');
    }
  }
);

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (formData: RegisterData, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      return null;
    
    } catch (err: any) {
      const errors = err.response?.data?.errors;

      if (errors) {
        errors.forEach((error: any) => {
          dispatch(
            setAlert({
              message: error.msg,
              type: 'error',
            }) as any
          );
        });
      }

      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (formData: LoginCredentials, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);

      // Store token in axios + localStorage
      setAuthToken(res.data.token);

      // If backend already gives user, return it
      if (res.data.user) {
        return res.data;
      }

      // Otherwise, immediately load user details
      const userRes = await axios.get(`${API_BASE_URL}/api/auth/me`);
      return { token: res.data.token, user: userRes.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Invalid credentials');
    }
  }
);

// Initial state
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null,
};

// Slice
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
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload ? (action.payload as string) : null;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      // This is the key change: The fulfilled case no longer sets auth state.
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload as string;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload.user ?? null;
      })
      .addCase(login.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;