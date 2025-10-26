// src/features/crops/cropSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAlert } from '../alert/alertSlice';

export interface Crop {
  _id?: string;
  name: string;
  scientificName?: string;
  variety?:string;
  fieldId: string;
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

export const getCrops = createAsyncThunk('crops/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/crops`);
    const data: Crop[] = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch crops');
  }
});

export const addCrop = createAsyncThunk('crops/add', async (newCrop: Crop, { dispatch, rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/crops`, newCrop);
    dispatch(
      setAlert({ message: 'Crop added successfully', type: 'success' }) as any
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error?.message || 'Failed to add crop');
  }
});

export const updateCrop = createAsyncThunk(
  'crops/update',
  async ({ id, data }: { id: string; data: Partial<Crop> }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/crops/${id}`, data);
      dispatch(
        setAlert({ message: 'Crop updated successfully', type: 'success' }) as any
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update crop');
    }
  }
);

export const deleteCrop = createAsyncThunk('crops/delete', async (id: string, { dispatch, rejectWithValue }) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/crops/${id}`);
    dispatch(
        setAlert({ message: 'Crop deleted successfully', type: 'success' }) as any
    );
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete crop');
  }
});

// ========== Slice ==========
const cropSlice = createSlice({
  name: 'crop',
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

      .addCase(addCrop.fulfilled, (state, action: PayloadAction<Crop>) => {
        state.loading = false;
        state.crops.push(action.payload);
      })
      .addCase(updateCrop.fulfilled, (state, action: PayloadAction<Crop>) => {
        state.loading = false;
        state.crops = state.crops.map((crop) =>
          crop._id === action.payload._id ? action.payload : crop
        );
      })
      .addCase(deleteCrop.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.crops = state.crops.filter((crop) => crop._id !== action.payload);
      });
  },
});


export default cropSlice.reducer;
