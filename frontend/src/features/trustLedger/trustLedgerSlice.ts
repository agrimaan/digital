import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TrustProfile, LedgerEntry } from '../../types/agrimaan';
import axios from 'axios';

export const fetchTrustProfile = createAsyncThunk<TrustProfile, string>(
  'trust/fetchProfile',
  async (userId) => {
    const { data } = await axios.get(`/api/trust/${userId}`);
    return data as TrustProfile;
  }
);

export const addLedgerEntry = createAsyncThunk<LedgerEntry, Partial<LedgerEntry>>(
  'trust/addEntry',
  async (entry) => {
    const { data } = await axios.post('/api/trust/entries', entry);
    return data as LedgerEntry;
  }
);

interface TrustState {
  profile?: TrustProfile;
  loading: boolean;
  error?: string;
}
const initialState: TrustState = { loading: false };

const trustSlice = createSlice({
  name: 'trust',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTrustProfile.pending, (s)=>{ s.loading=true; s.error=undefined; })
     .addCase(fetchTrustProfile.fulfilled, (s,a)=>{ s.loading=false; s.profile=a.payload; })
     .addCase(fetchTrustProfile.rejected, (s,a)=>{ s.loading=false; s.error=a.error.message; })
     .addCase(addLedgerEntry.fulfilled, (s,a)=>{
        if (!s.profile) return;
        s.profile.history.unshift(a.payload);
        // Optionally refetch or recompute score client-side
     });
  }
});

export default trustSlice.reducer;
