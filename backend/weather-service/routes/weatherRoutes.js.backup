
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Weather API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo-key';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

// @route   GET /api/weather/current
// @desc    Get current weather for a location
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Mock weather data for demo
    const mockWeather = {
      location: {
        name: 'Demo Location',
        country: 'IN',
        region: 'Demo Region'
      },
      current: {
        temperature: 28.5,
        humidity: 65,
        pressure: 1013,
        wind_speed: 12.5,
        wind_direction: 180,
        weather_condition: 'Partly cloudy',
        weather_description: 'Partly cloudy with moderate temperature',
        visibility: 10,
        uv_index: 6
      },
      timestamp: new Date().toISOString()
    };

    // In production, use actual weather API
    if (WEATHER_API_KEY !== 'demo-key') {
      const response = await axios.get(`${WEATHER_API_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      });
      
      mockWeather.current = {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        wind_speed: response.data.wind.speed,
        wind_direction: response.data.wind.deg,
        weather_condition: response.data.weather[0].main,
        weather_description: response.data.weather[0].description,
        visibility: response.data.visibility / 1000,
        uv_index: response.data.uvi || 5
      };
    }

    res.json({
      success: true,
      data: mockWeather
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weather data',
      error: error.message
    });
  }
});

// @route   GET /api/weather/forecast
// @desc    Get weather forecast for a location
// @access  Public
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lon, days = 5 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Mock forecast data for demo
    const mockForecast = {
      location: {
        name: 'Demo Location',
        country: 'IN'
      },
      forecast: Array.from({ length: parseInt(days) || 5 }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: {
          min: 25 + Math.random() * 5,
          max: 30 + Math.random() * 5
        },
        humidity: 60 + Math.random() * 20,
        precipitation: Math.random() * 5,
        weather_condition: ['Sunny', 'Partly cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
        wind_speed: 10 + Math.random() * 15,
        uv_index: 5 + Math.random() * 5
      }))
    };

    // In production, use actual weather API
    if (WEATHER_API_KEY !== 'demo-key') {
      const response = await axios.get(`${WEATHER_API_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric',
          cnt: days
        }
      });
      
      mockForecast.forecast = response.data.list.map(item => ({
        date: new Date(item.dt * 1000).toISOString().split('T')[0],
        temperature: {
          min: item.main.temp_min,
          max: item.main.temp_max
        },
        humidity: item.main.humidity,
        precipitation: item.rain ? item.rain['3h'] || 0 : 0,
        weather_condition: item.weather[0].main,
        wind_speed: item.wind.speed,
        uv_index: 5
      }));
    }

    res.json({
      success: true,
      data: mockForecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast data',
      error: error.message
    });
  }
});

// @route   GET /api/weather/alerts
// @desc    Get weather alerts for a location
// @access  Public
router.get('/alerts', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Mock alerts data for demo
    const mockAlerts = {
      location: {
        name: 'Demo Location'
      },
      alerts: [
        {
          type: 'heatwave',
          severity: 'moderate',
          title: 'Heatwave Alert',
          description: 'Temperature expected to exceed 35\u00b0C',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'heavy_rain',
          severity: 'low',
          title: 'Heavy Rain Alert',
          description: 'Heavy rainfall expected in next 2 days',
          start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    res.json({
      success: true,
      data: mockAlerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weather alerts',
      error: error.message
    });
  }
});

// @route   GET /api/weather/historical
// @desc    Get historical weather data
// @access  Public
router.get('/historical', async (req, res) => {
  try {
    const { lat, lon, startDate, endDate } = req.query;

    if (!lat || !lon || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, startDate, and endDate are required'
      });
    }

    // Mock historical data for demo
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const mockHistorical = {
      location: {
        name: 'Demo Location',
        coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
      },
      data: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: {
          min: 20 + Math.random() * 10,
          max: 30 + Math.random() * 10,
          avg: 25 + Math.random() * 5
        },
        humidity: 60 + Math.random() * 30,
        precipitation: Math.random() * 10,
        wind_speed: 5 + Math.random() * 20
      }))
    };

    res.json({
      success: true,
      data: mockHistorical
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching historical weather data',
      error: error.message
    });
  }
});

module.exports = router;
