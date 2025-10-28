import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
//import { API_BASE_URL } from '../../config/apiConfig';
import { setAlert } from '../alert/alertSlice';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Types
interface LogisticsStats {
  totalDeliveries: number;
  activeDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  totalRevenue: number;
}

interface DeliveryItem {
  crop: {
    _id: string;
    name: string;
    variety: string;
  };
  quantity: number;
  unit: string;
}

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Delivery {
  _id: string;
  orderId: string;
  farmer: {
    _id: string;
    name: string;
  };
  buyer: {
    _id: string;
    name: string;
  };
  items: DeliveryItem[];
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'cancelled';
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  vehicle?: {
    _id: string;
    registrationNumber: string;
    driver: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface LogisticsState {
  deliveries: Delivery[];
  delivery: Delivery | null;
  stats: LogisticsStats | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: LogisticsState = {
  deliveries: [],
  delivery: null,
  stats: null,
  loading: false,
  error: null,
};

// Get all deliveries
export const getDeliveries = createAsyncThunk(
  'logistics/getDeliveries',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/shipments`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch deliveries');
    }
  }
);

// Get delivery by ID
export const getDeliveryById = createAsyncThunk(
  'logistics/getDeliveryById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/shipments/${id}`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch delivery');
    }
  }
);

// Create delivery
export const createDelivery = createAsyncThunk(
  'logistics/createDelivery',
  async (deliveryData: Partial<Delivery>, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/shipments`, deliveryData);
      
      dispatch(
        setAlert({ message: 'Delivery created successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create delivery');
    }
  }
);

// Update delivery
export const updateDelivery = createAsyncThunk(
  'logistics/updateDelivery',
  async ({ id, data }: { id: string; data: Partial<Delivery> }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/shipments/${id}`, data);
      
      dispatch(
        setAlert({ message: 'Delivery updated successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update delivery');
    }
  }
);

// Delete delivery
export const deleteDelivery = createAsyncThunk(
  'logistics/deleteDelivery',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/shipments/${id}`);
      
      dispatch(
        setAlert({ message: 'Delivery deleted successfully', type: 'success' }) as any
      );
      
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete delivery');
    }
  }
);

// Update delivery status
export const updateDeliveryStatus = createAsyncThunk(
  'logistics/updateDeliveryStatus',
  async ({ id, status }: { id: string; status: string }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/shipments/${id}/status`, { status });
      
      dispatch(
        setAlert({ message: 'Delivery status updated successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update delivery status');
    }
  }
);

// Assign vehicle to delivery
export const assignVehicle = createAsyncThunk(
  'logistics/assignVehicle',
  async ({ id, vehicleId }: { id: string; vehicleId: string }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/shipments/${id}/assign-vehicle`, { vehicleId });
      
      dispatch(
        setAlert({ message: 'Vehicle assigned successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to assign vehicle');
    }
  }
);

// Get logistics statistics
export const getLogisticsStats = createAsyncThunk(
  'logistics/getLogisticsStats',
  async (_, { rejectWithValue }) => {
    try {
      // In a real implementation, this would call an API endpoint for statistics
      // For now, we'll return mock data but in a real scenario this would be:
      // const res = await axios.get(`${API_BASE_URL}/api/shipments/stats`);
      // return res.data.data || res.data;
      
      // Mock data for now
      return {
        totalDeliveries: 150,
        activeDeliveries: 12,
        completedDeliveries: 135,
        pendingDeliveries: 3,
        totalRevenue: 75000,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch logistics statistics');
    }
  }
);

// Slice
const logisticsSlice = createSlice({
  name: 'logistics',
  initialState,
  reducers: {
    clearDelivery: (state) => {
      state.delivery = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all deliveries
      .addCase(getDeliveries.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDeliveries.fulfilled, (state, action) => {
        state.deliveries = action.payload;
        state.loading = false;
      })
      .addCase(getDeliveries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get delivery by ID
      .addCase(getDeliveryById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDeliveryById.fulfilled, (state, action) => {
        state.delivery = action.payload;
        state.loading = false;
      })
      .addCase(getDeliveryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create delivery
      .addCase(createDelivery.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDelivery.fulfilled, (state, action) => {
        state.deliveries.push(action.payload);
        state.delivery = action.payload;
        state.loading = false;
      })
      .addCase(createDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update delivery
      .addCase(updateDelivery.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDelivery.fulfilled, (state, action) => {
        state.deliveries = state.deliveries.map(delivery =>
          delivery._id === action.payload._id ? action.payload : delivery
        );
        state.delivery = action.payload;
        state.loading = false;
      })
      .addCase(updateDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete delivery
      .addCase(deleteDelivery.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDelivery.fulfilled, (state, action) => {
        state.deliveries = state.deliveries.filter(delivery => delivery._id !== action.payload);
        state.delivery = null;
        state.loading = false;
      })
      .addCase(deleteDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update delivery status
      .addCase(updateDeliveryStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        state.deliveries = state.deliveries.map(delivery =>
          delivery._id === action.payload._id ? action.payload : delivery
        );
        if (state.delivery && state.delivery._id === action.payload._id) {
          state.delivery = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateDeliveryStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Assign vehicle
      .addCase(assignVehicle.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignVehicle.fulfilled, (state, action) => {
        state.deliveries = state.deliveries.map(delivery =>
          delivery._id === action.payload._id ? action.payload : delivery
        );
        if (state.delivery && state.delivery._id === action.payload._id) {
          state.delivery = action.payload;
        }
        state.loading = false;
      })
      .addCase(assignVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get logistics statistics
      .addCase(getLogisticsStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getLogisticsStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.loading = false;
      })
      .addCase(getLogisticsStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearDelivery, clearError } = logisticsSlice.actions;

export default logisticsSlice.reducer;