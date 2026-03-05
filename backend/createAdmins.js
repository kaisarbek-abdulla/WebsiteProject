const adminModule = require('./firebase/admin');
const admin = adminModule.default || adminModule;
const { db } = adminModule;

async function createAdmins() {
  const admins = [
    { email: 'ka3000@hw.ac.uk', name: 'Admin 1' },
    { email: 'Abdullakaisar@outlook.com', name: 'Admin 2' },
    { email: 'deobat72@gmail.com', name: 'Admin 3' }
  ];

  if (!admin || !db) {
    console.error('Firebase not initialized. Check your service account configuration.');
    process.exit(1);
  }

  for (const adminData of admins) {
    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: adminData.email,
        password: 'TempPass123!', // Temporary password
        displayName: adminData.name
      });

      // Create user document in Firestore
      const userDoc = {
        id: userRecord.uid,
        name: adminData.name,
        email: adminData.email,
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

      await db.collection('users').doc(userRecord.uid).set(userDoc);
      console.log(`Admin created: ${adminData.email}`);
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