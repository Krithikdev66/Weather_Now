"""
app.py — Streamlit frontend for WeatherNow – Live Weather Dashboard.

Run locally with:
    streamlit run app.py
"""

from pathlib import Path
import streamlit as st

from weather import (
    WeatherError,
    celsius_to_fahrenheit,
    fetch_weather,
    format_wind_speed,
)

# ---------------------------------------------------------------------------
# 1. Page Configuration
# ---------------------------------------------------------------------------
LOGO_PATH = Path(__file__).parent / "assets" / "logo.png"

st.set_page_config(
    page_title="WeatherNow – Live Weather Dashboard",
    page_icon=str(LOGO_PATH) if LOGO_PATH.exists() else "🌤️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# 2. Custom CSS for Gradient Background, Rounded Cards & Responsive Dashboard
# ---------------------------------------------------------------------------
st.markdown(
    """
    <style>
    /* Soft atmospheric gradient canvas */
    .stApp {
        background: linear-gradient(160deg, #f0f7ff 0%, #e6eef8 50%, #f8fafc 100%);
        color: #0f172a;
    }

    /* Main hero weather card */
    .weather-hero-card {
        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%);
        color: #ffffff;
        padding: 2rem;
        border-radius: 20px;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
        margin-bottom: 1.25rem;
    }

    .weather-hero-card.sunny {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 55%, #1e40af 100%);
    }

    .weather-hero-card.cloudy {
        background: linear-gradient(135deg, #334155 0%, #475569 55%, #1e293b 100%);
    }

    .weather-hero-card.rainy,
    .weather-hero-card.stormy {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0369a1 100%);
    }

    .weather-hero-card.snowy {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 65%, #60a5fa 100%);
    }

    .weather-location {
        font-size: 1.15rem;
        font-weight: 600;
        opacity: 0.92;
        margin-bottom: 0.35rem;
    }

    .weather-temp {
        font-size: 3.75rem;
        font-weight: 700;
        line-height: 1.05;
        margin: 0.25rem 0;
    }

    .weather-desc {
        font-size: 1.1rem;
        opacity: 0.9;
    }

    /* Individual metric cards */
    .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        height: 100%;
    }

    .metric-label {
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 600;
        margin-bottom: 0.4rem;
    }

    .metric-value {
        font-size: 1.65rem;
        font-weight: 700;
        color: #0f172a;
    }

    .metric-sub {
        font-size: 0.8rem;
        color: #94a3b8;
        margin-top: 0.25rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


def render_weather_dashboard(weather: dict, unit: str) -> None:
    """Render the current weather hero card and atmospheric metric grid."""
    is_fahrenheit = unit == "F"
    temp_display = (
        celsius_to_fahrenheit(weather["temp_c"]) if is_fahrenheit else weather["temp_c"]
    )
    feels_display = (
        celsius_to_fahrenheit(weather["feels_like_c"])
        if is_fahrenheit
        else weather["feels_like_c"]
    )
    unit_symbol = "°F" if is_fahrenheit else "°C"
    wind_display = format_wind_speed(weather["wind_speed_mps"], unit)
    visibility_display = (
        f"{weather['visibility_km']} km"
        if weather["visibility_km"] is not None
        else "N/A"
    )
    country_suffix = f", {weather['country']}" if weather["country"] else ""

    # Hero card showing city, icon, temperature, and condition
    st.markdown(
        f"""
        <div class="weather-hero-card {weather['category']}">
            <div class="weather-location">{weather['city']}{country_suffix}</div>
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
                <div>
                    <div class="weather-temp">{temp_display}{unit_symbol}</div>
                    <div class="weather-desc">
                        {weather['condition']} · {weather['description']}
                    </div>
                    <div style="font-size:0.95rem; opacity:0.85; margin-top:0.4rem;">
                        Feels like {feels_display}{unit_symbol}
                    </div>
                </div>
                <div style="font-size:4.5rem; line-height:1;">{weather['icon']}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Four-column metric cards
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-label">Humidity</div>
                <div class="metric-value">{weather['humidity']}%</div>
                <div class="metric-sub">Relative moisture</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col2:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-label">Wind Speed</div>
                <div class="metric-value">{wind_display}</div>
                <div class="metric-sub">Surface wind</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col3:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-label">Pressure</div>
                <div class="metric-value">{weather['pressure_hpa']} hPa</div>
                <div class="metric-sub">Atmospheric pressure</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col4:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-label">Visibility</div>
                <div class="metric-value">{visibility_display}</div>
                <div class="metric-sub">Horizontal range</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def main() -> None:
    """Main entry point for the WeatherNow Streamlit application."""
    # Remember the active city across unit switches using session_state
    if "selected_city" not in st.session_state:
        st.session_state.selected_city = "London"

    # -----------------------------------------------------------------------
    # Sidebar Navigation & Settings
    # -----------------------------------------------------------------------
    with st.sidebar:
        if LOGO_PATH.exists():
            st.image(str(LOGO_PATH), width=72)
        st.title("WeatherNow")
        st.caption("Live meteorological dashboard powered by OpenWeatherMap.")

        st.divider()
        unit_choice = st.radio(
            "Temperature Unit",
            options=["Celsius (°C)", "Fahrenheit (°F)"],
            index=0,
        )
        unit_code = "F" if "Fahrenheit" in unit_choice else "C"

        st.divider()
        st.subheader("Quick Cities")
        for sample_city in ["London", "Tokyo", "New York", "Bengaluru", "Reykjavik"]:
            if st.button(sample_city, use_container_width=True):
                st.session_state.selected_city = sample_city

    # -----------------------------------------------------------------------
    # Header & City Search Form
    # -----------------------------------------------------------------------
    header_col1, header_col2 = st.columns([1, 8])
    with header_col1:
        if LOGO_PATH.exists():
            st.image(str(LOGO_PATH), width=64)
    with header_col2:
        st.title("WeatherNow – Live Weather")
        st.write("Search any city worldwide to inspect real-time weather conditions.")

    with st.form(key="city_search_form", clear_on_submit=False):
        input_col, btn_col = st.columns([4, 1])
        with input_col:
            city_input = st.text_input(
                "City Name",
                value=st.session_state.selected_city,
                placeholder="e.g., London, Tokyo, Mumbai, Paris...",
                label_visibility="collapsed",
            )
        with btn_col:
            submitted = st.form_submit_button("Search", use_container_width=True)

    if submitted:
        st.session_state.selected_city = city_input

    # -----------------------------------------------------------------------
    # Fetch & Render Weather Data
    # -----------------------------------------------------------------------
    target_city = st.session_state.selected_city

    try:
        with st.spinner(f"Fetching live weather data for {target_city}..."):
            weather_data = fetch_weather(target_city)
        render_weather_dashboard(weather_data, unit_code)

    except WeatherError as err:
        st.error(err.message)
        if err.error_type == "config_error":
            st.info(
                "Tip: Copy `.env.example` to `.env` and set `OPENWEATHER_API_KEY=your_key`."
            )


if __name__ == "__main__":
    main()
