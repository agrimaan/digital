import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PointsSummary, SustainabilityAction } from '../../types/agrimaan';
import axios from 'axios';

export const fetchPoints = createAsyncThunk<PointsSummary, string>(
  'sustainability/fetchPoints',
  async (userId) => (await axios.get(`/api/sustainability/${userId}`)).data
);

export const logAction = createAsyncThunk<SustainabilityAction, Omit<SustainabilityAction,'id'|'createdAt'>>(
  'sustainability/logAction',
  async (payload) => (await axios.post('/api/sustainability/actions', payload)).data
);

interface SustainabilityState {
  summary?: PointsSummary;
  loading: boolean;
  error?: string;
}
const initial: SustainabilityState = { loading: false };

const sustainabilitySlice = createSlice({
  name: 'sustainability',
  initialState: initial,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPoints.pending, (s)=>{ s.loading=true; s.error=undefined; })
     .addCase(fetchPoints.fulfilled, (s,a)=>{ s.loading=false; s.summary=a.payload; })
     .addCase(fetchPoints.rejected, (s,a)=>{ s.loading=false; s.error=a.error.message; })
     .addCase(logAction.fulfilled, (s,a)=>{
        if (!s.summary) return;
        s.summary.actions.unshift(a.payload);
        s.summary.totalPoints += a.payload.points;
        s.summary.carbonCredits = Math.floor(s.summary.totalPoints / 1000);
     });
  }
});

export default sustainabilitySlice.reducer;
