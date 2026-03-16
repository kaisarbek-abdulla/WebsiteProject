# PULSE - AI Health Assistant

## 📋 Project Overview

PULSE is a comprehensive full-stack health assistant application that provides AI-powered symptom analysis, user authentication, reminders, and health tracking features. The application consists of a web frontend, Node.js backend API, and supports multiple languages (English, Kazakh, Russian).

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: In-memory storage (configurable for production)
- **Authentication**: JWT tokens
- **Email**: Nodemailer for notifications
- **AI Integration**: Symptom analysis API
- **Internationalization**: Multi-language support

### Project Structure

```
WebsiteProject/
├── .env                    # Environment variables
├── .env.example           # Environment variables template
├── .git/                  # Git repository
├── .gitignore            # Git ignore rules
├── .vscode/              # VS Code settings
├── backend/              # Node.js backend application
│   ├── server.js         # Main server file
│   ├── test_api.js       # API testing utilities
│   ├── config/
│   │   └── database.js   # Database configuration
│   ├── controllers/      # Route controllers
│   │   ├── authController.js
│   │   ├── reminderController.js
│   │   └── symptomController.js
│   ├── firebase/
│   │   └── admin.js      # Firebase admin SDK
│   ├── jobs/
│   │   └── reminderWorker.js  # Background job for reminders
│   ├── mailer/
│   │   └── mailer.js     # Email service
│   ├── middleware/
│   │   └── auth.js       # Authentication middleware
│   ├── models/
│   │   └── inMemoryStore.js  # Data models
│   └── routes/           # API route definitions
│       ├── auth.js
│       ├── example.js
│       ├── reminders.js
│       └── symptoms.js
├── frontend/             # Web frontend application
│   ├── assets/
│   │   ├── fonts/        # Font files
│   │   └── images/       # Image assets
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   ├── html/
│   │   └── index.html    # Main HTML page
│   ├── js/
│   │   └── script.js     # Main JavaScript file
│   └── locales/          # Translation files
│       ├── en.json
│       ├── kz.json
│       └── ru.json
├── node_modules/         # NPM dependencies
├── package.json          # Project dependencies and scripts
├── package-lock.json     # Dependency lock file
├── Procfile              # Heroku deployment configuration
├── README.md             # Original project README
├── scripts/              # Utility scripts
└── web/                  # Additional web-related files
```

## 🚀 Features

### Core Functionality
- **User Authentication**: Registration, login, JWT-based sessions
- **Symptom Analysis**: AI-powered health symptom analysis
- **Reminders**: Scheduled health reminders and notifications
- **Multi-language Support**: English, Kazakh, Russian
- **Email Notifications**: Automated email alerts
- **Responsive Design**: Mobile-friendly web interface

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

#### Symptoms
- `POST /api/symptoms/analyze` - Analyze symptoms using AI
- `GET /api/symptoms/history` - Get symptom analysis history

#### Reminders
- `POST /api/reminders` - Create reminder
- `GET /api/reminders` - Get user reminders
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to project**:
   ```bash
   cd "C:\Users\Abdul\OneDrive\Рабочий стол\stag 2 soft\WebsiteProject"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   PORT=3000
   JWT_SECRET=your-secret-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   ```

4. **Start the application**:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**:
   - Web app: http://localhost:3000
   - API endpoints: http://localhost:3000/api/*

## 📱 Mobile App Development History

### Previous Attempts (Cleaned Up)
The project explored several mobile app development approaches that were ultimately removed to keep the repository focused:

1. **Expo/React Native** - Attempted to create a mobile app using Expo CLI
   - Issues: Navigation throttling, asset loading problems, complex setup
   - Status: Removed - `mobile-app/` folder deleted

2. **Capacitor** - Tried wrapping the web app for mobile using Capacitor
   - Issues: Gradle wrapper corruption, Android SDK setup problems
   - Status: Removed - Capacitor dependencies and `android/` folder deleted

3. **Ionic Framework** - Created an Ionic Angular app
   - Issues: Similar build problems, decided to focus on core web app
   - Status: Removed - `mobile-app/` folder deleted

### Current Status
- **Web App**: Fully functional with all features implemented
- **Mobile App**: No mobile implementation currently - focus is on web platform
- **Future**: May consider React Native CLI for native mobile app if needed

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_USER`: Email service username
- `EMAIL_PASS`: Email service password
- `DATABASE_URL`: Database connection string (if using external DB)

### Database
Currently uses in-memory storage. For production, configure `config/database.js` to use:
- MongoDB
- PostgreSQL
- MySQL
- Or other preferred database

## 📦 Dependencies

### Production Dependencies
- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management
- `jsonwebtoken`: JWT authentication
- `node-fetch`: HTTP requests
- `nodemailer`: Email sending

### Development Dependencies
- `nodemon`: Auto-restart server in development

## 🚀 Deployment

### Heroku
The project includes a `Procfile` for Heroku deployment:
```
web: node backend/server.js
```

### Other Platforms
- Configure environment variables
- Set up database connection
- Run `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 📞 Support

For questions or issues, please check the code comments or create an issue in the repository.

---

**Last Updated**: March 16, 2026
**Status**: Web application fully functional, mobile development paused
# hello