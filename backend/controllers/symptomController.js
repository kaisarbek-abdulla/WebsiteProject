const { db } = require('../firebase/admin');

// Simple keyword parsing for basic categorization
const KEYWORDS = {
  fever: ['fever', 'temperature', 'hot', 'feverish'],
  cough: ['cough', 'coughing'],
  headache: ['headache', 'migraine', 'head pain', 'headache'],
  nausea: ['nausea', 'nauseous', 'vomit', 'vomiting', 'sick'],
  fatigue: ['tired', 'fatigue', 'exhausted', 'weak'],
  pain: ['pain', 'hurts', 'ache', 'aching']
};

function parseText(text) {
  const found = [];
  const t = (text || '').toLowerCase();
  Object.keys(KEYWORDS).forEach(k => {
    KEYWORDS[k].forEach(w => { if (t.includes(w)) found.push(k); });
  });
  return [...new Set(found)];
}

// Analyze symptoms using Grok AI
async function analyzeWithGrok(symptomText) {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a medical symptom analyzer. Analyze the user\'s symptoms and provide possible conditions, severity level (mild/moderate/severe), and general advice. Always emphasize that this is not medical advice and they should consult a healthcare professional. Keep responses concise and structured.'
          },
          {
            role: 'user',
            content: `Please analyze these symptoms: ${symptomText}`
          }
        ],
        model: 'grok-beta',
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Grok API call failed:', error);
    return 'Unable to analyze symptoms at this time. Please consult a healthcare professional.';
  }
}

exports.createEntry = async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    // Get AI analysis from Grok
    const aiAnalysis = await analyzeWithGrok(text);

    // Parse basic symptoms for categorization (keep simple keyword matching for now)
    const parsedSymptoms = parseText(text);
    const severity = parsedSymptoms.length >= 3 ? 'severe' : parsedSymptoms.length >= 2 ? 'moderate' : 'mild';

    const entry = {
      id: Date.now().toString(),
      userId: req.user?.id || req.body.userId || 'anonymous',
      text,
      parsedSymptoms,
      severity,
      aiAnalysis,
      language: language || 'en',
      timestamp: new Date().toISOString()
    };

    if (db) {
      await db.collection('symptoms').doc(entry.id).set(entry);
    }

    res.json(entry);
  } catch (error) {
    console.error('Symptom analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
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
