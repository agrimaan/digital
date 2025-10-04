import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Backup as BackupIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
    backup: {
      autoBackup: true,
      frequency: 'daily',
      retention: 30,
    },
  });

  const [openDialog, setOpenDialog] = useState(null);
  const [backupSettings, setBackupSettings] = useState({
    type: 'full',
    schedule: 'daily',
    retention: 30,
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    // Save settings to backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const handleExportSettings = () => {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
  };

  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings: Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBackup = () => {
    // Simulate backup process
    setOpenDialog('backup');
  };

  const handleRestore = () => {
    // Simulate restore process
    setOpenDialog('restore');
  };

  const settingsSections = [
    {
      title: 'Appearance',
      icon: <PaletteIcon />,
      items: [
        {
          key: 'theme',
          label: 'Theme',
          type: 'select',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ],
        },
        {
          key: 'language',
          label: 'Language',
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
          ],
        },
      ],
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon />,
      items: [
        {
          key: 'email',
          label: 'Email Notifications',
          type: 'switch',
        },
        {
          key: 'push',
          label: 'Push Notifications',
          type: 'switch',
        },
        {
          key: 'sms',
          label: 'SMS Notifications',
          type: 'switch',
        },
      ],
    },
    {
      title: 'Security',
      icon: <SecurityIcon />,
      items: [
        {
          key: 'twoFactorAuth',
          label: 'Two-Factor Authentication',
          type: 'switch',
        },
        {
          key: 'sessionTimeout',
          label: 'Session Timeout (minutes)',
          type: 'number',
          min: 5,
          max: 120,
        },
      ],
    },
  ];

  const renderSettingItem = (item, category) => {
    const value = settings[category]?.[item.key];

    switch (item.type) {
      case 'select':
        return (
          <FormControl fullWidth>
            <InputLabel>{item.label}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => handleSettingChange(category, item.key, e.target.value)}
              label={item.label}
            >
              {item.options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value || false}
                onChange={(e) => handleSettingChange(category, item.key, e.target.checked)}
              />
            }
            label={item.label}
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={item.label}
            value={value || ''}
            onChange={(e) => handleSettingChange(category, item.key, parseInt(e.target.value))}
            inputProps={{ min: item.min, max: item.max }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Settings</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportSettings}
          >
            Export Settings
          </Button>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
          >
            Import Settings
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImportSettings}
            />
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
          >
            Save All
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {settingsSections.map((section, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 1, color: 'primary.main' }}>
                    {section.icon}
                  </Box>
                  <Typography variant="h6">{section.title}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {section.items.map(item => (
                    <Box key={item.key}>
                      {renderSettingItem(item, section.title.toLowerCase())}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Backup & Restore Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1, color: 'primary.main' }}>
                  <BackupIcon />
                </Box>
                <Typography variant="h6">Backup & Restore</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.backup.autoBackup}
                        onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
                      />
                    }
                    label="Automatic Backup"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select
                      value={settings.backup.frequency}
                      onChange={(e) => handleSettingChange('backup', 'frequency', e.target.value)}
                      label="Backup Frequency"
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retention Period (days)"
                    value={settings.backup.retention}
                    onChange={(e) => handleSettingChange('backup', 'retention', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<BackupIcon />}
                      onClick={handleBackup}
                    >
                      Create Backup
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleRestore}
                    >
                      Restore from Backup
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Backup Dialog */}
      <Dialog open={openDialog === 'backup'} onClose={() => setOpenDialog(null)}>
        <DialogTitle>Backup Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Backup Type</InputLabel>
                <Select
                  value={backupSettings.type}
                  onChange={(e) => setBackupSettings({ ...backupSettings, type: e.target.value })}
                >
                  <MenuItem value="full">Full Backup</MenuItem>
                  <MenuItem value="incremental">Incremental Backup</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Schedule</InputLabel>
                <Select
                  value={backupSettings.schedule}
                  onChange={(e) => setBackupSettings({ ...backupSettings, schedule: e.target.value })}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Retention (days)"
                value={backupSettings.retention}
                onChange={(e) => setBackupSettings({ ...backupSettings, retention: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
          <Button onClick={() => setOpenDialog(null)} variant="contained">Start Backup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;