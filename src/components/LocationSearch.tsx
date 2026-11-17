import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { History, Loader2, MapPin, Search } from 'lucide-react';
import type { LocationSuggestion, TemperatureUnit } from '../utils/weatherLogic';

interface LocationSearchProps {
  activeCityLabel: string;
  loading: boolean;
  unit: TemperatureUnit;
  onUnitChange: (unit: TemperatureUnit) => void;
  onSelectLocation: (suggestion: LocationSuggestion) => void;
  onSubmitQuery: (query: string) => void;
}

const POPULAR_CITIES = ['Mangaluru', 'London', 'Tokyo', 'New York', 'Bengaluru'];
const RECENT_STORAGE_KEY = 'weathernow_recent_searches';

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(cityName: string): string[] {
  const clean = cityName.trim();
  if (!clean) return loadRecentSearches();
  const existing = loadRecentSearches().filter(
    (item) => item.toLowerCase() !== clean.toLowerCase()
  );
  const next = [clean, ...existing].slice(0, 4);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota issues
  }
  return next;
}

export function LocationSearch({
  activeCityLabel,
  loading,
  unit,
  onUnitChange,
  onSelectLocation,
  onSubmitQuery,
}: LocationSearchProps) {
  const [query, setQuery] = useState(activeCityLabel);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const skipNextFetchRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    skipNextFetchRef.current = true;
    setQuery(activeCityLabel);
  }, [activeCityLabel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsFetchingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsFetchingSuggestions(true);
      try {
        const res = await fetch(
          `/api/locations?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = await res.json();
        const items: LocationSuggestion[] = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];
        setSuggestions(items);
        setIsOpen(items.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleChooseSuggestion = (item: LocationSuggestion) => {
    skipNextFetchRef.current = true;
    const label = [item.name, item.state, item.country].filter(Boolean).join(', ');
    setQuery(label);
    setSuggestions([]);
    setIsOpen(false);
    setRecentSearches(saveRecentSearch(item.name));
    onSelectLocation(item);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim().length >= 2) {
      setRecentSearches(saveRecentSearch(query.split(',')[0].trim()));
    }
    onSubmitQuery(query);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleChooseSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <section
      aria-label="City search and unit controls"
      className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_32px_-16px_rgba(15,23,42,0.10)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] rounded-2xl p-5 sm:p-6 transition-colors duration-200"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div ref={containerRef} className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="city-search-input"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2"
            >
              Search City or Location
            </label>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="city-search-input"
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isOpen}
                  aria-controls="location-suggestions-listbox"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setIsOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a city (e.g., Mangalore, Bengaluru, London, Tokyo)"
                  className="w-full h-11 pl-10 pr-10 bg-slate-50/90 dark:bg-[#182235] border border-slate-200/90 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-600/15 dark:focus:ring-blue-400/20 focus:border-blue-600 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-[#1e293b] transition-all duration-150"
                />
                {isFetchingSuggestions && (
                  <Loader2
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2"
                    aria-label="Loading suggestions"
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-60 text-white dark:text-slate-950 text-sm font-semibold rounded-xl shadow-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] active:translate-y-px"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Searching</span>
                  </>
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <ul
              id="location-suggestions-listbox"
              role="listbox"
              aria-label="Location suggestions"
              className="weather-fade-up absolute left-0 right-0 sm:right-24 mt-2 z-30 bg-white/95 dark:bg-[#182235]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800"
            >
              {suggestions.map((item, idx) => {
                const subLabel = [item.state, item.country]
                  .filter(Boolean)
                  .join(', ');
                const isActive = idx === highlightedIndex;
                return (
                  <li key={item.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => handleChooseSuggestion(item)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-50/90 dark:bg-blue-950/60'
                          : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <MapPin
                          className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                          {subLabel ? (
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {' '}
                              · {subLabel}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0 tabular-nums">
                        {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Temperature Unit Toggle */}
        <div className="flex flex-col items-start lg:items-end gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Temperature Unit
          </span>
          <div
            role="group"
            aria-label="Temperature unit selector"
            className="inline-flex items-center p-1 bg-slate-100/90 dark:bg-[#182235] border border-slate-200/80 dark:border-slate-700/80 rounded-xl"
          >
            <button
              type="button"
              onClick={() => onUnitChange('C')}
              aria-pressed={unit === 'C'}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                unit === 'C'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Celsius (°C)
            </button>
            <button
              type="button"
              onClick={() => onUnitChange('F')}
              aria-pressed={unit === 'F'}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                unit === 'F'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Fahrenheit (°F)
            </button>
          </div>
        </div>
      </div>

      {/* Popular & Recent Cities */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            Popular cities:
          </span>
          {POPULAR_CITIES.map((city) => {
            const isCurrent = activeCityLabel.toLowerCase().startsWith(city.toLowerCase());
            return (
              <button
                key={city}
                type="button"
                onClick={() => {
                  skipNextFetchRef.current = true;
                  setQuery(city);
                  setIsOpen(false);
                  setRecentSearches(saveRecentSearch(city));
                  onSubmitQuery(city);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'bg-slate-50/80 dark:bg-[#182235] border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>

        {recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <History className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Recent:</span>
            </span>
            {recentSearches.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  skipNextFetchRef.current = true;
                  setQuery(city);
                  setIsOpen(false);
                  onSubmitQuery(city);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100/80 dark:bg-[#182235] text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
