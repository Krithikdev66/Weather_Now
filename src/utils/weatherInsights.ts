import {
  formatTemperature,
  type AirQualityData,
  type CurrentWeather,
  type DailyForecastItem,
  type HourlyForecastItem,
  type TemperatureUnit,
} from './weatherLogic';

export interface WeatherInsightCard {
  id:
    | 'outdoor'
    | 'clothing'
    | 'health'
    | 'travel'
    | 'umbrella'
    | 'best-time'
    | 'sunscreen';
  title: string;
  statusLabel: string;
  tone: 'positive' | 'caution' | 'warning';
  summary: string;
  bullets: string[];
}

export function generateWeatherInsights(
  current: CurrentWeather,
  airQuality: AirQualityData | null,
  hourly: HourlyForecastItem[],
  daily: DailyForecastItem[],
  unit: TemperatureUnit = 'C'
): WeatherInsightCard[] {
  const aqiLevel = airQuality?.aqi ?? 1;
  const isRainingNow = current.category === 'rainy' || current.category === 'stormy';
  const isSnowingNow = current.category === 'snowy';
  const maxRainNext12h = hourly
    .slice(0, 12)
    .reduce((max, h) => Math.max(max, h.rainProbabilityPct ?? 0), 0);
  const peakRainPct = Math.max(maxRainNext12h, daily[0]?.rainProbabilityPct ?? 0);
  const rainLikelyToday = isRainingNow || peakRainPct >= 40;

  // 1. Outdoor Activities
  let outdoorTone: WeatherInsightCard['tone'] = 'positive';
  let outdoorStatus = 'Favorable';
  let outdoorSummary = 'Comfortable outdoor conditions for walking, running, and sports.';
  const outdoorBullets: string[] = [];

  if (current.category === 'stormy' || current.windSpeedMps >= 12) {
    outdoorTone = 'warning';
    outdoorStatus = 'Not Recommended';
    outdoorSummary = 'Unfavorable outdoor weather due to storms or high winds.';
    outdoorBullets.push('Postpone open-field sports and trail runs until severe weather clears.');
  } else if (aqiLevel >= 4) {
    outdoorTone = 'warning';
    outdoorStatus = 'Limit Exertion';
    outdoorSummary = `Air quality is ${airQuality?.category} (AQI ${aqiLevel}/5); avoid strenuous outdoor workouts.`;
    outdoorBullets.push('Shift running or high-intensity cardio indoors today.');
  } else if (isRainingNow || isSnowingNow || current.tempC >= 35 || current.tempC <= 2) {
    outdoorTone = 'caution';
    outdoorStatus = 'Moderate Caution';
    outdoorSummary = isRainingNow
      ? 'Wet conditions expected; short walks are fine with waterproof gear.'
      : current.tempC >= 35
      ? 'High heat makes midday outdoor sports taxing; aim for cooler hours.'
      : 'Cold temperatures call for shorter outdoor sessions and warm-up layers.';
    outdoorBullets.push('Choose sheltered paths or adjust intensity to match current conditions.');
  } else {
    outdoorBullets.push(
      `Temperature (${formatTemperature(current.tempC, unit)}) and wind (${current.windSpeedMps} m/s) support brisk walking, jogging, and outdoor sports.`
    );
    if (aqiLevel <= 2) {
      outdoorBullets.push('Clean air quality makes extended outdoor exercise comfortable.');
    }
  }

  // 2. Clothing Suggestions
  const clothingBullets: string[] = [];
  let clothingStatus = 'Standard Layers';
  let clothingTone: WeatherInsightCard['tone'] = 'positive';

  if (current.tempC >= 28) {
    clothingStatus = 'Light & Breathable';
    clothingBullets.push('Wear lightweight cotton, linen, or moisture-wicking fabrics.');
    clothingBullets.push('Light-colored clothing and a breathable cap help reduce heat absorption.');
  } else if (current.tempC >= 18) {
    clothingStatus = 'Comfortable Casual';
    clothingBullets.push('Short sleeves or a light long-sleeve shirt work well.');
    if (current.tempMinC < 15) {
      clothingBullets.push(
        `Bring a light overshirt for cooler evening lows around ${formatTemperature(current.tempMinC, unit)}.`
      );
    }
  } else if (current.tempC >= 10) {
    clothingStatus = 'Light Jacket';
    clothingTone = 'caution';
    clothingBullets.push('Layer a light jacket, hoodie, or sweater over a breathable base.');
  } else {
    clothingStatus = 'Warm Winter Layers';
    clothingTone = 'caution';
    clothingBullets.push('Wear an insulated coat, thermal base layer, and warm footwear.');
    if (current.windSpeedMps >= 6) {
      clothingBullets.push('A windproof outer layer is recommended due to noticeable breeze.');
    }
  }

  if (rainLikelyToday) {
    clothingBullets.push('Choose water-resistant outerwear and quick-dry footwear.');
  }

  const clothingSummary =
    current.tempC >= 28
      ? 'Hot weather calls for light, breathable attire.'
      : current.tempC < 12
      ? 'Chilly temperatures require insulated outerwear.'
      : 'Mild temperatures suit comfortable layered clothing.';

  // 3. Health Precautions
  const healthBullets: string[] = [];
  let healthTone: WeatherInsightCard['tone'] = 'positive';
  let healthStatus = 'Low Risk';

  if (airQuality) {
    if (airQuality.aqi >= 4) {
      healthTone = 'warning';
      healthStatus = `AQI ${airQuality.aqi}/5 (${airQuality.category})`;
      healthBullets.push(
        `Elevated PM2.5 (${airQuality.pollutants.pm2_5} µg/m³): limit outdoor exposure and wear a protective mask if commuting.`
      );
    } else if (airQuality.aqi === 3) {
      healthTone = 'caution';
      healthStatus = 'Moderate Air Quality';
      healthBullets.push(
        'Sensitive individuals (asthma or allergies) should avoid heavy traffic corridors.'
      );
    } else {
      healthBullets.push(
        `Air quality is ${airQuality.category} (AQI ${airQuality.aqi}/5), supporting healthy respiratory comfort.`
      );
    }
  }

  if (current.tempC >= 30 || current.feelsLikeC >= 32) {
    if (healthTone === 'positive') healthTone = 'caution';
    healthStatus = healthTone === 'warning' ? healthStatus : 'Hydration Alert';
    healthBullets.push(
      `Feels like ${formatTemperature(current.feelsLikeC, unit)}: drink water regularly and take shaded breaks.`
    );
  } else if (current.humidity >= 85) {
    healthBullets.push(
      `High humidity (${current.humidity}%) slows sweat evaporation; stay hydrated during activity.`
    );
  } else {
    healthBullets.push('Maintain steady hydration throughout the day.');
  }

  const healthSummary =
    healthTone === 'warning'
      ? 'Take respiratory and environmental precautions today.'
      : healthTone === 'caution'
      ? 'Stay mindful of hydration or sensitive-group air comfort.'
      : 'Conditions pose minimal environmental health stress.';

  // 4. Travel Conditions
  const travelBullets: string[] = [];
  let travelTone: WeatherInsightCard['tone'] = 'positive';
  let travelStatus = 'Smooth Travel';

  if (current.category === 'stormy' || (current.visibilityKm !== null && current.visibilityKm < 2)) {
    travelTone = 'warning';
    travelStatus = 'Travel Caution';
    if (current.visibilityKm !== null && current.visibilityKm < 2) {
      travelBullets.push(
        `Reduced visibility (${current.visibilityKm} km): use low-beam headlights and increase following distance.`
      );
    }
    if (current.category === 'stormy') {
      travelBullets.push('Stormy weather may cause road ponding or transit delays.');
    }
  } else if (rainLikelyToday || current.windSpeedMps >= 10 || isSnowingNow) {
    travelTone = 'caution';
    travelStatus = 'Allow Extra Time';
    if (rainLikelyToday) {
      travelBullets.push('Wet roads expected; allow extra braking distance and transit buffer.');
    }
    if (current.windSpeedMps >= 10) {
      travelBullets.push(
        `Strong winds (${current.windSpeedMps} m/s) can affect high-profile vehicles and cyclists.`
      );
    }
  } else {
    travelBullets.push(
      `Clear road visibility${
        current.visibilityKm !== null ? ` (${current.visibilityKm} km)` : ''
      } and steady surface winds support smooth commuting.`
    );
  }

  const travelSummary =
    travelTone === 'warning'
      ? 'Hazardous weather may impact driving and transit safety.'
      : travelTone === 'caution'
      ? 'Minor weather disruptions possible; plan extra travel margin.'
      : 'Favorable conditions for road, rail, and local travel.';

  // 5. Umbrella Recommendations
  const umbrellaTone: WeatherInsightCard['tone'] = isRainingNow
    ? 'warning'
    : peakRainPct >= 40
    ? 'caution'
    : 'positive';
  const umbrellaStatus = isRainingNow
    ? 'Umbrella Required'
    : peakRainPct >= 40
    ? 'Pack Umbrella'
    : 'Not Needed';
  const umbrellaSummary = isRainingNow
    ? 'Active rainfall detected; carry an umbrella whenever stepping outside.'
    : peakRainPct >= 40
    ? `Precipitation probability reaches ${peakRainPct}% in today’s outlook.`
    : 'Dry short-term outlook with minimal chance of showers.';
  const umbrellaBullets = [
    isRainingNow
      ? `Current condition is ${current.description}; keep rain protection handy.`
      : peakRainPct >= 40
      ? `A compact umbrella is advised for later hours (${peakRainPct}% peak rain chance).`
      : `Peak short-term rain probability is only ${peakRainPct}%.`,
  ];

  // 6. Best Time to Go Outside
  let bestTimeLabel = 'Morning or late afternoon';
  let bestSlotTone: WeatherInsightCard['tone'] = 'positive';
  let bestSlotStatus = 'Optimal Window';

  if (hourly.length > 0) {
    const scored = hourly.slice(0, 16).map((slot) => {
      const rainPenalty = (slot.rainProbabilityPct ?? 0) * 1.5;
      const tempPenalty = Math.abs(slot.tempC - 22) * 2;
      const windPenalty = slot.windSpeedMps * 2;
      return { slot, score: rainPenalty + tempPenalty + windPenalty };
    });
    scored.sort((a, b) => a.score - b.score);
    const top = scored[0].slot;
    bestTimeLabel = `Around ${top.timeLabel} (${formatTemperature(
      top.tempC,
      unit
    )}, ${top.description})`;
    if ((top.rainProbabilityPct ?? 0) >= 60 || top.category === 'stormy') {
      bestSlotTone = 'caution';
      bestSlotStatus = 'Brief Breaks Only';
    }
  }

  const bestTimeCard: WeatherInsightCard = {
    id: 'best-time',
    title: 'Best Time Outside',
    statusLabel: bestSlotStatus,
    tone: bestSlotTone,
    summary: `Most comfortable forecast slot: ${bestTimeLabel}.`,
    bullets: [
      `Planned outdoor errands or walks align best with ${bestTimeLabel}.`,
      `Daytime temperature range spans ${formatTemperature(current.tempMinC, unit)} to ${formatTemperature(current.tempMaxC, unit)}.`,
    ],
  };

  // 7. Sunscreen Recommendations based on UV index
  let sunscreenTone: WeatherInsightCard['tone'] = 'positive';
  let sunscreenStatus = 'Low UV';
  let sunscreenSummary = 'Minimal UV exposure expected under current sky conditions.';
  const sunscreenBullets: string[] = [];

  if (current.uvIndex !== null) {
    if (current.uvIndex >= 6) {
      sunscreenTone = 'warning';
      sunscreenStatus = `UV ${current.uvIndex} · High`;
      sunscreenSummary = 'Strong UV radiation; broad-spectrum sun protection is essential.';
      sunscreenBullets.push(
        `Apply SPF 30+ or SPF 50+ sunscreen every 2 hours when outdoors (UV Index ${current.uvIndex}).`
      );
      sunscreenBullets.push('Wear UV-blocking sunglasses and seek shade around solar noon.');
    } else if (current.uvIndex >= 3) {
      sunscreenTone = 'caution';
      sunscreenStatus = `UV ${current.uvIndex} · Moderate`;
      sunscreenSummary = 'Moderate UV levels call for sunscreen during midday errands.';
      sunscreenBullets.push(
        `Apply SPF 30+ sunscreen before extended sun exposure (UV Index ${current.uvIndex}).`
      );
    } else {
      sunscreenStatus = `UV ${current.uvIndex} · Low`;
      sunscreenBullets.push(
        `UV Index is low (${current.uvIndex}); standard daily moisturizer or sunglasses suffice.`
      );
    }
  } else if (current.category === 'sunny') {
    sunscreenTone = 'caution';
    sunscreenStatus = 'Sunny Skies';
    sunscreenSummary = 'Direct sunlight expected; protect exposed skin during midday hours.';
    sunscreenBullets.push(
      'Use SPF 30+ sunscreen and sunglasses between 10:00 AM and 4:00 PM under clear skies.'
    );
  } else {
    sunscreenStatus = 'Cloud Filtered';
    sunscreenBullets.push(
      'Cloud cover reduces peak glare, though light SPF remains helpful for long outdoor stays.'
    );
  }

  return [
    {
      id: 'outdoor',
      title: 'Outdoor Activities',
      statusLabel: outdoorStatus,
      tone: outdoorTone,
      summary: outdoorSummary,
      bullets: outdoorBullets,
    },
    {
      id: 'clothing',
      title: 'Clothing Suggestions',
      statusLabel: clothingStatus,
      tone: clothingTone,
      summary: clothingSummary,
      bullets: clothingBullets,
    },
    {
      id: 'health',
      title: 'Health Precautions',
      statusLabel: healthStatus,
      tone: healthTone,
      summary: healthSummary,
      bullets: healthBullets,
    },
    {
      id: 'travel',
      title: 'Travel Conditions',
      statusLabel: travelStatus,
      tone: travelTone,
      summary: travelSummary,
      bullets: travelBullets,
    },
    {
      id: 'umbrella',
      title: 'Umbrella Advice',
      statusLabel: umbrellaStatus,
      tone: umbrellaTone,
      summary: umbrellaSummary,
      bullets: umbrellaBullets,
    },
    bestTimeCard,
    {
      id: 'sunscreen',
      title: 'Sunscreen & UV Care',
      statusLabel: sunscreenStatus,
      tone: sunscreenTone,
      summary: sunscreenSummary,
      bullets: sunscreenBullets,
    },
  ];
}
