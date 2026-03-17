# PULSE

PULSE is a health assistant project with a Node.js/Express backend API, a web UI (served as static files), and a Flutter mobile app in progress.

## Current Focus (Flutter App)

The mobile app lives in `pulse/` and is the primary development target now. The backend stays as the API that the app will call (locally or deployed on Railway).

## Quick Start (Flutter)

Prereqs:
- Flutter SDK installed and on PATH
- Android Studio + Android SDK (or standalone SDK) and at least one emulator/device

From the repo:

```bash
cd WebsiteProject/pulse
flutter pub get
flutter run
```

Notes:
- Android emulator uses `10.0.2.2` to reach your PC `localhost`.
- Physical device needs your PC LAN IP and the backend must bind to `0.0.0.0` (it already does).

## Quick Start (Backend API + Web)

Backend entrypoint: `backend/server.js` (defaults to port `5000`).

```bash
cd WebsiteProject
npm install
npm run dev
```

Open:
- Web UI: `http://localhost:5000/html/index.html`
- API base: `http://localhost:5000/api`

LAN access (Windows):
- The server binds to all interfaces (`0.0.0.0`). If Windows Firewall blocks it, run `scripts/open-port.ps1` as Administrator.

## Deployment (Railway)

This repo can be connected to Railway for the backend/web deployment. Set env vars in Railway (at least `JWT_SECRET`, and optionally AI/email settings) and run `npm start`.

The included `Procfile` (`web: node backend/server.js`) is compatible with simple PaaS deploys.

## API Overview

Unless stated otherwise, endpoints require `Authorization: Bearer <JWT>`.

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

Symptoms:
- `POST /api/symptoms` (also accepts `text` or `symptoms` in body)
- `POST /api/symptoms/analyze` (alias of the same action)
- `GET /api/symptoms`

Reminders:
- `POST /api/reminders`
- `GET /api/reminders`

Devices:
- `POST /api/devices/connect`
- `GET /api/devices`
- `DELETE /api/devices/:deviceId`

Complaints:
- `POST /api/complaints`
- `GET /api/complaints`

## Environment Variables

Copy `WebsiteProject/.env.example` to `WebsiteProject/.env` for local dev.

Common:
- `PORT` (default `5000`)
- `JWT_SECRET` (required for any real deployment)

AI symptom analysis:
- `GROQ_API_KEY` (Groq OpenAI-compatible endpoint)
- `XAI_API_KEY` (Grok fallback)

Email (reminders):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- If not set, the app uses an Ethereal test account and prints a preview URL in logs.

Storage:
- Default is file-backed in-memory store at `backend/data/store.json`.
- Firestore is optional and requires `firebase-admin` installed and credentials set (see `backend/firebase/admin.js`).

## Repo Layout (Relevant)

`WebsiteProject/`
- `backend/`: Express API + background reminder worker
- `web/`: Main web UI (served by the backend)
- `frontend/`: PWA assets (manifest + service worker + icons)
- `pulse/`: Flutter mobile app (current focus)

---

**Last Updated**: March 17, 2026
**Status**: Flutter app in progress; backend/web running and deployable (Railway)
