const { db } = require('../firebase/admin');
const store = require('../models/inMemoryStore');

exports.submitComplaint = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const complaint = {
    id: Date.now().toString(),
    userId,
    message,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  try {
    if (db) {
      await db.collection('complaints').doc(complaint.id).set(complaint);
    } else {
      store.addComplaint(complaint);
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Submit complaint failed:', e.message);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

exports.getComplaints = async (req, res) => {
  const userRole = req.user.role;
  try {
    let complaints = [];
    if (db) {
      const snapshot = await db.collection('complaints').get();
      complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      complaints = Array.isArray(store.complaints) ? store.complaints : [];
    }

    // If not admin, only show own complaints
    if (userRole !== 'admin') {
      complaints = complaints.filter(c => c.userId === req.user.id);
    } else {
      // For admins, include user info
      const userIds = [...new Set(complaints.map(c => c.userId).filter(Boolean))];
      const users = {};
      if (db) {
        for (const id of userIds) {
          const userDoc = await db.collection('users').doc(id).get();
          if (userDoc.exists) {
            const user = userDoc.data();
            users[id] = { name: user.name, email: user.email, role: user.role };
          }
        }
      } else {
        for (const id of userIds) {
          const u = store.users.find(x => x.id === id);
          if (u) users[id] = { name: u.name, email: u.email, role: u.role };
        }
      }
      complaints = complaints.map(c => ({ ...c, user: users[c.userId] || {} }));
    }

    res.json(complaints);
  } catch (e) {
    console.error('Get complaints failed:', e.message);
    res.status(500).json({ error: 'Failed to get complaints' });
  }
};
