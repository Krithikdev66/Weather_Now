import { useCallback, useEffect, useState } from 'react';
import { MapPin, Moon, Sun } from 'lucide-react';
import { WeatherBackdrop } from './components/WeatherBackdrop';
import { WeatherDashboard } from './components/WeatherDashboard';
import {
  validateCityInput,
  type LocationSuggestion,
  type TemperatureUnit,
  type WeatherDashboardBundle,
} from './utils/weatherLogic';

type ThemeMode = 'light' | 'dark';
type NavSectionId = 'dashboard' | 'air-quality' | 'forecast' | 'weather-insights';

const NAV_ITEMS: Array<{ id: NavSectionId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'air-quality', label: 'Air Quality' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'weather-insights', label: 'Weather Insights' },
];

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('weathernow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage read errors
  }
  return 'light';
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [activeNav, setActiveNav] = useState<NavSectionId>('dashboard');
  const [unit, setUnit] = useState<TemperatureUnit>('C');
  const [activeCityLabel, setActiveCityLabel] = useState<string>('London');
  const [bundle, setBundle] = useState<WeatherDashboardBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('weathernow_theme', theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 140;
      let current: NavSectionId = 'dashboard';
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollY) {
          current = item.id;
        }
      }
      setActiveNav(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadWeather = useCallback(
    async (target: { city?: string; suggestion?: LocationSuggestion }) => {
      const url = new URL('/api/weather', window.location.origin);

      if (target.suggestion) {
        const s = target.suggestion;
        url.searchParams.set('lat', String(s.lat));
        url.searchParams.set('lon', String(s.lon));
        url.searchParams.set('name', s.name);
        if (s.state) url.searchParams.set('state', s.state);
        if (s.country) url.searchParams.set('country', s.country);
        if (s.countryCode) url.searchParams.set('countryCode', s.countryCode);
        if (s.timezone) url.searchParams.set('timezone', s.timezone);
        setActiveCityLabel([s.name, s.state, s.country].filter(Boolean).join(', '));
      } else {
        const validation = validateCityInput(target.city ?? '');
        if (!validation.valid) {
          setError(validation.error || 'Please enter a valid city name.');
          setLoading(false);
          return;
        }
        url.searchParams.set('city', validation.city);
        setActiveCityLabel(validation.city);
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(url.pathname + url.search);
        const payload = await res.json();

        if (!res.ok) {
          setError(payload.error || 'Unable to load weather data for this location.');
          setLoading(false);
          return;
        }

        const weatherBundle = payload as WeatherDashboardBundle;
        setBundle(weatherBundle);
        const resolvedLabel = [
          weatherBundle.current.city,
          weatherBundle.current.state,
          weatherBundle.current.country,
        ]
          .filter(Boolean)
          .join(', ');
        setActiveCityLabel(resolvedLabel);
      } catch {
        setError(
          'Network connection error. Please check your internet connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadWeather({ city: 'London' });
  }, [loadWeather]);

  const scrollToSection = (id: NavSectionId) => {
    setActiveNav(id);
    if (id === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#F5F7FB] dark:bg-[#080D18] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      <WeatherBackdrop category={bundle?.current.category} />

      {/* Floating Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 pt-3">
        <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 rounded-2xl bg-white/85 dark:bg-[#111827]/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/90 shadow-[0_8px_30px_-14px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.65)] flex items-center justify-between gap-4 sm:gap-8">
          {/* Left: Brand */}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('dashboard');
            }}
            className="flex items-center gap-2.5 text-base sm:text-lg font-display font-bold tracking-tight text-[#111827] dark:text-[#F8FAFC] whitespace-nowrap shrink-0"
          >
            <img
              src="/src/assets/images/weathernow_logo_1794909639431.jpg"
              alt="WeatherNow logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-700"
            />
            <span>WeatherNow</span>
          </a>

          {/* Center: Section Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id);
                  }}
                  className={`relative py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#2563EB] dark:text-[#60A5FA] font-semibold'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-[#2563EB] dark:bg-[#60A5FA] transition-all duration-200 ${
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Right: Location Indicator + Light/Dark Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                scrollToSection('dashboard');
                const input = document.getElementById('city-search-input');
                input?.focus();
              }}
              aria-label={`Active location: ${activeCityLabel}. Focus city search`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-[#182235] border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-[#111827] dark:text-[#F8FAFC] hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 max-w-[170px]"
            >
              <MapPin
                className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA] shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">
                {bundle?.current.city || activeCityLabel.split(',')[0]}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              data-testid="theme-toggle"
              className="h-9 px-3 rounded-xl bg-slate-100/90 dark:bg-[#182235] border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-[#111827] dark:text-[#F8FAFC] hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-9">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight text-balance">
            Live City Weather
          </h1>
          <p className="text-sm sm:text-[15px] text-[#64748B] dark:text-[#94A3B8] mt-1.5 max-w-2xl leading-relaxed">
            Real-time meteorological telemetry, 1–5 air quality monitoring, hourly &amp; weekly forecasts, and weather intelligence.
          </p>
        </div>

        <WeatherDashboard
          bundle={bundle}
          loading={loading}
          error={error}
          unit={unit}
          activeCityLabel={activeCityLabel}
          onUnitChange={setUnit}
          onSelectLocation={(suggestion) => loadWeather({ suggestion })}
          onSubmitQuery={(city) => loadWeather({ city })}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <span>WeatherNow · Live Weather &amp; Air Quality Intelligence</span>
          <span>Real-time forecasts &amp; 1–5 AQI monitoring</span>
        </div>
      </footer>
    </div>
  );
}
