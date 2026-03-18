const crypto = require('crypto');
const store = require('../models/inMemoryStore');
const { db } = require('../firebase/admin');

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
}

function safeMsg(m) {
  return {
    id: m.id,
    fromUserId: m.fromUserId,
    toUserId: m.toUserId,
    text: m.text,
    createdAt: m.createdAt,
  };
}

async function getUserById(id) {
  const userId = String(id || '');
  if (!userId) return null;
  if (db) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) return doc.data();
    } catch (e) {
      console.error('getUserById failed:', e.message);
    }
    return null;
  }
  return store.users.find(u => String(u.id) === userId) || null;
}

exports.listWithUser = async (req, res) => {
  const me = req.user.id;
  const other = req.params.id;
  try {
    // Do not allow non-admins to open a direct chat with an admin account.
    // Admin-to-user is handled via admin-inbox (one-way, no admin accounts visible).
    const otherUser = await getUserById(other);
    if (otherUser && otherUser.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let messages = [];
    if (db) {
      // We can't do a single OR query easily across (from,to) in basic Firestore,
      // so we do two queries and merge.
      const q1 = await db.collection('messages')
        .where('fromUserId', '==', me)
        .where('toUserId', '==', other)
        .get();
      const q2 = await db.collection('messages')
        .where('fromUserId', '==', other)
        .where('toUserId', '==', me)
        .get();
      messages = [
        ...q1.docs.map(d => d.data()),
        ...q2.docs.map(d => d.data()),
      ];
    } else {
      messages = store.messages.filter(m =>
        (m.fromUserId === me && m.toUserId === other) ||
        (m.fromUserId === other && m.toUserId === me)
      );
    }
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(messages.map(safeMsg));
  } catch (e) {
    console.error('List messages failed:', e.message);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

exports.send = async (req, res) => {
  const me = req.user.id;
  const { toUserId, text } = req.body || {};
  if (!toUserId || !text) return res.status(400).json({ error: 'toUserId and text required' });

  const toUser = await getUserById(toUserId);
  if (toUser && toUser.role === 'admin' && req.user.role !== 'admin') {
    // One-way: users/doctors cannot message admins (and admins are not visible to them).
    return res.status(403).json({ error: 'You cannot message admins' });
  }

  const msg = {
    id: newId(),
    fromUserId: me,
    toUserId: String(toUserId),
    text: String(text).slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  try {
    if (db) {
      await db.collection('messages').doc(msg.id).set(msg);
    } else {
      store.addMessage(msg);
    }
    res.json(safeMsg(msg));
  } catch (e) {
    console.error('Send message failed:', e.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.adminInbox = async (req, res) => {
  const me = req.user.id;
  try {
    // List messages sent TO me by admins, without exposing admin identities.
    let incoming = [];
    if (db) {
      const snap = await db.collection('messages').where('toUserId', '==', me).get();
      incoming = snap.docs.map(d => d.data());
    } else {
      incoming = store.messages.filter(m => String(m.toUserId) === String(me));
    }

    const fromIds = [...new Set(incoming.map(m => m.fromUserId).filter(Boolean))];
    const adminSet = new Set();
    for (const id of fromIds) {
      // eslint-disable-next-line no-await-in-loop
      const u = await getUserById(id);
      if (u && u.role === 'admin') adminSet.add(String(id));
    }

    const msgs = incoming
      .filter(m => adminSet.has(String(m.fromUserId)))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(m => ({
        id: m.id,
        text: m.text,
        createdAt: m.createdAt,
      }));

    return res.json(msgs);
  } catch (e) {
    console.error('adminInbox failed:', e.message);
    return res.status(500).json({ error: 'Failed to load admin inbox' });
  }
};
