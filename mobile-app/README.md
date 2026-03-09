# PULSE Mobile App (React Native + Expo)

## Quick Start

### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

### 2. Configure API Connection
Edit `services/apiService.js` and update the `API_BASE` URL:
```javascript
const API_BASE = 'http://YOUR-SERVER-IP:5000/api';
```

**Important:** Use your actual server IP address (not localhost). Get it from your Railway deployment or local network IP.

### 3. Start the App
```bash
npm start
```

### 4. Test on Phone
1. Install the **Expo Go** app on your phone (iOS App Store or Android Play Store)
2. Run `npm start` in the terminal
3. Scan the QR code with your phone's camera
4. The app will open in Expo Go
5. Test login with your backend credentials

## Features

- ✅ Login & Register with backend
- ✅ Symptom Analysis with AI (Grok/Groq)
- ✅ Dashboard with health metrics
- ✅ Complaints & device management
- ✅ Persistent authentication
- ✅ Bottom tab navigation
- ✅ Dark mode ready

## Project Structure

```
mobile-app/
├── app/              # Expo Router app structure
├── contexts/         # AuthContext for state management
├── screens/          # Screen components
├── services/         # API calls
├── assets/           # Images & fonts
└── package.json
```

## Building for Production

### Android
```bash
eas build --platform android
```

### iOS (Mac required)
```bash
eas build --platform ios
```

Learn more: https://docs.expo.dev/build/

## Troubleshooting

**Can't connect to API:** Update API_BASE URL with your actual server IP

**Expo Go crashes:** Run `npm start -- --clear` to clear cache

**Login fails:** Ensure backend server is running on port 5000

---

Ready to test? 🎉 Download Expo Go and scan the QR code!

