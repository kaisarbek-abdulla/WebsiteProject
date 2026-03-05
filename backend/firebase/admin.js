const fs = require('fs');
let admin = null;
let db = null;

try {
  // Try to require firebase-admin if installed
  admin = require('firebase-admin');
} catch (e) {
  console.warn('firebase-admin not installed; Firestore disabled');
}

if (admin) {
  const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let credential = null;
  try {
    if (svcPath && fs.existsSync(svcPath)) {
      credential = admin.credential.cert(require(svcPath));
    } else if (svcJson) {
      credential = admin.credential.cert(JSON.parse(svcJson));
    }
  } catch (err) {
    console.error('Failed to load Firebase service account:', err.message);
  }

  try {
    if (credential) {
      admin.initializeApp({ credential });
      db = admin.firestore();
      console.log('Firebase Admin initialized.');
    } else {
      console.warn('No Firebase credential provided; Firestore disabled.');
    }
  } catch (err) {
    console.error('Firebase Admin initialization error:', err.message);
  }
}

module.exports = { admin, db };
