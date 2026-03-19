export interface WeatherData {
  temperature: number;
  weathercode: number;
  description: string;
  emoji: string;
  city?: string;
}

const weatherMap: Record<number, { emoji: string; desc: string }> = {
  0: { emoji: '☀️', desc: 'Ensoleillé' },
  1: { emoji: '🌤️', desc: 'Peu nuageux' },
  2: { emoji: '⛅', desc: 'Partiellement nuageux' },
  3: { emoji: '☁️', desc: 'Nuageux' },
  45: { emoji: '🌫️', desc: 'Brouillard' },
  48: { emoji: '🌫️', desc: 'Brouillard givrant' },
  51: { emoji: '🌧️', desc: 'Bruine légère' },
  53: { emoji: '🌧️', desc: 'Bruine' },
  55: { emoji: '🌧️', desc: 'Bruine forte' },
  61: { emoji: '🌧️', desc: 'Pluie légère' },
  63: { emoji: '🌧️', desc: 'Pluie' },
  65: { emoji: '🌧️', desc: 'Pluie forte' },
  71: { emoji: '🌨️', desc: 'Neige légère' },
  73: { emoji: '🌨️', desc: 'Neige' },
  75: { emoji: '🌨️', desc: 'Neige forte' },
  80: { emoji: '🌦️', desc: 'Averses' },
  81: { emoji: '🌦️', desc: 'Averses modérées' },
  82: { emoji: '⛈️', desc: 'Averses violentes' },
  95: { emoji: '⛈️', desc: 'Orage' },
  96: { emoji: '⛈️', desc: 'Orage avec grêle' },
  99: { emoji: '⛈️', desc: 'Orage violent' },
};

function parseWeather(data: any, city?: string): WeatherData {
  const cw = data.current_weather;
  const info = weatherMap[cw.weathercode] || { emoji: '🌡️', desc: 'Inconnu' };
  return {
    temperature: Math.round(cw.temperature),
    weathercode: cw.weathercode,
    description: info.desc,
    emoji: info.emoji,
    city,
  };
}

async function fetchWeatherByCoords(lat: number, lon: number, city?: string): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  );
  if (!res.ok) throw new Error('API indisponible');
  const data = await res.json();
  return parseWeather(data, city);
}

export async function fetchWeatherByGeolocation(): Promise<WeatherData> {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );
  const { latitude, longitude } = pos.coords;
  return fetchWeatherByCoords(latitude, longitude);
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
}

export async function geocodeCity(city: string): Promise<GeocodingResult> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`
  );
  if (!res.ok) throw new Error('API indisponible');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('CITY_NOT_FOUND');
  }
  const r = data.results[0];
  return { name: r.name, latitude: r.latitude, longitude: r.longitude };
}

export async function fetchWeatherByCity(cityName: string): Promise<WeatherData> {
  const geo = await geocodeCity(cityName);
  return fetchWeatherByCoords(geo.latitude, geo.longitude, geo.name);
}

export function getSavedCity(): string | null {
  try {
    return localStorage.getItem('mystyl_city');
  } catch {
    return null;
  }
}

export function saveCity(city: string) {
  localStorage.setItem('mystyl_city', city);
}

export function getCurrentSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'Printemps';
  if (m >= 5 && m <= 7) return 'Été';
  if (m >= 8 && m <= 10) return 'Automne';
  return 'Hiver';
}
