// src/pages/agronomist/AgronomistDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, List, ListItem, ListItemText, Avatar, CircularProgress, Alert } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import WarningIcon from '@mui/icons-material/Warning';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../storeHooks';
import { getRecommendations, getConsultations, getCropIssues } from '../../features/agronomist/agronomistSlice';

type WeatherData = {
  location: string;
  condition: string;
  temperature: { min: number; max: number };
  precipitation: number;
} | null;

const AgronomistDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { recommendations, consultations, issues, loading, error } = useAppSelector((s) => s.agronomist);

  // local “loading” placeholders just for skeletons
  const [loadingState, setLoadingState] = useState({
    fields: true,
    recommendations: true,
    consultations: true,
    cropIssues: true,
    weather: true,
  });
  const [monitoredFields] = useState<any[]>([]); // replace with real fields when you have them
  const [weatherData] = useState<WeatherData>(null);

  useEffect(() => {
    dispatch(getRecommendations() as any);
    dispatch(getConsultations() as any);
    dispatch(getCropIssues() as any);

    const t = setTimeout(() => {
      setLoadingState({
        fields: false,
        recommendations: false,
        consultations: false,
        cropIssues: false,
        weather: false,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [dispatch]);

  const pendingRecommendations = useMemo(() => (recommendations ?? []).slice(0, 5), [recommendations]);
  const upcomingConsultations = useMemo(() => (consultations ?? []).slice(0, 5), [consultations]);
  const reportedIssues = useMemo(() => (issues ?? []).slice(0, 5), [issues]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const fmtDate = (d?: string | Date) => (d ? new Date(d).toLocaleDateString() : '');

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('agronomistDashboard.title', 'Agronomist Dashboard')}
      </Typography>

      <Grid container spacing={3}>
        {/* Fields Overview */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <MapIcon />
                </Avatar>
                <Typography variant="h6">
                  {t('agronomistDashboard.fieldsOverview', 'Fields overview')}
                </Typography>
              </Box>

              {loadingState.fields ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                  <CircularProgress size={24} />
                </Box>
              ) : (monitoredFields ?? []).length > 0 ? (
                <List dense>
                  {(monitoredFields ?? []).slice(0, 3).map((field: any) => (
                    <ListItem key={field._id} sx={{ pl: 0, pr: 0 }}>
                      <ListItemText
                        primary={field.name}
                        secondary={`${field.location ?? ''} • ${field.size ?? ''} ${field.unit ?? ''}`}
                      />
                      <Chip
                        label={field.status ?? 'unknown'}
                        size="small"
                        color={field.status === 'active' ? 'success' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">{t('agronomistDashboard.noFields', 'No fields')}</Typography>
              )}

              <Button variant="outlined" fullWidth onClick={() => navigate('/agronomist/fields')}>
                {t('agronomistDashboard.viewAllFields', 'View all fields')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Recommendations */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                  <AssignmentIcon />
                </Avatar>
                <Typography variant="h6">
                  {t('agronomistDashboard.pendingRecommendations', 'Pending recommendations')}
                </Typography>
              </Box>

              {loadingState.recommendations ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                  <CircularProgress size={24} />
                </Box>
              ) : pendingRecommendations.length > 0 ? (
                <List dense>
                  {pendingRecommendations.map((r) => (
                    <ListItem key={r._id} sx={{ pl: 0, pr: 0 }}>
                      <ListItemText primary={r.title} secondary={fmtDate(r.createdAt)} />
                      <Chip
                        label={r.priority}
                        size="small"
                        color={
                          r.priority === 'urgent'
                            ? 'error'
                            : r.priority === 'high'
                            ? 'warning'
                            : r.priority === 'medium'
                            ? 'info'
                            : 'default'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">{t('agronomistDashboard.noRecommendations', 'No recommendations')}</Typography>
              )}

              <Button variant="outlined" fullWidth onClick={() => navigate('/agronomist/recommendations')}>
                {t('agronomistDashboard.createRecommendation', 'Create recommendation')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Consultations */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                  <EventIcon />
                </Avatar>
                <Typography variant="h6">
                  {t('agronomistDashboard.upcomingConsultations', 'Upcoming consultations')}
                </Typography>
              </Box>

              {loadingState.consultations ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                  <CircularProgress size={24} />
                </Box>
              ) : upcomingConsultations.length > 0 ? (
                <List dense>
                  {upcomingConsultations.map((c) => (
                    <ListItem key={c._id} sx={{ pl: 0, pr: 0 }}>
                      <ListItemText primary={c.title} secondary={c.farmerId} />
                      <Chip label={c.status} size="small" color={c.status === 'completed' ? 'success' : 'warning'} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">{t('agronomistDashboard.noConsultations', 'No consultations')}</Typography>
              )}

              <Button variant="outlined" fullWidth onClick={() => navigate('/agronomist/consultations')}>
                {t('agronomistDashboard.scheduleConsultation', 'Schedule consultation')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Reported Issues */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'error.main' }}>
                  <WarningIcon />
                </Avatar>
                <Typography variant="h6">
                  {t('agronomistDashboard.reportedIssues', 'Reported issues')}
                </Typography>
              </Box>

              {loadingState.cropIssues ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                  <CircularProgress size={24} />
                </Box>
              ) : reportedIssues.length > 0 ? (
                <List dense>
                  {reportedIssues.map((i) => (
                    <ListItem key={i._id} sx={{ pl: 0, pr: 0 }}>
                      <ListItemText primary={i.title} secondary={fmtDate(i.createdAt)} />
                      <Chip
                        label={i.severity}
                        size="small"
                        color={i.severity === 'critical' ? 'error' : i.severity === 'high' ? 'warning' : i.severity === 'medium' ? 'info' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">{t('agronomistDashboard.noIssues', 'No issues')}</Typography>
              )}

              <Button variant="outlined" fullWidth onClick={() => navigate('/agronomist/issues')}>
                {t('agronomistDashboard.viewAllIssues', 'View all issues')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Weather */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                  <ThermostatIcon />
                </Avatar>
                <Typography variant="h6">
                  {t('agronomistDashboard.weatherForecast', 'Weather forecast')}
                </Typography>
              </Box>

              {loadingState.weather ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                  <CircularProgress size={24} />
                </Box>
              ) : weatherData ? (
                <>
                  <Typography variant="subtitle1">{weatherData.location}</Typography>
                  <Typography variant="body2" color="text.secondary">{weatherData.condition}</Typography>
                  <Typography variant="body2">{t('agronomistDashboard.temperature', 'Temperature')}: {weatherData.temperature.min}°C – {weatherData.temperature.max}°C</Typography>
                  <Typography variant="body2">{t('agronomistDashboard.precipitation', 'Precipitation')}: {weatherData.precipitation}mm</Typography>
                </>
              ) : (
                <Typography color="text.secondary">{t('agronomistDashboard.noWeatherData', 'No weather data')}</Typography>
              )}

              <Button variant="outlined" fullWidth onClick={() => navigate('/agronomist/weather')}>
                {t('agronomistDashboard.detailedForecast', 'Detailed forecast')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgronomistDashboard;
