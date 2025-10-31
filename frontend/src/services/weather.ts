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

export type WeatherAdvice = {
  message?: string;
};

/**
 * WeatherData includes both the weather response and optional advice
 */
export type WeatherData = {
  weather: WeatherResponse;
  advice: WeatherAdvice | null;
};

/**
 * Fetch weather data from Open-Meteo API
 * @param lat Latitude
 * @param lng Longitude
 */
export async function fetchWeatherByCoordinates(
  lat: number,
  lng: number
): Promise<WeatherData> {
  const timezone = "Asia/Kolkata"; // India timezone

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current_weather=true` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset` +
    `&timezone=${timezone}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch weather: ${res.statusText}`);

  const wx = await res.json();

  // Today's date in IST
  const todayISTStr = new Date().toLocaleDateString("en-CA", { timeZone: timezone }); 
  // "YYYY-MM-DD" format

  const filteredDaily = wx.daily.time
    .map((date: string, i: number) => ({
      date,
      maxTemp: wx.daily.temperature_2m_max[i],
      minTemp: wx.daily.temperature_2m_min[i],
      totalRain: wx.daily.precipitation_sum[i],
      weatherCode: wx.daily.weathercode[i],
      sunrise: wx.daily.sunrise[i],
      sunset: wx.daily.sunset[i],
    }))
    .filter((d: any) => d.date > todayISTStr) // compare strings "YYYY-MM-DD" is safe
    .slice(0, 3); // next 3 days

  return {
    weather: {
      current_weather: wx.current_weather,
      daily: filteredDaily,
      hourly: wx.hourly,
      meta: wx,
    },
    advice: null,
  };
}
