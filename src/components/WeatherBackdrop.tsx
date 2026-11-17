import type { WeatherCategory } from '../utils/weatherLogic';

interface WeatherBackdropProps {
  category?: WeatherCategory;
}

interface FloatingEmojiItem {
  top: string;
  left?: string;
  right?: string;
  sizeClass: string;
  opacityClass: string;
  rotateClass: string;
  animClass: string;
}

const CATEGORY_TINTS: Record<WeatherCategory, string> = {
  sunny:
    'bg-[radial-gradient(ellipse_75%_45%_at_15%_0%,rgba(56,189,248,0.16),transparent_70%),radial-gradient(ellipse_60%_40%_at_90%_10%,rgba(251,191,36,0.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_75%_45%_at_15%_0%,rgba(59,130,246,0.18),transparent_70%),radial-gradient(ellipse_60%_40%_at_90%_10%,rgba(245,158,11,0.12),transparent_70%)]',
  cloudy:
    'bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(100,116,139,0.14),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(59,130,246,0.10),transparent_70%)] dark:bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(59,130,246,0.16),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(99,102,241,0.12),transparent_70%)]',
  rainy:
    'bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(37,99,235,0.14),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_12%,rgba(14,165,233,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(37,99,235,0.22),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_12%,rgba(14,165,233,0.14),transparent_70%)]',
  snowy:
    'bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(125,211,252,0.18),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(191,219,254,0.16),transparent_70%)] dark:bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(96,165,250,0.18),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(186,230,253,0.10),transparent_70%)]',
  stormy:
    'bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(67,56,202,0.14),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(71,85,105,0.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(99,102,241,0.22),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(168,85,247,0.12),transparent_70%)]',
  misty:
    'bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(148,163,184,0.16),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(14,165,233,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_75%_45%_at_20%_0%,rgba(148,163,184,0.14),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_10%,rgba(59,130,246,0.10),transparent_70%)]',
};

const CATEGORY_EMOJI_SETS: Record<WeatherCategory, string[]> = {
  sunny: ['☀️', '🌤️', '⛅', '🌈', '🌻', '☀️', '🌤️', '💨', '☀️', '🌤️', '🌈', '⛅'],
  cloudy: ['⛅', '☁️', '🌤️', '💨', '🌥️', '☁️', '⛅', '🌦️', '☁️', '💨', '🌤️', '🌥️'],
  rainy: ['🌧️', '☔', '🌦️', '💧', '☁️', '🌧️', '💧', '⛈️', '🌦️', '☔', '🌧️', '💧'],
  snowy: ['❄️', '🌨️', '☃️', '🌬️', '❄️', '☁️', '🌨️', '❄️', '🌬️', '☃️', '❄️', '🌨️'],
  stormy: ['⛈️', '⚡', '🌧️', '🌩️', '💨', '⛈️', '☁️', '⚡', '🌧️', '🌩️', '⛈️', '💨'],
  misty: ['🌫️', '☁️', '🌬️', '🌥️', '💧', '🌫️', '☁️', '💨', '🌫️', '🌥️', '💧', '☁️'],
};

const EMOJI_SLOTS: FloatingEmojiItem[] = [
  {
    top: '6%',
    left: '3%',
    sizeClass: 'text-4xl sm:text-5xl',
    opacityClass: 'opacity-20 dark:opacity-25',
    rotateClass: '-rotate-12',
    animClass: 'weather-float-slow',
  },
  {
    top: '9%',
    right: '4%',
    sizeClass: 'text-5xl sm:text-6xl',
    opacityClass: 'opacity-20 dark:opacity-25',
    rotateClass: 'rotate-12',
    animClass: 'weather-float-medium',
  },
  {
    top: '22%',
    left: '1.5%',
    sizeClass: 'text-3xl sm:text-4xl',
    opacityClass: 'opacity-15 dark:opacity-20',
    rotateClass: 'rotate-6',
    animClass: 'weather-float-medium',
  },
  {
    top: '27%',
    right: '2.5%',
    sizeClass: 'text-4xl sm:text-5xl',
    opacityClass: 'opacity-20 dark:opacity-25',
    rotateClass: '-rotate-6',
    animClass: 'weather-float-slow',
  },
  {
    top: '42%',
    left: '3.5%',
    sizeClass: 'text-5xl',
    opacityClass: 'opacity-15 dark:opacity-20',
    rotateClass: '-rotate-12',
    animClass: 'weather-float-slow',
  },
  {
    top: '46%',
    right: '3%',
    sizeClass: 'text-3xl sm:text-4xl',
    opacityClass: 'opacity-20 dark:opacity-25',
    rotateClass: 'rotate-12',
    animClass: 'weather-float-medium',
  },
  {
    top: '61%',
    left: '2%',
    sizeClass: 'text-3xl sm:text-4xl',
    opacityClass: 'opacity-20 dark:opacity-25',
    rotateClass: 'rotate-12',
    animClass: 'weather-float-medium',
  },
  {
    top: '64%',
    right: '4%',
    sizeClass: 'text-5xl',
    opacityClass: 'opacity-15 dark:opacity-20',
    rotateClass: '-rotate-6',
    animClass: 'weather-float-slow',
  },
  {
    top: '79%',
    left: '4%',
    sizeClass: 'text-4xl sm:text-5xl',
    opacityClass: 'opacity-15 dark:opacity-20',
    rotateClass: '-rotate-6',
    animClass: 'weather-float-slow',
  },
  {
    top: '82%',
    right: '2.5%',
    sizeClass: 'text-3xl sm:text-4xl',
    opacityClass: 'opacity-20 dark:opacity-25',
    rotateClass: 'rotate-12',
    animClass: 'weather-float-medium',
  },
  {
    top: '15%',
    left: '18%',
    sizeClass: 'text-3xl',
    opacityClass: 'opacity-12 dark:opacity-15',
    rotateClass: 'rotate-6',
    animClass: 'weather-float-slow',
  },
  {
    top: '91%',
    right: '16%',
    sizeClass: 'text-4xl',
    opacityClass: 'opacity-15 dark:opacity-20',
    rotateClass: '-rotate-12',
    animClass: 'weather-float-medium',
  },
];

export function WeatherBackdrop({ category = 'cloudy' }: WeatherBackdropProps) {
  const emojis = CATEGORY_EMOJI_SETS[category] ?? CATEGORY_EMOJI_SETS.cloudy;
  const tintClass = CATEGORY_TINTS[category] ?? CATEGORY_TINTS.cloudy;

  return (
    <div
      aria-hidden="true"
      data-testid="weather-emoji-backdrop"
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
    >
      {/* Atmospheric Sky Wash */}
      <div className={`absolute inset-0 transition-all duration-700 ${tintClass}`} />

      {/* Subtle Ambient Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(148, 163, 184, 0.25) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient Weather Emojis Layer */}
      {EMOJI_SLOTS.map((slot, index) => (
        <span
          key={index}
          style={{
            top: slot.top,
            left: slot.left,
            right: slot.right,
            animationDelay: `${(index % 5) * -1.4}s`,
          }}
          className={`absolute leading-none filter drop-shadow-xs ${slot.sizeClass} ${slot.opacityClass} ${slot.rotateClass} ${slot.animClass}`}
        >
          {emojis[index % emojis.length]}
        </span>
      ))}
    </div>
  );
}
