import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Resource, Booking } from '../../types/agrimaan';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Get API base URL from environment variables
//const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api'; // Fallback to /api for proxy

export const fetchResources = createAsyncThunk<Resource[]>(
  'resources/fetchAll',
  async () => (await axios.get(`${API_BASE_URL}/api/resources`)).data
);

export const createBooking = createAsyncThunk<Booking, Omit<Booking,'id'|'status'>>(
  'resources/createBooking',
  async (payload) => (await axios.post(`${API_BASE_URL}/bookings`, payload)).data
);

interface ResourcesState {
  list: Resource[];
  loading: boolean;
  error?: string;
  bookings: Booking[];
}
const initial: ResourcesState = { list: [], loading: false, bookings: [] };

const resourcesSlice = createSlice({
  name: 'resources',
  initialState: initial,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchResources.pending, (s)=>{ s.loading=true; s.error=undefined; })
     .addCase(fetchResources.fulfilled, (s,a)=>{ s.loading=false; s.list=a.payload; })
     .addCase(fetchResources.rejected, (s,a)=>{ s.loading=false; s.error=a.error.message; })
     .addCase(createBooking.fulfilled, (s,a)=>{ s.bookings.push(a.payload); });
  }
});

export default resourcesSlice.reducer;
