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

exports.listWithUser = async (req, res) => {
  const me = req.user.id;
  const other = req.params.id;
  try {
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

