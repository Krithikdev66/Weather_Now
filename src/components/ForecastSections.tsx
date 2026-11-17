import { CalendarDays, Clock, Droplets, Wind } from 'lucide-react';
import {
  formatTemperature,
  formatWindSpeed,
  type DailyForecastItem,
  type HourlyForecastItem,
  type TemperatureUnit,
} from '../utils/weatherLogic';
import { WeatherConditionIcon } from './WeatherIcons';

interface ForecastSectionsProps {
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  dailySourceNote?: string;
  unit: TemperatureUnit;
}

export function ForecastSections({
  hourly,
  daily,
  dailySourceNote,
  unit,
}: ForecastSectionsProps) {
  const allMins = daily.map((d) => d.tempMinC);
  const allMaxs = daily.map((d) => d.tempMaxC);
  const weekMin = allMins.length > 0 ? Math.min(...allMins) : 0;
  const weekMax = allMaxs.length > 0 ? Math.max(...allMaxs) : 1;
  const weekSpan = Math.max(1, weekMax - weekMin);

  return (
    <div id="forecast" className="scroll-mt-24 space-y-6">
      {/* 24-Hour Horizontal Scrolling Forecast */}
      <section
        aria-label="Next 24 hours forecast"
        data-testid="hourly-forecast-section"
        className="weather-fade-up bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_28px_-14px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Hourly Forecast (Next 24 Hours)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Scroll horizontally for upcoming hours
          </span>
        </div>

        {hourly.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hourly forecast data is unavailable for this location.
          </p>
        ) : (
          <div className="hourly-scroll flex gap-3 overflow-x-auto pb-2 snap-x">
            {hourly.map((slot, index) => {
              const isCurrentHour = index === 0;
              return (
                <div
                  key={slot.timeIso}
                  className={`min-w-[136px] shrink-0 snap-start rounded-xl p-4 flex flex-col items-center text-center gap-2 border transition-all duration-200 hover:-translate-y-0.5 ${
                    isCurrentHour
                      ? 'bg-blue-50/90 dark:bg-blue-950/45 border-blue-300 dark:border-blue-600/70 shadow-xs'
                      : 'bg-slate-50/90 dark:bg-[#182235] border-slate-200/80 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold whitespace-nowrap tabular-nums ${
                      isCurrentHour
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isCurrentHour ? `Now · ${slot.timeLabel}` : slot.timeLabel}
                  </span>
                  <WeatherConditionIcon
                    category={slot.category}
                    className="w-10 h-10"
                  />
                  <p className="font-display text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatTemperature(slot.tempC, unit)}
                  </p>
                  <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                    {slot.condition}
                  </span>
                  <div className="w-full pt-2 border-t border-slate-200/70 dark:border-slate-700/70 space-y-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {slot.rainProbabilityPct !== null && (
                      <div className="flex items-center justify-center gap-1 text-blue-700 dark:text-blue-400 font-medium">
                        <Droplets className="w-3 h-3" aria-hidden="true" />
                        <span>{slot.rainProbabilityPct}% rain</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                      <Wind className="w-3 h-3" aria-hidden="true" />
                      <span>{formatWindSpeed(slot.windSpeedMps, unit)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7-Day Weekly Forecast */}
      <section
        aria-label="7-day weather forecast"
        data-testid="daily-forecast-section"
        className="weather-fade-up bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_28px_-14px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] rounded-2xl p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {daily.length >= 7 ? '7-Day Weather Forecast' : `${daily.length}-Day Weather Forecast`}
            </h2>
          </div>
          {dailySourceNote && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{dailySourceNote}</p>
          )}
        </div>

        {daily.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Extended daily forecast data is unavailable for this location.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {daily.map((day) => {
              const leftPct = ((day.tempMinC - weekMin) / weekSpan) * 100;
              const widthPct = Math.max(
                10,
                ((day.tempMaxC - day.tempMinC) / weekSpan) * 100
              );

              return (
                <div
                  key={day.dateIso}
                  className="py-3.5 px-2 -mx-2 rounded-xl hover:bg-slate-50/90 dark:hover:bg-[#182235]/80 transition-colors grid grid-cols-12 items-center gap-3"
                >
                  <div className="col-span-4 sm:col-span-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {day.dayLabel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{day.dateLabel}</p>
                  </div>

                  <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5 min-w-0">
                    <WeatherConditionIcon
                      category={day.category}
                      className="w-8 h-8 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                        {day.description}
                      </p>
                      {day.rainProbabilityPct !== null && (
                        <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium tabular-nums">
                          {day.rainProbabilityPct}% rain chance
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-4 sm:col-span-6 flex items-center justify-end gap-3 tabular-nums">
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 w-12 text-right">
                      {formatTemperature(day.tempMinC, unit)}
                    </span>
                    <div className="hidden sm:block flex-1 max-w-[180px] h-2 bg-slate-100 dark:bg-[#182235] rounded-full relative overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 dark:from-sky-400 dark:to-blue-500"
                        style={{
                          left: `${Math.min(88, Math.max(0, leftPct))}%`,
                          width: `${Math.min(100 - leftPct, widthPct)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white w-12 text-right">
                      {formatTemperature(day.tempMaxC, unit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
