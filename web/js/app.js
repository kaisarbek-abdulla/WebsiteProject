// Multi-page app with client-side routing
// Use dynamic API base so mobile devices can call the same host/IP the page was served from.
// The API_BASE helper adapts to the host and protocol of the current page, avoiding hardcoded URLs.

const API_BASE = (function () {
  try {
    const host = window.location.host; // includes port
    const protocol = window.location.protocol;
    return `${protocol}//${host}/api`;
  } catch (e) {
    return "http://localhost:5000/api";
  }
})();

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("../sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

let currentUser = null;
let authToken = localStorage.getItem("authToken") || null;
// language support
let currentLang =
  localStorage.getItem("lang") ||
  (navigator.language.startsWith("ru")
    ? "ru"
    : navigator.language.startsWith("kk")
      ? "kz"
      : "en");
const translations = {
  en: {
    welcome: "Welcome",
    dashboard: "Dashboard",
    symptoms: "Symptoms",
    reminders: "Reminders",
    devices: "Devices",
    vitals: "Vitals",
    nutrition: "Nutrition",
    reports: "Reports",
    complaints: "Complaints",
    profile: "Profile",
    logout: "Logout",
    analyze: "Analyze",
    symptomAnalysis: "Symptom Analysis",
    yourSymptoms: "Your Symptoms",
    aiAnalysis: "AI Analysis",
    detectedSymptoms: "Detected Symptoms",
    noSpecificSymptomsDetected: "No specific symptoms detected",
    severityLevel: "Severity Level",
    important: "Important:",
    analysisDisclaimer:
      "This analysis is for informational purposes only and is not a substitute for professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.",
    close: "Close",
    describeSymptoms: "Describe your symptoms",
    symptomPlaceholder: "e.g. headache, fatigue, sore throat...",
    example: "e.g.",
    symptomReports: "Symptom Reports",
    activeReminders: "Active Reminders",
    connectedDevices: "Connected Devices",
    healthMetrics: "Health Metrics",
    reminders: "Reminders",
    connectedDevicesTitle: "Connected Devices",
    manageReminders: "Manage your health reminders",
    manageDevices: "Manage wearable devices",
    noReminders: "No reminders set",
    reminderMessage: "Reminder message",
    reminderPlaceholder: "e.g. Take medication at 9:00",
    noDevices: "No devices connected",
    noData: "No data",
    vitalsSubtitle: "Learn how your body is doing over time.",
    refreshVitals: "Refresh vitals",
    refreshingVitals: "Refreshing vitals...",
    recentReadings: "Recent readings",
    date: "Date",
    type: "Type",
    value: "Value",
    noReadingsAvailable: "No readings available",
    reportsSubtitle: "Download summaries and export data.",
    noReportsGenerated: "No reports generated",
    noComplaintsFound: "No complaints found.",
    history: "History",
    noSymptomsLogged: "No symptoms logged yet.",
    heartRate: "Heart Rate",
    bloodPressure: "Blood Pressure",
    oxygen: "Oxygen",
    steps: "Steps",
    weight: "Weight",
    temperature: "Temperature",
    pulse: "Pulse",
    breathing: "Breathing",
    symptomFocus: "Symptom Input",
    symptomExample: "e.g. headache, fever, cough",
    reminderSubtitle: "Stay on track with scheduled alerts.",
    addReminder: "+ Add reminder",
    noRemindersYet: "No reminders yet. Click above to add one.",
    deviceSubtitle: "Link smart watches and trackers for live data.",
    connectDevice: "Connect new device",
    connectNewDevice: "Connect New Device",
    deviceType: "Device Type",
    deviceName: "Device Name",
    deviceNameExample: "e.g. My Fitbit Charge 5",
    cancel: "Cancel",
    connect: "Connect",
    selectDeviceTypeAndName: "Please select device type and enter device name",
    deviceConnected: "Device connected successfully!",
    deviceConnectFailed: "Failed to connect device. Please try again.",
    nutritionSubtitle: "Log meals and monitor calories.",
    foodItem: "Food item",
    foodItemExample: "e.g. Banana",
    calories: "Calories",
    addFood: "Add",
    dailySummary: "Daily summary",
    totalCalories: "Total calories",
    noEntriesYet: "No entries yet",
    exportReports: "Export reports",
    complaintSubtitle: "Let us know what's wrong.",
    yourMessage: "Your message",
    submit: "Submit",
    previousSubmissions: "Previous submissions",
    noSubmissionsYet: "You haven't submitted anything yet.",
    reminderRequired: "Please enter a reminder message.",
    connectedLabel: "Connected",
    connectDate: "Connected",
    disconnect: "Disconnect",
    confirmDisconnect: "Are you sure you want to disconnect this device?",
    deviceDisconnected: "Device disconnected successfully!",
    deviceDisconnectFailed: "Failed to disconnect device. Please try again.",
    failedToLoadDevices: "Failed to load devices.",
    viewVitals: "View vitals",
    addReminderDialog: "Add reminder dialog (demo)",
    foodAddedDemo: "Food item added (demo)",
  },
  kz: {
    welcome: "Қош келдіңіз",
    dashboard: "Басқару панелі",
    symptoms: "Симптомдар",
    reminders: "Еске салғыштар",
    devices: "Құрылғылар",
    vitals: "Маңызды көрсеткіштер",
    nutrition: "Тамақтану",
    reports: "Есептер",
    complaints: "Шағымдар",
    profile: "Профиль",
    logout: "Шығу",
    analyze: "Талдау",
    symptomAnalysis: "Симптомдарды талдау",
    yourSymptoms: "Сіздің симптомдарыңыз",
    aiAnalysis: "AI талдамасы",
    detectedSymptoms: "Анықталған симптомдар",
    noSpecificSymptomsDetected: "Арнайы симптомдар табылмады",
    severityLevel: "Ауырлық деңгейі",
    important: "Маңызды:",
    analysisDisclaimer:
      "Бұл талдау ақпараттық мақсатта ғана және кәсіби медициналық кеңес орнына қолданылмайды. Дұрыс диагноз бен емдеу үшін дәрігерге қаралыңыз.",
    close: "Жабу",
    describeSymptoms: "Симптомдарыңызды сипаттаңыз",
    symptomPlaceholder: "мысалы: бас ауруы, температура, жөтел...",
    example: "мысалы",
    symptomReports: "Симптом есептері",
    activeReminders: "Қолданыстағы еске салғыштар",
    connectedDevices: "Қосылған құрылғылар",
    healthMetrics: "Денсаулық көрсеткіштері",
    reminders: "Еске салғыштар",
    connectedDevicesTitle: "Қосылған құрылғылар",
    manageReminders: "Денсаулық еске салғыштарын басқарыңыз",
    manageDevices: "Құрылғыларды басқарыңыз",
    noReminders: "Еске салғыштар жоқ",
    reminderMessage: "Еске салғыш мәтіні",
    reminderPlaceholder: "мысалы: 9:00-де дәрі қабылдау",
    noDevices: "Құрылғылар қосылмаған",
    noData: "Деректер жоқ",
    vitalsSubtitle: "Денеңіздің жағдайын уақыт өте келе қадағалаңыз.",
    refreshVitals: "Көрсеткіштерді жаңарту",
    refreshingVitals: "Көрсеткіштер жаңартылып жатыр...",
    recentReadings: "Жуықтағы көрсеткіштер",
    date: "Күн",
    type: "Тип",
    value: "Мән",
    noReadingsAvailable: "Көрсеткіштер жоқ",
    reportsSubtitle: "Қысқаша есеп пен экспортты жүктеп алыңыз.",
    noReportsGenerated: "Есептер жоқ",
    noComplaintsFound: "Шағымдар табылмады.",
    history: "Тарих",
    noSymptomsLogged: "Симптомдар сақталмады.",
    heartRate: "Жүрек соғысы",
    bloodPressure: "Қан қысымы",
    oxygen: "Оттегі",
    steps: "Қадамдар",
    weight: "Салмақ",
    temperature: "Температура",
    pulse: "Пульс",
    breathing: "Тыныс",
    symptomFocus: "Симптом енгізу",
    symptomExample: "мысалы: бас ауруы, ауыру, жөтел",
    reminderSubtitle: "Жоспарланған еске салғыштарды орындаңыз.",
    addReminder: "+ Еске салғыш қосу",
    noRemindersYet: "Еске салғыштар жоқ. Жоғарыдан қосыңыз.",
    deviceSubtitle: "Смарт-сағат пен трекерлерді жалғаңыз.",
    connectDevice: "Құрылғыны қосу",
    connectNewDevice: "Жаңа құрылғыны қосу",
    deviceType: "Құрылғы түрі",
    deviceName: "Құрылғының атауы",
    deviceNameExample: "мысалы: Менің Fitbit Charge 5",
    cancel: "Бас тарту",
    connect: "Қосу",
    selectDeviceTypeAndName: "Құрылғы түрін таңдаңыз және атын жазыңыз",
    deviceConnected: "Құрылғы сәтті қосылды!",
    deviceConnectFailed: "Құрылғыны қосу сәтсіз. Қайтадан көріңіз.",
    nutritionSubtitle: "Тамақтарды енгізіп, калорияны бақылаңыз.",
    foodItem: "Тағам атауы",
    foodItemExample: "мысалы: Банан",
    calories: "Калория",
    addFood: "Қосу",
    dailySummary: "Күндік қорытынды",
    totalCalories: "Жалпы калория",
    noEntriesYet: "Элементтер жоқ",
    exportReports: "Есепті экспорттау",
    complaintSubtitle: "Не дұрыс емес екенін айтыңыз.",
    yourMessage: "Хабарламаңыз",
    submit: "Жіберу",
    previousSubmissions: "Алдыңғы жіберілгендер",
    noSubmissionsYet: "Сіз әлі ештеңе жібермедіңіз.",
    reminderRequired: "Еске салғыш мәтінін енгізіңіз.",
    connectedLabel: "Қосылған",
    connectDate: "Қосылған",    
    disconnect: "Өшіру",
    confirmDisconnect: "Бұл құрылғыны ажыратқыңыз келетініне сенімдісіз бе?",
    deviceDisconnected: "Құрылғы сәтті ажыратылды!",
    deviceDisconnectFailed: "Құрылғыны ажырату сәтсіз өтті. Қайта көріңіз.",
    failedToLoadDevices: "Құрылғыларды жүктеу сәтсіз аяқталды.",
    viewVitals: "Көрсеткіштерді көру",
    addReminderDialog: "Еске салғыш диалогы (демо)",
    foodAddedDemo: "Тағам элементі қосылды (демо)",
  },
  ru: {
    welcome: "Добро пожаловать",
    dashboard: "Панель",
    symptoms: "Симптомы",
    reminders: "Напоминания",
    devices: "Устройства",
    vitals: "Показатели",
    nutrition: "Питание",
    reports: "Отчёты",
    complaints: "Жалобы",
    profile: "Профиль",
    logout: "Выйти",
    analyze: "Анализировать",
    symptomAnalysis: "Анализ симптомов",
    yourSymptoms: "Ваши симптомы",
    aiAnalysis: "AI-анализ",
    detectedSymptoms: "Обнаруженные симптомы",
    noSpecificSymptomsDetected: "Специфические симптомы не обнаружены",
    severityLevel: "Уровень тяжести",
    important: "Важно:",
    analysisDisclaimer:
      "Этот анализ предназначен только для информационных целей и не является заменой профессиональной медицинской помощи. Пожалуйста, обратитесь к врачу для постановки диагноза и лечения.",
    close: "Закрыть",
    describeSymptoms: "Опишите свои симптомы",
    symptomPlaceholder: "например: головная боль, температура, кашель...",
    example: "например",
    symptomReports: "Отчеты по симптомам",
    activeReminders: "Активные напоминания",
    connectedDevices: "Подключенные устройства",
    healthMetrics: "Показатели здоровья",
    reminders: "Напоминания",
    connectedDevicesTitle: "Подключенные устройства",
    manageReminders: "Управляйте напоминаниями",
    manageDevices: "Управляйте устройствами",
    noReminders: "Нет напоминаний",
    reminderMessage: "Текст напоминания",
    reminderPlaceholder: "например: принять лекарство в 9:00",
    noDevices: "Устройства не подключены",
    noData: "Нет данных",
    vitalsSubtitle: "Узнайте, как работает ваш организм с течением времени.",
    refreshVitals: "Обновить показатели",
    refreshingVitals: "Обновление показателей...",
    recentReadings: "Последние показания",
    date: "Дата",
    type: "Тип",
    value: "Значение",
    noReadingsAvailable: "Нет показаний",
    reportsSubtitle: "Скачайте сводки и экспортируйте данные.",
    noReportsGenerated: "Отчётов нет",
    noComplaintsFound: "Жалоб не найдено.",
    history: "История",
    noSymptomsLogged: "Симптомы не зарегистрированы.",
    heartRate: "Пульс",
    bloodPressure: "Артериальное давление",
    oxygen: "Кислород",
    steps: "Шаги",
    weight: "Вес",
    temperature: "Температура",
    pulse: "Пульс",
    breathing: "Дыхание",
    symptomFocus: "Поле симптомов",
    symptomExample: "например: головная боль, слабость, кашель",
    reminderSubtitle: "Следите за запланированными уведомлениями.",
    addReminder: "+ Добавить напоминание",
    noRemindersYet: "Напоминаний нет. Добавьте сверху.",
    deviceSubtitle: "Подключите умные часы и трекеры.",
    connectDevice: "Подключить устройство",
    connectNewDevice: "Подключить новое устройство",
    deviceType: "Тип устройства",
    deviceName: "Название устройства",
    deviceNameExample: "например: Мой Fitbit Charge 5",
    cancel: "Отмена",
    connect: "Подключить",
    selectDeviceTypeAndName:
      "Пожалуйста, выберите тип устройства и введите название",
    deviceConnected: "Устройство успешно подключено!",
    deviceConnectFailed: "Не удалось подключить устройство. Попробуйте снова.",
    nutritionSubtitle: "Записывайте питание и контролируйте калории.",
    foodItem: "Блюдо",
    foodItemExample: "например: Банан",
    calories: "Калории",
    addFood: "Добавить",
    dailySummary: "Ежедневный отчет",
    totalCalories: "Всего калорий",
    noEntriesYet: "Нет записей",
    exportReports: "Экспорт отчетов",
    complaintSubtitle: "Расскажите нам, что не так.",
    yourMessage: "Ваше сообщение",
    submit: "Отправить",
    previousSubmissions: "Предыдущие отправки",
    noSubmissionsYet: "Вы ещё ничего не отправили.",
    reminderRequired: "Пожалуйста, введите текст напоминания.",
    connectedLabel: "Подключено",
    connectDate: "Подключено",
    disconnect: "Отключить",
    confirmDisconnect: "Вы уверены, что хотите отключить это устройство?",
    deviceDisconnected: "Устройство успешно отключено!",
    deviceDisconnectFailed: "Не удалось отключить устройство. Пожалуйста, попробуйте снова.",
    failedToLoadDevices: "Не удалось загрузить устройства.",
    viewVitals: "Просмотреть показатели",
    addReminderDialog: "Диалог добавления напоминания (демо)",
    foodAddedDemo: "Блюдо добавлено (демо)",
  },
};
function t(key) {
  return translations[currentLang] && translations[currentLang][key]
    ? translations[currentLang][key]
    : key;
}
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  render();
}

function applyTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  if (normalized === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("dark-mode");
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.body.classList.remove("dark-mode");
  }
  localStorage.setItem("theme", normalized);
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  applyTheme(isDark ? "light" : "dark");
}

// initialize theme from localStorage or system preference
const storedTheme = localStorage.getItem("theme");
const initialTheme =
  storedTheme === "dark" || storedTheme === "light"
    ? storedTheme
    : window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
applyTheme(initialTheme);

// Restore currentUser from localStorage
if (localStorage.getItem("currentUser")) {
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser"));
  } catch (e) {
    console.error("Failed to parse stored currentUser");
    currentUser = null;
  }
}

// Fetch with auth header
async function apiCall(endpoint, method = "GET", body = null) {
  // wrap fetch with common headers, error handling, and auth
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        if (body && body.error) message = body.error;
        else if (body && body.message) message = body.message;
      } catch (e) {
        // ignore parse errors
      }

      if (res.status === 401) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        navigate("login");
        throw new Error(message || "Unauthorized");
      }
      throw new Error(message || `API Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("API call failed:", err);
    alert(`Error: ${err.message}`);
    throw err;
  }
}

// Simple routing
function getInitialPage() {
  const hashPage = window.location.hash.replace("#", "");
  if (hashPage) return hashPage;
  const savedPage = localStorage.getItem("currentPage");
  if (savedPage) return savedPage;
  return "dashboard";
}

let currentPage = getInitialPage();

function navigate(page, updateUrl = true) {
  currentPage = page;
  if (updateUrl) {
    window.location.hash = page;
  }
  if (page !== "login" && page !== "register") {
    localStorage.setItem("currentPage", page);
  }
  document.body.classList.toggle(
    "auth-page",
    page === "login" || page === "register",
  );
  render();
}

window.addEventListener("hashchange", () => {
  const page = window.location.hash.replace("#", "") || "dashboard";
  navigate(page, false);
});

function render() {
  const root = document.getElementById("app-root");
  if (!root) return;

  // Add class for auth page center layout
  const isAuthPage = currentPage === "login" || currentPage === "register";
  document.body.classList.toggle("auth-page", isAuthPage);

  // Show login if not authenticated
  if (!authToken && currentPage !== "login" && currentPage !== "register") {
    currentPage = "login";
    document.body.classList.add("auth-page");
  }

  switch (currentPage) {
    case "login":
      root.innerHTML = renderLogin();
      attachLoginHandlers();
      break;
    case "register":
      root.innerHTML = renderRegister();
      attachRegisterHandlers();
      break;
    case "dashboard":
      root.innerHTML = renderDashboard();
      attachDashboardHandlers();
      break;
    case "symptoms":
      root.innerHTML = renderSymptoms();
      attachSymptomsHandlers();
      break;
    case "reminders":
      root.innerHTML = renderReminders();
      attachRemindersHandlers();
      break;
    case "devices":
      root.innerHTML = renderDevices();
      attachDevicesHandlers();
      break;
    case "vitals":
      root.innerHTML = renderVitals();
      attachVitalsHandlers();
      break;
    case "nutrition":
      root.innerHTML = renderNutrition();
      break;
    case "reports":
      root.innerHTML = renderReports();
      attachReportsHandlers();
      break;
    case "profile":
      root.innerHTML = renderProfile();
      attachProfileHandlers();
      break;
    case "complaints":
      root.innerHTML = renderComplaints();
      attachComplaintsHandlers();
      break;
    default:
      root.innerHTML = renderDashboard();
  }
}

// ===== LOGIN PAGE =====
function renderLogin() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <img src="/assets/images/icon-192.png" alt="PULSE Logo" class="logo-large">
        <h1>Healthcare Virtual Assistant</h1>
        <p>Sign in to your account</p>
        
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="login-email" placeholder="user@example.com" />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-password" placeholder="••••••••" />
        </div>
        
        <button id="login-btn" class="btn primary full">Sign In</button>
        
        <p class="auth-switch">
          Don't have an account? <a href="#" onclick="navigate('register'); return false;">Create one now</a>
        </p>
      </div>
    </div>
  `;
}

function attachLoginHandlers() {
  document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const data = await apiCall("/auth/login", "POST", { email, password });
      authToken = data.token;
      localStorage.setItem("authToken", authToken);
      currentUser = {
        id: data.userId,
        role: data.role,
        email: data.email,
        name: data.name,
      };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      navigate("dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      alert(
        "Login failed: " + (err.message || "Please check your credentials"),
      );
    }
  });
}

// ===== REGISTER PAGE =====
function renderRegister() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <img src="/assets/images/icon-192.png" alt="PULSE Logo" class="logo-large">
        <h1>Create Your Account</h1>
        <p>Get started with Healthcare Virtual Assistant</p>
        
        <div class="form-group">
          <label>👤 Full Name</label>
          <input type="text" id="register-name" placeholder="John Doe" />
        </div>
        
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="register-email" placeholder="user@example.com" />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="register-password" placeholder="••••••••" />
        </div>

        <div class="form-group">
          <label>👨‍⚕️ I am a...</label>
          <select id="register-role">
            <option value="patient">🏥 Patient</option>
            <option value="doctor">👨‍⚕️ Doctor</option>
          </select>
        </div>
        
        <button id="register-btn" class="btn primary full">Create Account</button>
        
        <p class="auth-switch">
          Already have an account? <a href="#" onclick="navigate('login'); return false;">Sign in here</a>
        </p>
      </div>
    </div>
  `;
}

function attachRegisterHandlers() {
  document
    .getElementById("register-btn")
    .addEventListener("click", async () => {
      const name = document.getElementById("register-name").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document
        .getElementById("register-password")
        .value.trim();
      const role = document.getElementById("register-role").value;

      if (!name || !email || !password) {
        alert("Please fill in all fields");
        return;
      }

      try {
        const data = await apiCall("/auth/register", "POST", {
          name,
          email,
          password,
          role,
          language: "en",
        });
        authToken = data.token;
        localStorage.setItem("authToken", authToken);
        currentUser = {
          id: data.userId,
          role: data.role,
          email: data.email,
          name: data.name,
        };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        navigate("dashboard");
      } catch (err) {
        console.error("Registration failed:", err);
        alert(
          "Registration failed: " + (err.message || "Could not create account"),
        );
      }
    });
}

// ===== DASHBOARD PAGE =====
function renderDashboard() {
  const role = currentUser ? currentUser.role : "patient";
  if (role === "doctor") {
    return renderDoctorDashboard();
  } else if (role === "admin") {
    return renderAdminDashboard();
  } else {
    return renderPatientDashboard();
  }
}

function renderPatientDashboard() {
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]");
  const reminderCount = reminders.length;
  const vitalsCount = JSON.parse(localStorage.getItem("userVitals") || "[]").length;
  const devicesCount = JSON.parse(localStorage.getItem("localDevices") || "[]").length;
  return `
    ${renderHeader()}
    ${renderNav()}
    
    <main class="container">
      <section class="row top-row">
        <div class="col-lg-8">
          <div class="card symptom-card">
            <h3>${t("symptomAnalysis")}</h3>
            <p class="muted">${t("describeSymptoms")}</p>
            <textarea id="symptom-input" placeholder="${t("symptomPlaceholder")}"></textarea>
            <div class="actions">
              <button id="analyze-btn" class="btn primary">
                <span class="btn-icon">🔍</span> ${t("analyze")}
                <span class="spinner" style="display:none; margin-left:8px;">⏳</span>
              </button>
            </div>
            <div id="analysis-result" style="margin-top:12px; display:none; padding:12px; background:#e8f5e9; border-radius:8px; color:#1b5e20;"></div>
          </div>
        </div>
        <div class="col-lg-4 stats-col">
          <div class="card stats-grid">
            <div class="stat">
              <div class="stat-title">${t("symptomReports")}</div>
              <div class="stat-value">${Math.max(0, vitalsCount)}</div>
              <div class="stat-sub">${t("symptomReports")}</div>
            </div>
            <div class="stat">
              <div class="stat-title">${t("activeReminders")}</div>
              <div class="stat-value">${reminderCount}</div>
              <div class="stat-sub">${t("manageReminders")}</div>
            </div>
            <div class="stat">
              <div class="stat-title">${t("connectedDevicesTitle")}</div>
              <div class="stat-value">${devicesCount}</div>
              <div class="stat-sub">${t("manageDevices")}</div>
            </div>
            <div class="stat">
              <div class="stat-title">${t("healthMetrics")}</div>
              <div class="stat-value">${vitalsCount}</div>
              <div class="stat-sub">${t("healthMetrics")}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="row cards-row">
        <div class="card wide">
          <h4>${t("healthMetrics")}</h4>
          <div class="metrics-list">
            <div class="metric"> <div class="metric-icon">💓</div>
              <div class="metric-label">${t("heartRate")}</div>
              <div class="metric-value">${t("noData")}</div>
            </div>
            <div class="metric"> <div class="metric-icon">🩺</div>
              <div class="metric-label">${t("bloodPressure")}</div>
              <div class="metric-value">${t("noData")}</div>
            </div>
            <div class="metric"> <div class="metric-icon">🫁</div>
              <div class="metric-label">${t("oxygen")}</div>
              <div class="metric-value">${t("noData")}</div>
            </div>
            <div class="metric"> <div class="metric-icon">🥾</div>
              <div class="metric-label">${t("steps")}</div>
              <div class="metric-value">${t("noData")}</div>
            </div>
            <div class="metric"> <div class="metric-icon">⚖️</div>
              <div class="metric-label">${t("weight")}</div>
              <div class="metric-value">${t("noData")}</div>
            </div>
            <div class="metric"> <div class="metric-icon">🌡️</div>
              <div class="metric-label">${t("temperature")}</div>
              <div class="metric-value">${t("noData")}</div>
            </div>
          </div>
          <div style="margin-top:12px; text-align:right;"><button id="dashboard-vitals-btn" class="btn primary">${t("viewVitals")}</button></div>
        </div>
      </section>

      <section class="row lower-row">
        <div class="card half">
          <h4>${t("reminders")}</h4>
          <p class="muted">${t("manageReminders")}</p>
          <div class="empty-state">🔔 ${t("noReminders")}</div>
        </div>
        <div class="card half">
          <h4>${t("connectedDevicesTitle")}</h4>
          <p class="muted">${t("manageDevices")}</p>
          <div class="empty-state">⌚ ${t("noDevices")}</div>
        </div>
      </section>
    </main>

    ${renderFooter()}
  `;
}

function renderDoctorDashboard() {
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="card">
        <h2>Doctor Dashboard</h2>
        <p>View and manage your patients.</p>
        <div id="patients-list"></div>
      </div>
    </main>${renderFooter()}`;
}

function renderAdminDashboard() {
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="admin-section">
        <h2 class="section-title">👥 User Management</h2>
        <p class="section-subtitle">Manage system users, roles, and permissions</p>
        <div id="users-grid" class="users-grid"></div>
      </div>

      <div class="admin-section complaints-section">
        <h2 class="section-title">📋 System Complaints</h2>
        <p class="section-subtitle">Review and manage user complaints</p>
        <div id="complaints-list"></div>
      </div>
    </main>

    <!-- User Edit Modal -->
    <div id="user-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit User</h3>
          <button onclick="closeUserModal()" class="modal-close">&times;</button>
        </div>
        <div id="modal-content"></div>
      </div>
    </div>
    ${renderFooter()}`;
}

function attachDashboardHandlers() {
  const role = currentUser ? currentUser.role : "patient";
  if (role === "patient") {
    attachPatientDashboardHandlers();
  } else if (role === "doctor") {
    attachDoctorDashboardHandlers();
  } else if (role === "admin") {
    attachAdminDashboardHandlers();
  }
}

function attachPatientDashboardHandlers() {
  const analyzeBtn = document.getElementById("analyze-btn");
  const symptomInput = document.getElementById("symptom-input");
  const resultDiv = document.getElementById("analysis-result");

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      const text = symptomInput.value.trim();
      if (!text) {
        alert("Please enter symptoms to analyze");
        return;
      }

      try {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Analyzing...";

        const result = await apiCall("/symptoms/analyze", "POST", { text });
        if (!result || typeof result !== "object") {
          throw new Error("Invalid analysis response from server.");
        }

        // normalize fields with defaults so UI doesn't break
        const detectedSymptoms = Array.isArray(result.detectedSymptoms)
          ? result.detectedSymptoms
          : [];
        const symptomsCount =
          typeof result.symptomsCount === "number"
            ? result.symptomsCount
            : detectedSymptoms.length;
        const urgency = result.urgency || "";
        const severityVal = result.severity || "Low";
        const conditions = Array.isArray(result.conditions)
          ? result.conditions
          : [];
        const analysisText =
          result.analysis ||
          result.aiAnalysis ||
          result.text ||
          "No analysis available.";
        const treatments = Array.isArray(result.treatments)
          ? result.treatments
          : [];
        const diagnosticTests = Array.isArray(result.diagnosticTests)
          ? result.diagnosticTests
          : [];
        const healthAdvice = Array.isArray(result.healthAdvice)
          ? result.healthAdvice
          : [];
        const disclaimer =
          result.disclaimer ||
          "This analysis is for educational purposes only. Consult a healthcare professional.";

        resultDiv.style.display = "block";
        let html = `<strong style="font-size:1.2em; color:#1a1a1a;">📋 Comprehensive Analysis Result</strong><br><hr style="margin:10px 0; border:none; border-top:2px solid #e0e0e0;"><br>`;

        // Symptoms detected summary
        if (detectedSymptoms.length > 0) {
          html += `<div style="margin-bottom:12px; padding:10px; background-color:#e8f5e9; border-left:4px solid #4caf50; border-radius:4px;"><strong>🔍 Symptoms Detected:</strong> <span style="color:#2e7d32; font-weight:bold;">${symptomsCount}</span> - ${detectedSymptoms.map((s) => "<strong>" + s.charAt(0).toUpperCase() + s.slice(1) + "</strong>").join(", ")}</div>`;
        }

        // Urgency alert with enhanced styling
        const urgencyText = typeof urgency === "string" ? urgency : "";
        if (urgencyText === "URGENT") {
          html += `<div style="color:#fff; background-color:#d32f2f; padding:14px; border-radius:6px; margin-bottom:12px; font-weight:bold; border:2px solid #b71c1c;">⚠️ URGENT ALERT: Call 911 immediately - This requires emergency medical attention!</div>`;
        } else if (
          urgencyText.includes("ER") ||
          urgencyText.includes("Emergency")
        ) {
          html += `<div style="color:#fff; background-color:#f57c00; padding:14px; border-radius:6px; margin-bottom:12px; font-weight:bold; border:2px solid #e65100;">🚨 Emergency Alert: ${urgencyText} - Seek emergency care immediately!</div>`;
        } else if (
          urgencyText.includes("Consult") ||
          urgencyText.includes("See")
        ) {
          html += `<div style="color:#d32f2f; background-color:#ffebee; padding:12px; border-radius:6px; margin-bottom:12px; border-left:4px solid #d32f2f;"><strong>⏱️ Recommended Action:</strong> ${urgencyText}</div>`;
        }

        // Severity with visual indicator
        const severityColors = {
          High: { bg: "#ffcdd2", text: "#d32f2f" },
          Medium: { bg: "#ffe0b2", text: "#f57c00" },
          "Low-Medium": { bg: "#fff9c4", text: "#f9a825" },
          Low: { bg: "#e8f5e9", text: "#388e3c" },
        };
        const sColor = severityColors[severityVal] || severityColors["Low"];
        html += `<div style="margin-bottom:12px; padding:10px; background-color:${sColor.bg}; border-radius:4px; border-left:4px solid ${sColor.text};"><strong>📊 Severity Level:</strong> <span style="color:${sColor.text}; font-weight:bold; font-size:1.05em;">${severityVal}</span></div>`;

        // Possible conditions
        html += `<div style="margin-bottom:12px;"><strong>🏥 Possible Conditions (${conditions.length}):</strong><div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">`;
        conditions.forEach((cond) => {
          html += `<span style="background-color:#e3f2fd; color:#1565c0; padding:6px 12px; border-radius:20px; font-size:0.9em;">${cond}</span>`;
        });
        html += `</div></div>`;

        // Detailed Analysis
        const analysisLines = analysisText.split("\n").filter((l) => l.trim());
        html += `<div style="margin-bottom:12px; padding:12px; background-color:#f5f5f5; border-left:5px solid #2b67ff; border-radius:4px;"><strong style="font-size:1.05em;">📝 Detailed Analysis:</strong><br><div style="margin-top:8px; line-height:1.6; color:#333;">`;
        analysisLines.forEach((line, idx) => {
          if (
            line.includes("⚠️") ||
            line.includes("Multiple") ||
            line.includes("ALERT")
          ) {
            html += `<div style="color:#d32f2f; font-weight:600; margin-bottom:4px;">${line}</div>`;
          } else if (line.startsWith("•")) {
            html += `<div style="margin-left:12px; margin-bottom:4px; color:#555;">${line}</div>`;
          } else {
            html += `<div style="margin-bottom:4px; color:#333;">${line}</div>`;
          }
        });
        html += `</div></div>`;

        // Treatments
        if (result.treatments && result.treatments.length > 0) {
          html += `<div style="margin-bottom:12px; padding:12px; background-color:#f3e5f5; border-left:4px solid:#7b1fa2; border-radius:4px;"><strong>💊 Treatment Recommendations:</strong><ul style="margin:8px 0; padding-left:20px;">`;
          result.treatments.forEach((treatment) => {
            html += `<li style="margin-bottom:6px; color:#4a148c;">${treatment}</li>`;
          });
          html += `</ul></div>`;
        }

        // Diagnostic tests
        if (result.diagnosticTests && result.diagnosticTests.length > 0) {
          html += `<div style="margin-bottom:12px; padding:12px; background-color:#e0f2f1; border-left:4px solid #00695c; border-radius:4px;"><strong>🔬 Recommended Diagnostic Tests:</strong><ul style="margin:8px 0; padding-left:20px;">`;
          result.diagnosticTests.slice(0, 8).forEach((test) => {
            html += `<li style="margin-bottom:6px;"><code style="background-color:#ffffff; padding:4px 8px; border-radius:3px; border:1px solid #b2dfdb; color:#00695c; font-weight:500;">${test}</code></li>`;
          });
          if (result.diagnosticTests.length > 8) {
            html += `<li style="color:#666; font-style:italic;">+ ${result.diagnosticTests.length - 8} more tests</li>`;
          }
          html += `</ul></div>`;
        }

        // Health advice
        if (result.healthAdvice && result.healthAdvice.length > 0) {
          html += `<div style="margin-bottom:12px; padding:12px; background-color:#fef3e2; border-left:4px solid #ff6f00; border-radius:4px;"><strong>💡 Health Tips & Advice:</strong><ul style="margin:8px 0; padding-left:20px;">`;
          result.healthAdvice.slice(0, 6).forEach((advice) => {
            html += `<li style="margin-bottom:6px; color:#e65100;">${advice}</li>`;
          });
          if (result.healthAdvice.length > 6) {
            html += `<li style="color:#999; font-style:italic;">+ ${result.healthAdvice.length - 6} more tips</li>`;
          }
          html += `</ul></div>`;
        }

        // When to seek help box
        html += `<div style="margin-bottom:12px; padding:12px; background-color:#fff3cd; border:2px solid #ff9800; border-radius:4px;"><strong style="color:#ff6f00;">⚠️ Seek Immediate Medical Care If:</strong><ul style="margin:8px 0; padding-left:20px; color:#d84315;">
          <li>Symptoms worsen suddenly</li>
          <li>Difficulty breathing or chest pain develops</li>
          <li>Loss of consciousness or severe confusion</li>
          <li>Severe allergic reactions or difficulty swallowing</li>
          <li>Symptoms persist or new symptoms appear</li>
        </ul></div>`;

        // Disclaimer
        html += `<div style="font-size:0.9em; color:#d32f2f; background-color:#fff3e0; margin-top:16px; padding:14px; border-left:5px solid #d32f2f; border-radius:4px; border: 1px solid #ffb74d;"><strong>⚖️ Medical Disclaimer:</strong><br><span style="line-height:1.6;">${disclaimer} <strong>Always consult with a healthcare professional for proper diagnosis and treatment.</strong></span></div>`;

        resultDiv.innerHTML = html;

        analyzeBtn.textContent = "Analyze";
        analyzeBtn.disabled = false;
      } catch (err) {
        resultDiv.style.display = "block";
        resultDiv.innerHTML = `<strong style="color:#d32f2f; font-size:1.05em;">❌ Analysis Error:</strong><br><div style="margin-top:8px; color:#666;">${err.message}</div>`;
        analyzeBtn.textContent = "Analyze";
        analyzeBtn.disabled = false;
      }
    });
  }

  const vitalsBtn = document.getElementById("dashboard-vitals-btn");
  if (vitalsBtn) {
    vitalsBtn.addEventListener("click", () => {
      navigate("vitals");
    });
  }
}

function attachDoctorDashboardHandlers() {
  loadPatients();
}

async function loadPatients() {
  try {
    const patients = await apiCall("/auth/patients/all", "GET");
    const listDiv = document.getElementById("patients-list");
    if (patients.length === 0) {
      listDiv.innerHTML = "<p>No patients found.</p>";
      return;
    }
    let html = "<h3>Patients</h3><ul>";
    patients.forEach((p) => {
      html += `<li><strong>${p.name}</strong> (${p.email}) - Age: ${p.profile.age || "N/A"}, Height: ${p.profile.height || "N/A"}, Weight: ${p.profile.weight || "N/A"}</li>`;
    });
    html += "</ul>";
    listDiv.innerHTML = html;
  } catch (err) {
    console.error("Load patients failed:", err);
  }
}

function attachAdminDashboardHandlers() {
  loadUsers();
  loadComplaints();
}

async function loadUsers() {
  try {
    const users = await apiCall("/auth/users/all", "GET");
    const gridDiv = document.getElementById("users-grid");
    if (users.length === 0) {
      gridDiv.innerHTML = '<div class="empty-state">No users found.</div>';
      return;
    }
    let html = "";
    users.forEach((u) => {
      const roleColor =
        u.role === "admin"
          ? "var(--error)"
          : u.role === "doctor"
            ? "var(--primary)"
            : "var(--success)";
      const roleIcon =
        u.role === "admin" ? "👨‍💼" : u.role === "doctor" ? "👨‍⚕️" : "👤";
      html += `
        <div class="user-card" onclick="openEditUserModal('${u.id}', '${u.name}', '${u.email}', '${u.role}')">
          <div class="user-header">
            <div class="user-info">
              <div class="user-avatar">${roleIcon}</div>
              <div class="user-details">
                <h4>${u.name}</h4>
                <p>${u.email}</p>
              </div>
            </div>
            <span class="user-role" style="background:${roleColor}">${u.role}</span>
          </div>

          <div class="user-stats">
            <div class="user-stats-grid">
              <div><span>Age:</span> <strong>${u.profile?.age || "N/A"}</strong></div>
              <div><span>Height:</span> <strong>${u.profile?.height || "N/A"}</strong></div>
              <div><span>Weight:</span> <strong>${u.profile?.weight || "N/A"}</strong></div>
              <div><span>Joined:</span> <strong>${new Date(u.createdAt).toLocaleDateString()}</strong></div>
            </div>
          </div>

          <div class="user-actions">
            <button onclick="event.stopPropagation(); openEditUserModal('${u.id}', '${u.name}', '${u.email}', '${u.role}')" class="btn-small btn-edit">✏️ Edit</button>
            <button onclick="event.stopPropagation(); changeUserRole('${u.id}', '${u.role}')" class="btn-small btn-role">🔄 Role</button>
            <button onclick="event.stopPropagation(); confirmDeleteUser('${u.id}', '${u.name}')" class="btn-small btn-delete">🗑️ Delete</button>
          </div>
        </div>
      `;
    });
    gridDiv.innerHTML = html;
  } catch (err) {
    console.error("Load users failed:", err);
    document.getElementById("users-grid").innerHTML =
      '<div class="error-state">Failed to load users.</div>';
  }
}

function openEditUserModal(userId, name, email, role) {
  const modal = document.getElementById("user-modal");
  const content = document.getElementById("modal-content");
  content.innerHTML = `
    <form class="modal-form" onsubmit="handleUpdateUser(event, '${userId}')">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="edit-name" value="${name}" required>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="edit-email" value="${email}" required>
      </div>
      <div class="form-group">
        <label>Role</label>
        <select id="edit-role" value="${role}">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="submit" class="btn primary">Save Changes</button>
        <button type="button" onclick="closeUserModal()" class="btn secondary">Cancel</button>
      </div>
    </form>
  `;
  modal.style.display = "flex";
}

function closeUserModal() {
  document.getElementById("user-modal").style.display = "none";
}

async function handleUpdateUser(event, userId) {
  event.preventDefault();
  const name = document.getElementById("edit-name").value;
  const email = document.getElementById("edit-email").value;
  const role = document.getElementById("edit-role").value;

  try {
    await apiCall(`/auth/users/${userId}`, "PUT", { name, email, role });
    alert("User updated successfully!");
    closeUserModal();
    loadUsers();
  } catch (err) {
    console.error("Update failed:", err);
    alert("Failed to update user: " + err.message);
  }
}

async function changeUserRole(userId, currentRole) {
  const roles = ["patient", "doctor", "admin"];
  const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
  const confirm_msg = `Change user role from "${currentRole}" to "${nextRole}"?`;

  if (confirm(confirm_msg)) {
    try {
      await apiCall(`/auth/users/${userId}`, "PUT", { role: nextRole });
      alert(`Role changed to ${nextRole}!`);
      loadUsers();
    } catch (err) {
      console.error("Role change failed:", err);
      alert("Failed to change role: " + err.message);
    }
  }
}

function confirmDeleteUser(userId, userName) {
  if (
    confirm(
      `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
    )
  ) {
    deleteUser(userId, userName);
  }
}

async function deleteUser(userId, userName) {
  try {
    await apiCall(`/auth/users/${userId}`, "DELETE");
    alert(`User "${userName}" deleted successfully!`);
    loadUsers();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete user: " + err.message);
  }
}

async function loadComplaints() {
  try {
    const complaints = await apiCall("/complaints", "GET");
    const listDiv = document.getElementById("complaints-list");
    if (complaints.length === 0) {
      listDiv.innerHTML =
        '<div style="text-align:center; color:#99a0ac; padding:40px;">No complaints found.</div>';
      return;
    }
    let html = '<div style="display:grid; gap:12px;">';
    complaints.forEach((c) => {
      const statusColor =
        c.status === "pending"
          ? "#ff9800"
          : c.status === "resolved"
            ? "#4caf50"
            : "#99a0ac";
      const statusIcon =
        c.status === "pending" ? "⏳" : c.status === "resolved" ? "✅" : "❓";
      html += `
        <div style="background:white; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(20,30,60,0.06); border-left:4px solid ${statusColor};">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-size:12px; color:#99a0ac; margin-bottom:4px;">${new Date(c.createdAt).toLocaleString()}</div>
              <p style="margin:0; color:#0b0838; line-height:1.5;">${c.message}</p>
            </div>
            <span style="background:${statusColor}; color:white; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; text-transform:uppercase; margin-left:12px; white-space:nowrap;">${statusIcon} ${c.status}</span>
          </div>
          ${c.user ? `<div style="background:#f5f5f5; padding:8px 12px; border-radius:8px; font-size:12px; color:#0b0838;"><strong>User:</strong> ${c.user.name} (${c.user.email}) • <strong>Role:</strong> ${c.user.role}</div>` : ""}
        </div>
      `;
    });
    html += "</div>";
    listDiv.innerHTML = html;
  } catch (err) {
    console.error("Load complaints failed:", err);
    document.getElementById("complaints-list").innerHTML =
      '<p style="color:red; text-align:center;">Failed to load complaints.</p>';
  }
}

// ===== OTHER PAGES (STUB) =====
function renderSymptoms() {
  // form to log new symptom plus history list
  return `${renderHeader()}${renderNav()}<main class="container">
      <div class="page-header"><h2>${t("symptoms")}</h2><p class="subtitle">${t("describeSymptoms")}</p></div>
      <div class="card">
        <form id="symptom-form" class="modal-form">
          <div class="form-group">
            <label for="symptom-text">${t("yourSymptoms")}</label>
            <textarea id="symptom-text" placeholder="${t("symptomExample")}" required></textarea>
          </div>
          <button class="btn primary" onclick="submitSymptom(event)">${t("analyze")}</button>
        </form>
      </div>
      <div class="card">
        <h3>${t("history") || "History"}</h3>
        <div id="symptom-history" class="empty-state">${t("noSymptomsLogged") || "No symptoms logged yet."}</div>
      </div>
    </main>${renderFooter()}`;
}

function attachSymptomsHandlers() {
  loadSymptomHistory();
}

function renderReminders() {
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]");
  const listHtml =
    reminders.length === 0
      ? `<div class="empty-state">${t("noRemindersYet")}</div>`
      : `<ul class="reminders-list">${reminders
          .map(
            (r) =>
              `<li class="reminder-item"><strong>${new Date(r.createdAt).toLocaleString()}:</strong> ${r.message}</li>`,
          )
          .join("")}</ul>`;
  return `${renderHeader()}${renderNav()}<main class="container">
      <div class="page-header"><h2>${t("reminders")}</h2><p class="subtitle">${t("reminderSubtitle")}</p></div>
      <div class="card">
        <div class="form-group">
          <label>${t("reminderMessage")}</label>
          <input id="new-reminder-input" type="text" placeholder="${t("reminderPlaceholder")}"/>
        </div>
        <button id="add-reminder-btn" class="btn primary">${t("addReminder")}</button>
        <div id="reminders-list">${listHtml}</div>
      </div>
    </main>${renderFooter()}`;
}

function attachRemindersHandlers() {
  const addBtn = document.getElementById("add-reminder-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const textEl = document.getElementById("new-reminder-input");
      const text = textEl?.value.trim();
      if (!text) {
        alert(t("reminderRequired"));
        return;
      }
      const existing = JSON.parse(localStorage.getItem("reminders") || "[]");
      existing.push({
        id: Date.now(),
        message: text,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("reminders", JSON.stringify(existing));
      textEl.value = "";
      render();
    });
  }
}

function renderDevices() {
  return `${renderHeader()}${renderNav()}<main class="container">
      <div class="page-header"><h2>${t("devices")}</h2><p class="subtitle">${t("deviceSubtitle")}</p></div>
      <div class="card">
        <button class="btn primary" onclick="connectDevice()">${t("connectDevice")}</button>
        <div id="devices-list" class="empty-state">${t("noDevices")}</div>
      </div>
    </main>${renderFooter()}`;
}

function attachDevicesHandlers() {
  loadDevices();
}

function renderVitals() {
  return `${renderHeader()}${renderNav()}<main class="container">
      <div class="page-header"><h2>${t("vitals")}</h2><p class="subtitle">${t("vitalsSubtitle")}</p></div>
      <div class="card">
        <button id="refresh-vitals" class="btn primary">${t("refreshVitals")}</button>
      </div>
      <div class="stats-grid" id="vitals-grid">
        <div class="stat">${t("heartRate")}<br><div class="empty-chart">${t("noData")}</div></div>
        <div class="stat">${t("bloodPressure")}<br><div class="empty-chart">${t("noData")}</div></div>
        <div class="stat">${t("oxygen")}<br><div class="empty-chart">${t("noData")}</div></div>
        <div class="stat">${t("temperature")}<br><div class="empty-chart">${t("noData")}</div></div>
      </div>
      <div class="card" style="margin-top:24px;">
        <h3>${t("recentReadings")}</h3>
        <table style="width:100%; border-collapse:collapse;">
          <thead><tr><th>${t("date")}</th><th>${t("type")}</th><th>${t("value")}</th></tr></thead>
          <tbody id="vitals-table"><tr><td colspan="3" class="empty-state">${t("noReadingsAvailable")}</td></tr></tbody>
        </table>
      </div>
    </main>${renderFooter()}`;
}

function attachVitalsHandlers() {
  const refreshBtn = document.getElementById("refresh-vitals");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      alert(t("refreshingVitals"));
      render();
    });
  }
}

function renderNutrition() {
  const items = JSON.parse(localStorage.getItem("nutritionEntries") || "[]");
  const total = items.reduce((sum, item) => sum + (item.cal || 0), 0);
  const listHtml =
    items.length === 0
      ? `<div class="empty-state">${t("noEntriesYet")}</div>`
      : `<ul style="list-style:none; padding:0;">${items
          .map((item) => `<li>${item.food} — ${item.cal} kcal</li>`)
          .join("")}</ul>`;

  return `${renderHeader()}${renderNav()}<main class="container">
      <div class="page-header"><h2>${t("nutrition")}</h2><p class="subtitle">${t("nutritionSubtitle")}</p></div>
      <div class="card">
        <form id="nutrition-form" class="modal-form">
          <div class="form-group">
            <label>${t("foodItem")}</label>
            <input type="text" id="food-name" placeholder="${t("foodItemExample")}" required>
          </div>
          <div class="form-group">
            <label>${t("calories")}</label>
            <input type="number" id="food-cal" placeholder="200" required>
          </div>
          <button class="btn primary" id="add-food-btn">${t("addFood")}</button>
        </form>
      </div>
      <div class="card">
        <h3>${t("dailySummary")}</h3>
        <div>${t("totalCalories")}: <strong>${total} kcal</strong></div>
        <div id="nutrition-list">${listHtml}</div>
      </div>
    </main>${renderFooter()}`;
}

function renderReports() {
  const reports = JSON.parse(localStorage.getItem("userReports") || "[]");
  const reportList =
    reports.length === 0
      ? `<li class="empty-state">${t("noReportsGenerated")}</li>`
      : reports
          .map(
            (r) =>
              `<li>${new Date(r.createdAt).toLocaleString()}: ${r.title}</li>`,
          )
          .join("");
  return `${renderHeader()}${renderNav()}<main class="container">
      <div class="page-header"><h2>${t("reports")}</h2><p class="subtitle">${t("reportsSubtitle")}</p></div>
      <div class="card">
        <button id="export-report-btn" class="btn primary">${t("exportReports")}</button>
        <ul id="reports-list" style="list-style:none; padding:0; margin-top:12px;">${reportList}</ul>
      </div>
    </main>${renderFooter()}`;
}

function attachReportsHandlers() {
  const exportBtn = document.getElementById("export-report-btn");
  if (!exportBtn) return;
  exportBtn.addEventListener("click", () => {
    const reports = JSON.parse(localStorage.getItem("userReports") || "[]");
    const payload = {
      generatedAt: new Date().toISOString(),
      user: currentUser?.email || "guest",
      reports,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function renderComplaints() {
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="page-header"><h2>${t("complaints")}</h2><p class="subtitle">${t("complaintSubtitle")}</p></div>
      <div class="card">
        <form id="complaint-form" class="modal-form">
          <div class="form-group">
            <label>${t("yourMessage")}</label>
            <textarea id="complaint-text" required></textarea>
          </div>
          <button class="btn primary" onclick="submitComplaint(event)">${t("submit")}</button>
        </form>
      </div>
      <div class="card">
        <h3>${t("previousSubmissions")}</h3>
        <div id="complaints-history" class="empty-state">${t("noSubmissionsYet")}</div>
      </div>
    </main>
`;
}

function attachComplaintsHandlers() {
  loadComplaintsHistory();
}

async function loadComplaints() {
  try {
    const complaints = await apiCall("/complaints", "GET");
    const listDiv = document.getElementById("complaints-list");
    if (complaints.length === 0) {
      listDiv.innerHTML = `<p>${t("noComplaintsFound")}</p>`;
      return;
    }
    let html = "<h3>Your Complaints</h3><ul>";
    complaints.forEach((c) => {
      html += `<li><strong>${new Date(c.createdAt).toLocaleString()}</strong>: ${c.message} (${c.status})`;
      if (currentUser.role === "admin" && c.user) {
        html += ` - User: ${c.user.name} (${c.user.email}, ${c.user.role})`;
      }
      html += "</li>";
    });
    html += "</ul>";
    listDiv.innerHTML = html;
  } catch (err) {
    console.error("Load complaints failed:", err);
  }
}

function renderProfile() {
  if (!currentUser || !currentUser.profile) {
    return `<div class="container"><p>Loading profile...</p></div>`;
  }
  const profile = currentUser.profile || {};
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="card">
        <h2>Profile Settings</h2>
        <hr style="margin:16px 0; border:none; border-top:1px solid #e0e0e0;">
        
        <form id="profile-form">
          <div class="form-section" style="margin-bottom:24px;">
            <h3 style="margin-bottom:16px;">Personal Information</h3>
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="profile-name" value="${currentUser.name || ""}" placeholder="Enter your full name">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" value="${currentUser.email || ""}" disabled style="background-color:#f5f5f5; cursor:not-allowed;">
            </div>
            <div class="form-group">
              <label>Role</label>
              <input type="text" value="${{ patient: "Patient", doctor: "Doctor", admin: "Administrator" }[currentUser.role] || "User"}" disabled style="background-color:#f5f5f5; cursor:not-allowed;">
            </div>
          </div>
          
          <div class="form-section" style="margin-bottom:24px;">
            <h3 style="margin-bottom:16px;">Health Information</h3>
            <div class="form-group" style="display:inline-block; width:48%; margin-right:4%;">
              <label>Age (years)</label>
              <input type="number" id="profile-age" value="${profile.age || ""}" min="0" max="150" placeholder="Enter your age">
            </div>
            <div class="form-group" style="display:inline-block; width:48%;">
              <label>Blood Type</label>
              <select id="profile-bloodType">
                <option value="">-- Select Blood Type --</option>
                <option value="O+" ${profile.bloodType === "O+" ? "selected" : ""}>O+</option>
                <option value="O-" ${profile.bloodType === "O-" ? "selected" : ""}>O-</option>
                <option value="A+" ${profile.bloodType === "A+" ? "selected" : ""}>A+</option>
                <option value="A-" ${profile.bloodType === "A-" ? "selected" : ""}>A-</option>
                <option value="B+" ${profile.bloodType === "B+" ? "selected" : ""}>B+</option>
                <option value="B-" ${profile.bloodType === "B-" ? "selected" : ""}>B-</option>
                <option value="AB+" ${profile.bloodType === "AB+" ? "selected" : ""}>AB+</option>
                <option value="AB-" ${profile.bloodType === "AB-" ? "selected" : ""}>AB-</option>
              </select>
            </div>
            
            <div class="form-group" style="display:inline-block; width:32%; margin-right:2%;">
              <label>Height (cm)</label>
              <input type="number" id="profile-height" value="${profile.height || ""}" min="0" placeholder="cm">
            </div>
            <div class="form-group" style="display:inline-block; width:32%; margin-right:2%;">
              <label>Weight (kg)</label>
              <input type="number" id="profile-weight" value="${profile.weight || ""}" min="0" placeholder="kg" step="0.1">
            </div>
            <div class="form-group" style="display:inline-block; width:32%;">
              <label>Phone Number</label>
              <input type="tel" id="profile-phone" value="${profile.phoneNumber || ""}" placeholder="+1 (555) 000-0000">
            </div>
            
            <div class="form-group">
              <label>Allergies</label>
              <textarea id="profile-allergies" placeholder="List any known allergies (e.g., Penicillin, Peanuts)" style="min-height:60px;">${profile.allergies || ""}</textarea>
            </div>
            
            <div class="form-group">
              <label>Current Medications</label>
              <textarea id="profile-medications" placeholder="List current medications with dosages" style="min-height:60px;">${profile.medications || ""}</textarea>
            </div>
            
            <div class="form-group">
              <label>Medical History</label>
              <textarea id="profile-history" placeholder="Relevant medical history, conditions, surgeries, etc." style="min-height:80px;">${profile.medicalHistory || ""}</textarea>
            </div>
          </div>
          
          <div class="form-section">
            <h3 style="margin-bottom:16px;">Emergency Contact</h3>
            <div class="form-group">
              <label>Emergency Contact</label>
              <input type="text" id="profile-emergency" value="${profile.emergencyContact || ""}" placeholder="Name and phone number of emergency contact">
            </div>
          </div>
          
          <div style="margin-top:24px; display:flex; gap:12px;">
            <button type="submit" class="btn primary">Save Profile</button>
            <button type="button" class="btn" id="cancel-profile" style="background-color:#f5f5f5; color:#333;">Cancel</button>
            <button type="button" class="btn primary" id="logout-btn" style="background-color:#d32f2f; margin-left:auto;">Logout</button>
          </div>
        </form>
      </div>
    </main>
    ${renderFooter()}`;
}

function attachProfileHandlers() {
  if (!currentUser.profile) {
    // Load user profile data first
    (async () => {
      try {
        let userData;
        try {
          userData = await apiCall(`/auth/${currentUser.id}`, "GET");
        } catch (innerErr) {
          // If direct user fetch fails, try authenticated /auth/profile fallback
          if (
            innerErr.message.includes("404") ||
            innerErr.message.includes("not found")
          ) {
            userData = await apiCall(`/auth/profile`, "GET");
          } else {
            throw innerErr;
          }
        }

        currentUser = userData;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        // Re-render to show the loaded data
        render();
      } catch (err) {
        if (
          err.message.includes("404") ||
          err.message.includes("not found") ||
          err.message.includes("Unauthorized")
        ) {
          console.error("User account not found or deleted. Logging out...");
          alert("Your account was not found. You have been logged out.");
          logout();
        } else {
          console.error("Failed to load profile:", err);
          alert("Failed to load profile data. Please try again.");
          navigate("dashboard");
        }
      }
    })();
  } else {
    // Profile already loaded, attach handlers
    attachProfileFormHandlers();
  }
}

function attachProfileFormHandlers() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    logout();
  });

  document.getElementById("cancel-profile").addEventListener("click", () => {
    navigate("dashboard");
  });

  document
    .getElementById("profile-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const profileData = {
          name: document.getElementById("profile-name").value,
          profile: {
            age: document.getElementById("profile-age").value
              ? parseInt(document.getElementById("profile-age").value)
              : null,
            height: document.getElementById("profile-height").value
              ? parseInt(document.getElementById("profile-height").value)
              : null,
            weight: document.getElementById("profile-weight").value
              ? parseFloat(document.getElementById("profile-weight").value)
              : null,
            bloodType: document.getElementById("profile-bloodType").value,
            phoneNumber: document.getElementById("profile-phone").value,
            allergies: document.getElementById("profile-allergies").value,
            medications: document.getElementById("profile-medications").value,
            medicalHistory: document.getElementById("profile-history").value,
            emergencyContact:
              document.getElementById("profile-emergency").value,
          },
        };

        const result = await apiCall(
          `/auth/${currentUser.id}/profile`,
          "PUT",
          profileData,
        );
        currentUser = result;
        alert("Profile saved successfully!");
        navigate("profile");
      } catch (err) {
        alert("Error saving profile: " + err.message);
      }
    });
}

// placeholder handlers for new UI elements
function submitSymptom(e) {
  e.preventDefault();
  const text = document.getElementById("symptom-text").value.trim();
  if (!text) {
    alert("Please describe your symptoms");
    return;
  }

  // Show loading state
  const button = e.target;
  const originalText = button.textContent;
  button.textContent = "Analyzing...";
  button.disabled = true;

  apiCall("/symptoms", "POST", { text })
    .then((result) => {
      // Display the AI analysis
      showSymptomAnalysis(result);
      document.getElementById("symptom-text").value = "";
      loadSymptomHistory();
    })
    .catch((err) => {
      console.error("Symptom analysis failed:", err);
      alert("Failed to analyze symptoms. Please try again.");
    })
    .finally(() => {
      button.textContent = originalText;
      button.disabled = false;
    });
}
function openAddReminder() {
  alert(t("addReminderDialog"));
}
function connectDevice() {
  // Show device selection modal
  const deviceTypes = [
    { type: "fitbit", name: "Fitbit" },
    { type: "apple-watch", name: "Apple Watch" },
    { type: "garmin", name: "Garmin" },
    { type: "samsung-health", name: "Samsung Health" },
    { type: "google-fit", name: "Google Fit" },
    { type: "other", name: "Other Wearable" },
  ];

  let options = '<option value="">Select device type</option>';
  deviceTypes.forEach((device) => {
    options += `<option value="${device.type}">${device.name}</option>`;
  });

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal">
      <h3>${t("connectNewDevice")}</h3>
      <form id="device-connect-form">
        <div class="form-group">
          <label>${t("deviceType")}</label>
          <select id="device-type" required>
            ${options}
          </select>
        </div>
        <div class="form-group">
          <label>${t("deviceName")}</label>
          <input type="text" id="device-name" placeholder="${t("deviceNameExample")}" required>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" onclick="closeModal()">${t("cancel")}</button>
          <button type="submit" class="btn primary">${t("connect")}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("device-connect-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const deviceType = document.getElementById("device-type").value;
      const deviceName = document.getElementById("device-name").value.trim();

      if (!deviceType || !deviceName) {
        alert(t("selectDeviceTypeAndName"));
        return;
      }

      try {
        await apiCall("/devices/connect", "POST", { deviceType, deviceName });
        alert(t("deviceConnected"));
        closeModal();
        loadDevices();
      } catch (err) {
        console.error("Connect device failed:", err);
        alert(t("deviceConnectFailed"));
      }
    });
}

function showSymptomAnalysis(result) {
  const safeResult = result && typeof result === "object" ? result : {};
  let analysis =
    safeResult.aiAnalysis ||
    safeResult.analysis ||
    safeResult.text ||
    "No analysis available.";
  if (typeof analysis !== "string")
    analysis = String(analysis || "No analysis available.");
  // Defensive: only call replace if analysis is a string
  let analysisHtml = analysis;
  if (typeof analysisHtml === "string" && analysisHtml.replace) {
    analysisHtml = analysisHtml.replace(/\n/g, "<br>");
  }
  const parsedSymptoms = Array.isArray(safeResult.parsedSymptoms)
    ? safeResult.parsedSymptoms
    : [];
  const severity =
    typeof safeResult.severity === "string" ? safeResult.severity : "unknown";
  const scoreClass =
    severity && severity !== "unknown"
      ? `severity-${severity}`
      : "severity-low";

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal analysis-modal">
      <h3>${t("symptomAnalysis")}</h3>
      <div class="analysis-content">
        <div class="analysis-section">
          <h4>${t("yourSymptoms")}</h4>
          <p class="symptom-text">"${typeof safeResult.text === "string" ? safeResult.text : "-"}"</p>
        </div>
        <div class="analysis-section">
          <h4>${t("aiAnalysis")}</h4>
          <div class="ai-response">${analysisHtml}</div>
        </div>
        <div class="analysis-section">
          <h4>${t("detectedSymptoms")}</h4>
          <div class="symptoms-tags">
            ${
              parsedSymptoms.length > 0
                ? parsedSymptoms
                    .map((s) => `<span class="symptom-tag">${s}</span>`)
                    .join("")
                : t("noSpecificSymptomsDetected")
            }
          </div>
        </div>
        <div class="analysis-section">
          <h4>${t("severityLevel")}</h4>
          <span class="severity-badge ${scoreClass}">${severity}</span>
        </div>
        <div class="analysis-disclaimer">
          <strong>⚠️ ${t("important")}</strong> ${t("analysisDisclaimer")}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn primary" onclick="closeModal()">${t("close")}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function loadDevices() {
  try {
    const devices = await apiCall("/devices", "GET");
    const listDiv = document.getElementById("devices-list");

    if (!devices || devices.length === 0) {
      listDiv.innerHTML = `<div class="empty-state">${t("noDevices")}</div>`;
      return;
    }

    let html = '<ul class="devices-list">';
    devices.forEach((device) => {
      const connectedDate = new Date(device.connectedAt).toLocaleDateString();
      const statusClass =
        device.status === "connected"
          ? "status-connected"
          : "status-disconnected";
      html += `<li class="device-item">
        <div class="device-info">
          <div class="device-name">${device.deviceName}</div>
          <div class="device-type">${device.deviceType}</div>
          <div class="device-date">${t("connectDate")}: ${connectedDate}</div>
        </div>
        <div class="device-status ${statusClass}">${t("connectedLabel")}</div>
        ${device.status === "connected" ? `<button class="btn small danger" onclick="disconnectDevice('${device.id}')">${t("disconnect")}</button>` : ""}
      </li>`;
    });
    html += "</ul>";
    listDiv.innerHTML = html;
  } catch (err) {
    console.error("Load devices failed:", err);
    document.getElementById("devices-list").innerHTML =
      `<div class="empty-state">${t("failedToLoadDevices")}</div>`;
  }
}

async function disconnectDevice(deviceId) {
  if (!confirm(t("confirmDisconnect"))) return;

  try {
    await apiCall(`/devices/${deviceId}`, "DELETE");
    alert(t("deviceDisconnected"));
    loadDevices();
  } catch (err) {
    console.error("Disconnect device failed:", err);
    alert(t("deviceDisconnectFailed"));
  }
}

async function loadSymptomHistory() {
  try {
    const symptoms = await apiCall("/symptoms", "GET");
    const historyDiv = document.getElementById("symptom-history");

    if (!symptoms || symptoms.length === 0) {
      historyDiv.innerHTML = t("noSymptomsLogged") || "No symptoms logged yet.";
      return;
    }

    let html = '<div class="symptoms-history">';
    symptoms.forEach((symptom) => {
      const date = new Date(symptom.timestamp).toLocaleString();
      const severityClass = `severity-${symptom.severity}`;
      html += `
        <div class="symptom-entry">
          <div class="symptom-header">
            <span class="symptom-date">${date}</span>
            <span class="severity-badge ${severityClass}">${symptom.severity}</span>
          </div>
          <div class="symptom-text">"${symptom.text}"</div>
          <div class="symptom-analysis-preview">
            ${symptom.aiAnalysis ? symptom.aiAnalysis.substring(0, 100) + "..." : "Analysis not available"}
          </div>
          <button class="btn small" onclick="viewFullAnalysis(${JSON.stringify(symptom).replace(/"/g, "&quot;")})">View Full Analysis</button>
        </div>
      `;
    });
    html += "</div>";
    historyDiv.innerHTML = html;
  } catch (err) {
    console.error("Load symptoms failed:", err);
    document.getElementById("symptom-history").innerHTML =
      "Failed to load symptom history.";
  }
}

function viewFullAnalysis(symptom) {
  showSymptomAnalysis(symptom);
}
function addFood(e) {
  e.preventDefault();
  const food = document.getElementById("food-name").value.trim();
  const cal = Number(document.getElementById("food-cal").value);
  if (!food || !cal) {
    alert(t("foodInputError"));
    return;
  }
  const entries = JSON.parse(localStorage.getItem("nutritionEntries") || "[]");
  entries.push({ food, cal, createdAt: new Date().toISOString() });
  localStorage.setItem("nutritionEntries", JSON.stringify(entries));
  navigate("nutrition");
}
function saveProfile(e) {
  e.preventDefault();
  alert("Profile saved (demo)");
}
function submitComplaint(e) {
  e.preventDefault();
  const message = document.getElementById("complaint-text").value.trim();
  if (!message) {
    alert("Please enter a message");
    return;
  }

  apiCall("/complaints", "POST", { message })
    .then(() => {
      alert("Complaint submitted successfully");
      document.getElementById("complaint-text").value = "";
      loadComplaintsHistory();
    })
    .catch((err) => {
      console.error("Submit complaint failed:", err);
      alert("Failed to submit complaint. Please try again.");
    });
}

async function loadComplaintsHistory() {
  try {
    const complaints = await apiCall("/complaints", "GET");
    const historyDiv = document.getElementById("complaints-history");
    if (!complaints || complaints.length === 0) {
      historyDiv.innerHTML = t("noSubmissionsYet");
      return;
    }

    let html = '<ul class="complaints-list">';
    complaints.forEach((c) => {
      const date = new Date(c.createdAt).toLocaleString();
      const statusClass =
        c.status === "resolved"
          ? "status-resolved"
          : c.status === "pending"
            ? "status-pending"
            : "status-in-progress";
      html += `<li class="complaint-item">
        <div class="complaint-date">${date}</div>
        <div class="complaint-message">${c.message}</div>
        <div class="complaint-status ${statusClass}">${c.status}</div>
      </li>`;
    });
    html += "</ul>";
    historyDiv.innerHTML = html;
  } catch (err) {
    console.error("Load complaints failed:", err);
    document.getElementById("complaints-history").innerHTML =
      "Failed to load complaints.";
  }
}

// ===== SHARED COMPONENTS =====
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  navigate("login");
}

function renderHeader() {
  const roleLabel = currentUser
    ? { patient: "Patient", doctor: "Doctor", admin: "Administrator" }[
        currentUser.role
      ] || "User"
    : "User";
  return `
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo">
          <img src="/assets/images/icon-192.png" alt="PULSE Logo" class="logo-icon">
          <div class="branding">
            <div class="app-title">PULSE</div>
            <div class="app-sub">AI Health Assistant</div>
          </div>
        </div>
      </div>
      <div class="topbar-right">
        <select class="lang-select" onchange="setLanguage(this.value)">
          <option value="en" ${currentLang === "en" ? "selected" : ""}>English</option>
          <option value="kz" ${currentLang === "kz" ? "selected" : ""}>Қазақша</option>
          <option value="ru" ${currentLang === "ru" ? "selected" : ""}>Русский</option>
        </select>
        <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>
        <button class="logout" onclick="navigate('profile')">${t("profile")} ⟶</button>
        <button class="logout" onclick="logout()" style="background-color:#d32f2f; color:white; margin-left:8px; padding:8px 16px; border:none; border-radius:4px; cursor:pointer;">${t("logout")}</button>
      </div>
    </header>
  `;
}

function renderNav() {
  const items = [
    ["dashboard", "📈"],
    ["symptoms", "🩺"],
    ["reminders", "🔔"],
    ["devices", "⌚"],
    ["vitals", "❤️"],
    ["nutrition", "🍽️"],
    ["reports", "📊"],
    ["complaints", "📝"],
  ];
  const isDesktop = window.innerWidth >= 768;
  let html = `<nav class="${isDesktop ? "sidebar" : "main-nav"}" aria-label="Primary"><div ${isDesktop ? "" : 'class="nav-scroll"'}>`;
  items.forEach(([page, icon]) => {
    html += `<button class="nav-item ${currentPage === page ? "active" : ""}" onclick="navigate('${page}')"><span class="icon">${icon}</span> ${t(page)}</button>`;
  });
  html += `</div></nav>`;
  return html;
}

function renderFooter() {
  return `<footer class="site-footer">&copy; 2026 Healthcare Virtual Assistant</footer>`;
}

// Validate session on page load
async function validateSession() {
  console.log("validateSession called, authToken exists:", !!authToken);

  if (!authToken) {
    console.log("No token found, showing login");
    currentPage = "login";
    render();
    return;
  }

  // If we have token and currentUser data, restore last page (not always dashboard)
  if (currentUser && currentUser.id) {
    const restorePage = getInitialPage();
    console.log(
      "CurrentUser exists, restoring page:",
      restorePage,
      "user:",
      currentUser.id,
    );
    currentPage =
      restorePage === "login" || restorePage === "register"
        ? "dashboard"
        : restorePage;
    render();
    return;
  }

  // Token exists but no currentUser - try to restore from backend
  console.log("Token exists but no currentUser, fetching profile...");
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Profile response status:", response.status);

    if (response.status === 401 || response.status === 404) {
      console.error("User not found (401/404), clearing session");
      authToken = null;
      currentUser = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      currentPage = "login";
      render();
      return;
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    // Session valid - update currentUser
    const userData = await response.json();
    console.log("Profile data received, setting currentUser");
    currentUser = {
      id: userData.id,
      role: userData.role,
      email: userData.email,
      name: userData.name,
      profile: userData.profile,
    };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    currentPage = "dashboard";
    render();
  } catch (err) {
    console.error("Session validation error:", err.message);
    // If fetch fails, just show login
    authToken = null;
    currentUser = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    currentPage = "login";
    render();
  }
}

// Start the app
document.addEventListener("DOMContentLoaded", () => {
  // Clear invalid tokens
  if (authToken && typeof authToken !== "string") {
    authToken = null;
    localStorage.removeItem("authToken");
  }

  // Validate and restore session
  validateSession();
});
