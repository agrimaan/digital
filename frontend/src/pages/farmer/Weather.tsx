import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Field } from '../../types/domains';

import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Divider,
} from "@mui/material";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import AirIcon from "@mui/icons-material/Air";
import OpacityIcon from "@mui/icons-material/Opacity";
import GrainIcon from "@mui/icons-material/Grain";
import WbSunnyIcon from "@mui/icons-material/WbSunny";

import WeatherAdvicePanel from "../../components/WeatherAdvicePanel";
import LocationSearch from "../../components/LocationSearch";
import { Suggestion } from "../../features/weather/weatherSlice";
import { RootState } from "../../store";
import {
  fetchfields,
  fetchWeatherByFields,
  fetchWeatherByLocation,
  clearWeather,
} from "../../features/weather/weatherSlice";

// Forecast helpers
function pickForecastArray(wx: any | null): any[] {
  if (!wx) return [];
  const f = wx?.forecast;
  if (!f) return [];
  if (Array.isArray(f?.forecastday)) return f.forecastday;
  if (Array.isArray(f)) return f;
  return [];
}
function getDateLabel(item: any, index: number): string {
  const date = item?.date ? new Date(item.date) : item?.dt ? new Date(item.dt * 1000) : new Date(Date.now() + index * 86400000);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function readMaxC(item: any): number | undefined { return item?.day?.maxtemp_c ?? item?.max_c; }
function readMinC(item: any): number | undefined { return item?.day?.mintemp_c ?? item?.min_c; }
function readRainMM(item: any): number | undefined { return item?.day?.totalprecip_mm ?? item?.rain_mm; }
function readWindKPH(item: any): number | undefined { return item?.day?.maxwind_kph ?? item?.wind_kph; }
function readCondition(item: any): string | undefined { return item?.day?.condition?.text ?? item?.condition; }

export default function WeatherPage() {
  const dispatch = useDispatch();
  const { fields, weather, advice, loadingWeather, loadingAdvice, error, FieldsName, lastPickedLocation } = useSelector((state: RootState) => state.weather);

  const [FieldsId, setFieldsId] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");

  useEffect(() => {
    dispatch(fetchfields() as any);
    return () => { dispatch(clearWeather()); };
  }, [dispatch]);

  const handleFieldsChange = (id: string) => {
    setFieldsId(id);
    if (id) dispatch(fetchWeatherByFields(id) as any);
  };

  const onPickLocation = useCallback((s: Suggestion) => {
    setLocationQuery(s.displayName || s.name);
    dispatch(fetchWeatherByLocation(s) as any);
  }, [dispatch]);

  const forecastArray = useMemo(() => pickForecastArray(weather).slice(0, 3), [weather]);

  return (
    <Box display="grid" gridTemplateColumns={{ md: "2fr 1fr" }} gap={3}>
      {/* Left */}
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">Weather Dashboard</Typography>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="Fields-select-label">Fields</InputLabel>
            <Select labelId="Fields-select-label" value={FieldsId} label="Fields" onChange={(e) => handleFieldsChange(e.target.value)}>
              <MenuItem value=""><em>Select a Fields</em></MenuItem>
              {fields.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name || f._id}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <LocationSearch value={locationQuery} onChange={setLocationQuery} onPick={onPickLocation} placeholder="Type a location" />
          <Typography variant="caption" color="text.secondary">or pick a Fields above</Typography>
        </Box>

        {loadingWeather && <CircularProgress size={24} />}
        {weather && !loadingWeather && (
          <Card variant="outlined" sx={{ mb: 2, p: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Current Weather {FieldsName ? `(${FieldsName})` : ""}</Typography>
              <Divider sx={{ mb: 1 }} />
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                <Box display="flex" alignItems="center" gap={1}><ThermostatIcon color="primary" fontSize="small" /><Typography variant="body2">Temp: <strong>{weather.current?.temp_c ?? "—"} °C</strong></Typography></Box>
                <Box display="flex" alignItems="center" gap={1}><AirIcon color="info" fontSize="small" /><Typography variant="body2">Wind: <strong>{weather.current?.wind_kph ?? "—"} km/h</strong></Typography></Box>
                <Box display="flex" alignItems="center" gap={1}><OpacityIcon color="secondary" fontSize="small" /><Typography variant="body2">Humidity: <strong>{weather.current?.humidity ?? "—"}%</strong></Typography></Box>
                <Box display="flex" alignItems="center" gap={1}><GrainIcon color="success" fontSize="small" /><Typography variant="body2">Precip: <strong>{weather.current?.precip_mm ?? "—"} mm</strong></Typography></Box>
                <Box display="flex" alignItems="center" gap={1} gridColumn="span 2"><WbSunnyIcon color="warning" fontSize="small" /><Typography variant="body2">Condition: <strong>{weather.current?.condition?.text || "—"}</strong></Typography></Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {forecastArray.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Next 3 Days</Typography>
              <Divider sx={{ mb: 1 }} />
              <table style={{ width: "100%", fontSize: "0.875rem" }}>
                <thead><tr><th>Day</th><th>Max / Min (°C)</th><th>Rain (mm)</th><th>Wind (km/h)</th><th>Condition</th></tr></thead>
                <tbody>
                  {forecastArray.map((item: any, i: number) => (
                    <tr key={i}>
                      <td>{getDateLabel(item, i)}</td>
                      <td>{readMaxC(item) ?? "—"} / {readMinC(item) ?? "—"}</td>
                      <td>{readRainMM(item) ?? "—"}</td>
                      <td>{readWindKPH(item) ?? "—"}</td>
                      <td>{readCondition(item) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Typography variant="caption" color="text.secondary">* Values shown in °C, km/h, and mm.</Typography>
            </CardContent>
          </Card>
        )}

        {error && <Typography color="error" variant="body2" mt={2}>{error}</Typography>}
      </Box>

      {/* Right */}
      <WeatherAdvicePanel
        advice={advice}
        loading={loadingAdvice}
        error={error}
        onRefresh={() => {
          if (FieldsId) dispatch(fetchWeatherByFields(FieldsId) as any);
          else if (lastPickedLocation) dispatch(fetchWeatherByLocation(lastPickedLocation) as any);
        }}
        FieldsName={FieldsName}
      />
    </Box>
  );
}
