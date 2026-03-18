const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets with cache disabled for JS/CSS/HTML. This avoids "it didn't change" issues during expo demos.
function noStoreForTextAssets(res, filePath) {
  const p = String(filePath || '').toLowerCase();
  if (p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store');
  }
}

// Serve the web frontend from the `web/` folder (resolved relative to this file)
app.use(express.static(path.join(__dirname, '..', 'web'), { etag: true, maxAge: 0, setHeaders: noStoreForTextAssets }));
// Also serve frontend assets (PWA and logos)
app.use(express.static(path.join(__dirname, '..', 'frontend'), { etag: true, maxAge: 0, setHeaders: noStoreForTextAssets }));

// Explicit route for the dashboard HTML
app.get('/html/index.html', (req, res) => {
  const filePath = path.join(__dirname, '..', 'web', 'html', 'index.html');
  console.log(`[DEBUG] Serving ${req.path} from ${filePath}`);
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(filePath, (err) => {
    if (err) console.error(`[ERROR] sendFile failed: ${err.message}`);
  });
});

// Simple root redirect to index
app.get('/', (req, res) => {
  if (req.path === '/') {
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(path.join(__dirname, '..', 'web', 'html', 'index.html'));
  }
  res.send('Welcome to the API');
});

// Mount API routes (scaffold)
const authRouter = require('./routes/auth');
const symptomsRouter = require('./routes/symptoms');
const remindersRouter = require('./routes/reminders');
const complaintsRouter = require('./routes/complaints');
const devicesRouter = require('./routes/devices');
const messagesRouter = require('./routes/messages');
const aiRouter = require('./routes/ai');

app.use('/api/auth', authRouter);
app.use('/api/symptoms', symptomsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/ai', aiRouter);

// Start background workers
try {
  const reminderWorker = require('./jobs/reminderWorker');
  reminderWorker.start();
} catch (e) {
  console.warn('Reminder worker not started:', e.message);
}



// Start server (bind to all interfaces for LAN access)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});
