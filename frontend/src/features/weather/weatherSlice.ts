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

export type WeatherResponse = {
  current_weather?: {
    time: string;
    temperature: number;
    windspeed: number;
    winddirection: number;
    is_day: number;
    weathercode: number;
  };
  daily?: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    totalRain: number;
    weatherCode: number;
    sunrise?: string;
    sunset?: string;
  }>;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m?: number[];
    precipitation: number[];
    windspeed_10m: number[];
  };
  meta?: any;
};

interface WeatherState {
  fields: FieldsLite[];
  weather: WeatherResponse | null;
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

export const fetchWeatherByFields = createAsyncThunk(
  "weather/fetchWeatherByFields",
  async (field: any, { rejectWithValue }) => {
    try {
      if (!field?.location?.coordinates) throw new Error("Field coordinates not found");
      const [lng, lat] = field.location.coordinates;

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current_weather=true` +
        `&hourly=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset` +
        `&timezone=${timezone}`
      );

      const wx = await res.json();

      const today = new Date().toISOString().split("T")[0];

      const filteredDaily = wx.daily.time.map((date: string, i: number) => ({
        date,
        maxTemp: wx.daily.temperature_2m_max[i],
        minTemp: wx.daily.temperature_2m_min[i],
        totalRain: wx.daily.precipitation_sum[i],
        weatherCode: wx.daily.weathercode[i],
        sunrise: wx.daily.sunrise[i],
        sunset: wx.daily.sunset[i],
      })).filter((d: any) => d.date >= today);

      const formattedWeather: WeatherResponse = {
        current_weather: wx.current_weather,
        daily: filteredDaily.slice(0, 3),
        hourly: wx.hourly,
        meta: wx,
      };

      return { weather: formattedWeather, field, advice: null };
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to fetch weather/advice");
    }
  }
);

// -------------------- Slice --------------------
const weatherSlice = createSlice({
  name: "weather",
  initialState,
  reducers: {
    clearWeatherError: (state) => { state.error = null; },
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
      .addCase(fetchfields.fulfilled, (state, action) => { state.fields = action.payload; })
      .addCase(fetchfields.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchWeatherByFields.pending, (state) => {
        state.loadingWeather = true;
        state.loadingAdvice = true;
        state.error = null;
      })
      .addCase(fetchWeatherByFields.fulfilled, (state, action) => {
        state.weather = action.payload.weather;
        state.advice = action.payload.advice;
        state.FieldsName = action.payload.field.name || action.payload.field.locationName;
        state.lastPickedLocation = null;
        state.loadingWeather = false;
        state.loadingAdvice = false;
      })
      .addCase(fetchWeatherByFields.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loadingWeather = false;
        state.loadingAdvice = false;
      });
  },
});

export const { clearWeatherError, clearWeather } = weatherSlice.actions;
export default weatherSlice.reducer;
