import React from 'react';
import { ThemeProvider, createTheme } from '@mui/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff9800',
    },
    secondary: {
      main: '#4caf50',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Agrimaan Logistics Service
        </Typography>
        <Typography variant="body1">
          Welcome to the logistics dashboard. Your delivery management system is ready.
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default App;
