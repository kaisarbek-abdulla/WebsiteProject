const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const store = require('./models/inMemoryStore');

async function createAdmins() {
  const admins = [
    { email: 'ka3000@hw.ac.uk', name: 'Admin 1' },
    { email: 'Abdullakaisar@outlook.com', name: 'Admin 2' },
    { email: 'deobat72@gmail.com', name: 'Admin 3' }
  ];

  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { salt, hash };
  }

  for (const adminData of admins) {
    try {
      const exists = store.users.find(u => u.email === adminData.email.toLowerCase());
      if (exists) {
        console.log(`Admin already exists: ${adminData.email}`);
        continue;
      }

      const { salt, hash } = hashPassword('TempPass123!');
      const user = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: adminData.name,
        email: adminData.email.toLowerCase(),
        passwordHash: hash,
        salt,
        language: 'en',
        role: 'admin',
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

      store.addUser(user);
      console.log(`Admin created: ${adminData.email} (Password: TempPass123!)`);
    } catch (error) {
      console.error(`Error creating admin ${adminData.email}:`, error.message);
    }
  }
}

createAdmins().then(() => {
  console.log('Admins creation complete');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});