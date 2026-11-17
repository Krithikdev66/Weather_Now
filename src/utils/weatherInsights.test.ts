import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeatherInsights } from './weatherInsights';
import type { AirQualityData, CurrentWeather, DailyForecastItem, HourlyForecastItem } from './weatherLogic';

const baseCurrent: CurrentWeather = {
  city: 'Mangaluru',
  state: 'Karnataka',
  country: 'India',
  localTimeFormatted: 'Tue, 03:30 PM',
  tempC: 31,
  feelsLikeC: 35,
  tempMinC: 25,
  tempMaxC: 33,
  condition: 'Clear',
  description: 'Sunny',
  sunrise: '06:30 AM',
  sunset: '06:01 PM',
  humidity: 68,
  windSpeedMps: 3.5,
  windDirectionDeg: 270,
  windDirectionLabel: 'W',
  pressureHpa: 1011,
  visibilityKm: 10,
  cloudCoveragePct: 15,
  dewPointC: 24,
  uvIndex: 7,
  category: 'sunny',
  observedAt: '2026-11-17T10:00:00Z',
  provider: 'Live Meteorological Feed',
  coordinates: { lat: 12.91, lon: 74.85 },
};

const baseHourly: HourlyForecastItem[] = [
  {
    timeIso: '2026-11-17T11:00:00Z',
    timeLabel: '4:30 PM',
    tempC: 30,
    category: 'sunny',
    condition: 'Clear',
    description: 'Sunny',
    rainProbabilityPct: 10,
    windSpeedMps: 3.2,
  },
  {
    timeIso: '2026-11-17T14:00:00Z',
    timeLabel: '7:30 PM',
    tempC: 26,
    category: 'sunny',
    condition: 'Clear',
    description: 'Clear Sky',
    rainProbabilityPct: 5,
    windSpeedMps: 2.0,
  },
];

const baseDaily: DailyForecastItem[] = [
  {
    dateIso: '2026-11-17',
    dayLabel: 'Today',
    dateLabel: 'Nov 17',
    tempMinC: 25,
    tempMaxC: 33,
    category: 'sunny',
    description: 'Sunny',
    rainProbabilityPct: 10,
  },
];

test('generateWeatherInsights produces all 7 intelligence cards with dynamic hot/UV/AQI guidance', () => {
  const goodAq: AirQualityData = {
    aqi: 1,
    category: 'Good',
    description: 'Clean',
    healthImpact: 'None',
    recommendation: 'Ideal',
    pollutants: { pm2_5: 6, pm10: 14, co: 250, no2: 12, so2: 4, o3: 45 },
    scaleNote: '1-5',
  };

  const insights = generateWeatherInsights(baseCurrent, goodAq, baseHourly, baseDaily);
  assert.equal(insights.length, 7);
  assert.deepEqual(
    insights.map((c) => c.id),
    ['outdoor', 'clothing', 'health', 'travel', 'umbrella', 'best-time', 'sunscreen']
  );

  const clothing = insights.find((c) => c.id === 'clothing')!;
  assert.match(clothing.statusLabel, /Light/i);

  const health = insights.find((c) => c.id === 'health')!;
  assert.match(health.bullets.join(' '), /drink water|hydration/i);

  const sunscreen = insights.find((c) => c.id === 'sunscreen')!;
  assert.equal(sunscreen.tone, 'warning');
  assert.match(sunscreen.bullets.join(' '), /SPF 30\+/i);

  const bestTime = insights.find((c) => c.id === 'best-time')!;
  assert.match(bestTime.summary, /7:30 PM/);

  const fahrenheitInsights = generateWeatherInsights(baseCurrent, goodAq, baseHourly, baseDaily, 'F');
  const fBestTime = fahrenheitInsights.find((c) => c.id === 'best-time')!;
  assert.match(fBestTime.summary, /78\.8°F/);
});

test('generateWeatherInsights adapts to poor AQI and heavy rain/storms', () => {
  const poorAq: AirQualityData = {
    aqi: 5,
    category: 'Very Poor',
    description: 'Unhealthy',
    healthImpact: 'High risk',
    recommendation: 'Avoid outdoors',
    pollutants: { pm2_5: 95, pm10: 180, co: 900, no2: 80, so2: 20, o3: 110 },
    scaleNote: '1-5',
  };

  const stormyCurrent: CurrentWeather = {
    ...baseCurrent,
    tempC: 14,
    feelsLikeC: 12,
    category: 'stormy',
    condition: 'Thunderstorm',
    description: 'Thunderstorm',
    visibilityKm: 1.2,
    windSpeedMps: 13,
    uvIndex: 1,
  };

  const insights = generateWeatherInsights(stormyCurrent, poorAq, baseHourly, baseDaily);
  const outdoor = insights.find((c) => c.id === 'outdoor')!;
  const health = insights.find((c) => c.id === 'health')!;
  const travel = insights.find((c) => c.id === 'travel')!;
  const umbrella = insights.find((c) => c.id === 'umbrella')!;
  const sunscreen = insights.find((c) => c.id === 'sunscreen')!;

  assert.equal(outdoor.tone, 'warning');
  assert.equal(health.tone, 'warning');
  assert.equal(travel.tone, 'warning');
  assert.equal(umbrella.tone, 'warning');
  assert.match(umbrella.statusLabel, /Required/i);
  assert.equal(sunscreen.tone, 'positive');
});
