# PULSE

PULSE — это проект “AI Health Assistant”: веб‑приложение + Node.js/Express backend API (деплой на Railway) и мобильное приложение на Flutter (ранняя стадия).

Ниже — актуальное описание того, что уже сделано (включая Firestore и Groq), как запускать локально и какие переменные нужны для Railway.

---

## Что Уже Сделано (по состоянию на 19 марта 2026)

### 1) Хранилище и база данных (персистентность после redeploy)
Проблема: при редеплое Railway “новые аккаунты пропадали”, потому что данные были только в локальном store.

Решение:
- Добавлена опциональная интеграция **Firestore** через `firebase-admin` (работает, если настроены креды).
- Если Firestore не настроен, система продолжает работать на локальном store (`backend/data/store.json`) без падения.

Где в коде:
- `backend/firebase/admin.js` — инициализация Firebase Admin, включение/отключение Firestore.
- Firestore‑ветки в контроллерах: `authController.js`, `symptomController.js`, `reminderController.js`, `messageController.js`.

### 2) AI (Groq) для Symptom Analyzer + Doctor Assistant
Сделано:
- Подключён **Groq** (OpenAI‑compatible endpoint) для анализа симптомов.
- Поддержан fallback (если Groq падает) на `XAI_API_KEY` (Grok), либо локальный demo‑анализ без внешнего ключа.
- В запросах учитывается язык интерфейса (frontend передаёт `language`).
- Промпт улучшен так, чтобы советы и red flags были **релевантны к жалобе** (например “боль в ноге” → red flags по конечности, а не про дыхание).

Где в коде:
- `backend/controllers/symptomController.js` — анализ, JSON‑парсинг, нормализация ответа.
- `backend/controllers/aiController.js` + `backend/routes/ai.js` — endpoint “Doctor Assistant”.

Важно:
- Модель Groq задаётся через `GROQ_MODEL` (по умолчанию используется `llama-3.1-8b-instant`).
- Если ты видишь ошибку “model decommissioned”, просто поменяй `GROQ_MODEL` в Railway на актуальную модель.

### 3) Веб интерфейс (UI/UX)
Сделано:
- Улучшены **Vitals**: добавлена симуляция и значения для метрик, плюс более “живой” дизайн карточек (сердцебиение/шаги и другие).
- **Reminders**: раздел стал менее “скучным”, добавлены кнопки удаления:
  - удалить все,
  - удалить по одному,
  - отметка done (toggle).
- Reminders теперь отображаются и на **Dashboard** (мини‑список “upcoming”), а не только в отдельной секции.
- Страница **About Us**: текст расширен, порядок секций изменён:
  - Team → About the project (длинный текст) → Funding contact.
- На **Profile** исправлен перевод: основные заголовки и подписи теперь берутся из `t(...)`, плюс роль (patient/doctor/admin) переводится.

Где в коде:
- `web/js/app.js` — основной UI (Dashboard/Reminders/About/Profile и логика i18n).
- `web/css/style.css` — стили (в том числе мини‑reminders на Dashboard).

---

## Быстрый Запуск Backend + Web3

Backend entrypoint: `backend/server.js` (по умолчанию `PORT=5000`).

```bash
cd WebsiteProject
npm install
npm run dev
```

Открыть:
- Web UI: `http://localhost:5000/html/index.html`
- API base: `http://localhost:5000/api`

LAN доступ (Windows):
- Сервер слушает `0.0.0.0`. Если упираешься в Windows Firewall — используй `scripts/open-port.ps1` (Admin).

---

## Быстрый Запуск (Flutter App)

Мобильное приложение находится в `pulse/` (ранняя стадия).

```bash
cd WebsiteProject/pulse
flutter pub get
flutter run
```

Сетевые заметки:
- Android emulator → чтобы достучаться до backend на ПК: используй `10.0.2.2` вместо `localhost`.
- Физический телефон → используй LAN IP твоего ПК (например `http://192.168.x.x:5000/api`) и убедись, что firewall не режет порт.

---

## Railway Deploy (Веб + Backend)

Подключи репозиторий к Railway и выставь переменные.

Минимум:
- `JWT_SECRET` — любая длинная случайная строка (можно 32+ символа, например: `a9f1...`).

### Firestore (чтобы аккаунты не пропадали после redeploy)
1. Firebase Console → Project settings → Service accounts → Generate new private key
2. В Railway → Variables:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = **полное содержимое JSON** (service account)

Примечание:
- “Одной строкой” делать не обязательно, но в Railway удобнее вставлять в одну строку.
- PowerShell вариант “в одну строку”:
  - `(Get-Content .\\serviceAccountKey.json -Raw) -replace \"(\\r?\\n)+\",\"\"`

### Groq (AI)
- `GROQ_API_KEY` = твой ключ Groq
- `GROQ_MODEL` = (опционально) модель, например `llama-3.1-8b-instant`
- `XAI_API_KEY` = (опционально) fallback на Grok

---

## API (основные endpoints)

Обычно требуют `Authorization: Bearer <JWT>`.

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

Symptoms (AI):
- `POST /api/symptoms` (принимает `text` или `symptoms`)
- `POST /api/symptoms/analyze` (alias)
- `GET /api/symptoms`
- `DELETE /api/symptoms` (очистка истории)

Reminders:
- `POST /api/reminders`
- `GET /api/reminders`

AI tools (doctor assistant):
- `POST /api/ai/doctor-assistant`

Devices:
- `POST /api/devices/connect`
- `GET /api/devices`
- `DELETE /api/devices/:deviceId`

Complaints:
- `POST /api/complaints`
- `GET /api/complaints`

---

## Troubleshooting

### “Groq model decommissioned”
- Поменяй `GROQ_MODEL` в Railway на актуальную модель.

### “Не вижу изменения на сайте без очистки кэша”
- Иногда PWA/браузер кэширует статические ассеты. После деплоя сделай один раз жёсткое обновление:
  - ПК: `Ctrl+F5`
  - Телефон: закрыть вкладку и открыть заново

---

**Last Updated**: March 19, 2026
**Status**: Web + backend работают и деплоятся на Railway; Flutter app в разработке
