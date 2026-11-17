import test from 'node:test';
import assert from 'node:assert/strict';
import {
  categorizeOpenWeatherCondition,
  celsiusToFahrenheit,
  computeDewPointC,
  computeOwmAqiFromComponents,
  degreesToCompass,
  formatTemperature,
  formatWindSpeed,
  getAqiMeta,
  normalizeAirQualityFromOwm,
  normalizeMetNoAndWttrBundle,
  normalizeOpenWeatherCurrent,
  normalizeOpenWeatherForecast,
  validateCityInput,
  WeatherApiError,
} from './weatherLogic';

test('validateCityInput rejects empty or short queries', () => {
  assert.equal(validateCityInput('').valid, false);
  assert.equal(validateCityInput('  ').valid, false);
  assert.equal(validateCityInput('a').valid, false);
  const ok = validateCityInput('  Mangalore  ');
  assert.equal(ok.valid, true);
  assert.equal(ok.city, 'Mangalore');
});

test('temperature, wind speed, compass, and dew point conversions work accurately', () => {
  assert.equal(celsiusToFahrenheit(0), 32);
  assert.equal(celsiusToFahrenheit(25), 77);
  assert.equal(formatTemperature(20, 'C'), '20°C');
  assert.equal(formatTemperature(20, 'F'), '68°F');
  assert.equal(formatWindSpeed(5, 'C'), '5 m/s');
  assert.equal(formatWindSpeed(10, 'F'), '22.4 mph');
  assert.equal(degreesToCompass(0), 'N');
  assert.equal(degreesToCompass(90), 'E');
  assert.equal(degreesToCompass(225), 'SW');
  assert.ok(computeDewPointC(25, 60) > 16 && computeDewPointC(25, 60) < 17);
});

test('OpenWeatherMap 1-5 AQI scale thresholds map pollutants accurately', () => {
  assert.equal(
    computeOwmAqiFromComponents({
      pm2_5: 5,
      pm10: 12,
      co: 300,
      no2: 15,
      so2: 5,
      o3: 40,
    }),
    1
  );
  assert.equal(
    computeOwmAqiFromComponents({
      pm2_5: 18,
      pm10: 30,
      co: 400,
      no2: 20,
      so2: 10,
      o3: 50,
    }),
    2
  );
  assert.equal(
    computeOwmAqiFromComponents({
      pm2_5: 80,
      pm10: 120,
      co: 1000,
      no2: 60,
      so2: 20,
      o3: 90,
    }),
    5
  );
  assert.equal(getAqiMeta(1).category, 'Good');
  assert.equal(getAqiMeta(3).category, 'Moderate');
  assert.equal(getAqiMeta(5).category, 'Very Poor');
});

test('normalizeAirQualityFromOwm preserves 1-5 scale and all 6 pollutants', () => {
  const aq = normalizeAirQualityFromOwm({
    list: [
      {
        main: { aqi: 3 },
        components: {
          pm2_5: 28.4,
          pm10: 44.1,
          co: 412.5,
          no2: 31.2,
          so2: 8.7,
          o3: 75.3,
        },
      },
    ],
  });
  assert.ok(aq);
  assert.equal(aq.aqi, 3);
  assert.equal(aq.category, 'Moderate');
  assert.equal(aq.pollutants.pm2_5, 28.4);
  assert.equal(aq.pollutants.o3, 75.3);
});

test('normalizeOpenWeatherCurrent and Forecast parse complete weather structures', () => {
  const current = normalizeOpenWeatherCurrent({
    name: 'Mangaluru',
    sys: { country: 'IN', sunrise: 1700000000, sunset: 1700043200 },
    timezone: 19800,
    coord: { lat: 12.91, lon: 74.85 },
    main: {
      temp: 29.2,
      feels_like: 32.1,
      temp_min: 27.0,
      temp_max: 31.0,
      humidity: 72,
      pressure: 1011,
    },
    weather: [{ id: 801, main: 'Clouds', description: 'few clouds' }],
    wind: { speed: 4.1, deg: 270 },
    clouds: { all: 25 },
    visibility: 10000,
  });

  assert.equal(current.city, 'Mangaluru');
  assert.equal(current.windDirectionLabel, 'W');
  assert.equal(current.cloudCoveragePct, 25);
  assert.equal(current.provider, 'OpenWeatherMap');

  assert.throws(
    () => normalizeOpenWeatherCurrent({ name: 'Broken' }),
    (err: unknown) => err instanceof WeatherApiError && err.errorType === 'missing_data'
  );

  const forecast = normalizeOpenWeatherForecast({
    city: { timezone: 0 },
    list: [
      {
        dt: 1700006400,
        main: { temp: 20, temp_min: 18, temp_max: 21 },
        weather: [{ id: 500, main: 'Rain', description: 'light rain' }],
        wind: { speed: 3.5 },
        pop: 0.6,
      },
      {
        dt: 1700092800,
        main: { temp: 22, temp_min: 17, temp_max: 24 },
        weather: [{ id: 800, main: 'Clear', description: 'clear sky' }],
        wind: { speed: 2.1 },
        pop: 0.1,
      },
    ],
  });

  assert.equal(forecast.hourly.length, 2);
  assert.equal(forecast.hourly[0].rainProbabilityPct, 60);
  assert.equal(forecast.daily.length, 2);
});

test('normalizeMetNoAndWttrBundle combines current, hourly, 7-day, AQI, and alerts', () => {
  const timeseries = Array.from({ length: 7 }, (_, dayIdx) => ({
    time: `2026-11-${17 + dayIdx}T12:00:00Z`,
    data: {
      instant: {
        details: {
          air_temperature: 22 + dayIdx,
          relative_humidity: 60,
          air_pressure_at_sea_level: 1013,
          cloud_area_fraction: 30,
          wind_from_direction: 180,
          wind_speed: 3.2,
        },
      },
      next_1_hours: {
        summary: { symbol_code: 'clearsky_day' },
        details: { precipitation_amount: 0.0 },
      },
    },
  }));

  const bundle = normalizeMetNoAndWttrBundle(
    { name: 'Mangaluru', state: 'Karnataka', country: 'India', timezone: 'Asia/Kolkata', lat: 12.91, lon: 74.85 },
    {
      current_condition: [
        {
          temp_C: '30',
          FeelsLikeC: '33',
          humidity: '68',
          pressure: '1010',
          visibility: '10',
          cloudcover: '20',
          windspeedKmph: '14',
          winddirDegree: '270',
          winddir16Point: 'W',
          uvIndex: '7',
          weatherDesc: [{ value: 'Partly cloudy' }],
        },
      ],
      weather: [
        {
          mintempC: '24',
          maxtempC: '32',
          astronomy: [{ sunrise: '06:30 AM', sunset: '06:01 PM' }],
          hourly: [{ DewPointC: '23', uvIndex: '7' }],
        },
      ],
    },
    { properties: { timeseries } },
    null,
    []
  );

  assert.equal(bundle.current.city, 'Mangaluru');
  assert.equal(bundle.current.sunrise, '06:30 AM');
  assert.equal(bundle.current.uvIndex, 7);
  assert.equal(bundle.daily.length, 7);
  assert.equal(bundle.alerts.length, 0);
  assert.equal(categorizeOpenWeatherCondition('Clear', 800), 'sunny');
});
