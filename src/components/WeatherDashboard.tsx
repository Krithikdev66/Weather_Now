import { useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { generateWeatherInsights } from '../utils/weatherInsights';
import type {
  LocationSuggestion,
  TemperatureUnit,
  WeatherDashboardBundle,
} from '../utils/weatherLogic';
import { AirQualitySection } from './AirQualitySection';
import { CurrentWeatherHero } from './CurrentWeatherHero';
import { ForecastSections } from './ForecastSections';
import { LocationSearch } from './LocationSearch';
import { WeatherAlertsSection } from './WeatherAlertsSection';
import { WeatherInsightsSection } from './WeatherInsightsSection';

interface WeatherDashboardProps {
  bundle: WeatherDashboardBundle | null;
  loading: boolean;
  error: string | null;
  unit: TemperatureUnit;
  activeCityLabel: string;
  onUnitChange: (unit: TemperatureUnit) => void;
  onSelectLocation: (suggestion: LocationSuggestion) => void;
  onSubmitQuery: (query: string) => void;
}

export function WeatherDashboard({
  bundle,
  loading,
  error,
  unit,
  activeCityLabel,
  onUnitChange,
  onSelectLocation,
  onSubmitQuery,
}: WeatherDashboardProps) {
  const insights = useMemo(() => {
    if (!bundle) return [];
    return generateWeatherInsights(
      bundle.current,
      bundle.airQuality,
      bundle.hourly,
      bundle.daily,
      unit
    );
  }, [bundle, unit]);

  return (
    <div id="dashboard" className="scroll-mt-24 space-y-7">
      {/* Location search with autocomplete, recent searches, popular cities & unit switch */}
      <LocationSearch
        activeCityLabel={activeCityLabel}
        loading={loading}
        unit={unit}
        onUnitChange={onUnitChange}
        onSelectLocation={onSelectLocation}
        onSubmitQuery={onSubmitQuery}
      />

      {/* Friendly Error Banner */}
      {error && (
        <div
          role="alert"
          className="bg-red-50/95 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-2xl p-5 flex items-start gap-3.5 text-red-900 dark:text-red-100"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Could not load weather data</h2>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Initial Loading State */}
      {loading && !bundle && (
        <div
          aria-busy="true"
          className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 min-h-[280px]"
        >
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading live weather, forecast, and air quality data...
          </p>
        </div>
      )}

      {/* Main Dashboard Sections */}
      {bundle && (
        <div
          className={`space-y-7 transition-opacity duration-200 ${
            loading ? 'opacity-65' : 'opacity-100'
          }`}
        >
          <CurrentWeatherHero current={bundle.current} unit={unit} />
          <AirQualitySection airQuality={bundle.airQuality} />
          <ForecastSections
            hourly={bundle.hourly}
            daily={bundle.daily}
            dailySourceNote={bundle.dailySourceNote}
            unit={unit}
          />
          <WeatherInsightsSection insights={insights} />
          <WeatherAlertsSection
            alerts={bundle.alerts}
            alertsNote={bundle.alertsNote}
          />
        </div>
      )}
    </div>
  );
}
