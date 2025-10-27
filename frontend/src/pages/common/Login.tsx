import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import { RootState } from '../../store';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import LockOutlinedIcon from '@mui/icons-material/LooksOutlined';
import { setAlert } from '../../features/alert/alertSlice';

import { login } from '../../features/auth/authSlice';
import { languages } from '../../i18n';

// helpers
const homeForRole = (role?: string) => {
  switch ((role ?? '').toLowerCase()) {
    case 'farmer':
      return '/farmer';
    case 'buyer':
      return '/buyer';
    case 'admin':
      return '/admin';
    case 'logistics':
      return '/logistics';
    case 'agronomist':
      return '/agronomist';
    case 'investor':
      return '/investor';
      case 'supplier':
        return '/supplier';
      default:
      return '/';
  }
};

const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { loading, error, user } = useSelector(
    (state: RootState) => state.auth
  );

  const [formData, setFormData] = useState({ email: '', password: '' });
  const { email, password } = formData;

  const handleLanguageChange = (e: SelectChangeEvent) => {
    const languageCode = e.target.value as string;
    i18n.changeLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  };

  // FIX: THE REDIRECT LOGIC HAS BEEN REMOVED FROM THIS COMPONENT
  // The routing is now handled centrally in App.tsx

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      // On successful login, navigate to the correct dashboard
      if (result.user) {
        navigate(homeForRole(result.user.role));
      }
      dispatch(
        setAlert({
          message: 'Login Successful.',
          type: 'success',
        }) as any
      );
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const safeError =
    typeof error === 'string'
      ? error
      : (error as any)?.message || t('common.error');

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 2 }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('common.language')}</InputLabel>
            <Select
              value={i18n.language}
              label={t('common.language')}
              onChange={handleLanguageChange}
            >
              {languages.map((language) => (
                <MenuItem key={language.code} value={language.code}>
                  {language.flag} {language.nativeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>

        <Typography component="h1" variant="h5">
          {t('auth.welcomeBack')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {safeError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ mt: 1, width: '100%' }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('auth.email')}
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t('auth.password')}
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={handleChange}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : t('auth.login')}
          </Button>

          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                {t('auth.forgotPassword')}
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {t('auth.dontHaveAccount')} {t('auth.createAccount')}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {'© '}
          {new Date().getFullYear()}
          {' Agrimaan. All rights reserved.'}
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;