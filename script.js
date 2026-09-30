/* ==========================================================================
   WeatherSphere - Vanilla JavaScript Application Logic (ES6+)
   
   Teaching Concepts Demonstrated:
   1. Async/Await & Fetch API for asynchronous HTTP requests
   2. DOM Manipulation & Event Handling (click, submit, keydown)
   3. LocalStorage for persistent client-side data storage
   4. Timezone conversion and dynamic clock updates
   5. Dynamic CSS Theme & Weather background updates
   6. Error handling (try...catch, network errors, API error codes)
   7. Fallback Mock Data Engine when API key is unconfigured
   ========================================================================== */

// ==========================================================================
// 1. CONFIGURATION SECTION
// ==========================================================================
/**
 * OPENWEATHER API KEY
 * -------------------
 * Replace 'YOUR_API_KEY_HERE' with your actual free OpenWeather API key.
 * You can obtain a key by creating a free account at:
 * https://home.openweathermap.org/users/sign_up
 */
const API_KEY = "YOUR_API_KEY_HERE";

// OpenWeather API Base Endpoints
const API_BASE_URL = "https://api.openweathermap.org/data/2.5";
const ICON_BASE_URL = "https://openweathermap.org/img/wn";

// Storage Keys for LocalStorage
const STORAGE_KEYS = {
  THEME: "weathersphere_theme",
  UNIT: "weathersphere_unit",
  RECENT: "weathersphere_recent_cities",
  FAVORITES: "weathersphere_favorite_cities"
};

// ==========================================================================
// 2. STATE MANAGEMENT & DOM ELEMENT CACHING
// ==========================================================================
// Application State
let currentUnit = "metric"; // 'metric' (°C, m/s) or 'imperial' (°F, mph)
let currentWeatherData = null; // Stores raw current weather object
let currentForecastData = null; // Stores raw forecast object
let currentAqiData = null; // Stores raw air quality object
let clockIntervalId = null; // Stores setInterval handle for the live city clock

// Cache DOM Elements for efficient access
const els = {
  // Theme & Units
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  themeIcon: document.getElementById("themeIcon"),
  themeLabel: document.getElementById("themeLabel"),
  unitCelsiusBtn: document.getElementById("unitCelsiusBtn"),
  unitFahrenheitBtn: document.getElementById("unitFahrenheitBtn"),

  // Search
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  locationBtn: document.getElementById("locationBtn"),

  // Feedback UI
  messageBanner: document.getElementById("messageBanner"),
  loadingContainer: document.getElementById("loadingContainer"),

  // Current Weather Card
  weatherCard: document.getElementById("weatherCard"),
  cityName: document.getElementById("cityName"),
  favoriteToggleBtn: document.getElementById("favoriteToggleBtn"),
  localTime: document.getElementById("localTime"),
  tempValue: document.getElementById("tempValue"),
  tempUnit: document.getElementById("tempUnit"),
  weatherIcon: document.getElementById("weatherIcon"),
  weatherCondition: document.getElementById("weatherCondition"),
  feelsLike: document.getElementById("feelsLike"),
  humidityValue: document.getElementById("humidityValue"),
  windValue: document.getElementById("windValue"),
  pressureValue: document.getElementById("pressureValue"),
  visibilityValue: document.getElementById("visibilityValue"),
  sunriseValue: document.getElementById("sunriseValue"),
  sunsetValue: document.getElementById("sunsetValue"),

  // Air Quality Card
  aqiCard: document.getElementById("aqiCard"),
  aqiBadge: document.getElementById("aqiBadge"),
  aqiDesc: document.getElementById("aqiDesc"),
  aqiPm25: document.getElementById("aqiPm25"),
  aqiPm10: document.getElementById("aqiPm10"),
  aqiO3: document.getElementById("aqiO3"),
  aqiNo2: document.getElementById("aqiNo2"),

  // Forecast
  forecastSection: document.getElementById("forecastSection"),
  forecastGrid: document.getElementById("forecastGrid"),

  // Sidebar Lists
  recentList: document.getElementById("recentList"),
  favoriteList: document.getElementById("favoriteList")
};

// ==========================================================================
// 3. INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initUnit();
  renderRecentCities();
  renderFavoriteCities();
  setupEventListeners();

  // Load default city weather (e.g. Bulawayo) on launch
  loadWeatherForCity("Bulawayo");
});

/**
 * Attach Event Listeners to UI Controls
 */
function setupEventListeners() {
  // Search Form Submit (Enter key or click)
  els.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = els.cityInput.value.trim();
    if (!city) {
      showError("Please enter a city name to search.");
      return;
    }
    loadWeatherForCity(city);
  });

  // Current Location Button Click
  els.locationBtn.addEventListener("click", () => {
    getUserLocationWeather();
  });

  // Theme Toggle Button Click
  els.themeToggleBtn.addEventListener("click", toggleTheme);

  // Unit Buttons Click
  els.unitCelsiusBtn.addEventListener("click", () => setTemperatureUnit("metric"));
  els.unitFahrenheitBtn.addEventListener("click", () => setTemperatureUnit("imperial"));

  // Favorite Button Click
  els.favoriteToggleBtn.addEventListener("click", toggleCurrentFavorite);
}

// ==========================================================================
// 4. API FETCHING & WEATHER CONTROLLER (ASYNC / AWAIT)
// ==========================================================================
/**
 * Main function to load weather, forecast, and air quality for a city name.
 * @param {string} city - Name of the city to search.
 */
async function loadWeatherForCity(city) {
  clearMessage();
  showLoading();

  try {
    // Verify if API Key is configured, otherwise notify user and use mock mode
    const isMock = isApiKeyUnconfigured();
    if (isMock) {
      showInfo("ℹ️ Demo Mode: OpenWeather API key is placeholder. Showing simulated weather data. Set API_KEY in script.js for live data.");
    }

    // 1. Fetch Current Weather Data
    const weather = await fetchCurrentWeather(city, isMock);

    // 2. Fetch 5-Day Forecast Data
    const forecast = await fetchForecast(city, isMock);

    // 3. Fetch Air Quality Data using latitude & longitude from weather response
    const { lat, lon } = weather.coord;
    const aqi = await fetchAirQuality(lat, lon, isMock);

    // Store in global state
    currentWeatherData = weather;
    currentForecastData = forecast;
    currentAqiData = aqi;

    // Render all UI components
    displayCurrentWeather(weather);
    displayForecast(forecast);
    displayAirQuality(aqi);

    // Save city to Recent Searches
    saveRecentCity(weather.name);

  } catch (error) {
    console.error("Error fetching weather:", error);
    showError(error.message || "Unable to retrieve weather data. Please check your network connection and try again.");
  } finally {
    hideLoading();
  }
}

/**
 * Fetch weather using browser Geolocation API coordinates
 */
function getUserLocationWeather() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  clearMessage();
  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const isMock = isApiKeyUnconfigured();
        if (isMock) {
          showInfo("ℹ️ Demo Mode: Using location coordinates with simulated weather data.");
        }

        const weather = await fetchWeatherByCoords(latitude, longitude, isMock);
        const forecast = await fetchForecastByCoords(latitude, longitude, isMock);
        const aqi = await fetchAirQuality(latitude, longitude, isMock);

        currentWeatherData = weather;
        currentForecastData = forecast;
        currentAqiData = aqi;

        displayCurrentWeather(weather);
        displayForecast(forecast);
        displayAirQuality(aqi);

        saveRecentCity(weather.name);
        els.cityInput.value = weather.name;

      } catch (err) {
        showError(err.message || "Failed to load weather for your current location.");
      } finally {
        hideLoading();
      }
    },
    (geoError) => {
      hideLoading();
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          showError("Location access denied. Please enable location permissions in your browser or type a city name.");
          break;
        case geoError.POSITION_UNAVAILABLE:
          showError("Location information is currently unavailable.");
          break;
        case geoError.TIMEOUT:
          showError("The request to get your location timed out.");
          break;
        default:
          showError("An unknown error occurred while retrieving your location.");
      }
    },
    { timeout: 10000 }
  );
}

// --------------------------------------------------------------------------
// HTTP FETCH HELPERS
// --------------------------------------------------------------------------
async function fetchCurrentWeather(city, isMock = false) {
  if (isMock) return mockFetchWeather(city);

  const url = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    } else if (response.status === 401) {
      throw new Error("Invalid API Key. Please verify your OpenWeather API key in script.js.");
    } else if (response.status === 429) {
      throw new Error("API rate limit exceeded. Please wait a moment and try again.");
    }
    throw new Error("Failed to fetch weather data from OpenWeather server.");
  }

  return await response.json();
}

async function fetchForecast(city, isMock = false) {
  if (isMock) return mockFetchForecast(city);

  const url = `${API_BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch 5-day forecast data.");
  }

  return await response.json();
}

async function fetchAirQuality(lat, lon, isMock = false) {
  if (isMock) return mockFetchAirQuality();

  try {
    const url = `${API_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null; // Graceful fallback if AQI endpoint is unbacked
  }
}

async function fetchWeatherByCoords(lat, lon, isMock = false) {
  if (isMock) return mockFetchWeather("My Location", lat, lon);

  const url = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not retrieve weather for your coordinates.");
  return await response.json();
}

async function fetchForecastByCoords(lat, lon, isMock = false) {
  if (isMock) return mockFetchForecast("My Location");

  const url = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not retrieve forecast for your coordinates.");
  return await response.json();
}

// Check if API_KEY is placeholder
function isApiKeyUnconfigured() {
  return !API_KEY || API_KEY.trim() === "" || API_KEY === "YOUR_API_KEY_HERE";
}

// ==========================================================================
// 5. DOM RENDERING FUNCTIONS
// ==========================================================================
/**
 * Render Current Weather Card
 * @param {Object} data - OpenWeather current weather response JSON
 */
function displayCurrentWeather(data) {
  if (!data) return;

  const countryName = getCountryName(data.sys?.country);
  const cityDisplay = countryName ? `${data.name}, ${countryName}` : data.name;
  els.cityName.textContent = cityDisplay;

  // Weather Condition & Icon
  const weatherObj = data.weather && data.weather[0] ? data.weather[0] : { main: "Clear", description: "Clear sky", icon: "01d" };
  els.weatherCondition.textContent = capitalizeFirstLetter(weatherObj.description);
  
  // Use OpenWeather icon standard URL with local fallback
  els.weatherIcon.src = `${ICON_BASE_URL}/${weatherObj.icon}@2x.png`;
  els.weatherIcon.alt = weatherObj.description;
  els.weatherIcon.onerror = () => {
    // Fallback icon based on weather condition
    els.weatherIcon.src = getLocalAssetIcon(weatherObj.main);
  };

  // Temperature formatting based on active unit (°C or °F)
  const mainTemp = data.main.temp;
  const feelsLikeTemp = data.main.feels_like;
  
  els.tempValue.textContent = formatTemp(mainTemp);
  els.tempUnit.textContent = currentUnit === "metric" ? "°C" : "°F";
  els.feelsLike.textContent = `Feels like: ${formatTemp(feelsLikeTemp)}${currentUnit === "metric" ? "°C" : "°F"}`;

  // Metrics
  els.humidityValue.textContent = `${data.main.humidity}%`;
  els.windValue.textContent = formatWind(data.wind.speed);
  els.pressureValue.textContent = `${data.main.pressure} hPa`;
  
  // Visibility in km or miles
  const visKm = (data.visibility / 1000).toFixed(1);
  els.visibilityValue.textContent = currentUnit === "metric" ? `${visKm} km` : `${(visKm * 0.621371).toFixed(1)} mi`;

  // Sunrise and Sunset formatted to local city time
  const tzOffset = data.timezone ?? 0;
  els.sunriseValue.textContent = formatUnixTimestamp(data.sys.sunrise, tzOffset);
  els.sunsetValue.textContent = formatUnixTimestamp(data.sys.sunset, tzOffset);

  // Dynamic Local Time Clock
  startCityClock(tzOffset);

  // Dynamic Background styling
  updateDynamicBackground(weatherObj.main);

  // Favorite Star Button status
  updateFavoriteStar(data.name);

  // Reveal Card
  els.weatherCard.style.display = "flex";
}

/**
 * Render 5-Day Forecast Grid
 * @param {Object} forecastData - OpenWeather forecast response JSON
 */
function displayForecast(forecastData) {
  if (!forecastData || !forecastData.list) {
    els.forecastSection.style.display = "none";
    return;
  }

  els.forecastGrid.innerHTML = "";
  const tzOffset = forecastData.city?.timezone ?? 0;

  // Process 3-hour interval data into 5 distinct daily forecasts
  const dailyList = processDailyForecasts(forecastData.list, tzOffset);

  dailyList.forEach((dayData) => {
    const card = document.createElement("article");
    card.className = "forecast-card";

    const dayName = getDayOfWeekName(dayData.dateStr);
    const dateFormatted = formatDateMonth(dayData.dateStr);

    const weatherObj = dayData.weather;
    const iconUrl = `${ICON_BASE_URL}/${weatherObj.icon}@2x.png`;
    const popPercent = Math.round((dayData.pop || 0) * 100);

    card.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-date">${dateFormatted}</div>
      <img class="forecast-icon" src="${iconUrl}" alt="${weatherObj.description}" onerror="this.src='${getLocalAssetIcon(weatherObj.main)}'">
      <div class="forecast-temp">
        <span>${formatTemp(dayData.tempMax)}°</span>
        <span class="forecast-lo">${formatTemp(dayData.tempMin)}°</span>
      </div>
      <div class="forecast-condition">${weatherObj.main}</div>
      ${popPercent > 0 ? `<div class="forecast-pop">💧 ${popPercent}%</div>` : ''}
    `;

    els.forecastGrid.appendChild(card);
  });

  els.forecastSection.style.display = "flex";
}

/**
 * Process OpenWeather 3-hour 40-item forecast array into 5 clean daily entries.
 */
function processDailyForecasts(list, tzOffset) {
  const dailyMap = new Map();
  const todayDateStr = getCityDateString(Date.now(), tzOffset);

  for (const item of list) {
    // Convert item Unix timestamp to city's local date string YYYY-MM-DD
    const itemDateStr = getCityDateString(item.dt * 1000, tzOffset);

    // Skip today's remaining hours to show true 5 upcoming days
    if (itemDateStr === todayDateStr && dailyMap.size === 0) continue;

    if (!dailyMap.has(itemDateStr)) {
      dailyMap.set(itemDateStr, {
        dateStr: itemDateStr,
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        weatherList: [item.weather[0]],
        middayItem: item,
        middayDiff: Math.abs(new Date(item.dt * 1000).getUTCHours() - 12),
        pop: item.pop || 0
      });
    } else {
      const dayEntry = dailyMap.get(itemDateStr);
      dayEntry.tempMax = Math.max(dayEntry.tempMax, item.main.temp_max);
      dayEntry.tempMin = Math.min(dayEntry.tempMin, item.main.temp_min);
      dayEntry.pop = Math.max(dayEntry.pop, item.pop || 0);

      // Pick the icon/description closest to 12:00 PM local time
      const itemHourDiff = Math.abs(new Date(item.dt * 1000).getUTCHours() - 12);
      if (itemHourDiff < dayEntry.middayDiff) {
        dayEntry.middayDiff = itemHourDiff;
        dayEntry.middayItem = item;
      }
    }
  }

  // Format array to return 5 days
  return Array.from(dailyMap.values()).slice(0, 5).map(entry => ({
    dateStr: entry.dateStr,
    tempMax: entry.tempMax,
    tempMin: entry.tempMin,
    weather: entry.middayItem.weather[0],
    pop: entry.pop
  }));
}

/**
 * Render Air Quality Index Card
 * @param {Object} aqiData - Air pollution response JSON
 */
function displayAirQuality(aqiData) {
  if (!aqiData || !aqiData.list || !aqiData.list[0]) {
    els.aqiCard.style.display = "none";
    return;
  }

  const aqiObj = aqiData.list[0];
  const aqiIndex = aqiObj.main.aqi; // 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
  const components = aqiObj.components;

  const aqiLevels = {
    1: { label: "Good 🟢", desc: "Air quality is considered satisfactory, and air pollution poses little or no risk.", class: "level-1" },
    2: { label: "Fair 🟡", desc: "Air quality is acceptable. However, sensitive individuals may experience minor irritation.", class: "level-2" },
    3: { label: "Moderate 🟧", desc: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.", class: "level-3" },
    4: { label: "Poor 🔴", desc: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.", class: "level-4" },
    5: { label: "Very Poor 🟣", desc: "Health warnings of emergency conditions. The entire population is more likely to be affected.", class: "level-5" }
  };

  const levelInfo = aqiLevels[aqiIndex] || aqiLevels[1];

  els.aqiBadge.textContent = levelInfo.label;
  els.aqiBadge.className = `aqi-badge ${levelInfo.class}`;
  els.aqiDesc.textContent = levelInfo.desc;

  // Pollutants in µg/m³
  els.aqiPm25.textContent = `${components.pm2_5.toFixed(1)} µg/m³`;
  els.aqiPm10.textContent = `${components.pm10.toFixed(1)} µg/m³`;
  els.aqiO3.textContent = `${components.o3.toFixed(1)} µg/m³`;
  els.aqiNo2.textContent = `${components.no2.toFixed(1)} µg/m³`;

  els.aqiCard.style.display = "flex";
}

// ==========================================================================
// 6. TIMEZONE & DATE HELPER FUNCTIONS
// ==========================================================================
/**
 * Starts a live digital clock for the selected city based on its UTC timezone offset in seconds.
 * @param {number} tzOffsetSeconds - Timezone offset in seconds from UTC.
 */
function startCityClock(tzOffsetSeconds) {
  if (clockIntervalId) clearInterval(clockIntervalId);

  const updateClock = () => {
    const cityDate = getCityLocalDate(tzOffsetSeconds);
    const options = {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    };
    els.localTime.innerHTML = `🕒 <span>${cityDate.toLocaleDateString("en-US", options)}</span>`;
  };

  updateClock();
  clockIntervalId = setInterval(updateClock, 10000); // Update every 10 seconds
}

/**
 * Calculates a Date object adjusted for the target city's UTC offset.
 */
function getCityLocalDate(tzOffsetSeconds) {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcMs + (tzOffsetSeconds * 1000));
}

/**
 * Formats a Unix timestamp into a local 24-hour time string (e.g. "06:15").
 */
function formatUnixTimestamp(unixSec, tzOffsetSeconds) {
  const utcMs = (unixSec * 1000);
  // Read using UTC timezone
  const date = new Date(utcMs + (tzOffsetSeconds * 1000));
  const hrs = String(date.getUTCHours()).padStart(2, '0');
  const mins = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hrs}:${mins}`;
}

function getCityDateString(timestampMs, tzOffsetSeconds) {
  const d = new Date(timestampMs + (tzOffsetSeconds * 1000));
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getDayOfWeekName(dateStr) {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase();
}

function formatDateMonth(dateStr) {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// ==========================================================================
// 7. TEMPERATURE & WIND UNIT CONVERSION
// ==========================================================================
function setTemperatureUnit(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;

  // Save preference to localStorage
  try { localStorage.setItem(STORAGE_KEYS.UNIT, unit); } catch { /* ignore */ }

  // Update button active UI
  els.unitCelsiusBtn.classList.toggle("active", unit === "metric");
  els.unitCelsiusBtn.setAttribute("aria-pressed", unit === "metric");
  els.unitFahrenheitBtn.classList.toggle("active", unit === "imperial");
  els.unitFahrenheitBtn.setAttribute("aria-pressed", unit === "imperial");

  // Re-render currently displayed weather & forecast with new unit without making new API calls!
  if (currentWeatherData) displayCurrentWeather(currentWeatherData);
  if (currentForecastData) displayForecast(currentForecastData);
}

function formatTemp(tempInCelsius) {
  if (tempInCelsius == null) return "--";
  let temp = tempInCelsius;
  if (currentUnit === "imperial") {
    temp = (tempInCelsius * 9 / 5) + 32;
  }
  return Math.round(temp);
}

function formatWind(windInMs) {
  if (windInMs == null) return "--";
  if (currentUnit === "imperial") {
    const mph = (windInMs * 2.23694).toFixed(1);
    return `${mph} mph`;
  }
  return `${windInMs.toFixed(1)} m/s`;
}

// ==========================================================================
// 8. THEME TOGGLE (DARK / LIGHT MODE)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme(newTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(STORAGE_KEYS.THEME, theme); } catch { /* ignore */ }

  if (theme === "dark") {
    els.themeIcon.textContent = "☀️";
    els.themeLabel.textContent = "Light Mode";
  } else {
    els.themeIcon.textContent = "🌙";
    els.themeLabel.textContent = "Dark Mode";
  }
}

function initUnit() {
  const savedUnit = localStorage.getItem(STORAGE_KEYS.UNIT) || "metric";
  setTemperatureUnit(savedUnit);
}

// ==========================================================================
// 9. DYNAMIC WEATHER BACKGROUNDS
// ==========================================================================
function updateDynamicBackground(mainCondition) {
  // Remove existing weather classes from body
  document.body.classList.remove(
    "weather-clear",
    "weather-clouds",
    "weather-rain",
    "weather-snow",
    "weather-thunderstorm",
    "weather-mist"
  );

  const condition = (mainCondition || "").toLowerCase();

  if (condition.includes("clear")) {
    document.body.classList.add("weather-clear");
  } else if (condition.includes("cloud")) {
    document.body.classList.add("weather-clouds");
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    document.body.classList.add("weather-rain");
  } else if (condition.includes("snow")) {
    document.body.classList.add("weather-snow");
  } else if (condition.includes("thunderstorm")) {
    document.body.classList.add("weather-thunderstorm");
  } else if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) {
    document.body.classList.add("weather-mist");
  } else {
    document.body.classList.add("weather-clear");
  }
}

// Map condition to local SVG/PNG asset fallback
function getLocalAssetIcon(mainCondition) {
  const cond = (mainCondition || "").toLowerCase();
  if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("thunderstorm")) {
    return "assets/rain.png";
  }
  if (cond.includes("snow")) {
    return "assets/snow.png";
  }
  if (cond.includes("cloud") || cond.includes("mist") || cond.includes("fog")) {
    return "assets/cloudy.png";
  }
  return "assets/clear.png";
}

// ==========================================================================
// 10. RECENT SEARCHES & FAVORITES (LOCALSTORAGE)
// ==========================================================================
function getStoredArray(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredArray(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch { /* ignore storage quota errors */ }
}

// RECENT SEARCHES
function saveRecentCity(cityName) {
  if (!cityName) return;
  let recent = getStoredArray(STORAGE_KEYS.RECENT);
  
  // Filter out duplicates (case-insensitive)
  recent = recent.filter(c => c.toLowerCase() !== cityName.toLowerCase());
  
  // Add to start
  recent.unshift(cityName);
  
  // Limit to 5
  recent = recent.slice(0, 5);
  
  saveStoredArray(STORAGE_KEYS.RECENT, recent);
  renderRecentCities();
}

function renderRecentCities() {
  const recent = getStoredArray(STORAGE_KEYS.RECENT);
  els.recentList.innerHTML = "";

  if (recent.length === 0) {
    els.recentList.innerHTML = `<span class="empty-state">No recent searches yet.</span>`;
    return;
  }

  recent.forEach((city) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip-btn";
    btn.textContent = city;
    btn.addEventListener("click", () => {
      els.cityInput.value = city;
      loadWeatherForCity(city);
    });
    els.recentList.appendChild(btn);
  });
}

// FAVORITES
function toggleCurrentFavorite() {
  if (!currentWeatherData) return;
  const cityName = currentWeatherData.name;
  let favorites = getStoredArray(STORAGE_KEYS.FAVORITES);
  
  const index = favorites.findIndex(c => c.toLowerCase() === cityName.toLowerCase());
  if (index >= 0) {
    favorites.splice(index, 1); // Remove
  } else {
    favorites.push(cityName); // Add
  }

  saveStoredArray(STORAGE_KEYS.FAVORITES, favorites);
  updateFavoriteStar(cityName);
  renderFavoriteCities();
}

function updateFavoriteStar(cityName) {
  const favorites = getStoredArray(STORAGE_KEYS.FAVORITES);
  const isFav = favorites.some(c => c.toLowerCase() === cityName.toLowerCase());
  els.favoriteToggleBtn.classList.toggle("active", isFav);
  els.favoriteToggleBtn.title = isFav ? "Remove from Favorites" : "Add to Favorites";
}

function renderFavoriteCities() {
  const favorites = getStoredArray(STORAGE_KEYS.FAVORITES);
  els.favoriteList.innerHTML = "";

  if (favorites.length === 0) {
    els.favoriteList.innerHTML = `<span class="empty-state">No favorite cities saved. Click ⭐ to add one!</span>`;
    return;
  }

  favorites.forEach((city) => {
    const chip = document.createElement("div");
    chip.className = "chip-btn";
    
    const cityText = document.createElement("span");
    cityText.textContent = `⭐ ${city}`;
    cityText.addEventListener("click", () => {
      els.cityInput.value = city;
      loadWeatherForCity(city);
    });

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-fav";
    removeBtn.textContent = "✖";
    removeBtn.title = "Remove favorite";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFavoriteCity(city);
    });

    chip.appendChild(cityText);
    chip.appendChild(removeBtn);
    els.favoriteList.appendChild(chip);
  });
}

function removeFavoriteCity(cityName) {
  let favorites = getStoredArray(STORAGE_KEYS.FAVORITES);
  favorites = favorites.filter(c => c.toLowerCase() !== cityName.toLowerCase());
  saveStoredArray(STORAGE_KEYS.FAVORITES, favorites);
  
  if (currentWeatherData && currentWeatherData.name.toLowerCase() === cityName.toLowerCase()) {
    updateFavoriteStar(cityName);
  }
  renderFavoriteCities();
}

// ==========================================================================
// 11. UI STATE HELPERS (LOADING & NOTIFICATIONS)
// ==========================================================================
function showLoading() {
  els.loadingContainer.style.display = "flex";
  els.searchBtn.disabled = true;
  els.locationBtn.disabled = true;
  els.searchBtn.innerHTML = `<span>⏳ Loading...</span>`;
}

function hideLoading() {
  els.loadingContainer.style.display = "none";
  els.searchBtn.disabled = false;
  els.locationBtn.disabled = false;
  els.searchBtn.innerHTML = `<span>🔍 Search</span>`;
}

function showError(msg) {
  els.messageBanner.textContent = msg;
  els.messageBanner.className = "message-banner error";
  els.messageBanner.style.display = "flex";
}

function showInfo(msg) {
  els.messageBanner.textContent = msg;
  els.messageBanner.className = "message-banner info";
  els.messageBanner.style.display = "flex";
}

function clearMessage() {
  els.messageBanner.style.display = "none";
  els.messageBanner.textContent = "";
}

function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getCountryName(countryCode) {
  if (!countryCode) return "";
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

// ==========================================================================
// 12. FALLBACK MOCK DATA ENGINE (FOR DEMO / UNCONFIGURED API KEY)
// ==========================================================================
/**
 * Generates realistic weather mock data when user tests app before configuring API key.
 */
function mockFetchWeather(cityName = "Bulawayo", lat = -20.15, lon = 28.58) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const cleanCity = cityName.trim();
      if (cleanCity.toLowerCase() === "invalidcity123") {
        return reject(new Error(`City "${cleanCity}" not found. Please check the spelling.`));
      }

      const formattedName = capitalizeFirstLetter(cleanCity);
      const isHarare = formattedName.toLowerCase().includes("harare");
      const isLondon = formattedName.toLowerCase().includes("london");
      const isTokyo = formattedName.toLowerCase().includes("tokyo");

      let mockCountry = "ZW";
      let mockTemp = 28.4;
      let mockCondition = { main: "Clear", description: "clear sky", icon: "01d" };
      let mockTz = 7200; // UTC+2

      if (isLondon) {
        mockCountry = "GB";
        mockTemp = 17.2;
        mockCondition = { main: "Clouds", description: "broken clouds", icon: "04d" };
        mockTz = 3600;
      } else if (isTokyo) {
        mockCountry = "JP";
        mockTemp = 22.8;
        mockCondition = { main: "Rain", description: "light rain", icon: "10d" };
        mockTz = 32400;
      } else if (isHarare) {
        mockCountry = "ZW";
        mockTemp = 26.5;
        mockCondition = { main: "Clear", description: "clear sky", icon: "01d" };
        mockTz = 7200;
      }

      const nowSec = Math.floor(Date.now() / 1000);

      resolve({
        coord: { lat, lon },
        weather: [mockCondition],
        main: {
          temp: mockTemp,
          feels_like: mockTemp + 1.2,
          humidity: 45,
          pressure: 1015,
          temp_min: mockTemp - 3,
          temp_max: mockTemp + 4
        },
        visibility: 10000,
        wind: { speed: 4.2 },
        sys: {
          country: mockCountry,
          sunrise: nowSec - 28000,
          sunset: nowSec + 16000
        },
        timezone: mockTz,
        name: formattedName
      });
    }, 400);
  });
}

function mockFetchForecast(cityName = "Bulawayo") {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const list = [];
      const weatherKinds = [
        { main: "Clear", description: "clear sky", icon: "01d" },
        { main: "Clouds", description: "few clouds", icon: "02d" },
        { main: "Rain", description: "light rain", icon: "10d" },
        { main: "Clouds", description: "scattered clouds", icon: "03d" },
        { main: "Clear", description: "sunny", icon: "01d" }
      ];

      for (let i = 0; i < 40; i++) {
        const itemTime = nowSec + (i * 10800); // 3-hour steps
        const dayIdx = Math.floor(i / 8) % weatherKinds.length;
        const tempBase = 24 + 5 * Math.sin(i / 3);

        list.push({
          dt: itemTime,
          main: {
            temp: tempBase,
            temp_min: tempBase - 4,
            temp_max: tempBase + 4
          },
          weather: [weatherKinds[dayIdx]],
          pop: dayIdx === 2 ? 0.75 : 0.1
        });
      }

      resolve({
        city: { name: cityName, timezone: 7200 },
        list
      });
    }, 400);
  });
}

function mockFetchAirQuality() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        list: [{
          main: { aqi: 1 },
          components: {
            co: 210.3,
            no2: 8.5,
            o3: 42.1,
            pm2_5: 5.2,
            pm10: 12.4
          }
        }]
      });
    }, 300);
  });
}
