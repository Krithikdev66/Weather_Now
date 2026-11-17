import {
  Cloud,
  Compass,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Navigation,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from 'lucide-react';
import {
  formatTemperature,
  formatWindSpeed,
  type CurrentWeather,
  type TemperatureUnit,
  type WeatherCategory,
} from '../utils/weatherLogic';
import { WeatherConditionIcon } from './WeatherIcons';

interface CurrentWeatherHeroProps {
  current: CurrentWeather;
  unit: TemperatureUnit;
}

function isNightLocalTime(localTimeFormatted: string): boolean {
  const match = localTimeFormatted.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return false;
  let hour = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return hour >= 19 || hour < 6;
}

function getHeroTheme(category: WeatherCategory, localTimeFormatted: string) {
  const isNight = isNightLocalTime(localTimeFormatted);

  if (category === 'snowy') {
    return {
      gradient:
        'bg-gradient-to-br from-sky-100 via-blue-50 to-white dark:from-slate-800 dark:via-sky-950 dark:to-slate-900',
      textPrimary: 'text-slate-900 dark:text-white',
      textMuted: 'text-slate-600 dark:text-sky-200/90',
      border: 'border border-sky-200/90 dark:border-sky-800/60',
      halo: 'bg-sky-200/50 dark:bg-sky-500/15',
    };
  }

  if (isNight && (category === 'sunny' || category === 'cloudy' || category === 'misty')) {
    return {
      gradient: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950',
      textPrimary: 'text-white',
      textMuted: 'text-indigo-100/90',
      border: 'border border-indigo-400/20',
      halo: 'bg-indigo-400/15',
    };
  }

  const map: Record<WeatherCategory, { gradient: string; halo: string; muted: string }> = {
    sunny: {
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700',
      halo: 'bg-yellow-200/25',
      muted: 'text-amber-50',
    },
    cloudy: {
      gradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-blue-900',
      halo: 'bg-sky-300/15',
      muted: 'text-slate-100',
    },
    rainy: {
      gradient: 'bg-gradient-to-br from-slate-800 via-blue-900 to-slate-950',
      halo: 'bg-blue-400/15',
      muted: 'text-blue-100',
    },
    stormy: {
      gradient: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950',
      halo: 'bg-purple-400/15',
      muted: 'text-indigo-100',
    },
    misty: {
      gradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900',
      halo: 'bg-slate-300/15',
      muted: 'text-slate-100',
    },
    snowy: {
      gradient: 'bg-gradient-to-br from-sky-100 via-blue-50 to-white',
      halo: 'bg-sky-200/40',
      muted: 'text-slate-700',
    },
  };

  const selected = map[category] ?? map.cloudy;
  return {
    gradient: selected.gradient,
    textPrimary: 'text-white',
    textMuted: selected.muted,
    border: 'border border-white/15',
    halo: selected.halo,
  };
}

export function CurrentWeatherHero({ current, unit }: CurrentWeatherHeroProps) {
  const locationParts = [current.city, current.state, current.country].filter(Boolean);
  const lastUpdated = new Date(current.observedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const heroTheme = getHeroTheme(current.category, current.localTimeFormatted);

  const windProgress = Math.min(100, Math.round((current.windSpeedMps / 20) * 100));
  const pressureProgress = Math.min(
    100,
    Math.max(8, Math.round(((current.pressureHpa - 960) / 80) * 100))
  );
  const visibilityProgress =
    current.visibilityKm !== null
      ? Math.min(100, Math.round((current.visibilityKm / 10) * 100))
      : 0;
  const uvProgress =
    current.uvIndex !== null ? Math.min(100, Math.round((current.uvIndex / 11) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Current Weather Hero Card */}
      <section
        aria-label="Current weather overview"
        className={`weather-fade-up relative overflow-hidden ${heroTheme.gradient} ${heroTheme.textPrimary} ${heroTheme.border} rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.45)] transition-all duration-300`}
      >
        {/* Subtle decorative ambient sky glow */}
        <div
          aria-hidden="true"
          className={`absolute -top-20 -right-16 w-72 h-72 rounded-full blur-3xl pointer-events-none ${heroTheme.halo}`}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm ${heroTheme.textMuted}`}>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                {locationParts.join(', ')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{current.localTimeFormatted}</span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap tabular-nums">
                Updated {lastUpdated}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <p
                data-testid="current-temperature"
                className="font-display text-6xl sm:text-7xl font-bold tracking-tight tabular-nums leading-none"
              >
                {formatTemperature(current.tempC, unit)}
              </p>
              <span className={`text-base sm:text-lg font-medium tabular-nums ${heroTheme.textMuted}`}>
                Feels like {formatTemperature(current.feelsLikeC, unit)}
              </span>
            </div>

            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base ${heroTheme.textMuted}`}>
              <span className="font-semibold">
                {current.condition} · {current.description}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                High {formatTemperature(current.tempMaxC, unit)} / Low{' '}
                {formatTemperature(current.tempMinC, unit)}
              </span>
            </div>

            <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs pt-1 ${heroTheme.textMuted}`}>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Sunrise className="w-3.5 h-3.5" aria-hidden="true" />
                Sunrise {current.sunrise}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Sunset className="w-3.5 h-3.5" aria-hidden="true" />
                Sunset {current.sunset}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                {current.provider}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-start md:justify-end self-start md:self-center">
            <div className="relative p-4 rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/15">
              <WeatherConditionIcon
                category={current.category}
                animated
                className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8 Individual Premium Weather Metrics Cards */}
      <section aria-label="Detailed weather metrics" className="space-y-3.5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Atmospheric Conditions
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            8 live surface measurements
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Humidity */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Humidity</span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {current.humidity}%
            </p>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#182235] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, current.humidity)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {current.humidity >= 75
                  ? 'Humid surface air'
                  : current.humidity <= 35
                  ? 'Dry air moisture'
                  : 'Comfortable moisture'}
              </p>
            </div>
          </article>

          {/* 2. Wind Speed */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Wind Speed</span>
              <span className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                <Wind className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatWindSpeed(current.windSpeedMps, unit)}
            </p>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#182235] rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, windProgress)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {current.windSpeedMps >= 10
                  ? 'Breezy / strong gusts'
                  : current.windSpeedMps >= 5
                  ? 'Moderate surface breeze'
                  : 'Calm to light breeze'}
              </p>
            </div>
          </article>

          {/* 3. Wind Direction */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Wind Direction</span>
              <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {current.windDirectionLabel}
                {current.windDirectionDeg !== null
                  ? ` · ${Math.round(current.windDirectionDeg)}°`
                  : ''}
              </p>
              <div
                aria-hidden="true"
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#182235] flex items-center justify-center shrink-0"
              >
                <Navigation
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-500"
                  style={{
                    transform: `rotate(${current.windDirectionDeg ?? 0}deg)`,
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Meteorological wind bearing
            </p>
          </article>

          {/* 4. Atmospheric Pressure */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Atmospheric Pressure</span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {current.pressureHpa} hPa
            </p>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#182235] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${pressureProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {current.pressureHpa >= 1018
                  ? 'High-pressure stability'
                  : current.pressureHpa <= 1005
                  ? 'Low-pressure trough'
                  : 'Normal sea-level range'}
              </p>
            </div>
          </article>

          {/* 5. Visibility */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Visibility</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {current.visibilityKm !== null ? `${current.visibilityKm} km` : 'N/A'}
            </p>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#182235] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${visibilityProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {current.visibilityKm !== null && current.visibilityKm >= 8
                  ? 'Clear horizontal sightline'
                  : current.visibilityKm !== null && current.visibilityKm < 3
                  ? 'Reduced visibility'
                  : 'Moderate horizontal range'}
              </p>
            </div>
          </article>

          {/* 6. UV Index */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">UV Index</span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {current.uvIndex !== null ? `${current.uvIndex}` : 'Not supplied'}
            </p>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#182235] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${uvProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {current.uvIndex !== null
                  ? current.uvIndex >= 6
                    ? 'High UV · SPF 30+ advised'
                    : current.uvIndex >= 3
                    ? 'Moderate UV exposure'
                    : 'Low UV exposure'
                  : 'Requires One Call UV feed'}
              </p>
            </div>
          </article>

          {/* 7. Cloud Coverage */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Cloud Coverage</span>
              <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#182235] flex items-center justify-center">
                <Cloud className="w-4 h-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {current.cloudCoveragePct !== null ? `${current.cloudCoveragePct}%` : 'N/A'}
            </p>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#182235] rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-500 dark:bg-slate-400 rounded-full transition-all duration-500"
                  style={{ width: `${current.cloudCoveragePct ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total sky cloud fraction
              </p>
            </div>
          </article>

          {/* 8. Dew Point */}
          <article className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Dew Point</span>
              <span className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {current.dewPointC !== null
                ? formatTemperature(current.dewPointC, unit)
                : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {current.dewPointC !== null && current.dewPointC >= 20
                ? 'Muggy condensation level'
                : current.dewPointC !== null && current.dewPointC >= 12
                ? 'Comfortable moisture point'
                : 'Crisp condensation level'}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
