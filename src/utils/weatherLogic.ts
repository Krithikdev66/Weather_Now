export type TemperatureUnit = 'C' | 'F';

export type WeatherCategory =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy'
  | 'misty';

export type AqiLevel = 1 | 2 | 3 | 4 | 5;

export interface LocationSuggestion {
  id: string;
  name: string;
  state?: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface CurrentWeather {
  city: string;
  state?: string;
  country: string;
  timezone?: string;
  localTimeFormatted: string;
  tempC: number;
  feelsLikeC: number;
  tempMinC: number;
  tempMaxC: number;
  condition: string;
  description: string;
  sunrise: string;
  sunset: string;
  humidity: number;
  windSpeedMps: number;
  windDirectionDeg: number | null;
  windDirectionLabel: string;
  pressureHpa: number;
  visibilityKm: number | null;
  cloudCoveragePct: number | null;
  dewPointC: number | null;
  uvIndex: number | null;
  category: WeatherCategory;
  observedAt: string;
  provider: 'OpenWeatherMap' | 'Live Meteorological Feed';
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface AirQualityPollutants {
  pm2_5: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
}

export interface AirQualityData {
  aqi: AqiLevel; // OpenWeatherMap 1-5 scale
  category: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor';
  description: string;
  healthImpact: string;
  recommendation: string;
  pollutants: AirQualityPollutants;
  scaleNote: string;
}

export interface HourlyForecastItem {
  timeIso: string;
  timeLabel: string;
  tempC: number;
  category: WeatherCategory;
  condition: string;
  description: string;
  rainProbabilityPct: number | null;
  windSpeedMps: number;
}

export interface DailyForecastItem {
  dateIso: string;
  dayLabel: string;
  dateLabel: string;
  tempMinC: number;
  tempMaxC: number;
  category: WeatherCategory;
  description: string;
  rainProbabilityPct: number | null;
}

export interface WeatherAlertItem {
  event: string;
  sender: string;
  severity?: string;
  start?: string;
  end?: string;
  description: string;
}

export interface WeatherDashboardBundle {
  current: CurrentWeather;
  airQuality: AirQualityData | null;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  dailySourceNote?: string;
  alerts: WeatherAlertItem[];
  alertsNote: string;
}

export class WeatherApiError extends Error {
  errorType:
    | 'invalid_city'
    | 'invalid_api_key'
    | 'rate_limit'
    | 'network_error'
    | 'missing_data';
  statusCode: number;

  constructor(
    message: string,
    errorType: WeatherApiError['errorType'],
    statusCode = 400
  ) {
    super(message);
    this.name = 'WeatherApiError';
    this.errorType = errorType;
    this.statusCode = statusCode;
  }
}

export function validateCityInput(rawCity: string): {
  valid: boolean;
  city: string;
  error?: string;
} {
  const cleaned = rawCity.trim();
  if (!cleaned) {
    return {
      valid: false,
      city: '',
      error: 'Please enter a city or location name before searching.',
    };
  }
  if (cleaned.length < 2) {
    return {
      valid: false,
      city: cleaned,
      error: 'Please enter at least 2 characters to search for a location.',
    };
  }
  return { valid: true, city: cleaned };
}

export function celsiusToFahrenheit(celsius: number): number {
  return Math.round(((celsius * 9) / 5 + 32) * 10) / 10;
}

export function convertTempValue(tempC: number, unit: TemperatureUnit): number {
  return unit === 'F' ? celsiusToFahrenheit(tempC) : Math.round(tempC * 10) / 10;
}

export function formatTemperature(tempC: number, unit: TemperatureUnit): string {
  return `${convertTempValue(tempC, unit)}°${unit}`;
}

export function formatWindSpeed(speedMps: number, unit: TemperatureUnit): string {
  if (unit === 'F') {
    const mph = Math.round(speedMps * 2.23694 * 10) / 10;
    return `${mph} mph`;
  }
  return `${Math.round(speedMps * 10) / 10} m/s`;
}

export function degreesToCompass(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return 'N/A';
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return directions[index];
}

export function computeDewPointC(tempC: number, humidityPct: number): number {
  // Magnus-Tetens approximation for dew point when not directly provided
  const a = 17.27;
  const b = 237.7;
  const rh = Math.max(1, Math.min(100, humidityPct));
  const gamma = (a * tempC) / (b + tempC) + Math.log(rh / 100);
  const dewPoint = (b * gamma) / (a - gamma);
  return Math.round(dewPoint * 10) / 10;
}

export function categorizeOpenWeatherCondition(
  conditionMain: string,
  weatherId = 800
): WeatherCategory {
  const normalized = conditionMain.trim().toLowerCase();
  if (weatherId >= 200 && weatherId < 300) return 'stormy';
  if (normalized.includes('thunderstorm')) return 'stormy';
  if (
    (weatherId >= 300 && weatherId < 600) ||
    normalized.includes('rain') ||
    normalized.includes('drizzle')
  ) {
    return 'rainy';
  }
  if ((weatherId >= 600 && weatherId < 700) || normalized.includes('snow')) {
    return 'snowy';
  }
  if (
    (weatherId >= 700 && weatherId < 800) ||
    ['mist', 'fog', 'haze', 'smoke', 'dust'].some((term) =>
      normalized.includes(term)
    )
  ) {
    return 'misty';
  }
  if (weatherId === 800 || normalized.includes('clear')) return 'sunny';
  return 'cloudy';
}

export function mapDescriptionToWeather(description: string): {
  condition: string;
  category: WeatherCategory;
} {
  const text = description.trim().toLowerCase();
  if (text.includes('thunder') || text.includes('storm')) {
    return { condition: 'Thunderstorm', category: 'stormy' };
  }
  if (
    text.includes('snow') ||
    text.includes('sleet') ||
    text.includes('blizzard') ||
    text.includes('ice')
  ) {
    return { condition: 'Snow', category: 'snowy' };
  }
  if (
    text.includes('rain') ||
    text.includes('drizzle') ||
    text.includes('shower')
  ) {
    return { condition: 'Rain', category: 'rainy' };
  }
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) {
    return { condition: 'Mist', category: 'misty' };
  }
  if (text.includes('sunny') || text.includes('clear')) {
    return { condition: 'Clear', category: 'sunny' };
  }
  return { condition: 'Clouds', category: 'cloudy' };
}

export function mapMetNoSymbol(symbolCode: string): {
  condition: string;
  description: string;
  category: WeatherCategory;
} {
  const code = symbolCode.toLowerCase();
  if (code.includes('thunder')) {
    return { condition: 'Thunderstorm', description: 'Thunderstorm', category: 'stormy' };
  }
  if (code.includes('snow') || code.includes('sleet')) {
    return { condition: 'Snow', description: 'Snow Showers', category: 'snowy' };
  }
  if (code.includes('heavyrain')) {
    return { condition: 'Rain', description: 'Heavy Rain', category: 'rainy' };
  }
  if (code.includes('rain')) {
    return { condition: 'Rain', description: 'Light to Moderate Rain', category: 'rainy' };
  }
  if (code.includes('fog')) {
    return { condition: 'Mist', description: 'Fog & Mist', category: 'misty' };
  }
  if (code.includes('clearsky') || code.includes('fair')) {
    return { condition: 'Clear', description: code.includes('fair') ? 'Mostly Clear' : 'Clear Sky', category: 'sunny' };
  }
  if (code.includes('partlycloudy')) {
    return { condition: 'Clouds', description: 'Partly Cloudy', category: 'cloudy' };
  }
  return { condition: 'Clouds', description: 'Cloudy', category: 'cloudy' };
}

export function getAqiMeta(aqi: AqiLevel): Omit<AirQualityData, 'aqi' | 'pollutants'> {
  const scaleNote = 'OpenWeatherMap Air Quality Scale (1 = Good to 5 = Very Poor)';
  switch (aqi) {
    case 1:
      return {
        category: 'Good',
        description: 'Air quality is clean with minimal pollutant levels.',
        healthImpact: 'No anticipated health risk for the general public or sensitive groups.',
        recommendation: 'Ideal conditions for outdoor exercise, walking, and open-air activities.',
        scaleNote,
      };
    case 2:
      return {
        category: 'Fair',
        description: 'Air quality is acceptable with low concentrations of common pollutants.',
        healthImpact: 'Minimal impact for most people; unusually sensitive individuals may notice mild irritation.',
        recommendation: 'Great time for outdoor activity; sensitive groups should pay attention to comfort.',
        scaleNote,
      };
    case 3:
      return {
        category: 'Moderate',
        description: 'Noticeable pollutant concentration that may affect sensitive airways.',
        healthImpact: 'People with asthma, heart, or lung conditions may experience mild respiratory symptoms.',
        recommendation: 'Healthy adults can continue outdoor plans; sensitive groups should moderate strenuous exertion.',
        scaleNote,
      };
    case 4:
      return {
        category: 'Poor',
        description: 'Elevated air pollution levels present across key particulate or gas metrics.',
        healthImpact: 'Increased risk of throat irritation, coughing, and breathing discomfort.',
        recommendation: 'Reduce prolonged or heavy outdoor exertion and consider wearing an N95/KN95 mask outdoors.',
        scaleNote,
      };
    case 5:
    default:
      return {
        category: 'Very Poor',
        description: 'High pollutant concentrations indicating unhealthy ambient air.',
        healthImpact: 'Significant respiratory risk for everyone, especially children, older adults, and sensitive groups.',
        recommendation: 'Avoid outdoor exercise, keep windows closed, and use indoor air filtration if available.',
        scaleNote,
      };
  }
}

export function computeOwmAqiFromComponents(components: AirQualityPollutants): AqiLevel {
  // Exact OpenWeatherMap 1-5 pollutant concentration thresholds (ug/m^3)
  const scoreFor = (value: number, thresholds: [number, number, number, number]): AqiLevel => {
    if (value < thresholds[0]) return 1;
    if (value < thresholds[1]) return 2;
    if (value < thresholds[2]) return 3;
    if (value < thresholds[3]) return 4;
    return 5;
  };

  const indices: AqiLevel[] = [
    scoreFor(components.so2, [20, 80, 250, 350]),
    scoreFor(components.no2, [40, 70, 150, 200]),
    scoreFor(components.pm10, [20, 50, 100, 200]),
    scoreFor(components.pm2_5, [10, 25, 50, 75]),
    scoreFor(components.o3, [60, 100, 140, 180]),
    scoreFor(components.co, [4400, 9400, 12400, 15400]),
  ];

  return Math.max(...indices) as AqiLevel;
}

export function formatSunTimeFromUnix(
  unixSeconds: number | undefined,
  timezoneOffsetSeconds = 0
): string {
  if (!unixSeconds) return 'N/A';
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatLocalTimeForTimezone(timezone?: string, offsetSeconds?: number): string {
  try {
    if (timezone) {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());
    }
    if (typeof offsetSeconds === 'number') {
      const shifted = new Date(Date.now() + offsetSeconds * 1000);
      return `${shifted.toUTCString().slice(0, 3)}, ${String(shifted.getUTCHours()).padStart(2, '0')}:${String(
        shifted.getUTCMinutes()
      ).padStart(2, '0')} local`;
    }
  } catch {
    // Fallback below
  }
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatHourLabel(isoString: string, timezone?: string, offsetSeconds?: number): string {
  const date = new Date(isoString);
  if (timezone) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      // Fallback
    }
  }
  if (typeof offsetSeconds === 'number') {
    const shifted = new Date(date.getTime() + offsetSeconds * 1000);
    const h = shifted.getUTCHours();
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${period}`;
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function normalizeAirQualityFromOwm(raw: any): AirQualityData | null {
  const item = raw?.list?.[0];
  if (!item || !item.main || !item.components) return null;

  const rawAqi = Number(item.main.aqi);
  const aqi = ([1, 2, 3, 4, 5].includes(rawAqi) ? rawAqi : 1) as AqiLevel;
  const pollutants: AirQualityPollutants = {
    pm2_5: Math.round(Number(item.components.pm2_5 ?? 0) * 10) / 10,
    pm10: Math.round(Number(item.components.pm10 ?? 0) * 10) / 10,
    co: Math.round(Number(item.components.co ?? 0) * 10) / 10,
    no2: Math.round(Number(item.components.no2 ?? 0) * 10) / 10,
    so2: Math.round(Number(item.components.so2 ?? 0) * 10) / 10,
    o3: Math.round(Number(item.components.o3 ?? 0) * 10) / 10,
  };

  return {
    aqi,
    ...getAqiMeta(aqi),
    pollutants,
  };
}

export function normalizeAirQualityFromOpenMeteo(raw: any): AirQualityData | null {
  const current = raw?.current;
  if (!current || current.pm2_5 === undefined) return null;

  const pollutants: AirQualityPollutants = {
    pm2_5: Math.round(Number(current.pm2_5 ?? 0) * 10) / 10,
    pm10: Math.round(Number(current.pm10 ?? 0) * 10) / 10,
    co: Math.round(Number(current.carbon_monoxide ?? 0) * 10) / 10,
    no2: Math.round(Number(current.nitrogen_dioxide ?? 0) * 10) / 10,
    so2: Math.round(Number(current.sulphur_dioxide ?? 0) * 10) / 10,
    o3: Math.round(Number(current.ozone ?? 0) * 10) / 10,
  };

  const aqi = computeOwmAqiFromComponents(pollutants);
  return {
    aqi,
    ...getAqiMeta(aqi),
    pollutants,
  };
}

export function normalizeOpenWeatherCurrent(
  raw: any,
  meta?: { state?: string; countryName?: string }
): CurrentWeather {
  if (
    !raw ||
    typeof raw.name !== 'string' ||
    !raw.main ||
    typeof raw.main.temp !== 'number' ||
    typeof raw.main.feels_like !== 'number' ||
    typeof raw.main.humidity !== 'number' ||
    typeof raw.main.pressure !== 'number' ||
    !Array.isArray(raw.weather) ||
    raw.weather.length === 0
  ) {
    throw new WeatherApiError(
      'Received incomplete weather data from OpenWeatherMap.',
      'missing_data',
      502
    );
  }

  const weatherInfo = raw.weather[0];
  const condition = String(weatherInfo.main ?? 'Clear');
  const descriptionRaw = String(weatherInfo.description ?? condition);
  const description = descriptionRaw.replace(/\b\w/g, (ch) => ch.toUpperCase());
  const weatherId = Number(weatherInfo.id ?? 800);
  const tzOffset = typeof raw.timezone === 'number' ? raw.timezone : 0;
  const tempC = Math.round(raw.main.temp * 10) / 10;
  const humidity = Math.round(raw.main.humidity);
  const windDeg = typeof raw.wind?.deg === 'number' ? raw.wind.deg : null;

  return {
    city: raw.name,
    state: meta?.state,
    country: meta?.countryName || String(raw.sys?.country ?? ''),
    localTimeFormatted: formatLocalTimeForTimezone(undefined, tzOffset),
    tempC,
    feelsLikeC: Math.round(raw.main.feels_like * 10) / 10,
    tempMinC: Math.round(Number(raw.main.temp_min ?? tempC) * 10) / 10,
    tempMaxC: Math.round(Number(raw.main.temp_max ?? tempC) * 10) / 10,
    condition,
    description,
    sunrise: formatSunTimeFromUnix(raw.sys?.sunrise, tzOffset),
    sunset: formatSunTimeFromUnix(raw.sys?.sunset, tzOffset),
    humidity,
    windSpeedMps: Math.round(Number(raw.wind?.speed ?? 0) * 10) / 10,
    windDirectionDeg: windDeg,
    windDirectionLabel: degreesToCompass(windDeg),
    pressureHpa: Math.round(raw.main.pressure),
    visibilityKm:
      typeof raw.visibility === 'number'
        ? Math.round((raw.visibility / 1000) * 10) / 10
        : null,
    cloudCoveragePct:
      typeof raw.clouds?.all === 'number' ? Math.round(raw.clouds.all) : null,
    dewPointC: computeDewPointC(tempC, humidity),
    uvIndex: null,
    category: categorizeOpenWeatherCondition(condition, weatherId),
    observedAt: new Date().toISOString(),
    provider: 'OpenWeatherMap',
    coordinates: {
      lat: Number(raw.coord?.lat ?? 0),
      lon: Number(raw.coord?.lon ?? 0),
    },
  };
}

export function normalizeOpenWeatherForecast(raw: any): {
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
} {
  const list = Array.isArray(raw?.list) ? raw.list : [];
  const tzOffset = typeof raw?.city?.timezone === 'number' ? raw.city.timezone : 0;

  // Next 24 hours (8 x 3-hour blocks from OWM 5-day/3-hr forecast)
  const hourly: HourlyForecastItem[] = list.slice(0, 8).map((slot: any) => {
    const info = slot.weather?.[0] ?? {};
    const condition = String(info.main ?? 'Clouds');
    const description = String(info.description ?? condition).replace(/\b\w/g, (c) =>
      c.toUpperCase()
    );
    const iso = new Date(Number(slot.dt) * 1000).toISOString();

    return {
      timeIso: iso,
      timeLabel: formatHourLabel(iso, undefined, tzOffset),
      tempC: Math.round(Number(slot.main?.temp ?? 0) * 10) / 10,
      category: categorizeOpenWeatherCondition(condition, Number(info.id ?? 800)),
      condition,
      description,
      rainProbabilityPct:
        typeof slot.pop === 'number' ? Math.round(slot.pop * 100) : null,
      windSpeedMps: Math.round(Number(slot.wind?.speed ?? 0) * 10) / 10,
    };
  });

  // Group by local day for available forecast days (up to 5 days on OWM free tier)
  const byDay = new Map<
    string,
    {
      min: number;
      max: number;
      pops: number[];
      midSlot: any;
      dateObj: Date;
    }
  >();

  for (const slot of list) {
    const shifted = new Date((Number(slot.dt) + tzOffset) * 1000);
    const key = shifted.toISOString().slice(0, 10);
    const tMin = Number(slot.main?.temp_min ?? slot.main?.temp ?? 0);
    const tMax = Number(slot.main?.temp_max ?? slot.main?.temp ?? 0);
    const pop = typeof slot.pop === 'number' ? Math.round(slot.pop * 100) : 0;

    const existing = byDay.get(key);
    if (!existing) {
      byDay.set(key, {
        min: tMin,
        max: tMax,
        pops: [pop],
        midSlot: slot,
        dateObj: shifted,
      });
    } else {
      existing.min = Math.min(existing.min, tMin);
      existing.max = Math.max(existing.max, tMax);
      existing.pops.push(pop);
      if (shifted.getUTCHours() >= 11 && shifted.getUTCHours() <= 15) {
        existing.midSlot = slot;
      }
    }
  }

  const daily: DailyForecastItem[] = Array.from(byDay.entries()).map(
    ([dateIso, group], idx) => {
      const info = group.midSlot?.weather?.[0] ?? {};
      const condition = String(info.main ?? 'Clouds');
      const description = String(info.description ?? condition).replace(/\b\w/g, (c) =>
        c.toUpperCase()
      );
      const weekday = group.dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      });
      const dateLabel = group.dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });

      return {
        dateIso,
        dayLabel: idx === 0 ? 'Today' : weekday,
        dateLabel,
        tempMinC: Math.round(group.min * 10) / 10,
        tempMaxC: Math.round(group.max * 10) / 10,
        category: categorizeOpenWeatherCondition(condition, Number(info.id ?? 800)),
        description,
        rainProbabilityPct:
          group.pops.length > 0 ? Math.max(...group.pops) : null,
      };
    }
  );

  return { hourly, daily };
}

export function normalizeMetNoAndWttrBundle(
  location: {
    name: string;
    state?: string;
    country: string;
    timezone?: string;
    lat: number;
    lon: number;
  },
  wttrPayload: any,
  metNoPayload: any,
  airQuality: AirQualityData | null,
  alerts: WeatherAlertItem[]
): WeatherDashboardBundle {
  const currentWttr = wttrPayload?.current_condition?.[0];
  const todayWttr = wttrPayload?.weather?.[0];
  const metSeries: any[] = Array.isArray(metNoPayload?.properties?.timeseries)
    ? metNoPayload.properties.timeseries
    : [];

  const metNow = metSeries[0]?.data?.instant?.details;
  if (!currentWttr && !metNow) {
    throw new WeatherApiError(
      'Received incomplete weather data from the live meteorological service.',
      'missing_data',
      502
    );
  }

  const tempC =
    currentWttr?.temp_C !== undefined
      ? Math.round(Number(currentWttr.temp_C) * 10) / 10
      : Math.round(Number(metNow.air_temperature) * 10) / 10;
  const feelsLikeC =
    currentWttr?.FeelsLikeC !== undefined
      ? Math.round(Number(currentWttr.FeelsLikeC) * 10) / 10
      : tempC;
  const humidity =
    currentWttr?.humidity !== undefined
      ? Math.round(Number(currentWttr.humidity))
      : Math.round(Number(metNow?.relative_humidity ?? 50));

  const rawDesc = String(currentWttr?.weatherDesc?.[0]?.value ?? 'Clear');
  const description = rawDesc.replace(/\b\w/g, (ch) => ch.toUpperCase());
  const mappedDesc = mapDescriptionToWeather(rawDesc);

  const windSpeedMps =
    currentWttr?.windspeedKmph !== undefined
      ? Math.round((Number(currentWttr.windspeedKmph) / 3.6) * 10) / 10
      : Math.round(Number(metNow?.wind_speed ?? 0) * 10) / 10;

  const windDirectionDeg =
    currentWttr?.winddirDegree !== undefined
      ? Number(currentWttr.winddirDegree)
      : typeof metNow?.wind_from_direction === 'number'
      ? metNow.wind_from_direction
      : null;

  const windDirectionLabel =
    currentWttr?.winddir16Point || degreesToCompass(windDirectionDeg);

  const pressureHpa =
    currentWttr?.pressure !== undefined
      ? Math.round(Number(currentWttr.pressure))
      : Math.round(Number(metNow?.air_pressure_at_sea_level ?? 1013));

  const visibilityKm =
    currentWttr?.visibility !== undefined
      ? Math.round(Number(currentWttr.visibility) * 10) / 10
      : null;

  const cloudCoveragePct =
    currentWttr?.cloudcover !== undefined
      ? Math.round(Number(currentWttr.cloudcover))
      : typeof metNow?.cloud_area_fraction === 'number'
      ? Math.round(metNow.cloud_area_fraction)
      : null;

  const wttrHourlyNow = todayWttr?.hourly?.[0];
  const dewPointC =
    wttrHourlyNow?.DewPointC !== undefined
      ? Math.round(Number(wttrHourlyNow.DewPointC) * 10) / 10
      : computeDewPointC(tempC, humidity);

  const uvIndex =
    currentWttr?.uvIndex !== undefined
      ? Number(currentWttr.uvIndex)
      : wttrHourlyNow?.uvIndex !== undefined
      ? Number(wttrHourlyNow.uvIndex)
      : null;

  const sunrise = todayWttr?.astronomy?.[0]?.sunrise || 'N/A';
  const sunset = todayWttr?.astronomy?.[0]?.sunset || 'N/A';

  // Build 24-hour forecast from met.no hourly entries
  const hourly: HourlyForecastItem[] = metSeries.slice(0, 24).map((entry: any) => {
    const details = entry?.data?.instant?.details ?? {};
    const next1h = entry?.data?.next_1_hours;
    const next6h = entry?.data?.next_6_hours;
    const symbolCode = String(
      next1h?.summary?.symbol_code ||
        next6h?.summary?.symbol_code ||
        'cloudy'
    );
    const mapped = mapMetNoSymbol(symbolCode);
    const precipMm =
      next1h?.details?.precipitation_amount ??
      next6h?.details?.precipitation_amount ??
      null;
    const popFromSymbol =
      typeof precipMm === 'number' && precipMm > 0
        ? Math.min(95, Math.round(35 + precipMm * 25))
        : mapped.category === 'rainy' || mapped.category === 'stormy'
        ? 60
        : 10;

    return {
      timeIso: entry.time,
      timeLabel: formatHourLabel(entry.time, location.timezone),
      tempC: Math.round(Number(details.air_temperature ?? tempC) * 10) / 10,
      category: mapped.category,
      condition: mapped.condition,
      description: mapped.description,
      rainProbabilityPct: precipMm !== null ? popFromSymbol : null,
      windSpeedMps: Math.round(Number(details.wind_speed ?? 0) * 10) / 10,
    };
  });

  // Build 7-day daily forecast from met.no timeseries
  const dayBuckets = new Map<
    string,
    {
      temps: number[];
      symbols: string[];
      precips: number[];
    }
  >();

  for (const entry of metSeries) {
    const dt = new Date(entry.time);
    let dateKey = entry.time.slice(0, 10);
    if (location.timezone) {
      try {
        dateKey = new Intl.DateTimeFormat('en-CA', {
          timeZone: location.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(dt);
      } catch {
        // Fallback to UTC dateKey
      }
    }

    const tempVal = entry?.data?.instant?.details?.air_temperature;
    if (typeof tempVal !== 'number') continue;

    const sym = String(
      entry?.data?.next_6_hours?.summary?.symbol_code ||
        entry?.data?.next_1_hours?.summary?.symbol_code ||
        'partlycloudy_day'
    );
    const precip = Number(
      entry?.data?.next_6_hours?.details?.precipitation_amount ??
        entry?.data?.next_1_hours?.details?.precipitation_amount ??
        0
    );

    const bucket = dayBuckets.get(dateKey);
    if (!bucket) {
      dayBuckets.set(dateKey, { temps: [tempVal], symbols: [sym], precips: [precip] });
    } else {
      bucket.temps.push(tempVal);
      bucket.symbols.push(sym);
      bucket.precips.push(precip);
    }
  }

  const daily: DailyForecastItem[] = Array.from(dayBuckets.entries())
    .slice(0, 7)
    .map(([dateIso, bucket], idx) => {
      const midSymbol = bucket.symbols[Math.floor(bucket.symbols.length / 2)] || 'cloudy';
      const mapped = mapMetNoSymbol(midSymbol);
      const totalPrecip = bucket.precips.reduce((acc, v) => acc + v, 0);
      const rainProbabilityPct =
        totalPrecip > 0.2
          ? Math.min(95, Math.round(35 + totalPrecip * 8))
          : mapped.category === 'rainy' || mapped.category === 'stormy'
          ? 55
          : 10;

      const parsedDate = new Date(`${dateIso}T12:00:00Z`);
      const dayLabel =
        idx === 0
          ? 'Today'
          : parsedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              timeZone: 'UTC',
            });
      const dateLabel = parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });

      return {
        dateIso,
        dayLabel,
        dateLabel,
        tempMinC: Math.round(Math.min(...bucket.temps) * 10) / 10,
        tempMaxC: Math.round(Math.max(...bucket.temps) * 10) / 10,
        category: mapped.category,
        description: mapped.description,
        rainProbabilityPct,
      };
    });

  const todayMinC =
    todayWttr?.mintempC !== undefined
      ? Math.round(Number(todayWttr.mintempC) * 10) / 10
      : daily[0]?.tempMinC ?? tempC;
  const todayMaxC =
    todayWttr?.maxtempC !== undefined
      ? Math.round(Number(todayWttr.maxtempC) * 10) / 10
      : daily[0]?.tempMaxC ?? tempC;

  return {
    current: {
      city: location.name,
      state: location.state,
      country: location.country,
      timezone: location.timezone,
      localTimeFormatted: formatLocalTimeForTimezone(location.timezone),
      tempC,
      feelsLikeC,
      tempMinC: todayMinC,
      tempMaxC: todayMaxC,
      condition: mappedDesc.condition,
      description,
      sunrise,
      sunset,
      humidity,
      windSpeedMps,
      windDirectionDeg,
      windDirectionLabel,
      pressureHpa,
      visibilityKm,
      cloudCoveragePct,
      dewPointC,
      uvIndex,
      category: mappedDesc.category,
      observedAt: new Date().toISOString(),
      provider: 'Live Meteorological Feed',
      coordinates: { lat: location.lat, lon: location.lon },
    },
    airQuality,
    hourly,
    daily,
    alerts,
    alertsNote:
      alerts.length > 0
        ? 'Official severe weather warnings issued by regional meteorological authorities.'
        : 'No active official severe weather alerts reported for this location.',
  };
}
