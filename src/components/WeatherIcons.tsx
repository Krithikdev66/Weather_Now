import type { WeatherCategory } from '../utils/weatherLogic';

interface WeatherIconProps {
  category: WeatherCategory;
  className?: string;
  animated?: boolean;
}

export function WeatherConditionIcon({
  category,
  className = 'w-20 h-20',
  animated = false,
}: WeatherIconProps) {
  switch (category) {
    case 'sunny':
      return (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-label="Sunny weather icon"
          className={className}
        >
          <circle cx="40" cy="40" r="16" fill="#F59E0B" />
          <g
            stroke="#FBBF24"
            strokeWidth="3.5"
            strokeLinecap="round"
            className={animated ? 'weather-sun-spin' : undefined}
          >
            <line x1="40" y1="8" x2="40" y2="16" />
            <line x1="40" y1="64" x2="40" y2="72" />
            <line x1="8" y1="40" x2="16" y2="40" />
            <line x1="64" y1="40" x2="72" y2="40" />
            <line x1="17.4" y1="17.4" x2="23" y2="23" />
            <line x1="57" y1="57" x2="62.6" y2="62.6" />
            <line x1="62.6" y1="17.4" x2="57" y2="23" />
            <line x1="23" y1="57" x2="17.4" y2="62.6" />
          </g>
        </svg>
      );

    case 'rainy':
      return (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-label="Rainy weather icon"
          className={className}
        >
          <path
            d="M24 46h33a11 11 0 0 0 1.4-21.9A15 15 0 0 0 29 21.5 12 12 0 0 0 24 46Z"
            fill="#CBD5E1"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <g
            stroke="#3B82F6"
            strokeWidth="3.5"
            strokeLinecap="round"
            className={animated ? 'weather-rain-fall' : undefined}
          >
            <line x1="28" y1="53" x2="24" y2="64" />
            <line x1="41" y1="53" x2="37" y2="64" />
            <line x1="54" y1="53" x2="50" y2="64" />
          </g>
        </svg>
      );

    case 'snowy':
      return (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-label="Snowy weather icon"
          className={className}
        >
          <path
            d="M24 44h33a11 11 0 0 0 1.4-21.9A15 15 0 0 0 29 19.5 12 12 0 0 0 24 44Z"
            fill="#E2E8F0"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <g fill="#38BDF8" className={animated ? 'weather-rain-fall' : undefined}>
            <circle cx="28" cy="56" r="3" />
            <circle cx="41" cy="60" r="3" />
            <circle cx="53" cy="55" r="3" />
            <circle cx="34" cy="67" r="2.5" />
            <circle cx="48" cy="67" r="2.5" />
          </g>
        </svg>
      );

    case 'stormy':
      return (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-label="Thunderstorm weather icon"
          className={className}
        >
          <path
            d="M24 44h33a11 11 0 0 0 1.4-21.9A15 15 0 0 0 29 19.5 12 12 0 0 0 24 44Z"
            fill="#94A3B8"
            stroke="#475569"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M42 46L33 59h7l-3 12 12-15h-7l4-10h-4Z"
            fill="#F59E0B"
            className={animated ? 'weather-float-medium' : undefined}
          />
        </svg>
      );

    case 'misty':
      return (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-label="Misty weather icon"
          className={className}
        >
          <path
            d="M24 38h33a10 10 0 0 0 1.2-19.9A14 14 0 0 0 30 16a11 11 0 0 0-6 22Z"
            fill="#CBD5E1"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <g
            stroke="#64748B"
            strokeWidth="3.5"
            strokeLinecap="round"
            className={animated ? 'weather-float-medium' : undefined}
          >
            <line x1="18" y1="49" x2="62" y2="49" />
            <line x1="22" y1="58" x2="56" y2="58" />
            <line x1="28" y1="67" x2="52" y2="67" />
          </g>
        </svg>
      );

    case 'cloudy':
    default:
      return (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-label="Cloudy weather icon"
          className={className}
        >
          <circle
            cx="52"
            cy="28"
            r="11"
            fill="#F59E0B"
            className={animated ? 'weather-float-slow' : undefined}
          />
          <path
            d="M22 54h35a11 11 0 0 0 1.4-21.9A15 15 0 0 0 29 29.5 12 12 0 0 0 22 54Z"
            fill="#E2E8F0"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
