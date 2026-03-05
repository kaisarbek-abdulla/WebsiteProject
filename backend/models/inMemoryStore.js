const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'store.json');
const dataDir = path.dirname(dataFile);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize with empty data
let data = {
  users: [],
  symptoms: [],
  reminders: []
};

// Load from file if it exists
if (fs.existsSync(dataFile)) {
  try {
    data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    console.warn('Could not load store.json, using empty store');
  }
}

// Function to save data to file
function saveToFile() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save store to file:', e.message);
  }
}

// Export the store with auto-save on modifications
module.exports = {
  get users() {
    return data.users;
  },
  get symptoms() {
    return data.symptoms;
  },
  get reminders() {
    return data.reminders;
  },
  // Override array methods to auto-save
  addUser(user) {
    data.users.push(user);
    saveToFile();
    return user;
  },
  updateUser(id, updates) {
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...updates };
      saveToFile();
    }
    return data.users[idx];
  },
  removeUser(id) {
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      data.users.splice(idx, 1);
      saveToFile();
    }
  },
  deleteUser(id) {
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      data.users.splice(idx, 1);
      saveToFile();
    }
  },
  addSymptom(symptom) {
    data.symptoms.push(symptom);
    saveToFile();
    return symptom;
  },
  addReminder(reminder) {
    data.reminders.push(reminder);
    saveToFile();
    return reminder;
  },
  save() {
    saveToFile();
  }
};
