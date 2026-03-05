const store = require('../models/inMemoryStore');

// Very small keyword-based NLP stub for demo purposes
const KEYWORDS = {
  fever: ['fever', 'temperature', 'hot'],
  cough: ['cough', 'coughing'],
  headache: ['headache', 'migraine', 'head pain'],
  nausea: ['nausea', 'nauseous', 'vomit', 'vomiting']
};

function parseText(text) {
  const found = [];
  const t = (text || '').toLowerCase();
  Object.keys(KEYWORDS).forEach(k => {
    KEYWORDS[k].forEach(w => { if (t.includes(w)) found.push(k); });
  });
  return [...new Set(found)];
}

exports.createEntry = (req, res) => {
  (async () => {
    const { text, language } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const parsedSymptoms = parseText(text);
    const severity = parsedSymptoms.length >= 2 ? 'moderate' : parsedSymptoms.length === 1 ? 'mild' : 'unknown';
    const suggestions = parsedSymptoms.map(s => `Suggestion for ${s}`);
    const entry = {
      id: Date.now().toString(),
      userId: (req.user && req.user.id) || req.body.userId || 'anonymous',
      text,
      parsedSymptoms,
      severity,
      suggestions,
      language: language || 'en',
      timestamp: new Date().toISOString()
    };
    if (db) {
      try {
        await db.collection('symptoms').doc(entry.id).set(entry);
      } catch (e) {
        console.error('Firestore write symptom failed:', e.message);
      }
    } else {
      store.symptoms.push(entry);
    }
    res.json(entry);
  })();
};

exports.listForUser = (req, res) => {
  (async () => {
    const userId = (req.user && req.user.id) || req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId query param required or Authorization header' });
    if (db) {
      try {
        const q = await db.collection('symptoms').where('userId', '==', userId).get();
        const results = q.docs.map(d => d.data());
        return res.json(results);
      } catch (e) {
        console.error('Firestore list symptoms failed:', e.message);
      }
    }
    const results = store.symptoms.filter(s => s.userId === userId);
    res.json(results);
  })();
};
