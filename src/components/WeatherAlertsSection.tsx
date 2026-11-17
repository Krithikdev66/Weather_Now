import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Flame,
  Wind,
  Zap,
} from 'lucide-react';
import type { WeatherAlertItem } from '../utils/weatherLogic';

interface WeatherAlertsSectionProps {
  alerts: WeatherAlertItem[];
  alertsNote: string;
}

function getAlertVisuals(eventName: string) {
  const lower = eventName.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm') || lower.includes('lightning')) {
    return {
      icon: Zap,
      cardClass:
        'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100',
      iconClass: 'text-indigo-600 dark:text-indigo-400',
      subClass: 'text-indigo-800 dark:text-indigo-300',
    };
  }
  if (lower.includes('rain') || lower.includes('flood')) {
    return {
      icon: CloudRain,
      cardClass:
        'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100',
      iconClass: 'text-blue-600 dark:text-blue-400',
      subClass: 'text-blue-800 dark:text-blue-300',
    };
  }
  if (lower.includes('heat') || lower.includes('fire') || lower.includes('warm')) {
    return {
      icon: Flame,
      cardClass:
        'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-950 dark:text-red-100',
      iconClass: 'text-red-600 dark:text-red-400',
      subClass: 'text-red-800 dark:text-red-300',
    };
  }
  if (lower.includes('wind') || lower.includes('gale')) {
    return {
      icon: Wind,
      cardClass:
        'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
      iconClass: 'text-amber-600 dark:text-amber-400',
      subClass: 'text-amber-800 dark:text-amber-300',
    };
  }
  return {
    icon: AlertTriangle,
    cardClass:
      'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
    iconClass: 'text-amber-600 dark:text-amber-400',
    subClass: 'text-amber-800 dark:text-amber-300',
  };
}

export function WeatherAlertsSection({
  alerts,
  alertsNote,
}: WeatherAlertsSectionProps) {
  return (
    <section
      aria-label="Official Weather Alerts"
      data-testid="weather-alerts-section"
      className="weather-fade-up bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_28px_-14px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] rounded-2xl p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Weather Alerts
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">{alertsNote}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
          <CheckCircle2
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              No active severe weather warnings
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Verified official alerts are displayed automatically whenever issued by a meteorological authority.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const visuals = getAlertVisuals(alert.event);
            const Icon = visuals.icon;
            return (
              <div
                key={`${alert.event}-${idx}`}
                role="alert"
                className={`border rounded-xl p-4 flex items-start gap-3 ${visuals.cardClass}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 mt-0.5 ${visuals.iconClass}`}
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{alert.event}</h3>
                    {alert.severity && (
                      <span className={`text-xs font-medium ${visuals.subClass}`}>
                        · {alert.severity}
                      </span>
                    )}
                    <span className={`text-xs ${visuals.subClass}`}>· {alert.sender}</span>
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
