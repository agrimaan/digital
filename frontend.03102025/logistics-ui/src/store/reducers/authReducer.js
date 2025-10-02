import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      localStorage.setItem('token', action.payload.token);
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload.user;
    },
    loginFailure: (state, action) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
    },
    authLoaded: (state, action) => {
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload;
    },
    authError: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
    }
  }
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  authLoaded, 
  authError 
} = authSlice.actions;

export default authSlice.reducer;
