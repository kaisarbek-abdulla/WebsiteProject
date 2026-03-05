const store = require('../models/inMemoryStore');

exports.createReminder = (req, res) => {
  (async () => {
    const userId = (req.user && req.user.id) || req.body.userId;
    const { title, message, time, repeatRule } = req.body;
    if (!userId || !title || !time) return res.status(400).json({ error: 'userId, title and time required' });
    // Try to determine user email from DB or in-memory store
    let userEmail = req.body.userEmail || null;
    if (!userEmail) {
      try {
        if (db) {
          const doc = await db.collection('users').doc(userId).get();
          if (doc.exists) userEmail = doc.data().email || null;
        } else {
          const u = store.users.find(x => x.id === userId);
          if (u) userEmail = u.email || null;
        }
      } catch (e) { console.error('Lookup userEmail failed:', e.message); }
    }

    const reminder = {
      id: Date.now().toString(),
      userId,
      title,
      message: message || '',
      userEmail: userEmail || null,
      time,
      repeatRule: repeatRule || null,
      notified: false,
      createdAt: new Date().toISOString()
    };
    if (db) {
      try {
        await db.collection('reminders').doc(reminder.id).set(reminder);
      } catch (e) {
        console.error('Firestore write reminder failed:', e.message);
      }
    } else {
      store.reminders.push(reminder);
    }
    res.json(reminder);
  })();
};

exports.listForUser = (req, res) => {
  (async () => {
    const userId = (req.user && req.user.id) || req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId query param required or Authorization header' });
    if (db) {
      try {
        const q = await db.collection('reminders').where('userId', '==', userId).get();
        const results = q.docs.map(d => d.data());
        return res.json(results);
      } catch (e) {
        console.error('Firestore list reminders failed:', e.message);
      }
    }
    const results = store.reminders.filter(r => r.userId === userId);
    res.json(results);
  })();
};
