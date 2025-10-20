// src/features/crops/cropSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Crop {
  _id?: string;
  name: string;
  scientificName?: string;
  variety?: 
  | 'normal'
  | 'Premium'
  | 'variety1'
  | 'variety2'
  | 'variety3';
  farmId: string;
  farmerId?: string;
  plantedArea: number;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  expectedYield: number;
  actualYield?: number;
  unit?: 'kg' | 'ton' | 'quintal';
  pricePerUnit?: number;
  totalValue?: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  soilType:
    | 'loam'
    | 'clay'
    | 'sandy'
    | 'silty'
    | 'peaty'
    | 'chalky'
    | 'alluvial';
  irrigationMethod:
    | 'drip'
    | 'sprinkler'
    | 'flood'
    | 'rainfed'
    | 'center-pivot';
  seedSource: 'own' | 'market' | 'government' | 'supplier';
  healthStatus?: 'excellent' | 'good' | 'fair' | 'poor' | 'diseased';
  growthStage?:
    | 'seedling'
    | 'vegetative'
    | 'flowering'
    | 'fruiting'
    | 'maturity'
    | 'harvested'
    | 'failed';
  notes?: string;
}

interface CropState {
  crops: Crop[];
  loading: boolean;
  error: string | null;
}

const initialState: CropState = {
  crops: [],
  loading: false,
  error: null,
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Fetch all crops (for farmer)
export const getCrops = createAsyncThunk<Crop[]>(
  'crops/fetchAll',
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/crops`);
      return res.data.data || res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// Add new crop
export const addCrop = createAsyncThunk<Crop, Crop>(
  'crops/add',
  async (cropData, thunkAPI) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/crops`, cropData);
      return res.data.data || res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

const cropSlice = createSlice({
  name: 'crops',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCrops.fulfilled, (state, action: PayloadAction<Crop[]>) => {
        state.loading = false;
        state.crops = action.payload;
      })
      .addCase(getCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addCrop.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCrop.fulfilled, (state, action: PayloadAction<Crop>) => {
        state.loading = false;
        state.crops.push(action.payload);
      })
      .addCase(addCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default cropSlice.reducer;
