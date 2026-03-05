const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const store = require('../models/inMemoryStore');
const { db } = require('../firebase/admin');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

exports.register = async (req, res) => {
  const { name, email, password, language, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  
  const validRoles = ['patient', 'doctor'];
  const userRole = (role && validRoles.includes(role)) ? role : 'patient';
  
  const exists = store.users.find(u => u.email === email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'User already exists' });

  const { salt, hash } = hashPassword(password);
  const user = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name: name || '',
    email: email.toLowerCase(),
    passwordHash: hash,
    salt,
    language: language || 'en',
    role: userRole,
    profile: {
      age: null,
      height: null,
      weight: null,
      bloodType: null,
      allergies: '',
      medications: '',
      medicalHistory: '',
      emergencyContact: '',
      phoneNumber: ''
    },
    createdAt: new Date().toISOString()
  };
  if (db) {
    try {
      await db.collection('users').doc(user.id).set(user);
    } catch (e) {
      console.error('Firestore write user failed:', e.message);
    }
  } else {
    store.users.push(user);
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ userId: user.id, token, role: user.role });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  let user = null;
  if (db) {
    try {
      const q = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
      if (!q.empty) user = q.docs[0].data();
    } catch (e) {
      console.error('Firestore read user failed:', e.message);
    }
  } else {
    user = store.users.find(u => u.email === email.toLowerCase());
  }
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, userId: user.id, role: user.role });
};

exports.getUser = async (req, res) => {
  const id = req.params.id;
  let user = null;
  if (db) {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (doc.exists) user = doc.data();
    } catch (e) {
      console.error('Firestore getUser failed:', e.message);
    }
  } else {
    user = store.users.find(u => u.id === id);
  }
  if (!user) return res.status(404).json({ error: 'User not found' });
  const safe = { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    role: user.role, 
    language: user.language,
    profile: user.profile || {}
  };
  res.json(safe);
};

exports.getPatients = async (req, res) => {
  if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Access denied' });
  try {
    let patients = [];
    if (db) {
      const snapshot = await db.collection('users').where('role', '==', 'patient').get();
      patients = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          profile: data.profile || {}
        };
      });
    } else {
      patients = store.users.filter(u => u.role === 'patient').map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        profile: u.profile || {}
      }));
    }
    res.json(patients);
  } catch (e) {
    console.error('Get patients failed:', e.message);
    res.status(500).json({ error: 'Failed to get patients' });
  }
};

exports.getAllUsers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  try {
    let users = [];
    if (db) {
      const snapshot = await db.collection('users').get();
      users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          profile: data.profile || {}
        };
      });
    } else {
      users = store.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        profile: u.profile || {}
      }));
    }
    res.json(users);
  } catch (e) {
    console.error('Get all users failed:', e.message);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

exports.updateProfile = async (req, res) => {
  const id = req.params.id;
  const { name, profile } = req.body;
  
  let user = null;
  if (db) {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (doc.exists) user = doc.data();
    } catch (e) {
      console.error('Firestore getUser failed:', e.message);
    }
  } else {
    user = store.users.find(u => u.id === id);
  }
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.name = name || user.name;
  user.profile = { ...user.profile, ...profile };
  
  if (db) {
    try {
      await db.collection('users').doc(id).update(user);
    } catch (e) {
      console.error('Firestore update failed:', e.message);
      return res.status(500).json({ error: 'Update failed' });
    }
  } else {
    const idx = store.users.findIndex(u => u.id === id);
    if (idx !== -1) store.users[idx] = user;
  }
  
  const safe = { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    role: user.role, 
    language: user.language,
    profile: user.profile
  };
  res.json(safe);
};
