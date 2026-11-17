import {
  Activity,
  Car,
  Clock,
  HeartPulse,
  Shirt,
  Sun,
  Umbrella,
} from 'lucide-react';
import type { WeatherInsightCard } from '../utils/weatherInsights';

interface WeatherInsightsSectionProps {
  insights: WeatherInsightCard[];
}

const CARD_ICONS: Record<WeatherInsightCard['id'], typeof Activity> = {
  outdoor: Activity,
  clothing: Shirt,
  health: HeartPulse,
  travel: Car,
  umbrella: Umbrella,
  'best-time': Clock,
  sunscreen: Sun,
};

const TONE_TEXT: Record<WeatherInsightCard['tone'], string> = {
  positive: 'text-emerald-700 dark:text-emerald-400',
  caution: 'text-amber-700 dark:text-amber-400',
  warning: 'text-red-700 dark:text-red-400',
};

export function WeatherInsightsSection({ insights }: WeatherInsightsSectionProps) {
  return (
    <section
      id="weather-insights"
      aria-label="Your Weather Intelligence"
      data-testid="weather-insights-section"
      className="scroll-mt-24 space-y-4"
    >
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Your Weather Intelligence
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Dynamic activity, clothing, health, travel, umbrella, timing, and UV recommendations derived from live conditions and forecast data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {insights.map((card, index) => {
          const Icon = CARD_ICONS[card.id];
          // 4 cards on first/second row? Better: 3 cards (col-span-2) on row 1, 2 cards (col-span-3) on row 2, 2 cards (col-span-3) on row 3 -> perfect symmetry for 7 cards!
          const spanClass =
            index < 3
              ? 'lg:col-span-2'
              : 'lg:col-span-3';

          return (
            <article
              key={card.id}
              className={`weather-fade-up bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl p-6 space-y-3 flex flex-col ${spanClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {card.title}
                  </h3>
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap shrink-0 ${
                    TONE_TEXT[card.tone]
                  }`}
                >
                  {card.statusLabel}
                </span>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                {card.summary}
              </p>

              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400 list-disc pl-4">
                {card.bullets.map((bullet, i) => (
                  <li key={i} className="leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
