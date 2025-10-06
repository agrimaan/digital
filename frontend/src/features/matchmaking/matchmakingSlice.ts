import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { setAlert } from '../alert/alertSlice';

// Types
export interface MatchRecommendation {
  id: string;
  farmerId: string;
  buyerId: string;
  crop: string;
  score: number;       // 0..1
  reasons: string[];
}

interface MatchState {
  items: MatchRecommendation[];
  loading: boolean;
  error: string | null;
}

// Get recommendations for a farmer
export const getRecommendationsForFarmer = createAsyncThunk(
  'matchmaking/getRecommendationsForFarmer',
  async (farmerId: string, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/matchmaking`, {
        params: { farmerId }
      });
      // Optional toast
      dispatch(setAlert({
        message: `Found ${res.data?.length || 0} buyer matches`,
        type: 'success'
      }) as any);
      return res.data as MatchRecommendation[];
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch farmer matchmaking';
      return rejectWithValue(msg);
    }
  }
);

// Get recommendations for a buyer
export const getRecommendationsForBuyer = createAsyncThunk(
  'matchmaking/getRecommendationsForBuyer',
  async (buyerId: string, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/matchmaking`, {
        params: { buyerId }
      });
      // Optional toast
      dispatch(setAlert({
        message: `Found ${res.data?.length || 0} farmer matches`,
        type: 'success'
      }) as any);
      return res.data as MatchRecommendation[];
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch buyer matchmaking';
      return rejectWithValue(msg);
    }
  }
);

// Initial state
const initialState: MatchState = {
  items: [],
  loading: false,
  error: null
};

// Slice
const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState,
  reducers: {
    clearMatches: (state) => {
      state.items = [];
    },
    clearMatchmakingError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Farmer recs
      .addCase(getRecommendationsForFarmer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRecommendationsForFarmer.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(getRecommendationsForFarmer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Buyer recs
      .addCase(getRecommendationsForBuyer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRecommendationsForBuyer.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(getRecommendationsForBuyer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearMatches, clearMatchmakingError } = matchmakingSlice.actions;

export default matchmakingSlice.reducer;
