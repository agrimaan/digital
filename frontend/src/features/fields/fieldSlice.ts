import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { setAlert } from '../alert/alertSlice';

// Types
interface Location {
  type: 'Point';
  coordinates: number[]; // [lng, lat]
}

interface SoilHealth {
  ph?: number;
  organicMatter?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
}

export interface Fields {
  _id: string;
  name: string;
  owner: string;
  location: Location;
  area: number;
  boundary?: string;
  soilType?: string;
  locationName?: string;
  description?: string;
  crops: string[];
  status: 'active' | 'fallow' | 'preparation' | 'harvested';
  irrigationSource: 'rainfed' | 'canal' | 'well' | 'borewell' | 'pond' | 'river' | 'other';
  irrigationSystem: 'flood' | 'drip' | 'sprinkler' | 'none' | 'other';
  soilHealth?: SoilHealth;
  createdAt: Date;
  updatedAt: Date;
}

interface FieldState {
  fields: Fields[];
  Fields: Fields | null;
  loading: boolean;
  error: string | null;
}

// ================= THUNKS ==================

// Get all fields
export const getFields = createAsyncThunk(
  'Fields/getFields',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/fields`);
      // Normalize: always return array
      if (Array.isArray(res.data)) return res.data;
      if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch fields');
    }
  }
);

// Get Fields by ID
// Get Fields by ID
export const getFieldsById = createAsyncThunk(
  'Fields/getFieldsById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/fields/${id}`);
      // If API returns { success: true, data: { ... } }
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch field');
    }
  }
);


// Create Fields
export const createFields = createAsyncThunk(
  'Fields/createFields',
  async (formData: Partial<Fields>, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/fields`, formData);

      dispatch(
        setAlert({ message: 'Fields created successfully', type: 'success' }) as any
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create Fields');
    }
  }
);

// Update Fields
export const updateFields = createAsyncThunk(
  'Fields/updateFields',
  async ({ id, data }: { id: string; data: Partial<Fields> }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/fields/${id}`, data);

      dispatch(
        setAlert({ message: 'Fields updated successfully', type: 'success' }) as any
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update Fields');
    }
  }
);

// Delete Fields
export const deleteFields = createAsyncThunk(
  'Fields/deleteFields',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/fields/${id}`);

      dispatch(
        setAlert({ message: 'Field deleted successfully', type: 'success' }) as any
      );

      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete Fields');
    }
  }
);

// Get nearby fields
export const getNearbyfields = createAsyncThunk(
  'Fields/getNearbyfields',
  async ({ lng, lat, distance }: { lng: number; lat: number; distance: number }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fields/nearby?longitude=${lng}&latitude=${lat}&distance=${distance}`
      );
      return Array.isArray(res.data.data) ? res.data.data : [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch nearby fields');
    }
  }
);

// ================= SLICE ==================
const initialState: FieldState = {
  fields: [],
  Fields: null,
  loading: false,
  error: null,
};

const fieldSlice = createSlice({
  name: 'Fields',
  initialState,
  reducers: {
    clearFields: (state) => {
      state.Fields = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all fields
      .addCase(getFields.pending, (state) => { state.loading = true; })
      .addCase(getFields.fulfilled, (state, action) => { state.fields = action.payload; state.loading = false; })
      .addCase(getFields.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Get Fields by ID
      .addCase(getFieldsById.pending, (state) => { state.loading = true; })
      .addCase(getFieldsById.fulfilled, (state, action) => { state.Fields = action.payload; state.loading = false; })
      .addCase(getFieldsById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Create Fields
      .addCase(createFields.pending, (state) => { state.loading = true; })
      .addCase(createFields.fulfilled, (state, action) => {
        if (Array.isArray(state.fields)) state.fields.push(action.payload);
        state.Fields = action.payload;
        state.loading = false;
      })
      .addCase(createFields.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Update Fields
      .addCase(updateFields.pending, (state) => { state.loading = true; })
      .addCase(updateFields.fulfilled, (state, action) => {
        state.fields = state.fields.map(f => f._id === action.payload._id ? action.payload : f);
        state.Fields = action.payload;
        state.loading = false;
      })
      .addCase(updateFields.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Delete Fields
      .addCase(deleteFields.pending, (state) => { state.loading = true; })
      .addCase(deleteFields.fulfilled, (state, action) => {
        state.fields = state.fields.filter(f => f._id !== action.payload);
        state.Fields = null;
        state.loading = false;
      })
      .addCase(deleteFields.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Get nearby fields
      .addCase(getNearbyfields.pending, (state) => { state.loading = true; })
      .addCase(getNearbyfields.fulfilled, (state, action) => { state.fields = action.payload; state.loading = false; })
      .addCase(getNearbyfields.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  }
});

export const { clearFields, clearError } = fieldSlice.actions;

export default fieldSlice.reducer;
