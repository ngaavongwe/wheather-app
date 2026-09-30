# 🌤️ WeatherSphere - Real-Time Weather Application

**WeatherSphere** is a complete, modern, responsive weather dashboard web application built with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. It leverages the [OpenWeather API](https://openweathermap.org/api) to provide live weather updates, 5-day weather forecasts, air quality index metrics, and exact local city time for locations worldwide.

---

## 🌟 Key Features

- 🔍 **Global City Search**: Search weather for any city worldwide with instant validation and friendly error handling.
- 📍 **Browser Geolocation**: Click `📍 Use My Location` to fetch hyper-local weather based on your current latitude and longitude.
- 🕒 **City Local Date & Time**: Computes and displays the exact local time of the searched city using UTC timezone offset calculations (not your computer's time).
- 🌡️ **Temperature Unit Toggle (°C / °F)**: Effortlessly switch between Celsius and Fahrenheit. All values (current, feels-like, forecast, wind speed) update instantly without requiring re-fetching.
- 🌙 **Dark / Light Mode**: Dynamic theme switcher with persistent user preference stored in `localStorage`.
- 🎨 **Dynamic Weather Backgrounds**: The background color and visual gradient adapt automatically based on current weather conditions (Clear, Clouds, Rain, Snow, Thunderstorm, Mist).
- 📅 **5-Day Weather Forecast**: Displays daily weather forecasts with midday condition icons, min/max temperatures, and rain probability percentages.
- 🍃 **Air Quality Index (AQI)**: Displays air pollution ratings (Good, Fair, Moderate, Poor, Very Poor) along with detailed pollutant metrics (PM2.5, PM10, O₃, NO₂).
- 🕒 **Recent Searches**: Saves up to 5 recently searched cities in `localStorage` for 1-click re-searching.
- ⭐ **Favorite Cities**: Bookmark your favorite cities with a ⭐ button. Favorites are stored in `localStorage` and can be loaded or removed anytime.
- 📱 **Fully Responsive & Accessible**: Uses semantic HTML5, ARIA labels, focus state outlines, and fluid CSS media queries for desktop, tablet, and mobile devices.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic tags (`<header>`, `<main>`, `<section>`, `<article>`, `<form>`, `<dl>`, `<footer>`).
- **CSS3**: Modern CSS custom properties (variables), Glassmorphic frosted glass design, CSS Grid, Flexbox, micro-animations, fluid typography, and Media Queries.
- **Vanilla JavaScript (ES6+)**: `async/await`, Fetch API, JSON parsing, DOM manipulation, LocalStorage API, Event listeners, Date & Timezone calculations.
- **OpenWeather API**: Current Weather Data, 5-Day / 3-Hour Forecast, and Air Pollution endpoints.

---

## 📁 Project Structure

```text
weather-app/
│
├── index.html        # Main HTML structure and semantic layout
├── style.css         # Custom styling, dark/light themes, dynamic weather backgrounds
├── script.js         # JavaScript application logic, API fetching, LocalStorage, DOM updates
├── README.md         # Complete project documentation and guide
│
└── assets/           # Local weather icon image fallback assets
    ├── clear.png
    ├── cloudy.png
    ├── rain.png
    └── snow.png
```

---

## 🔑 How to Obtain an OpenWeather API Key

1. Visit the OpenWeather website: [https://home.openweathermap.org/users/sign_up](https://home.openweathermap.org/users/sign_up)
2. Create a free account or log in.
3. Navigate to the **API keys** tab in your account dashboard.
4. Copy your unique API Key (it looks like `a1b2c3d4e5f67890abcdef1234567890`).

> ℹ️ *Note: Free OpenWeather API keys usually take 10 to 30 minutes to activate after generation.*

---

## ⚙️ Where to Put Your API Key

Open `script.js` in your code editor and update the `API_KEY` constant at the top of the file:

```javascript
// Open script.js and replace the placeholder:
const API_KEY = "YOUR_ACTUAL_API_KEY_HERE";
```

> 💡 **Built-in Demo / Mock Mode**: If `API_KEY` is left as `"YOUR_API_KEY_HERE"`, WeatherSphere will display a friendly notification banner and automatically run in **Demo Mode** using realistic simulated weather data so you can test all UI features right away without crashing!

---

## 🚀 How to Run the Application

1. **Option 1: Direct File Launch**
   - Double-click `index.html` to open it directly in any modern web browser (Chrome, Firefox, Edge, Safari).

2. **Option 2: Local Web Server (Recommended)**
   - If using VS Code, install the **Live Server** extension.
   - Right-click `index.html` and select **Open with Live Server**.
   - Or run a quick server via terminal:
     ```bash
     npx serve .
     ```

---

## 📡 How the OpenWeather API Works

WeatherSphere communicates with three core OpenWeather endpoints:

1. **Current Weather Endpoint**:
   - `GET https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={API_KEY}&units=metric`
   - Returns temperature, humidity, wind speed, pressure, visibility, timezone offset, sunrise/sunset, and condition code.

2. **5-Day / 3-Hour Forecast Endpoint**:
   - `GET https://api.openweathermap.org/data/2.5/forecast?q={CITY}&appid={API_KEY}&units=metric`
   - Returns 40 weather data points spaced at 3-hour intervals across 5 days.

3. **Air Pollution Endpoint**:
   - `GET https://api.openweathermap.org/data/2.5/air_pollution?lat={LAT}&lon={LON}&appid={API_KEY}`
   - Returns Air Quality Index (1 to 5) and concentration breakdown for PM2.5, PM10, O3, NO2.

---

## 🧠 JavaScript Concepts Demonstrated

This project serves as a comprehensive learning resource for beginner-to-intermediate JavaScript developers:

1. **Asynchronous JavaScript (`async` / `await`)**:
   Handling asynchronous HTTP requests cleanly using `try...catch` blocks instead of nested promise callbacks.
2. **Fetch API & Response Handling**:
   Checking `response.ok` and HTTP status codes (`404` for invalid city, `401` for invalid key, `429` for rate limits).
3. **JSON Parsing**:
   Extracting nested properties from complex JSON objects returned by APIs.
4. **Timezone Mathematics**:
   Converting UTC timestamps and city timezone offsets (`timezone` in seconds) into accurate local dates and times.
5. **DOM Manipulation & Dynamic Rendering**:
   Creating HTML elements dynamically using template literals and `document.createElement()`.
6. **LocalStorage Client Storage**:
   Persisting user theme preferences (`light`/`dark`), temperature unit (`metric`/`imperial`), recent searches, and favorite cities across page reloads.
7. **Geolocation API**:
   Requesting coordinates using `navigator.geolocation.getCurrentPosition()`.

---

## 🛡️ Security Note

- **Never commit real API keys to public repositories** (such as GitHub).
- In production applications, API keys should be hidden behind a server backend or serverless proxy function (e.g., Netlify Functions or Node.js backend) to prevent unauthorized usage or rate limit depletion.

---

## 🌐 Deployment Instructions

### Deploy to GitHub Pages
1. Push your project to a GitHub repository.
2. Go to **Settings > Pages**.
3. Under **Branch**, select `main` (or `master`) and click **Save**.
4. Your site will be published at `https://<your-username>.github.io/<repository-name>/`.

### Deploy to Netlify or Vercel
- Drag and drop your project folder onto the Netlify or Vercel dashboard for instant deployment!

---

## 🚀 Future Improvements

- 🗺️ Interactive weather radar map using Leaflet.js.
- 🔔 Hourly forecast slider for the next 24 hours.
- 🔊 Voice command search ("What's the weather in Tokyo?").
- 🌧️ Rain sound generator for ambient rainy weather backgrounds.
