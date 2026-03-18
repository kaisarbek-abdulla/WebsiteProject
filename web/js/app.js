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

// Expo-mode: disable service workers so users don't need to keep clearing cache to see updates.
// This will unregister any previously installed SW for this origin.
async function disableServiceWorkersForExpo() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if (regs.length) {
      console.log("Service workers unregistered for expo mode.");
      // Force one reload so the page is no longer controlled by the old SW.
      if (!sessionStorage.getItem("sw_unregistered_reload")) {
        sessionStorage.setItem("sw_unregistered_reload", "1");
        window.location.reload();
      }
    }
  } catch (e) {
    // ignore
  }
}
disableServiceWorkersForExpo();

let currentUser = null;
let authToken = localStorage.getItem("authToken") || null;

// Doctor/patient chat selection state (shared between dashboard and chat page)
let activeChatUserId = null;
let activeChatUserName = null;
let activePatient = null;

// ===== Modal helpers (dynamic modals used across pages) =====
function openDynamicModal(overlayEl) {
  if (!overlayEl) return;
  overlayEl.style.display = "flex";
  // Click outside to close
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModal();
  });
}

function closeModal() {
  document.querySelectorAll(".modal-overlay.dynamic-modal").forEach((el) => el.remove());
}

// ===== Demo sims (Vitals + Nutrition helpers) =====
// These are UI sims for the expo so the site feels alive even without devices/APIs.
const VITALS_SIM = {
  paused: false,
  heartRate: 76,
  steps: 512,
  goalSteps: 1000,
  bloodPressure: { sys: 120, dia: 80 },
  oxygen: 98,
  temperatureC: 36.7,
  baseWeightKg: 72.4,
  weightKg: 72.4,
  wave: [0.55, 0.6, 0.52, 0.66, 0.58, 0.62],
};
let vitalsSimTimer = null;

function ensureVitalsSim() {
  if (vitalsSimTimer) return;
  vitalsSimTimer = window.setInterval(() => {
    if (VITALS_SIM.paused) return;

    const drift = Math.floor(Math.random() * 5) - 2; // -2..+2
    VITALS_SIM.heartRate = clamp(VITALS_SIM.heartRate + drift, 58, 122);

    const burst = Math.random() < 0.12 ? Math.floor(Math.random() * 22) : Math.floor(Math.random() * 7);
    VITALS_SIM.steps += burst;

    // Other vitals: gentle drift (demo only)
    VITALS_SIM.oxygen = clamp(VITALS_SIM.oxygen + (Math.random() < 0.2 ? (Math.random() < 0.5 ? -1 : 1) : 0), 94, 100);
    VITALS_SIM.temperatureC = clamp(VITALS_SIM.temperatureC + (Math.random() < 0.18 ? (Math.random() < 0.5 ? -0.1 : 0.1) : 0), 36.1, 37.8);
    // Drift around the profile weight, not away from it.
    if (Math.random() < 0.08) {
      const n = VITALS_SIM.baseWeightKg + (Math.random() < 0.5 ? -0.1 : 0.1);
      VITALS_SIM.weightKg = clamp(n, 45, 140);
      VITALS_SIM.baseWeightKg = VITALS_SIM.weightKg;
    }
    if (Math.random() < 0.14) {
      VITALS_SIM.bloodPressure.sys = clamp(VITALS_SIM.bloodPressure.sys + (Math.random() < 0.5 ? -1 : 1), 95, 145);
      VITALS_SIM.bloodPressure.dia = clamp(VITALS_SIM.bloodPressure.dia + (Math.random() < 0.5 ? -1 : 1), 55, 95);
    }

    const normalized = (VITALS_SIM.heartRate - 58) / (122 - 58);
    const noise = (Math.random() - 0.5) * 0.18;
    VITALS_SIM.wave.push(clamp(normalized + noise, 0.05, 0.95));
    if (VITALS_SIM.wave.length > 54) VITALS_SIM.wave.shift();

    renderVitalsSimToDom();
  }, 900);
}

function syncVitalsFromProfile() {
  try {
    const raw = currentUser?.profile?.weight;
    const w = typeof raw === "number" ? raw : raw ? Number(raw) : NaN;
    if (!Number.isFinite(w) || w <= 0) return;
    VITALS_SIM.baseWeightKg = w;
    VITALS_SIM.weightKg = w;
    renderVitalsSimToDom();
  } catch (e) {
    // ignore
  }
}

function toggleVitalsSim() {
  VITALS_SIM.paused = !VITALS_SIM.paused;
  renderVitalsSimToDom();
}

function renderVitalsSimToDom() {
  // Dashboard tiles
  const hrMetric = document.getElementById("sim-hr-metric");
  if (hrMetric) hrMetric.textContent = `${VITALS_SIM.heartRate} BPM`;
  const stepsMetric = document.getElementById("sim-steps-metric");
  if (stepsMetric) stepsMetric.textContent = `${VITALS_SIM.steps}`;
  const bpMetric = document.getElementById("sim-bp-metric");
  if (bpMetric) bpMetric.textContent = `${VITALS_SIM.bloodPressure.sys}/${VITALS_SIM.bloodPressure.dia}`;
  const o2Metric = document.getElementById("sim-o2-metric");
  if (o2Metric) o2Metric.textContent = `${VITALS_SIM.oxygen}%`;
  const tempMetric = document.getElementById("sim-temp-metric");
  if (tempMetric) tempMetric.textContent = `${Number(VITALS_SIM.temperatureC).toFixed(1)} °C`;
  const weightMetric = document.getElementById("sim-weight-metric");
  if (weightMetric) weightMetric.textContent = `${Number(VITALS_SIM.weightKg).toFixed(1)} kg`;

  // Vitals page
  const hrText = document.getElementById("sim-hr");
  if (hrText) hrText.textContent = `${VITALS_SIM.heartRate}`;
  const stepsText = document.getElementById("sim-steps");
  if (stepsText) stepsText.textContent = `${VITALS_SIM.steps}`;
  const bpText = document.getElementById("sim-bp");
  if (bpText) bpText.textContent = `${VITALS_SIM.bloodPressure.sys}/${VITALS_SIM.bloodPressure.dia}`;
  const o2Text = document.getElementById("sim-o2");
  if (o2Text) o2Text.textContent = `${VITALS_SIM.oxygen}%`;
  const o2Big = document.getElementById("sim-o2-big");
  if (o2Big) o2Big.textContent = String(VITALS_SIM.oxygen);
  const tempText = document.getElementById("sim-temp");
  if (tempText) tempText.textContent = `${Number(VITALS_SIM.temperatureC).toFixed(1)} °C`;
  const weightText = document.getElementById("sim-weight");
  if (weightText) weightText.textContent = `${Number(VITALS_SIM.weightKg).toFixed(1)} kg`;

  // Fancy vitals widgets
  const thermo = document.getElementById("sim-thermo");
  if (thermo) {
    thermo.classList.remove("cold", "ok", "hot");
    const t = Number(VITALS_SIM.temperatureC);
    const cls = t < 36.4 ? "cold" : t > 37.4 ? "hot" : "ok";
    thermo.classList.add(cls);
    // map 35.0..39.5 to 0..100
    const p = clamp((t - 35.0) / (39.5 - 35.0), 0, 1);
    thermo.style.setProperty("--fill", `${Math.round(p * 100)}%`);
  }
  const o2Ring = document.getElementById("sim-o2-ring");
  if (o2Ring) {
    const p = clamp((Number(VITALS_SIM.oxygen) - 90) / (100 - 90), 0, 1);
    o2Ring.style.setProperty("--p", `${Math.round(p * 100)}%`);
    o2Ring.setAttribute("data-level", VITALS_SIM.oxygen >= 96 ? "ok" : VITALS_SIM.oxygen >= 93 ? "warn" : "bad");
  }
  const bpWidget = document.getElementById("sim-bp-widget");
  if (bpWidget) {
    const sys = Number(VITALS_SIM.bloodPressure.sys);
    const dia = Number(VITALS_SIM.bloodPressure.dia);
    const sysP = clamp((sys - 90) / (150 - 90), 0, 1);
    const diaP = clamp((dia - 50) / (100 - 50), 0, 1);
    bpWidget.style.setProperty("--sys", `${Math.round(sysP * 100)}%`);
    bpWidget.style.setProperty("--dia", `${Math.round(diaP * 100)}%`);
    const lvl = sys <= 130 && dia <= 85 ? "ok" : sys <= 140 && dia <= 90 ? "warn" : "bad";
    bpWidget.setAttribute("data-level", lvl);
  }
  const scale = document.getElementById("sim-scale");
  if (scale) {
    const w = Number(VITALS_SIM.weightKg);
    // 45..140 kg -> -40..+40 deg
    const t = clamp((w - 45) / (140 - 45), 0, 1);
    const deg = -40 + t * 80;
    scale.style.setProperty("--needle", `${deg.toFixed(1)}deg`);
  }

  // Derived quick stats (demo only)
  const kcalEl = document.getElementById("sim-kcal");
  const minsEl = document.getElementById("sim-mins");
  const kmEl = document.getElementById("sim-km");
  if (kcalEl || minsEl || kmEl) {
    const kcal = 650 + Math.floor(VITALS_SIM.steps * 0.25);
    const activeMinutes = Math.max(0, Math.floor(VITALS_SIM.steps / 36));
    const km = (VITALS_SIM.steps * 0.00067).toFixed(2);
    if (kcalEl) kcalEl.textContent = String(kcal);
    if (minsEl) minsEl.textContent = `${activeMinutes}:${String(VITALS_SIM.steps % 60).padStart(2, "0")}`;
    if (kmEl) kmEl.textContent = String(km);
  }

  const hrRing = document.getElementById("sim-hr-ring");
  if (hrRing) {
    const p = clamp((VITALS_SIM.heartRate - 55) / (125 - 55), 0, 1);
    hrRing.style.setProperty("--p", `${Math.round(p * 100)}%`);
  }
  const stepsRing = document.getElementById("sim-steps-ring");
  if (stepsRing) {
    const p = clamp(VITALS_SIM.steps / VITALS_SIM.goalSteps, 0, 1);
    stepsRing.style.setProperty("--p", `${Math.round(p * 100)}%`);
  }

  const pauseBtn = document.getElementById("sim-pause-btn");
  if (pauseBtn) pauseBtn.textContent = VITALS_SIM.paused ? "Resume" : "Pause";

  const wavePath = document.getElementById("sim-wave-path");
  if (wavePath) {
    const d = waveToPath(VITALS_SIM.wave, 260, 70);
    wavePath.setAttribute("d", d);
  }
}

function waveToPath(samples, w, h) {
  if (!samples || samples.length === 0) return "";
  const n = samples.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const x = t * w;
    const y = (1 - clamp(samples[i], 0, 1)) * h;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d.trim();
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

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
    symptoms: "AI Tools",
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
    clearHistory: "Clear history",
    confirmClearHistory: "Clear your symptom history? This cannot be undone.",
    historyCleared: "History cleared.",
    clearHistoryFailed: "Failed to clear history.",
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
    "doctor-chat": "Chat",
  },
  kz: {
    welcome: "Қош келдіңіз",
    dashboard: "Басқару панелі",
    symptoms: "AI құралдары",
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
    clearHistory: "Тарихты тазалау",
    confirmClearHistory: "Симптомдар тарихын тазалайсыз ба? Қайтарылмайды.",
    historyCleared: "Тарих тазаланды.",
    clearHistoryFailed: "Тарихты тазалау сәтсіз аяқталды.",
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
    "doctor-chat": "Чат",
  },
  ru: {
    welcome: "Добро пожаловать",
    dashboard: "Панель",
    symptoms: "AI инструменты",
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
    clearHistory: "Очистить историю",
    confirmClearHistory: "Очистить историю симптомов? Это действие нельзя отменить.",
    historyCleared: "История очищена.",
    clearHistoryFailed: "Не удалось очистить историю.",
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
    deviceDisconnectFailed:
      "Не удалось отключить устройство. Пожалуйста, попробуйте снова.",
    failedToLoadDevices: "Не удалось загрузить устройства.",
    viewVitals: "Просмотреть показатели",
    addReminderDialog: "Диалог добавления напоминания (демо)",
    foodAddedDemo: "Блюдо добавлено (демо)",
    "doctor-chat": "Чат",
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
    case "doctor-chat":
      root.innerHTML = renderDoctorChat();
      attachDoctorChatHandlers();
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
      attachNutritionHandlers();
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
  const vitalsCount = JSON.parse(
    localStorage.getItem("userVitals") || "[]",
  ).length;
  const devicesCount = JSON.parse(
    localStorage.getItem("localDevices") || "[]",
  ).length;
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
              <div class="metric-value" id="sim-hr-metric">—</div>
            </div>
            <div class="metric"> <div class="metric-icon">🩺</div>
              <div class="metric-label">${t("bloodPressure")}</div>
              <div class="metric-value" id="sim-bp-metric">—</div>
            </div>
            <div class="metric"> <div class="metric-icon">🫁</div>
              <div class="metric-label">${t("oxygen")}</div>
              <div class="metric-value" id="sim-o2-metric">—</div>
            </div>
            <div class="metric"> <div class="metric-icon">🥾</div>
              <div class="metric-label">${t("steps")}</div>
              <div class="metric-value" id="sim-steps-metric">—</div>
            </div>
            <div class="metric"> <div class="metric-icon">⚖️</div>
              <div class="metric-label">${t("weight")}</div>
              <div class="metric-value" id="sim-weight-metric">—</div>
            </div>
            <div class="metric"> <div class="metric-icon">🌡️</div>
              <div class="metric-label">${t("temperature")}</div>
              <div class="metric-value" id="sim-temp-metric">—</div>
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

      <section class="row">
        <div class="card wide">
          <h4>Doctor help</h4>
          <p class="muted">Find a doctor and send a message.</p>
          <div class="doctor-help-bar">
            <select id="doctor-select" class="doctor-select">
              <option value="">Loading doctors...</option>
            </select>
            <button class="btn primary" id="open-doctor-chat" type="button">Open chat</button>
          </div>
          <div id="patient-chat-thread" class="chat-thread empty-state" style="margin-top:12px;">Select a doctor to view messages.</div>
          <form id="patient-chat-form" class="chat-form">
            <input id="patient-chat-text" type="text" placeholder="Type a message..." autocomplete="off" />
            <button class="btn primary" type="submit">Send</button>
          </form>
        </div>
      </section>
    </main>

    ${renderFooter()}
  `;
}

function renderDoctorDashboard() {
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="page-header">
        <h2>Doctor Dashboard</h2>
        <p class="subtitle">Patients and messaging</p>
      </div>

      <div class="doctor-layout">
        <div class="card doctor-panel">
          <div class="panel-head">
            <h3 style="margin:0;">Patients</h3>
            <button class="btn small" id="refresh-patients-btn" type="button">Refresh</button>
          </div>
          <div id="patients-list" class="list"></div>
        </div>

        <div class="card doctor-panel">
          <div class="panel-head">
            <div>
              <h3 style="margin:0;">Patient overview</h3>
              <div class="muted" id="doctor-chat-selected">Select a patient on the left.</div>
            </div>
          </div>
          <div id="doctor-patient-overview" class="empty-state" style="margin-top:10px;">
            No patient selected.
          </div>
          <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
            <button class="btn primary" id="open-doctor-chat" type="button" disabled>Open chat</button>
          </div>
        </div>
      </div>
    </main>${renderFooter()}`;
}

function renderDoctorChat() {
  const name = activeChatUserName || "Patient";
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="page-header">
        <h2>Doctor Chat</h2>
        <p class="subtitle">Conversation with your patient</p>
      </div>

      <div class="card doctor-panel">
        <div class="panel-head" style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <div>
            <h3 id="chat-title" style="margin:0;">Chat with ${escapeHtml(name)}</h3>
            <div class="muted" id="chat-sub">Messages are stored on the server (demo).</div>
          </div>
          <button class="btn secondary small" type="button" onclick="navigate('dashboard')">Back</button>
        </div>
        <div id="chat-thread" class="chat-thread empty-state">No conversation selected.</div>
        <form id="chat-form" class="chat-form">
          <input id="chat-text" type="text" placeholder="Type a message..." autocomplete="off" />
          <button class="btn primary" type="submit">Send</button>
          <button class="btn" type="button" id="recommend-btn">Recommend yourself</button>
        </form>
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

  // Ensure vitals numbers look alive on the dashboard.
  ensureVitalsSim();
  renderVitalsSimToDom();

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

        const result = await apiCall("/symptoms/analyze", "POST", {
          text,
          language: typeof currentLang === "string" ? currentLang : "en",
        });
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

        function esc(x) {
          return escapeHtml(typeof x === "string" ? x : String(x ?? ""));
        }
        function pill(text2) {
          return `<span class="analysis-pill">${esc(text2)}</span>`;
        }
        const urgencyText = typeof urgency === "string" ? urgency : "";
        const badgeClass =
          severityVal === "High"
            ? "analysis-badge severe"
            : severityVal === "Medium" || severityVal === "Low-Medium"
              ? "analysis-badge moderate"
              : "analysis-badge mild";

        resultDiv.style.display = "block";
        resultDiv.innerHTML = `
          <div class="analysis-panel">
            <div class="analysis-head">
              <div>
                <div class="analysis-title">${t("symptomAnalysis")}</div>
                <div class="analysis-sub">${esc(text)}</div>
              </div>
              <div class="${badgeClass}">${esc(severityVal)}</div>
            </div>

            ${detectedSymptoms.length ? `
              <div class="analysis-row">
                <div class="analysis-row-title">${t("detectedSymptoms")}</div>
                <div class="analysis-pills">
                  ${detectedSymptoms.slice(0, 10).map((s) => pill(s)).join("")}
                </div>
              </div>
            ` : ""}

            ${conditions.length ? `
              <div class="analysis-row">
                <div class="analysis-row-title">Possible conditions</div>
                <div class="analysis-pills">
                  ${conditions.slice(0, 12).map((c) => pill(c)).join("")}
                </div>
              </div>
            ` : ""}

            ${analysisText ? `
              <div class="analysis-row">
                <div class="analysis-row-title">${t("aiAnalysis")}</div>
                <div class="analysis-text">${esc(analysisText).replace(/\\n/g, "<br>")}</div>
              </div>
            ` : ""}

            ${treatments.length ? `
              <div class="analysis-row">
                <div class="analysis-row-title">Treatments</div>
                <ul class="analysis-list">${treatments.slice(0, 10).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              </div>
            ` : ""}

            ${diagnosticTests.length ? `
              <div class="analysis-row">
                <div class="analysis-row-title">Diagnostic tests</div>
                <ul class="analysis-list">${diagnosticTests.slice(0, 10).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              </div>
            ` : ""}

            ${healthAdvice.length ? `
              <div class="analysis-row">
                <div class="analysis-row-title">Advice</div>
                <ul class="analysis-list">${healthAdvice.slice(0, 10).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              </div>
            ` : ""}

            ${urgencyText ? `
              <div class="analysis-note">
                <div class="analysis-note-title">Next step</div>
                <div class="analysis-note-body">${esc(urgencyText)}</div>
              </div>
            ` : ""}

            <div class="analysis-disclaimer">
              <strong>${t("important")}</strong> ${esc(disclaimer)}
            </div>
          </div>
        `;

        analyzeBtn.textContent = "Analyze";
        analyzeBtn.disabled = false;
      } catch (err) {
        resultDiv.style.display = "block";
        resultDiv.innerHTML = `<div class="analysis-panel"><div class="analysis-title">Error</div><div class="analysis-text">${escapeHtml(err.message)}</div></div>`;
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

  attachPatientDoctorHelpHandlers();
}

function attachPatientDoctorHelpHandlers() {
  const select = document.getElementById("doctor-select");
  const openBtn = document.getElementById("open-doctor-chat");
  const form = document.getElementById("patient-chat-form");
  const input = document.getElementById("patient-chat-text");

  if (!select || !openBtn || !form || !input) return;

  loadDoctorsIntoSelect(select).catch(() => {
    select.innerHTML = `<option value="">Failed to load doctors</option>`;
  });

  openBtn.addEventListener("click", async () => {
    const id = select.value;
    const name = select.selectedOptions?.[0]?.textContent || "Doctor";
    if (!id) return;
    activeChatUserName = name;
    await openPatientChatWith(id, name);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = select.value;
    if (!id) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await sendChatMessage(id, text);
    await refreshPatientChatThread(id, select.selectedOptions?.[0]?.textContent || "Doctor");
  });
}

async function loadDoctorsIntoSelect(selectEl) {
  const doctors = await apiCall("/auth/doctors/all", "GET");
  if (!Array.isArray(doctors) || doctors.length === 0) {
    selectEl.innerHTML = `<option value="">No doctors available</option>`;
    return;
  }
  selectEl.innerHTML =
    `<option value="">Select a doctor...</option>` +
    doctors
      .map((d) => `<option value="${d.id}">${escapeHtml(d.name)} (${escapeHtml(d.email)})</option>`)
      .join("");
}

async function openPatientChatWith(doctorId, name) {
  await refreshPatientChatThread(doctorId, name);
}

async function refreshPatientChatThread(doctorId, doctorName) {
  const thread = document.getElementById("patient-chat-thread");
  if (!thread) return;
  if (!doctorId) {
    thread.classList.add("empty-state");
    thread.textContent = "Select a doctor to view messages.";
    return;
  }
  try {
    const msgs = await apiCall(`/messages/with/${doctorId}`, "GET");
    thread.classList.remove("empty-state");
    activeChatUserName = doctorName;
    thread.innerHTML = renderChatMessages(msgs, doctorId);
    thread.scrollTop = thread.scrollHeight;
  } catch (e) {
    thread.classList.add("empty-state");
    thread.textContent = "Failed to load messages.";
  }
}

function attachDoctorDashboardHandlers() {
  loadPatients();

  const refreshBtn = document.getElementById("refresh-patients-btn");
  if (refreshBtn) refreshBtn.addEventListener("click", () => loadPatients());

  const openBtn = document.getElementById("open-doctor-chat");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      if (!activeChatUserId) return;
      navigate("doctor-chat");
    });
  }
}

async function loadPatients() {
  try {
    const patients = await apiCall("/auth/patients/all", "GET");
    const listDiv = document.getElementById("patients-list");
    if (patients.length === 0) {
      listDiv.innerHTML = '<div class="empty-state">No patients found.</div>';
      return;
    }
    let html = '<div class="list">';
    patients.forEach((p) => {
      const age = p.profile?.age || "N/A";
      const h = p.profile?.height || "N/A";
      const w = p.profile?.weight || "N/A";
      html += `
        <button class="list-item" type="button" data-chat-user="${p.id}" data-chat-name="${escapeHtml(p.name)}">
          <div class="li-title">${escapeHtml(p.name)}</div>
          <div class="li-sub">${escapeHtml(p.email)} • Age ${age} • H ${h} • W ${w}</div>
        </button>
      `;
    });
    html += "</div>";
    listDiv.innerHTML = html;

    listDiv.querySelectorAll("[data-chat-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-chat-user");
        const name = btn.getAttribute("data-chat-name") || "Patient";
        // Select patient for chat, then let doctor open the separate chat section.
        activeChatUserId = id;
        activeChatUserName = name;
        activePatient = patients.find((p) => String(p.id) === String(id)) || null;
        const label = document.getElementById("doctor-chat-selected");
        if (label) label.textContent = `Selected: ${name}`;
        const openBtn = document.getElementById("open-doctor-chat");
        if (openBtn) openBtn.disabled = !activeChatUserId;

        const panel = document.getElementById("doctor-patient-overview");
        if (panel) {
          if (!activePatient) {
            panel.classList.add("empty-state");
            panel.textContent = "No patient selected.";
          } else {
            panel.classList.remove("empty-state");
            const pr = activePatient.profile || {};
            const age = pr.age ?? "—";
            const height = pr.height ?? "—";
            const weight = pr.weight ?? "—";
            const bloodType = pr.bloodType ?? "—";
            const allergies = pr.allergies ? escapeHtml(String(pr.allergies)) : "—";
            const meds = pr.medications ? escapeHtml(String(pr.medications)) : "—";
            panel.innerHTML = `
              <div class="analysis-panel">
                <div class="analysis-head">
                  <div>
                    <div class="analysis-title">${escapeHtml(activePatient.name)}</div>
                    <div class="analysis-sub">${escapeHtml(activePatient.email)}</div>
                  </div>
                  <div class="analysis-badge mild">Patient</div>
                </div>
                <div class="analysis-row">
                  <div class="analysis-row-title">Vitals (profile)</div>
                  <div class="analysis-pills">
                    <span class="analysis-pill">Age: ${escapeHtml(String(age))}</span>
                    <span class="analysis-pill">Height: ${escapeHtml(String(height))}</span>
                    <span class="analysis-pill">Weight: ${escapeHtml(String(weight))}</span>
                    <span class="analysis-pill">Blood: ${escapeHtml(String(bloodType))}</span>
                  </div>
                </div>
                <div class="analysis-row">
                  <div class="analysis-row-title">Allergies</div>
                  <div class="analysis-text">${allergies}</div>
                </div>
                <div class="analysis-row">
                  <div class="analysis-row-title">Medications</div>
                  <div class="analysis-text">${meds}</div>
                </div>
              </div>
            `;
          }
        }
      });
    });
  } catch (err) {
    console.error("Load patients failed:", err);
  }
}

function attachDoctorChatHandlers() {
  // Only doctors should use this page; if not, bounce back.
  if (currentUser?.role !== "doctor") {
    navigate("dashboard");
    return;
  }
  wireChatUI();
  if (activeChatUserId) {
    openChatWith(activeChatUserId, activeChatUserName || "Patient");
  } else {
    const thread = document.getElementById("chat-thread");
    if (thread) {
      thread.classList.add("empty-state");
      thread.textContent = "No conversation selected. Go back and choose a patient.";
    }
  }
}

function wireChatUI() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-text");
  const recommendBtn = document.getElementById("recommend-btn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeChatUserId) return;
      const text = (input?.value || "").trim();
      if (!text) return;
      if (input) input.value = "";
      await sendChatMessage(activeChatUserId, text);
      await refreshChatThread();
    });
  }

  if (recommendBtn) {
    recommendBtn.addEventListener("click", async () => {
      if (!activeChatUserId) return;
      const name = currentUser?.name || "Doctor";
      const text = `Hello, I'm Dr. ${name}. I can help review your symptoms and suggest next steps.`;
      await sendChatMessage(activeChatUserId, text);
      await refreshChatThread();
    });
  }
}

async function openChatWith(userId, name) {
  activeChatUserId = userId;
  activeChatUserName = name;
  const title = document.getElementById("chat-title");
  const sub = document.getElementById("chat-sub");
  if (title) title.textContent = `Chat with ${name}`;
  if (sub) sub.textContent = "Messages are stored on the server (demo).";
  await refreshChatThread();
}

async function refreshChatThread() {
  const thread = document.getElementById("chat-thread");
  if (!thread) return;
  if (!activeChatUserId) {
    thread.classList.add("empty-state");
    thread.textContent = "No conversation selected.";
    return;
  }
  try {
    const msgs = await apiCall(`/messages/with/${activeChatUserId}`, "GET");
    thread.classList.remove("empty-state");
    thread.innerHTML = renderChatMessages(msgs, activeChatUserId);
    thread.scrollTop = thread.scrollHeight;
  } catch (e) {
    thread.classList.add("empty-state");
    thread.textContent = "Failed to load messages.";
  }
}

async function sendChatMessage(toUserId, text) {
  try {
    await apiCall("/messages", "POST", { toUserId, text });
  } catch (e) {
    alert("Failed to send message.");
  }
}

function renderChatMessages(msgs, otherId) {
  if (!Array.isArray(msgs) || msgs.length === 0) {
    return '<div class="empty-state">No messages yet. Say hi.</div>';
  }
  return msgs
    .map((m) => {
      const mine = m.fromUserId === currentUser?.id;
      const cls = mine ? "chat-bubble mine" : "chat-bubble";
      const who = mine ? "You" : (activeChatUserName || "User");
      const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      return `<div class="${cls}">
        <div class="chat-meta">${escapeHtml(who)} • ${escapeHtml(time)}</div>
        <div class="chat-text">${escapeHtml(m.text || "")}</div>
      </div>`;
    })
    .join("");
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
  const role = currentUser ? currentUser.role : "patient";
  if (role === "doctor") {
    return `${renderHeader()}${renderNav()}<main class="container">
        <div class="page-header"><h2>${t("symptoms")}</h2><p class="subtitle">Nurse AI assistant for doctors</p></div>
        <div class="card">
          <h3 style="margin-top:0;">AI Nurse Assistant</h3>
          <p class="muted">Ask for reminders, medication notes, red flags, differential ideas, or what to do next.</p>
          <div class="form-group">
            <label for="doctor-ai-question">Question</label>
            <textarea id="doctor-ai-question" placeholder="e.g. Patient has ankle pain after running, what red flags and home care advice?" style="min-height:110px;"></textarea>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button id="doctor-ai-ask" class="btn primary" type="button">Ask assistant</button>
            <button id="doctor-ai-clear" class="btn secondary" type="button">Clear</button>
          </div>
          <div id="doctor-ai-answer" style="margin-top:14px; display:none;"></div>
        </div>
      </main>${renderFooter()}`;
  }

  // patient: symptom analyzer + history
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
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <h3 style="margin:0;">${t("history") || "History"}</h3>
          <button id="clear-symptoms-btn" class="btn secondary small">${t("clearHistory") || "Clear history"}</button>
        </div>
        <div id="symptom-history" class="empty-state">${t("noSymptomsLogged") || "No symptoms logged yet."}</div>
      </div>
    </main>${renderFooter()}`;
}

function attachSymptomsHandlers() {
  const role = currentUser ? currentUser.role : "patient";
  if (role === "doctor") {
    attachDoctorAiToolsHandlers();
    return;
  }

  loadSymptomHistory();
  const clearBtn = document.getElementById("clear-symptoms-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      const msg =
        t("confirmClearHistory") ||
        "Are you sure you want to clear your symptom history?";
      if (!confirm(msg)) return;
      try {
        await apiCall("/symptoms", "DELETE");
        await loadSymptomHistory();
        alert(t("historyCleared") || "History cleared.");
      } catch (err) {
        console.error("Clear symptom history failed:", err);
        alert(t("clearHistoryFailed") || "Failed to clear history.");
      }
    });
  }
}

function attachDoctorAiToolsHandlers() {
  const askBtn = document.getElementById("doctor-ai-ask");
  const clearBtn = document.getElementById("doctor-ai-clear");
  const qEl = document.getElementById("doctor-ai-question");
  const out = document.getElementById("doctor-ai-answer");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (qEl) qEl.value = "";
      if (out) {
        out.style.display = "none";
        out.innerHTML = "";
      }
    });
  }
  if (askBtn) {
    askBtn.addEventListener("click", async () => {
      const q = (qEl?.value || "").trim();
      if (!q) return;
      try {
        askBtn.disabled = true;
        askBtn.textContent = "Thinking...";
        const resp = await apiCall("/ai/doctor-assistant", "POST", {
          question: q,
          language: typeof currentLang === "string" ? currentLang : "en",
        });
        const answer = resp && typeof resp.answer === "string" ? resp.answer : "";
        if (out) {
          out.style.display = "block";
          out.innerHTML = `<div class="analysis-panel"><div class="analysis-title">Assistant</div><div class="analysis-text">${escapeHtml(answer).replace(/\\n/g, "<br>")}</div></div>`;
        }
      } catch (e) {
        if (out) {
          out.style.display = "block";
          out.innerHTML = `<div class="analysis-panel"><div class="analysis-title">Error</div><div class="analysis-text">${escapeHtml(e.message)}</div></div>`;
        }
      } finally {
        askBtn.disabled = false;
        askBtn.textContent = "Ask assistant";
      }
    });
  }
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
        <div class="vitals-actions">
          <button id="refresh-vitals" class="btn primary">${t("refreshVitals")}</button>
          <button id="sim-pause-btn" class="btn" type="button">Pause</button>
        </div>
      </div>

      <div class="vitals-sim-grid">
        <div class="card vitals-sim-card">
          <div class="vitals-sim-header">
            <div>
              <div class="vitals-sim-title">Measuring Heart Rate</div>
              <div class="vitals-sim-sub">${t("heartRate")}</div>
            </div>
            <button class="icon-btn" type="button" aria-label="Info">i</button>
          </div>
          <div class="ring-wrap">
            <div class="ring" id="sim-hr-ring" style="--p: 55%">
              <div class="ring-center">
                <div class="ring-icon">💓</div>
                <div class="ring-value"><span id="sim-hr">76</span></div>
                <div class="ring-unit">BPM</div>
              </div>
            </div>
          </div>
          <div class="wave-wrap" aria-hidden="true">
            <svg width="260" height="70" viewBox="0 0 260 70">
              <path id="sim-wave-path" d="" fill="none" stroke="rgba(43,103,255,0.9)" stroke-width="2.5" stroke-linecap="round"></path>
            </svg>
          </div>
          <div class="muted" style="margin-top:8px;">${t("refreshingVitals").replace("...", "")} (simulation)</div>
        </div>

        <div class="card vitals-sim-card">
          <div class="vitals-sim-header">
            <div>
              <div class="vitals-sim-title">Pedometer Monitor</div>
              <div class="vitals-sim-sub">${t("steps")}</div>
            </div>
            <button class="icon-btn" type="button" aria-label="Refresh">⟳</button>
          </div>
          <div class="ring-wrap">
            <div class="ring" id="sim-steps-ring" style="--p: 45%">
              <div class="ring-center">
                <div class="ring-icon">👣</div>
                <div class="ring-value"><span id="sim-steps">512</span></div>
                <div class="ring-unit">Steps</div>
              </div>
            </div>
          </div>
          <div class="pill">Goal: 1000 steps</div>
          <div class="vitals-mini-stats">
            <div class="mini-stat"><div class="mini-ic">🔥</div><div class="mini-v" id="sim-kcal">780</div><div class="mini-l">Kcal</div></div>
            <div class="mini-stat"><div class="mini-ic">⏱</div><div class="mini-v" id="sim-mins">14:08</div><div class="mini-l">Mins</div></div>
            <div class="mini-stat"><div class="mini-ic">📍</div><div class="mini-v" id="sim-km">0.34</div><div class="mini-l">Km</div></div>
          </div>
        </div>
      </div>

      <div class="vitals-mini-grid">
        <div class="card vitals-mini-card" id="sim-bp-widget" data-level="ok">
          <div class="mini-head">
            <div>
              <div class="mini-title">${t("bloodPressure")}</div>
              <div class="mini-sub">SYS / DIA</div>
            </div>
            <div class="mini-pill" id="sim-bp">—</div>
          </div>
          <div class="bp-bars">
            <div class="bp-row">
              <div class="bp-label">SYS</div>
              <div class="bp-track"><div class="bp-fill sys"></div></div>
            </div>
            <div class="bp-row">
              <div class="bp-label">DIA</div>
              <div class="bp-track"><div class="bp-fill dia"></div></div>
            </div>
          </div>
          <div class="mini-note">Optimal is around 120/80</div>
        </div>

        <div class="card vitals-mini-card">
          <div class="mini-head">
            <div>
              <div class="mini-title">${t("oxygen")}</div>
              <div class="mini-sub">SpO₂</div>
            </div>
            <div class="mini-pill" id="sim-o2">—</div>
          </div>
          <div class="o2-wrap">
            <div class="o2-ring" id="sim-o2-ring" style="--p: 70%" data-level="ok">
              <div class="o2-center">
                <div class="o2-ic">🫁</div>
                <div class="o2-big" id="sim-o2-big">—</div>
                <div class="o2-unit">%</div>
              </div>
            </div>
          </div>
          <div class="mini-note">Usually 95–100%</div>
        </div>

        <div class="card vitals-mini-card">
          <div class="mini-head">
            <div>
              <div class="mini-title">${t("temperature")}</div>
              <div class="mini-sub">Body temperature</div>
            </div>
            <div class="mini-pill" id="sim-temp">—</div>
          </div>
          <div class="thermo" id="sim-thermo" style="--fill: 50%">
            <div class="thermo-tube">
              <div class="thermo-fill"></div>
            </div>
            <div class="thermo-bulb"></div>
            <div class="thermo-scale">
              <div class="tick">35</div>
              <div class="tick">36</div>
              <div class="tick">37</div>
              <div class="tick">38</div>
              <div class="tick">39</div>
            </div>
          </div>
          <div class="mini-note">Cold / Normal / Hot colors</div>
        </div>

        <div class="card vitals-mini-card">
          <div class="mini-head">
            <div>
              <div class="mini-title">${t("weight")}</div>
              <div class="mini-sub">Body weight</div>
            </div>
            <div class="mini-pill" id="sim-weight">—</div>
          </div>
          <div class="scale" id="sim-scale">
            <div class="scale-dial">
              <div class="scale-arc"></div>
              <div class="scale-needle"></div>
              <div class="scale-center"></div>
            </div>
            <div class="scale-labels">
              <span>45</span><span>70</span><span>95</span><span>120</span><span>140</span>
            </div>
          </div>
          <div class="mini-note">Demo weight drift</div>
        </div>
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

  const pauseBtn = document.getElementById("sim-pause-btn");
  if (pauseBtn) pauseBtn.addEventListener("click", toggleVitalsSim);

  ensureVitalsSim();
  renderVitalsSimToDom();

  // sync oxygen big number if present
  const o2Big = document.getElementById("sim-o2-big");
  if (o2Big) o2Big.textContent = String(VITALS_SIM.oxygen);
}

function renderNutrition() {
  const items = JSON.parse(localStorage.getItem("nutritionMealsV2") || "[]");
  const totals = items.reduce(
    (acc, it) => {
      acc.kcal += Number(it.kcal || 0);
      acc.p += Number(it.p || 0);
      acc.c += Number(it.c || 0);
      acc.f += Number(it.f || 0);
      return acc;
    },
    { kcal: 0, p: 0, c: 0, f: 0 },
  );

  const listHtml =
    items.length === 0
      ? `<div class="empty-state">${t("noEntriesYet")}</div>`
      : `<div class="meal-list">${items
          .map(
            (it, idx) => `
              <div class="meal-row">
                <div class="meal-main">
                  <div class="meal-title">${escapeHtml(it.name)} <span class="meal-grams">• ${it.grams}g</span></div>
                  <div class="meal-sub">${Math.round(it.kcal)} kcal  |  P ${Number(it.p).toFixed(1)}g  C ${Number(it.c).toFixed(1)}g  F ${Number(it.f).toFixed(1)}g</div>
                </div>
                <button class="icon-btn" type="button" data-remove-meal="${idx}" aria-label="Remove">✕</button>
              </div>
            `,
          )
          .join("")}</div>`;

  return `${renderHeader()}${renderNav()}<main class="container">
      <div class="page-header"><h2>${t("nutrition")}</h2><p class="subtitle">Log meals and estimate macros (protein, carbs, fat).</p></div>
      <div class="card">
        <form id="nutrition-form" class="modal-form">
          <div class="form-group">
            <label>Dish name</label>
            <input type="text" id="food-name" placeholder="e.g. chicken, rice, banana" required>
          </div>
          <div class="form-group">
            <label>Weight (grams)</label>
            <input type="number" id="food-grams" placeholder="200" value="200" required>
          </div>
          <button class="btn primary" id="add-food-btn">${t("addFood")}</button>
          <div class="muted" style="margin-top:10px;">Tip: this is a small built-in food list for the expo. We can connect a real nutrition API later.</div>
          <div id="nutrition-error" class="error-text" style="display:none;"></div>
        </form>
      </div>
      <div class="card">
        <h3>${t("dailySummary")}</h3>
        <div>${t("totalCalories")}: <strong>${Math.round(totals.kcal)} kcal</strong></div>
        <div class="macro-chips" style="margin-top:10px;">
          <div class="macro-chip">Protein: <strong>${totals.p.toFixed(1)} g</strong></div>
          <div class="macro-chip">Carbs: <strong>${totals.c.toFixed(1)} g</strong></div>
          <div class="macro-chip">Fat: <strong>${totals.f.toFixed(1)} g</strong></div>
        </div>
        <div id="nutrition-list" style="margin-top:14px;">${listHtml}</div>
      </div>
    </main>${renderFooter()}`;
}

function attachNutritionHandlers() {
  const form = document.getElementById("nutrition-form");
  if (!form) return;
  ensureVitalsSim(); // no-op if already running, keeps demo feeling alive

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("food-name")?.value?.trim() || "";
    const grams = Number(document.getElementById("food-grams")?.value || 0);
    const errEl = document.getElementById("nutrition-error");

    const food = lookupFood(name);
    if (!name || !grams || grams <= 0) {
      showNutritionError(errEl, "Enter a dish name and a valid weight in grams.");
      return;
    }
    if (!food) {
      showNutritionError(errEl, `Unknown dish. Try: ${Object.keys(FOOD_DB).slice(0, 6).join(", ")}`);
      return;
    }
    if (errEl) errEl.style.display = "none";

    const factor = grams / 100;
    const entry = {
      name,
      grams,
      kcal: food.kcal * factor,
      p: food.p * factor,
      c: food.c * factor,
      f: food.f * factor,
      createdAt: new Date().toISOString(),
    };
    const items = JSON.parse(localStorage.getItem("nutritionMealsV2") || "[]");
    items.unshift(entry);
    localStorage.setItem("nutritionMealsV2", JSON.stringify(items));
    navigate("nutrition");
  });

  const list = document.getElementById("nutrition-list");
  if (list) {
    list.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-remove-meal]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-remove-meal"));
      const items = JSON.parse(localStorage.getItem("nutritionMealsV2") || "[]");
      if (idx >= 0 && idx < items.length) {
        items.splice(idx, 1);
        localStorage.setItem("nutritionMealsV2", JSON.stringify(items));
        navigate("nutrition");
      }
    });
  }
}

function showNutritionError(el, msg) {
  if (!el) {
    alert(msg);
    return;
  }
  el.textContent = msg;
  el.style.display = "block";
}

const FOOD_DB = {
  // Per 100g (demo list)
  banana: { kcal: 89, p: 1.1, c: 22.8, f: 0.3 },
  apple: { kcal: 52, p: 0.3, c: 13.8, f: 0.2 },
  rice: { kcal: 130, p: 2.7, c: 28.2, f: 0.3 }, // cooked
  pasta: { kcal: 131, p: 5.0, c: 25.0, f: 1.1 }, // cooked
  potato: { kcal: 77, p: 2.0, c: 17.0, f: 0.1 },
  bread: { kcal: 265, p: 9.0, c: 49.0, f: 3.2 },
  egg: { kcal: 143, p: 13.0, c: 1.1, f: 9.5 },
  milk: { kcal: 42, p: 3.4, c: 5.0, f: 1.0 },
  yogurt: { kcal: 59, p: 10.0, c: 3.6, f: 0.4 },
  chicken: { kcal: 165, p: 31.0, c: 0.0, f: 3.6 },
  beef: { kcal: 250, p: 26.0, c: 0.0, f: 15.0 },
  salad: { kcal: 20, p: 1.2, c: 3.6, f: 0.2 },
  oatmeal: { kcal: 68, p: 2.4, c: 12.0, f: 1.4 }, // cooked
};

function lookupFood(rawName) {
  const n = String(rawName || "").trim().toLowerCase();
  if (!n) return null;
  if (FOOD_DB[n]) return FOOD_DB[n];
  const keys = Object.keys(FOOD_DB);
  for (const k of keys) {
    if (n.includes(k)) return FOOD_DB[k];
  }
  return null;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        syncVitalsFromProfile();
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

  apiCall("/symptoms", "POST", {
    text,
    language: typeof currentLang === "string" ? currentLang : "en",
  })
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
  modal.className = "modal-overlay dynamic-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${t("connectNewDevice")}</h3>
        <button onclick="closeModal()" class="modal-close" aria-label="Close">&times;</button>
      </div>
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
  openDynamicModal(modal);

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
  modal.className = "modal-overlay dynamic-modal";
  modal.innerHTML = `
    <div class="modal-content analysis-modal">
      <div class="modal-header">
        <h3>${t("symptomAnalysis")}</h3>
        <button onclick="closeModal()" class="modal-close" aria-label="Close">&times;</button>
      </div>
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
          <strong>${t("important")}</strong> ${t("analysisDisclaimer")}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn primary" onclick="closeModal()">${t("close")}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  openDynamicModal(modal);
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

    // Cache for "View Full Analysis" without embedding huge JSON in onclick attributes.
    window.__symptomHistoryCache = Array.isArray(symptoms) ? symptoms : [];

    let html = '<div class="symptoms-history">';
    symptoms.forEach((symptom) => {
      const date = new Date(symptom.timestamp).toLocaleString();
      const severityClass = `severity-${symptom.severity}`;
      const analysisPreviewRaw =
        (typeof symptom.aiAnalysis === "string" && symptom.aiAnalysis) ||
        (typeof symptom.analysis === "string" && symptom.analysis) ||
        (Array.isArray(symptom.conditions) && symptom.conditions.length
          ? `Possible: ${symptom.conditions.slice(0, 3).join(", ")}`
          : "");
      const analysisPreview = analysisPreviewRaw
        ? analysisPreviewRaw.substring(0, 140) + (analysisPreviewRaw.length > 140 ? "..." : "")
        : "Analysis not available";
      html += `
        <div class="symptom-entry" role="button" tabindex="0" onclick="viewFullAnalysis('${escapeHtml(String(symptom.id || ""))}')">
          <div class="symptom-header">
            <span class="symptom-date">${date}</span>
            <span class="severity-badge ${severityClass}">${symptom.severity}</span>
          </div>
          <div class="symptom-text">"${symptom.text}"</div>
          <div class="symptom-analysis-preview">
            ${escapeHtml(analysisPreview)}
          </div>
          <button class="btn small view-analysis-btn"
            data-symptom-id="${escapeHtml(String(symptom.id || ""))}"
            onclick="event.stopPropagation(); viewFullAnalysis(this.getAttribute('data-symptom-id'))"
          >View Full Analysis</button>
        </div>
      `;
    });
    html += "</div>";
    historyDiv.innerHTML = html;

    // One delegated listener (more reliable than per-button listeners across rerenders).
    if (!historyDiv.__analysisClickBound) {
      historyDiv.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest
          ? e.target.closest(".view-analysis-btn")
          : null;
        if (!btn) return;
        const id = btn.getAttribute("data-symptom-id");
        viewFullAnalysis(id);
      });
      historyDiv.__analysisClickBound = true;
    }
  } catch (err) {
    console.error("Load symptoms failed:", err);
    document.getElementById("symptom-history").innerHTML =
      "Failed to load symptom history.";
  }
}

function viewFullAnalysis(symptomId) {
  const list = Array.isArray(window.__symptomHistoryCache)
    ? window.__symptomHistoryCache
    : [];
  const found = list.find((s) => String(s.id) === String(symptomId));
  showSymptomAnalysis(found || { text: "-", analysis: "No analysis available." });
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
    // doctor-only page is inserted below (after dashboard) when applicable
    ["symptoms", "🩺"],
    ["reminders", "🔔"],
    ["devices", "⌚"],
    ["vitals", "❤️"],
    ["nutrition", "🍽️"],
    ["reports", "📊"],
    ["complaints", "📝"],
  ];
  if (currentUser?.role === "doctor") {
    items.splice(1, 0, ["doctor-chat", "💬"]);
  }
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
    syncVitalsFromProfile();
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
