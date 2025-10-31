import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
//import { API_BASE_URL } from '../../config/apiConfig';
import { setAlert } from '../alert/alertSlice';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Types
interface Recommendation {
  _id: string;
  farmerId: string;
  fieldId: string;
  cropId: string;
  title: string;
  description: string;
  recommendationType: string;
  priority: string;
  suggestedActions: Array<{
    action: string;
    timeline: string;
    resourcesNeeded: Array<{
      name: string;
      quantity: number;
      unit: string;
    }>;
  }>;
  expectedOutcome: string;
  status: string;
  agronomistId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Consultation {
  _id: string;
  farmerId: string;
  agronomistId: string;
  fieldId: string;
  cropId: string;
  title: string;
  description: string;
  consultationType: string;
  status: string;
  scheduledAt: Date;
  completedAt: Date;
  notes: string;
  images: Array<{
    url: string;
    caption: string;
  }>;
  documents: Array<{
    url: string;
    name: string;
  }>;
  rating: number;
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CropIssue {
  _id: string;
  farmerId: string;
  fieldId: string;
  cropId: string;
  title: string;
  description: string;
  issueType: string;
  severity: string;
  images: Array<{
    url: string;
    caption: string;
  }>;
  suggestedSolutions: Array<{
    solution: string;
    productType: string;
    products: Array<{
      name: string;
      description: string;
      quantity: number;
      unit: string;
    }>;
  }>;
  status: string;
  reportedBy: string;
  assignedTo: string;
  resolvedAt: Date;
  resolutionNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AgronomistState {
  recommendations: Recommendation[];
  consultations: Consultation[];
  issues: CropIssue[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AgronomistState = {
  recommendations: [],
  consultations: [],
  issues: [],
  loading: false,
  error: null,
};

// Get all recommendations
export const getRecommendations = createAsyncThunk(
  'agronomist/getRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/recommendations`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch recommendations');
    }
  }
);

// Get recommendation by ID
export const getRecommendationById = createAsyncThunk(
  'agronomist/getRecommendationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/recommendations/${id}`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch recommendation');
    }
  }
);

// Create recommendation
export const createRecommendation = createAsyncThunk(
  'agronomist/createRecommendation',
  async (recommendationData: Partial<Recommendation>, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/recommendations`, recommendationData);
      
      dispatch(
        setAlert({ message: 'Recommendation created successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create recommendation');
    }
  }
);

// Update recommendation
export const updateRecommendation = createAsyncThunk(
  'agronomist/updateRecommendation',
  async ({ id, data }: { id: string; data: Partial<Recommendation> }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/recommendations/${id}`, data);
      
      dispatch(
        setAlert({ message: 'Recommendation updated successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update recommendation');
    }
  }
);

// Delete recommendation
export const deleteRecommendation = createAsyncThunk(
  'agronomist/deleteRecommendation',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/recommendations/${id}`);
      
      dispatch(
        setAlert({ message: 'Recommendation deleted successfully', type: 'success' }) as any
      );
      
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete recommendation');
    }
  }
);

// Get all consultations
export const getConsultations = createAsyncThunk(
  'agronomist/getConsultations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/consultations`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch consultations');
    }
  }
);

// Get consultation by ID
export const getConsultationById = createAsyncThunk(
  'agronomist/getConsultationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/consultations/${id}`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch consultation');
    }
  }
);

// Create consultation
export const createConsultation = createAsyncThunk(
  'agronomist/createConsultation',
  async (consultationData: Partial<Consultation>, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/consultations`, consultationData);
      
      dispatch(
        setAlert({ message: 'Consultation created successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create consultation');
    }
  }
);

// Update consultation
export const updateConsultation = createAsyncThunk(
  'agronomist/updateConsultation',
  async ({ id, data }: { id: string; data: Partial<Consultation> }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/consultations/${id}`, data);
      
      dispatch(
        setAlert({ message: 'Consultation updated successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update consultation');
    }
  }
);

// Delete consultation
export const deleteConsultation = createAsyncThunk(
  'agronomist/deleteConsultation',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/consultations/${id}`);
      
      dispatch(
        setAlert({ message: 'Consultation deleted successfully', type: 'success' }) as any
      );
      
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete consultation');
    }
  }
);

// Get all crop issues
export const getCropIssues = createAsyncThunk(
  'agronomist/getCropIssues',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/issues`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch crop issues');
    }
  }
);

// Get crop issue by ID
export const getCropIssueById = createAsyncThunk(
  'agronomist/getCropIssueById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/issues/${id}`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch crop issue');
    }
  }
);

// Create crop issue
export const createCropIssue = createAsyncThunk(
  'agronomist/createCropIssue',
  async (issueData: Partial<CropIssue>, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/issues`, issueData);
      
      dispatch(
        setAlert({ message: 'Crop issue reported successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to report crop issue');
    }
  }
);

// Update crop issue
export const updateCropIssue = createAsyncThunk(
  'agronomist/updateCropIssue',
  async ({ id, data }: { id: string; data: Partial<CropIssue> }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/issues/${id}`, data);
      
      dispatch(
        setAlert({ message: 'Crop issue updated successfully', type: 'success' }) as any
      );
      
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update crop issue');
    }
  }
);

// Delete crop issue
export const deleteCropIssue = createAsyncThunk(
  'agronomist/deleteCropIssue',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/issues/${id}`);
      
      dispatch(
        setAlert({ message: 'Crop issue deleted successfully', type: 'success' }) as any
      );
      
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete crop issue');
    }
  }
);

// ========== Slice ==========
const agronomistSlice = createSlice({
  name: 'agronomist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Recommendations
      .addCase(getRecommendations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload;
        state.error = null;
      })
      .addCase(getRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Consultations
      .addCase(getConsultations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getConsultations.fulfilled, (state, action) => {
        state.loading = false;
        state.consultations = action.payload;
        state.error = null;
      })
      .addCase(getConsultations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Crop Issues
      .addCase(getCropIssues.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCropIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload;
        state.error = null;
      })
      .addCase(getCropIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default agronomistSlice.reducer;