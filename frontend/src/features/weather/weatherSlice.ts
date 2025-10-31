// src/features/weather/weatherSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getWeatherAdviceByBundle, type WeatherAdvice } from "../../services/ai";
import { api } from "../../lib/api";

// -------------------- Types --------------------
export type Suggestion = {
  id: number | string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
  countryCode?: string | null;
};

export type FieldsLite = {
  _id: string;
  name?: string;
  location?: { type: "Point"; coordinates: [number, number] };
  locationName?: string;
};

interface WeatherState {
  fields: FieldsLite[];
  weather: any | null; // weather will be populated by service, type can be imported if needed
  advice: WeatherAdvice | null;
  FieldsName?: string;
  lastPickedLocation: Suggestion | null;
  loadingWeather: boolean;
  loadingAdvice: boolean;
  error: string | null;
}

// -------------------- Initial State --------------------
const initialState: WeatherState = {
  fields: [],
  weather: null,
  advice: null,
  FieldsName: undefined,
  lastPickedLocation: null,
  loadingWeather: false,
  loadingAdvice: false,
  error: null,
};

// -------------------- Thunks --------------------
export const fetchfields = createAsyncThunk(
  "weather/fetchfields",
  async (_, { rejectWithValue }) => {
    try {
      const list = await api<FieldsLite[]>("/api/fields");
      return Array.isArray(list)
        ? list.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        : [];
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to load fields");
    }
  }
);

// -------------------- Slice --------------------
const weatherSlice = createSlice({
  name: "weather",
  initialState,
  reducers: {
    clearWeatherError: (state) => {
      state.error = null;
    },
    clearWeather: (state) => {
      state.weather = null;
      state.advice = null;
      state.FieldsName = undefined;
      state.lastPickedLocation = null;
      state.loadingWeather = false;
      state.loadingAdvice = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchfields.fulfilled, (state, action) => {
        state.fields = action.payload;
      })
      .addCase(fetchfields.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearWeatherError, clearWeather } = weatherSlice.actions;
export default weatherSlice.reducer;
