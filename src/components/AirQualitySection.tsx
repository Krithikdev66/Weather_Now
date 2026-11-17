import { Activity, Info, ShieldAlert } from 'lucide-react';
import type { AirQualityData, AqiLevel } from '../utils/weatherLogic';

interface AirQualitySectionProps {
  airQuality: AirQualityData | null;
}

const AQI_LEVEL_COLORS: Record<
  AqiLevel,
  {
    stroke: string;
    bar: string;
    text: string;
    surface: string;
  }
> = {
  1: {
    stroke: '#10b981',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    surface: 'bg-emerald-50/70 dark:bg-emerald-950/30',
  },
  2: {
    stroke: '#84cc16',
    bar: 'bg-lime-500',
    text: 'text-lime-700 dark:text-lime-400',
    surface: 'bg-lime-50/70 dark:bg-lime-950/30',
  },
  3: {
    stroke: '#f59e0b',
    bar: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    surface: 'bg-amber-50/70 dark:bg-amber-950/30',
  },
  4: {
    stroke: '#f97316',
    bar: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    surface: 'bg-orange-50/70 dark:bg-orange-950/30',
  },
  5: {
    stroke: '#dc2626',
    bar: 'bg-red-600',
    text: 'text-red-700 dark:text-red-400',
    surface: 'bg-red-50/70 dark:bg-red-950/30',
  },
};

const SCALE_SEGMENTS: Array<{ level: AqiLevel; label: string; color: string }> = [
  { level: 1, label: '1 · Good', color: 'bg-emerald-500' },
  { level: 2, label: '2 · Fair', color: 'bg-lime-500' },
  { level: 3, label: '3 · Moderate', color: 'bg-amber-500' },
  { level: 4, label: '4 · Poor', color: 'bg-orange-500' },
  { level: 5, label: '5 · Very Poor', color: 'bg-red-600' },
];

export function AirQualitySection({ airQuality }: AirQualitySectionProps) {
  if (!airQuality) {
    return (
      <section
        id="air-quality"
        aria-label="Air Quality Index"
        className="scroll-mt-24 bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-6 space-y-2"
      >
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Air Quality Index (AQI)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Air pollution measurements are currently unavailable for this location.
        </p>
      </section>
    );
  }

  const style = AQI_LEVEL_COLORS[airQuality.aqi];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = airQuality.aqi / 5;
  const dashOffset = circumference * (1 - progressFraction);

  const pollutantCards = [
    {
      label: 'PM2.5',
      full: 'Fine Particulates',
      value: airQuality.pollutants.pm2_5,
      refMax: 75,
    },
    {
      label: 'PM10',
      full: 'Coarse Particulates',
      value: airQuality.pollutants.pm10,
      refMax: 200,
    },
    {
      label: 'O₃',
      full: 'Ozone',
      value: airQuality.pollutants.o3,
      refMax: 180,
    },
    {
      label: 'NO₂',
      full: 'Nitrogen Dioxide',
      value: airQuality.pollutants.no2,
      refMax: 200,
    },
    {
      label: 'SO₂',
      full: 'Sulfur Dioxide',
      value: airQuality.pollutants.so2,
      refMax: 350,
    },
    {
      label: 'CO',
      full: 'Carbon Monoxide',
      value: airQuality.pollutants.co,
      refMax: 15400,
    },
  ];

  return (
    <section
      id="air-quality"
      aria-label="Air Quality Index"
      data-testid="aqi-section"
      className="weather-fade-up scroll-mt-24 bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_28px_-14px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] rounded-2xl p-6 sm:p-7 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        {/* Circular Animated AQI Gauge + Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 130 130"
              className="w-full h-full -rotate-90"
              role="img"
              aria-label={`Circular AQI gauge showing ${airQuality.aqi} out of 5 (${airQuality.category})`}
            >
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke={style.stroke}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                data-testid="aqi-score-label"
                className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none"
              >
                {airQuality.aqi}/5
              </span>
              <span className={`text-xs font-semibold mt-1 ${style.text}`}>
                {airQuality.category}
              </span>
            </div>
          </div>

          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Air Quality Index (AQI)
              </h2>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {airQuality.description}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>
                {airQuality.scaleNote} · Distinct from 0–500 US EPA AQI values.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Visual 5-Segment Scale Meter */}
      <div className="space-y-2">
        <div
          className="grid grid-cols-5 gap-2"
          role="meter"
          aria-label="OpenWeatherMap Air Quality Index scale 1 to 5"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={airQuality.aqi}
          aria-valuetext={`${airQuality.aqi} out of 5, ${airQuality.category}`}
        >
          {SCALE_SEGMENTS.map((seg) => {
            const isCurrent = seg.level === airQuality.aqi;
            return (
              <div key={seg.level} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all ${seg.color} ${
                    isCurrent
                      ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-[#111827] opacity-100'
                      : 'opacity-25 dark:opacity-30'
                  }`}
                />
                <p
                  className={`text-[11px] font-medium truncate ${
                    isCurrent
                      ? 'text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {seg.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Impact & Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className={`rounded-xl p-4 space-y-1 ${style.surface}`}>
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Health Impact</span>
          </h3>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {airQuality.healthImpact}
          </p>
        </div>
        <div className="rounded-xl p-4 space-y-1 bg-slate-50/90 dark:bg-[#182235]">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Recommended Action
          </h3>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {airQuality.recommendation}
          </p>
        </div>
      </div>

      {/* 6 Pollutants Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {pollutantCards.map((item) => {
          const pct = Math.min(100, Math.max(6, Math.round((item.value / item.refMax) * 100)));
          return (
            <div
              key={item.label}
              className="bg-slate-50/90 dark:bg-[#182235] border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-3.5 space-y-2"
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">µg/m³</span>
              </div>
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {item.value}
              </p>
              <div className="h-1 w-full bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.full}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
