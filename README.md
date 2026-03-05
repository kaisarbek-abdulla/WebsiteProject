# Website Project

A full-stack website project with Node.js backend and HTML/CSS/JS frontend.

## Folder Structure

```
WebsiteProject/
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── config/
│   └── server.js
├── frontend/
│   ├── html/
│   ├── css/
│   ├── js/
│   └── assets/
│       ├── images/
│       └── fonts/
├── package.json
├── .env
├── .gitignore
└── README.md
```

## Getting Started

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Open frontend files in your browser
## VS Code Quick Setup

- Recommended workflow: run the backend from VS Code and start the Expo mobile app from the `mobile/` folder. This keeps web and mobile development in one workspace.
- Open the workspace in VS Code and install the recommended extensions (VS Code will prompt based on `.vscode/extensions.json`).

Quick commands:
```bash
# root: install and run backend
npm install
npm run dev:web

# mobile: install and start Expo
cd mobile
npm install
npm start
```

## LAN / Mobile Access (Quick)

To open the site from another device on the same Wi‑Fi (phone, another PC):

1. Ensure the server binds to all interfaces (already set in `backend/server.js`):

```bash
# server listens on 0.0.0.0 and default port 5000
node backend/server.js
```

2. Find your PC's local IPv4 address (Windows):

```powershell
ipconfig
# look for "IPv4 Address" under the active adapter, e.g. 192.168.1.42
```

3. On your phone or another PC on the same Wi‑Fi open:

```
http://<PC_IP>:5000/html/index.html
```

4. If your firewall blocks the port, run the provided script to open it (Windows PowerShell, admin):

```powershell
# from project root
./scripts/open-port.ps1
```

5. Alternative (remote testing): use a tunnel like `ngrok` or `npx localtunnel --port 5000` and open the provided HTTPS URL on your device.

Notes:
- If the frontend or API uses absolute URLs, update them to use the PC IP or the tunnel URL.
- Android emulator: use `http://10.0.2.2:5000/html/index.html`
- iOS Simulator: use `http://localhost:5000/html/index.html`


