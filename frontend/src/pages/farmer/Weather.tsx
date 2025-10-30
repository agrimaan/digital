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

import WeatherAdvicePanel from "../../components/WeatherAdvicePanel";
import { RootState, AppDispatch } from "../../store";
import { fetchWeatherByFields, clearWeather } from "../../features/weather/weatherSlice";
import { getFields } from "../../features/fields/fieldSlice";
import { getWeatherDescription, calculateFeelsLike } from "../../utils/weatherUtils"; // Assume you have these helpers

export default function WeatherPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { weather, advice, loadingWeather, loadingAdvice, error, FieldsName } =
    useSelector((state: RootState) => state.weather);

  const [FieldsId, setFieldsId] = useState<string>("");
  const [fieldsList, setFieldsList] = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  
  // Fetch Fields
  useEffect(() => {
    const loadFields = async () => {
      try {
        setFieldsLoading(true);
        const resultAction = await dispatch(getFields()).unwrap();
        setFieldsList(resultAction as Field[]);
      } catch (err: any) {
        console.error("Failed to load fields", err);
      } finally {
        setFieldsLoading(false);
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

  const handleFieldsChange = (id: string) => {
    setFieldsId(id);
    const selectedField = fieldsList.find(f => f._id === id);
    if (selectedField) dispatch(fetchWeatherByFields(selectedField) as any);
  };

  // Calculate Daily Forecast with Max Wind
  const dailyForecastWithWind = useMemo(() => {
    if (!weather?.daily || !weather?.hourly) return [];

    const hourly = weather.hourly;
    return weather.daily.map(d => {
      const windSpeeds = hourly.windspeed_10m.filter((_, i) =>
        hourly.time[i].startsWith(d.date)
      );
      const maxWind = windSpeeds.length ? Math.max(...windSpeeds) : undefined;
      return { ...d, maxWind };
    }).slice(0, 3);
  }, [weather]);

  // Current weather & additional info
  const currentWeather = weather?.current_weather;
  const currentHumidity = weather?.hourly?.relative_humidity_2m?.[0] ?? null;
  const feelsLike = currentWeather && currentHumidity !== null
    ? calculateFeelsLike(currentWeather.temperature, currentWeather.windspeed, currentHumidity)
    : null;

  const sunrise = weather?.daily?.[0]?.sunrise
    ? new Date(weather.daily[0].sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const sunset = weather?.daily?.[0]?.sunset
    ? new Date(weather.daily[0].sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box sx={{ flexGrow: 1, p: 3 }} display="grid" gridTemplateColumns={{ md: "2fr 1fr" }} gap={3}>
      {/* Left Column */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Weather Forecast</Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="Fields-select-label">Fields</InputLabel>
            <Select
              labelId="Fields-select-label"
              value={FieldsId}
              label="Fields"
              onChange={(e) => handleFieldsChange(e.target.value)}
            >
              <MenuItem value=""><em>Select a Field</em></MenuItem>
              {fieldsLoading && <MenuItem disabled>Loading...</MenuItem>}
              {fieldsList.map(f => (
                <MenuItem key={f._id} value={f._id}>{f.name || f._id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loadingWeather && <CircularProgress size={24} />}

        {currentWeather && !loadingWeather && (
          <Card variant="outlined" sx={{ mb: 2, p: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Current Weather {FieldsName ? `(${FieldsName})` : ""}
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

        {/* Daily Forecast Table */}
        {dailyForecastWithWind.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Next 3 Days</Typography>
              <Divider sx={{ mb: 1.5 }} />
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
                  {dailyForecastWithWind.map(d => (
                    <TableRow key={d.date} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
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

      {/* Right Column */}
      <WeatherAdvicePanel
        advice={advice}
        loading={loadingAdvice}
        error={error}
        onRefresh={() => {
          if (FieldsId) dispatch(fetchWeatherByFields(fieldsList.find(f => f._id === FieldsId)!) as any);
        }}
        FieldsName={FieldsName}
      />
    </Box>
  );
}
