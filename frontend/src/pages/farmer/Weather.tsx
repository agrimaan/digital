import { useEffect, useState, useMemo } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import ThermostatIcon from "@mui/icons-material/Thermostat";
import AirIcon from "@mui/icons-material/Air";
import OpacityIcon from "@mui/icons-material/Opacity";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import Brightness5Icon from "@mui/icons-material/Brightness5";
import Brightness3Icon from "@mui/icons-material/Brightness3";

import WeatherAdvicePanel from "./WeatherAdvicePanel";
import { RootState, AppDispatch } from "../../store";
import { clearWeather } from "../../features/weather/weatherSlice";
import { getFields } from "../../features/fields/fieldSlice";
import { getWeatherDescription, calculateFeelsLike } from "../../utils/weatherUtils";
import { fetchWeatherByCoordinates, WeatherResponse, WeatherData } from '../../services/weather';

type DailyForecastWithWind = {
  date: string;
  maxTemp: number;
  minTemp: number;
  totalRain: number;
  weatherCode: number;
  sunrise?: string;
  sunset?: string;
  maxWind?: number;
};

export default function WeatherPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { advice, loadingAdvice, error } = useSelector((state: RootState) => state.weather);

  const [fieldsId, setFieldsId] = useState<string>("");
  const [fieldsName, setFieldsName] = useState<string>("");
  const [fieldsList, setFieldsList] = useState<Field[]>([]);
  const [localWeather, setLocalWeather] = useState<WeatherResponse | null>(null);
  const [localLoadingWeather, setLocalLoadingWeather] = useState(false);
  const [localLoadingAdvice, setLocalLoadingAdvice] = useState(false);

  // Fetch Fields
  useEffect(() => {
    const loadFields = async () => {
      try {
        const resultAction = await dispatch(getFields()).unwrap();
        setFieldsList(resultAction as Field[]);
      } catch (err: any) {
        console.error("Failed to load fields", err);
      }
    };
    loadFields();
  }, [dispatch]);

  // Cleanup weather on unmount
  useEffect(() => {
    return () => {
      dispatch(clearWeather());
    };
  }, [dispatch]);

  const handleFieldsChange = async (id: string) => {
    setFieldsId(id);
    const selectedField = fieldsList.find(f => f._id === id);
    if (!selectedField) return;

    setFieldsName(selectedField.name ?? "");

    const coords = (selectedField as any).location?.coordinates;
    if (!coords || coords.length !== 2) return;

    const [lng, lat] = coords;

    try {
      setLocalLoadingWeather(true);
      setLocalLoadingAdvice(true);

      console.log("Fetching weather for:", lat, lng);

      // Fetch weather
      const weatherData: WeatherData = await fetchWeatherByCoordinates(lat, lng);

      // Extract the WeatherResponse part
      setLocalWeather(weatherData.weather);

    } catch (err: any) {
      console.error("Failed to fetch weather:", err);
    } finally {
      setLocalLoadingWeather(false);
      setLocalLoadingAdvice(false);
    }
  };

  const dailyForecastWithWind: DailyForecastWithWind[] = useMemo(() => {
    if (!localWeather?.daily || !localWeather?.hourly) return [];

    return localWeather.daily.map((d) => {
      const windSpeeds = localWeather.hourly?.windspeed_10m
        ?.filter((_, i) => localWeather.hourly?.time[i]?.startsWith(d.date)) ?? [];
      const maxWind = windSpeeds.length ? Math.max(...windSpeeds) : undefined;
      return { ...d, maxWind };
    }).slice(0, 3);
  }, [localWeather]);

  const currentWeather = localWeather?.current_weather;
  const currentHumidity = localWeather?.hourly?.relative_humidity_2m?.[0] ?? null;
  const feelsLike = currentWeather && currentHumidity !== null
    ? calculateFeelsLike(currentWeather.temperature, currentWeather.windspeed, currentHumidity)
    : null;

  const sunrise = localWeather?.daily?.[0]?.sunrise
    ? new Date(localWeather.daily[0].sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const sunset = localWeather?.daily?.[0]?.sunset
    ? new Date(localWeather.daily[0].sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box sx={{ flexGrow: 1, p: 3 }} display="grid" gridTemplateColumns={{ md: "2fr 1fr" }} gap={3}>
      <Box>
        <Typography variant="h4" mb={2}>Weather Forecast</Typography>

        <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel id="fields-select-label">Fields</InputLabel>
          <Select
            labelId="fields-select-label"
            value={fieldsId}
            label="Fields"
            onChange={(e) => handleFieldsChange(e.target.value)}
          >
            <MenuItem value=""><em>Select a Field</em></MenuItem>
            {fieldsList.map(f => (
              <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {localLoadingWeather && <CircularProgress size={24} />}

        {currentWeather && !localLoadingWeather && (
          <Card variant="outlined" sx={{ mb: 2, p: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Current Weather {fieldsName ? `(${fieldsName})` : ""}
              </Typography>
              <Divider sx={{ mb: 1 }} />

              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ThermostatIcon color="primary" fontSize="small"/>
                  <Typography variant="body2">Temp: <strong>{currentWeather.temperature} °C</strong></Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <AirIcon color="info" fontSize="small"/>
                  <Typography variant="body2">Wind: <strong>{currentWeather.windspeed} km/h</strong></Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <OpacityIcon color="secondary" fontSize="small"/>
                  <Typography variant="body2">Humidity: <strong>{currentHumidity ?? "N/A"}%</strong></Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <ThermostatIcon color="warning" fontSize="small"/>
                  <Typography variant="body2">Feels like: <strong>{feelsLike?.toFixed(1) ?? "-" } °C</strong></Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <WbSunnyIcon color="warning" fontSize="small"/>
                  <Typography variant="body2">Condition: <strong>{getWeatherDescription(currentWeather.weathercode)}</strong></Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Brightness5Icon color="info" fontSize="small"/>
                  <Typography variant="body2">Sunrise: <strong>{sunrise}</strong></Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Brightness3Icon color="secondary" fontSize="small"/>
                  <Typography variant="body2">Sunset: <strong>{sunset}</strong></Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {dailyForecastWithWind.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Next 3 Days</Typography>
              <Divider sx={{ mb: 1 }} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell align="right">Max / Min (°C)</TableCell>
                    <TableCell align="right">Rain (mm)</TableCell>
                    <TableCell align="right">Wind (km/h)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyForecastWithWind.map((d: DailyForecastWithWind) => (
                    <TableRow key={d.date}>
                      <TableCell>
                        {new Date(d.date).toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" })}
                      </TableCell>
                      <TableCell align="right">{d.maxTemp.toFixed(1)} / {d.minTemp.toFixed(1)}</TableCell>
                      <TableCell align="right">{d.totalRain.toFixed(1)}</TableCell>
                      <TableCell align="right">{d.maxWind?.toFixed(1) ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {error && <Typography color="error" mt={2}>{error}</Typography>}
      </Box>

      <WeatherAdvicePanel
        advice={advice}
        loading={loadingAdvice || localLoadingAdvice}
        error={error}
        onRefresh={() => {
          if (fieldsId) handleFieldsChange(fieldsId);
        }}
        FieldsName={fieldsName}
      />
    </Box>
  );
}
