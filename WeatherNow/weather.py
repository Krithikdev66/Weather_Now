"""
weather.py — Weather data fetching, parsing, unit conversion, and error handling
for the WeatherNow application.

This module separates API logic from the Streamlit user interface (app.py),
keeping the codebase modular, readable, and easy to test.
"""

import os
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv

# OpenWeatherMap Current Weather API endpoint
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"


class WeatherError(Exception):
    """
    Custom exception raised when fetching or parsing weather data fails.

    Attributes:
        message (str): A user-friendly error message suitable for display in the UI.
        error_type (str): A short category label (e.g., 'invalid_city', 'network_error').
    """

    def __init__(self, message: str, error_type: str = "general_error") -> None:
        super().__init__(message)
        self.message = message
        self.error_type = error_type


def load_api_key() -> str:
    """
    Load the OpenWeatherMap API key from the .env file or environment variables.

    Returns:
        str: The API key string if found, otherwise an empty string.
    """
    load_dotenv()
    return os.getenv("OPENWEATHER_API_KEY", "").strip()


def celsius_to_fahrenheit(celsius: float) -> float:
    """
    Convert a temperature value from Celsius (°C) to Fahrenheit (°F).

    Formula: (°C × 9/5) + 32
    """
    return round((celsius * 9.0 / 5.0) + 32.0, 1)


def format_wind_speed(speed_mps: float, unit: str = "C") -> str:
    """
    Format wind speed based on the selected temperature unit system.
    - Metric ('C'): meters per second (m/s)
    - Imperial ('F'): miles per hour (mph)
    """
    if unit.upper() == "F":
        mph = round(speed_mps * 2.23694, 1)
        return f"{mph} mph"
    return f"{round(speed_mps, 1)} m/s"


def get_weather_category(condition_main: str, weather_id: int = 800) -> str:
    """
    Map an OpenWeatherMap condition name and numeric ID to a broad category
    for choosing icons and dashboard themes.

    Reference: https://openweathermap.org/weather-conditions
    """
    condition = condition_main.strip().lower()

    if 200 <= weather_id < 300 or "thunderstorm" in condition:
        return "stormy"
    if 300 <= weather_id < 600 or any(word in condition for word in ("rain", "drizzle")):
        return "rainy"
    if 600 <= weather_id < 700 or "snow" in condition:
        return "snowy"
    if 700 <= weather_id < 800 or any(
        word in condition for word in ("mist", "fog", "haze", "smoke", "dust")
    ):
        return "misty"
    if weather_id == 800 or "clear" in condition:
        return "sunny"
    return "cloudy"


def get_weather_icon(condition_main: str, weather_id: int = 800) -> str:
    """
    Return a clean weather symbol matching the current weather category.
    Covers sunny, cloudy, rainy, snowy, stormy, and misty conditions.
    """
    category = get_weather_category(condition_main, weather_id)
    icon_map = {
        "sunny": "☀️",
        "cloudy": "☁️",
        "rainy": "🌧️",
        "snowy": "❄️",
        "stormy": "⛈️",
        "misty": "🌫️",
    }
    return icon_map.get(category, "🌤️")


def parse_weather_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and validate required weather fields from the raw JSON response.

    Raises:
        WeatherError: If expected weather fields are missing or malformed.
    """
    try:
        main_data = data["main"]
        weather_list = data["weather"]
        if not weather_list:
            raise KeyError("weather list is empty")

        weather_info = weather_list[0]
        wind_data = data.get("wind", {})
        sys_data = data.get("sys", {})

        # Visibility is returned in meters by OpenWeatherMap; convert to kilometers
        visibility_meters = data.get("visibility")
        visibility_km = (
            round(float(visibility_meters) / 1000.0, 1)
            if visibility_meters is not None
            else None
        )

        condition_main = str(weather_info["main"])
        weather_id = int(weather_info.get("id", 800))

        return {
            "city": str(data["name"]),
            "country": str(sys_data.get("country", "")),
            "temp_c": round(float(main_data["temp"]), 1),
            "feels_like_c": round(float(main_data["feels_like"]), 1),
            "condition": condition_main,
            "description": str(weather_info["description"]).title(),
            "humidity": int(main_data["humidity"]),
            "wind_speed_mps": round(float(wind_data.get("speed", 0.0)), 1),
            "pressure_hpa": int(main_data["pressure"]),
            "visibility_km": visibility_km,
            "weather_id": weather_id,
            "category": get_weather_category(condition_main, weather_id),
            "icon": get_weather_icon(condition_main, weather_id),
        }
    except (KeyError, TypeError, ValueError) as exc:
        raise WeatherError(
            "Received incomplete weather data from the server. Please try again.",
            error_type="missing_data",
        ) from exc


def fetch_weather(
    city: str,
    api_key: Optional[str] = None,
    timeout: int = 10,
) -> Dict[str, Any]:
    """
    Fetch current weather data for a given city from the OpenWeatherMap API.

    Args:
        city (str): Name of the city (e.g., 'London', 'Tokyo', 'Bengaluru').
        api_key (Optional[str]): Optional API key override. If None, loads from .env.
        timeout (int): Request timeout in seconds.

    Returns:
        Dict[str, Any]: Normalized weather dictionary ready for display in app.py.

    Raises:
        WeatherError: For invalid inputs, HTTP errors, network failures, or missing data.
    """
    cleaned_city = city.strip()
    if not cleaned_city:
        raise WeatherError(
            "Please enter a city name before searching.",
            error_type="invalid_city",
        )

    resolved_key = (api_key if api_key is not None else load_api_key()).strip()
    if not resolved_key or resolved_key == "your_openweathermap_api_key_here":
        raise WeatherError(
            "OpenWeatherMap API key is missing. Add OPENWEATHER_API_KEY to your .env file.",
            error_type="config_error",
        )

    params = {
        "q": cleaned_city,
        "appid": resolved_key,
        "units": "metric",  # Always fetch in Celsius and convert cleanly in the UI
    }

    try:
        response = requests.get(OPENWEATHER_BASE_URL, params=params, timeout=timeout)
    except requests.exceptions.ConnectionError as exc:
        raise WeatherError(
            "Unable to connect to the weather service. Please check your internet connection.",
            error_type="network_error",
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise WeatherError(
            "The weather service took too long to respond. Please try again.",
            error_type="network_error",
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise WeatherError(
            "An unexpected network error occurred while fetching weather data.",
            error_type="network_error",
        ) from exc

    # Handle standard OpenWeatherMap HTTP status codes with clear messages
    if response.status_code == 404:
        raise WeatherError(
            f"City '{cleaned_city}' was not found. Please check the spelling and try again.",
            error_type="invalid_city",
        )
    if response.status_code == 401:
        raise WeatherError(
            "Invalid API key. Please verify your OPENWEATHER_API_KEY in the .env file.",
            error_type="invalid_api_key",
        )
    if response.status_code == 429:
        raise WeatherError(
            "API rate limit exceeded. Please wait a moment before making more requests.",
            error_type="rate_limit",
        )
    if response.status_code != 200:
        raise WeatherError(
            f"Weather service returned an error (HTTP {response.status_code}). Please try again later.",
            error_type="api_error",
        )

    try:
        raw_data = response.json()
    except ValueError as exc:
        raise WeatherError(
            "Could not decode the weather response from the server.",
            error_type="missing_data",
        ) from exc

    return parse_weather_response(raw_data)
