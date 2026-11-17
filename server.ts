import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  WeatherApiError,
  normalizeAirQualityFromOpenMeteo,
  normalizeAirQualityFromOwm,
  normalizeMetNoAndWttrBundle,
  normalizeOpenWeatherCurrent,
  normalizeOpenWeatherForecast,
  validateCityInput,
  type LocationSuggestion,
  type WeatherAlertItem,
  type WeatherDashboardBundle,
} from './src/utils/weatherLogic.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Simple in-memory TTL cache to prevent duplicate API requests
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const locationCache = new Map<string, CacheEntry<LocationSuggestion[]>>();
const weatherCache = new Map<string, CacheEntry<WeatherDashboardBundle>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number
) {
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function searchLocationsOwm(query: string, apiKey: string): Promise<LocationSuggestion[]> {
  const url = new URL('https://api.openweathermap.org/geo/1.0/direct');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '6');
  url.searchParams.set('appid', apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(7000) });
  if (res.status === 401) {
    throw new WeatherApiError(
      'Invalid or inactive OpenWeatherMap API key configured on the server.',
      'invalid_api_key',
      401
    );
  }
  if (res.status === 429) {
    throw new WeatherApiError(
      'OpenWeatherMap API rate limit exceeded. Please wait before searching again.',
      'rate_limit',
      429
    );
  }
  if (!res.ok) {
    throw new WeatherApiError(
      `Location search returned HTTP ${res.status}.`,
      'network_error',
      502
    );
  }

  const list = (await res.json()) as Array<{
    name: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
  }>;

  return list.map((item, idx) => ({
    id: `${item.lat.toFixed(3)},${item.lon.toFixed(3)},${idx}`,
    name: item.name,
    state: item.state,
    country: item.country,
    countryCode: item.country,
    lat: item.lat,
    lon: item.lon,
  }));
}

async function searchLocationsOpenMeteo(query: string): Promise<LocationSuggestion[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '7');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(7000) });
  if (res.status === 429) {
    throw new WeatherApiError(
      'Location search rate limit exceeded. Please wait a moment.',
      'rate_limit',
      429
    );
  }
  if (!res.ok) {
    throw new WeatherApiError(
      `Location search returned HTTP ${res.status}.`,
      'network_error',
      502
    );
  }

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      name: string;
      admin1?: string;
      country?: string;
      country_code?: string;
      latitude: number;
      longitude: number;
      timezone?: string;
    }>;
  };

  return (data.results ?? []).map((item) => ({
    id: String(item.id),
    name: item.name,
    state: item.admin1,
    country: item.country || item.country_code || '',
    countryCode: item.country_code,
    lat: item.latitude,
    lon: item.longitude,
    timezone: item.timezone,
  }));
}

async function fetchNwsAlertsIfUs(
  lat: number,
  lon: number,
  countryCode?: string
): Promise<WeatherAlertItem[]> {
  if (countryCode && countryCode.toUpperCase() !== 'US') {
    return [];
  }
  try {
    const res = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
      {
        headers: { 'User-Agent': 'WeatherNow/2.0 (weathernow-app)' },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { features?: Array<{ properties?: any }> };
    return (json.features ?? []).slice(0, 5).map((feat) => ({
      event: String(feat.properties?.event ?? 'Weather Advisory'),
      sender: String(feat.properties?.senderName ?? 'National Weather Service'),
      severity: feat.properties?.severity,
      start: feat.properties?.onset || feat.properties?.effective,
      end: feat.properties?.ends || feat.properties?.expires,
      description: String(feat.properties?.headline || feat.properties?.description || ''),
    }));
  } catch {
    return [];
  }
}

async function fetchOwmBundle(
  params: {
    lat?: number;
    lon?: number;
    city?: string;
    state?: string;
    countryName?: string;
  },
  apiKey: string
): Promise<WeatherDashboardBundle> {
  const currentUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
  if (params.lat !== undefined && params.lon !== undefined) {
    currentUrl.searchParams.set('lat', String(params.lat));
    currentUrl.searchParams.set('lon', String(params.lon));
  } else if (params.city) {
    currentUrl.searchParams.set('q', params.city);
  }
  currentUrl.searchParams.set('appid', apiKey);
  currentUrl.searchParams.set('units', 'metric');

  let currentRes: Response;
  try {
    currentRes = await fetch(currentUrl.toString(), {
      signal: AbortSignal.timeout(9000),
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    throw new WeatherApiError(
      isTimeout
        ? 'OpenWeatherMap took too long to respond. Please try again.'
        : 'Unable to reach OpenWeatherMap. Please check your internet connection.',
      'network_error',
      503
    );
  }

  if (currentRes.status === 404) {
    throw new WeatherApiError(
      `Location "${params.city || 'selected'}" was not found. Please check spelling and try again.`,
      'invalid_city',
      404
    );
  }
  if (currentRes.status === 401) {
    throw new WeatherApiError(
      'Invalid or inactive OpenWeatherMap API key configured on the server.',
      'invalid_api_key',
      401
    );
  }
  if (currentRes.status === 429) {
    throw new WeatherApiError(
      'OpenWeatherMap API rate limit exceeded. Please wait a moment before retrying.',
      'rate_limit',
      429
    );
  }
  if (!currentRes.ok) {
    throw new WeatherApiError(
      `OpenWeatherMap returned HTTP ${currentRes.status}.`,
      'network_error',
      502
    );
  }

  const currentJson = await currentRes.json();
  const current = normalizeOpenWeatherCurrent(currentJson, {
    state: params.state,
    countryName: params.countryName,
  });

  const { lat, lon } = current.coordinates;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(
    apiKey
  )}&units=metric`;
  const aqUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(
    apiKey
  )}`;

  const [forecastRes, aqRes, alerts] = await Promise.all([
    fetch(forecastUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null),
    fetch(aqUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null),
    fetchNwsAlertsIfUs(lat, lon, currentJson?.sys?.country),
  ]);

  let hourly: WeatherDashboardBundle['hourly'] = [];
  let daily: WeatherDashboardBundle['daily'] = [];
  if (forecastRes && forecastRes.ok) {
    const forecastJson = await forecastRes.json();
    const parsed = normalizeOpenWeatherForecast(forecastJson);
    hourly = parsed.hourly;
    daily = parsed.daily;
  }

  let airQuality = null;
  if (aqRes && aqRes.ok) {
    const aqJson = await aqRes.json();
    airQuality = normalizeAirQualityFromOwm(aqJson);
  }

  return {
    current,
    airQuality,
    hourly,
    daily,
    dailySourceNote:
      daily.length > 0 && daily.length < 7
        ? `Showing ${daily.length}-day outlook from the OpenWeatherMap 5-Day / 3-Hour Forecast API. A 7-day daily forecast requires OpenWeatherMap One Call API 3.0.`
        : undefined,
    alerts,
    alertsNote:
      alerts.length > 0
        ? 'Official weather alerts issued by regional authorities.'
        : 'Official severe weather alerts on OpenWeatherMap require One Call API 3.0; no regional NWS warnings active.',
  };
}

async function fetchBuiltInLiveBundle(params: {
  lat?: number;
  lon?: number;
  city?: string;
  name?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
}): Promise<WeatherDashboardBundle> {
  let target = {
    name: params.name || params.city || '',
    state: params.state,
    country: params.country || '',
    countryCode: params.countryCode,
    timezone: params.timezone,
    lat: params.lat,
    lon: params.lon,
  };

  if (target.lat === undefined || target.lon === undefined) {
    const matches = await searchLocationsOpenMeteo(target.name);
    if (matches.length === 0) {
      throw new WeatherApiError(
        `Location "${target.name}" was not found. Please check spelling or pick a suggestion.`,
        'invalid_city',
        404
      );
    }
    const first = matches[0];
    target = {
      name: first.name,
      state: first.state,
      country: first.country,
      countryCode: first.countryCode,
      timezone: first.timezone,
      lat: first.lat,
      lon: first.lon,
    };
  }

  const lat = target.lat!;
  const lon = target.lon!;

  const wttrUrl = `https://wttr.in/${lat},${lon}?format=j1`;
  const metNoUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(
    4
  )}&lon=${lon.toFixed(4)}`;
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;

  const [wttrRes, metRes, aqRes, alerts] = await Promise.all([
    fetch(wttrUrl, {
      headers: { 'User-Agent': 'WeatherNow/2.0' },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null),
    fetch(metNoUrl, {
      headers: { 'User-Agent': 'WeatherNow/2.0 (weathernow-dashboard)' },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null),
    fetch(aqUrl, { signal: AbortSignal.timeout(7000) }).catch(() => null),
    fetchNwsAlertsIfUs(lat, lon, target.countryCode),
  ]);

  if ((!wttrRes || !wttrRes.ok) && (!metRes || !metRes.ok)) {
    throw new WeatherApiError(
      'Unable to reach the live meteorological servers right now. Please try again.',
      'network_error',
      503
    );
  }

  const wttrJson = wttrRes && wttrRes.ok ? await wttrRes.json() : null;
  const metJson = metRes && metRes.ok ? await metRes.json() : null;
  const aqJson = aqRes && aqRes.ok ? await aqRes.json() : null;

  const airQuality = aqJson ? normalizeAirQualityFromOpenMeteo(aqJson) : null;

  return normalizeMetNoAndWttrBundle(
    {
      name: target.name,
      state: target.state,
      country: target.country,
      timezone: target.timezone,
      lat,
      lon,
    },
    wttrJson,
    metJson,
    airQuality,
    alerts
  );
}

let owmUnauthorizedUntil = 0;

function getServerOwmKey(): string {
  const envKey = process.env.OPENWEATHER_API_KEY?.trim() || '';
  if (
    !envKey ||
    envKey === 'your_openweathermap_api_key_here' ||
    envKey === 'MY_OPENWEATHER_API_KEY'
  ) {
    return '';
  }
  return envKey;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/locations', async (req, res) => {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (rawQuery.length < 2) {
      res.json({ suggestions: [] });
      return;
    }

    const owmKey = getServerOwmKey();
    const useOwm = Boolean(owmKey) && Date.now() >= owmUnauthorizedUntil;

    const cacheKey = `${useOwm ? 'owm' : 'geo'}:${rawQuery.toLowerCase()}`;
    const cached = getCached(locationCache, cacheKey);
    if (cached) {
      res.json({ suggestions: cached });
      return;
    }

    try {
      let suggestions: LocationSuggestion[];
      let usedProvider: 'owm' | 'geo' = useOwm ? 'owm' : 'geo';

      if (useOwm) {
        try {
          suggestions = await searchLocationsOwm(rawQuery, owmKey);
        } catch (err) {
          if (err instanceof WeatherApiError && err.errorType === 'invalid_api_key') {
            owmUnauthorizedUntil = Date.now() + 60_000;
            console.warn(
              'OpenWeatherMap returned 401 for geocoding; using built-in live geocoding fallback.'
            );
            usedProvider = 'geo';
            suggestions = await searchLocationsOpenMeteo(rawQuery);
          } else {
            throw err;
          }
        }
      } else {
        suggestions = await searchLocationsOpenMeteo(rawQuery);
      }

      setCached(
        locationCache,
        `${usedProvider}:${rawQuery.toLowerCase()}`,
        suggestions,
        10 * 60 * 1000
      );
      res.json({ suggestions });
    } catch (err) {
      if (err instanceof WeatherApiError) {
        res.status(err.statusCode).json({ error: err.message, errorType: err.errorType });
        return;
      }
      res.status(503).json({
        error: 'Unable to fetch location suggestions right now.',
        errorType: 'network_error',
      });
    }
  });

  app.get('/api/weather', async (req, res) => {
    const latParam = typeof req.query.lat === 'string' ? Number(req.query.lat) : undefined;
    const lonParam = typeof req.query.lon === 'string' ? Number(req.query.lon) : undefined;
    const hasCoords =
      latParam !== undefined &&
      lonParam !== undefined &&
      !Number.isNaN(latParam) &&
      !Number.isNaN(lonParam);

    const rawCity = typeof req.query.city === 'string' ? req.query.city : '';
    const nameParam = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    const stateParam = typeof req.query.state === 'string' ? req.query.state.trim() : undefined;
    const countryParam =
      typeof req.query.country === 'string' ? req.query.country.trim() : undefined;
    const countryCodeParam =
      typeof req.query.countryCode === 'string' ? req.query.countryCode.trim() : undefined;
    const timezoneParam =
      typeof req.query.timezone === 'string' ? req.query.timezone.trim() : undefined;

    if (!hasCoords) {
      const validation = validateCityInput(rawCity);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error, errorType: 'invalid_city' });
        return;
      }
    }

    const owmKey = getServerOwmKey();
    const useOwm = Boolean(owmKey) && Date.now() >= owmUnauthorizedUntil;
    const coordOrCityKey = hasCoords
      ? `${latParam!.toFixed(3)},${lonParam!.toFixed(3)}`
      : rawCity.trim().toLowerCase();

    const cacheKey = `${useOwm ? 'owm:' + owmKey.slice(-4) : 'live'}:${coordOrCityKey}`;

    const cached = getCached(weatherCache, cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      let bundle: WeatherDashboardBundle;
      let usedPrefix = useOwm ? 'owm:' + owmKey.slice(-4) : 'live';

      if (useOwm) {
        try {
          bundle = await fetchOwmBundle(
            {
              lat: hasCoords ? latParam : undefined,
              lon: hasCoords ? lonParam : undefined,
              city: rawCity.trim(),
              state: stateParam,
              countryName: countryParam,
            },
            owmKey
          );
        } catch (err) {
          if (err instanceof WeatherApiError && err.errorType === 'invalid_api_key') {
            owmUnauthorizedUntil = Date.now() + 60_000;
            console.warn(
              'OpenWeatherMap returned 401 for weather data; using built-in live weather fallback.'
            );
            usedPrefix = 'live';
            bundle = await fetchBuiltInLiveBundle({
              lat: hasCoords ? latParam : undefined,
              lon: hasCoords ? lonParam : undefined,
              city: rawCity.trim(),
              name: nameParam || rawCity.trim(),
              state: stateParam,
              country: countryParam,
              countryCode: countryCodeParam,
              timezone: timezoneParam,
            });
          } else {
            throw err;
          }
        }
      } else {
        bundle = await fetchBuiltInLiveBundle({
          lat: hasCoords ? latParam : undefined,
          lon: hasCoords ? lonParam : undefined,
          city: rawCity.trim(),
          name: nameParam || rawCity.trim(),
          state: stateParam,
          country: countryParam,
          countryCode: countryCodeParam,
          timezone: timezoneParam,
        });
      }

      setCached(weatherCache, `${usedPrefix}:${coordOrCityKey}`, bundle, 5 * 60 * 1000);
      res.json(bundle);
    } catch (err) {
      if (err instanceof WeatherApiError) {
        res.status(err.statusCode).json({
          error: err.message,
          errorType: err.errorType,
        });
        return;
      }
      res.status(500).json({
        error: 'An unexpected server error occurred while fetching weather data.',
        errorType: 'network_error',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WeatherNow server running on http://localhost:${PORT}`);
  });
}

startServer();
