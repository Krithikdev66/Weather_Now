# WeatherNow – Live Weather Application

A clean, beginner-friendly Python and Streamlit weather dashboard that fetches real-time weather data from the OpenWeatherMap API. Built as a structured portfolio project demonstrating modular Python design, API integration, environment variable security, and modern UI styling.

---

## Features

- **City Search**: Look up current weather conditions for any city worldwide, with quick-access preset cities.
- **Comprehensive Weather Metrics**: Displays city and country, current temperature, feels-like temperature, condition and description, humidity percentage, wind speed, atmospheric pressure (`hPa`), and visibility (`km`).
- **Dynamic Weather Icons**: Automatically displays condition-appropriate icons and card themes for sunny, cloudy, rainy, snowy, stormy, and misty weather.
- **Unit Conversion (°C / °F)**: Seamlessly switch between Celsius (`°C`, `m/s`) and Fahrenheit (`°F`, `mph`) without re-fetching data.
- **Modern Dashboard UI**: Rounded cards, responsive grid layout, gradient atmospheric themes, and a loading spinner during API calls.
- **Graceful Error Handling**: Friendly messages for invalid city names (`404`), missing/invalid API keys (`401`), API rate limits (`429`), internet connection failures, and incomplete data.

---

## Technologies Used

- **Python 3** — Core programming language
- **Streamlit** — Interactive web dashboard framework
- **OpenWeatherMap API** — Live global weather data
- **Requests** — HTTP client for API calls
- **Python Dotenv** — Secure loading of API keys from `.env`

---

## Project Folder Structure

```text
WeatherNow/
│
├── app.py              # Streamlit frontend UI & dashboard layout
├── weather.py          # OpenWeatherMap API client, parser & unit converters
├── requirements.txt    # Python package dependencies
├── .env.example        # Template for environment variables
├── .gitignore          # Files ignored by Git (keeps .env secret)
├── README.md           # Project documentation
│
└── assets/
    └── logo.png        # WeatherNow application icon
```

---

## Installation Instructions

1. **Clone the repository** (or navigate into the `WeatherNow` folder):
   ```bash
   git clone https://github.com/your-username/WeatherNow.git
   cd WeatherNow
   ```

2. **Create and activate a virtual environment** (recommended):
   ```bash
   python -m venv venv

   # On macOS / Linux:
   source venv/bin/activate

   # On Windows (Command Prompt):
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## API Configuration Instructions

1. Sign up for a free account at [OpenWeatherMap](https://openweathermap.org/api) and generate an API key.
2. Copy `.env.example` to `.env`:
   ```bash
   # macOS / Linux:
   cp .env.example .env

   # Windows:
   copy .env.example .env
   ```
3. Open `.env` in your editor and paste your real API key:
   ```env
   OPENWEATHER_API_KEY=your_actual_api_key_here
   ```
   *(Never commit `.env` to GitHub — `.gitignore` automatically protects it.)*

---

## How to Run the Application

Start the Streamlit development server:

```bash
streamlit run app.py
```

Your browser will automatically open at `http://localhost:8501`.

---

## Screenshots

> Add screenshots of your running dashboard in a `docs/` folder or paste images directly into GitHub Issues/README after running locally:
>
> - **Main Dashboard (Sunny / Clear)**: Search bar, hero weather card, and 4 metric cards
> - **Fahrenheit Mode & Quick Cities**: Instant unit switching in the sidebar
> - **Error Handling**: Friendly alert when an invalid city name is entered

---

## GitHub Upload Commands

Run these commands inside the `WeatherNow/` directory to publish your project to GitHub:

```bash
git init
git add .
git status   # Verify .env is NOT listed before committing!
git commit -m "Initial commit: WeatherNow Streamlit weather application"
git branch -M main
git remote add origin https://github.com/your-username/WeatherNow.git
git push -u origin main
```

---

## Future Improvements

- 5-day / 3-hour weather forecast chart using Plotly or Altair
- Geolocation auto-detection for local weather on startup
- Saved favorite cities list with local persistence
- Air Quality Index (AQI) and UV index cards

---

## License

This project is licensed under the **MIT License** — feel free to use, learn from, and expand it in your portfolio.
