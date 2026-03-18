const { db } = require('../firebase/admin');
const store = require('../models/inMemoryStore');

// Railway/Node version safety: ensure we have fetch available.
// Node 18+ has global fetch, older runtimes need node-fetch.
// eslint-disable-next-line global-require
const fetchFn = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');

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

function localStructuredAnalysis(symptomText, preferredLang) {
  const detected = parseText(symptomText);
  const severity =
    detected.length >= 3 ? 'High' : detected.length >= 2 ? 'Medium' : 'Low';

  const conditions = [];
  if (detected.includes('fever') && detected.includes('cough')) conditions.push('Flu', 'Viral infection');
  if (detected.includes('headache') && detected.includes('fatigue')) conditions.push('Dehydration', 'Stress');
  if (detected.includes('nausea')) conditions.push('Food poisoning', 'Gastritis');
  if (detected.includes('pain')) conditions.push('Inflammation');
  if (conditions.length === 0) conditions.push('Non-specific symptoms');

  const urgent = severity === 'High' ? 'Consult emergency services if symptoms are severe or worsening.' : 'Consult a healthcare professional if symptoms persist.';

  const lang = (preferredLang || '').toLowerCase();
  const hasCyr = /[А-Яа-яЁё]/.test(symptomText || '');

  const analysisRu = `Демо-анализ (без внешнего ИИ). Похоже, у вас: ${detected.length ? detected.join(', ') : 'неспецифические симптомы'}. Возможные причины: ${conditions.join(', ')}.\n\nЧто можно сделать сейчас:\n• Отдых и питьё\n• Измерьте температуру\n• Если состояние ухудшается или есть одышка/боль в груди — срочно обратитесь за помощью.\n\nЭто не диагноз.`;
  const analysisKk = `Демо-талдау (сыртқы ИИ жоқ). Мүмкін белгілер: ${detected.length ? detected.join(', ') : 'нақты емес симптомдар'}. Ықтимал себептер: ${conditions.join(', ')}.\n\nҚазір не істеуге болады:\n• Демалыс және су ішу\n• Температураны өлшеңіз\n• Нашарласа немесе ентігу/кеуде ауыруы болса — жедел көмекке жүгініңіз.\n\nБұл диагноз емес.`;
  const analysisEn = `Demo analysis (no external AI key configured). Detected: ${detected.length ? detected.join(', ') : 'non-specific symptoms'}. Possible causes: ${conditions.join(', ')}.\n\nWhat you can do now:\n• Rest and hydration\n• Monitor temperature\n• If symptoms worsen or you have chest pain/trouble breathing: seek urgent care.\n\nThis is not a diagnosis.`;

  const pickAnalysis = () => {
    if (lang === 'ru') return analysisRu;
    if (lang === 'kk' || lang === 'kz') return analysisKk;
    if (lang === 'en') return analysisEn;
    return hasCyr ? analysisRu : analysisEn;
  };
  const analysisText = pickAnalysis();

  return {
    detectedSymptoms: detected,
    urgency: urgent,
    severity,
    conditions,
    analysis: analysisText,
    aiAnalysis: analysisText,
    treatments: [
      'Rest and hydration',
      'Monitor temperature and symptoms',
      'Over-the-counter medication only as directed',
    ],
    diagnosticTests: severity === 'High' ? ['Clinical evaluation', 'CBC', 'Temperature monitoring'] : ['Clinical evaluation if needed'],
    healthAdvice: [
      'If you have chest pain, trouble breathing, or fainting: seek urgent care.',
      'Keep a symptom journal and note duration and triggers.',
    ],
    disclaimer:
      'This analysis is for informational purposes only and is not a substitute for professional medical advice.',
  };
}

function normalizeAiData(aiData, symptomText, preferredLang) {
  const base = (aiData && typeof aiData === 'object') ? { ...aiData } : {};

  // Ensure analysis is a printable string for the UI.
  const candidate =
    (typeof base.analysis === 'string' && base.analysis) ? base.analysis
      : (typeof base.aiAnalysis === 'string' && base.aiAnalysis) ? base.aiAnalysis
        : '';

  if (candidate) {
    base.analysis = candidate;
    base.aiAnalysis = candidate;
  } else {
    const fallback = localStructuredAnalysis(symptomText, preferredLang);
    base.analysis = fallback.analysis;
    base.aiAnalysis = fallback.aiAnalysis;
    if (!base.detectedSymptoms) base.detectedSymptoms = fallback.detectedSymptoms;
    if (!base.conditions) base.conditions = fallback.conditions;
    if (!base.urgency) base.urgency = fallback.urgency;
    if (!base.disclaimer) base.disclaimer = fallback.disclaimer;
  }

  // Do not let AI overwrite our UI severity badge class (mild/moderate/severe).
  if (Object.prototype.hasOwnProperty.call(base, 'severity')) {
    base.aiSeverity = base.severity;
    delete base.severity;
  }

  return base;
}

// Analyze symptoms using Grok/Groq AI.  Attempts to parse JSON output.
async function analyzeWithGrok(symptomText, preferredLang) {
  // use GROQ_API_KEY if provided, otherwise fall back to XAI_API_KEY (grok)
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  const isGroq = !!process.env.GROQ_API_KEY;
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.x.ai/v1/chat/completions';

  if (!apiKey) {
    return localStructuredAnalysis(symptomText, preferredLang);
  }

  // Hard timeout so the UI doesn't "hang" during expo demos.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  // helper for fallback call to grok when groq fails
  async function analyzeWithGrokFallback(fallbackText) {
    if (!process.env.XAI_API_KEY) return { analysis: 'AI unavailable' };
    try {
      const lang = (preferredLang || '').toLowerCase();
      const langName = lang === 'ru' ? 'Russian' : (lang === 'kk' || lang === 'kz') ? 'Kazakh' : 'English';
      const resp = await fetchFn('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `Fallback medical symptom analyzer. Respond in ${langName}.` },
            { role: 'user', content: `Please analyze these symptoms: ${fallbackText}` }
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7
        })
      });
      const j = await resp.json();
      const cont = j.choices?.[0]?.message?.content || '';
      return { analysis: cont };
    } catch (e) {
      console.error('Fallback grok call failed', e);
      return { analysis: 'Fallback analysis unavailable' };
    }
  }

  function extractJsonFromText(text) {
    const raw = (text || '').toString().trim();
    if (!raw) return null;

    // Strip common markdown fences
    let s = raw;
    s = s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    s = s.replace(/```$/i, '').trim();

    // If there's extra prefix/suffix, try the first JSON object region.
    const first = s.indexOf('{');
    const last = s.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    return s.slice(first, last + 1);
  }

  function uniqueNonEmpty(arr) {
    const out = [];
    const seen = new Set();
    (arr || []).forEach((v) => {
      const s = (v || '').toString().trim();
      if (!s) return;
      if (seen.has(s)) return;
      seen.add(s);
      out.push(s);
    });
    return out;
  }

  const groqModels = uniqueNonEmpty([
    process.env.GROQ_MODEL,
    // Default modern Groq models (can change; env override recommended for Railway).
    'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ]);

  try {
    const modelCandidates = isGroq ? groqModels : ['grok-beta'];
    let response;
    let lastErrText = '';
    let lastErrJson;

    for (let idx = 0; idx < modelCandidates.length; idx += 1) {
      const model = modelCandidates[idx];
      const lang = (preferredLang || '').toLowerCase();
      const langName = lang === 'ru' ? 'Russian' : (lang === 'kk' || lang === 'kz') ? 'Kazakh' : 'English';
      const langHint = `Respond in ${langName}.`;
      response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a medical symptom analyzer. ${langHint} Return ONLY valid JSON (no markdown, no code fences, no extra text) with these keys: detectedSymptoms (array), urgency (string), severity (string), conditions (array), analysis (string), treatments (array), diagnosticTests (array), healthAdvice (array), disclaimer (string). Always include a disclaimer reminding the user to consult a healthcare professional.`
            },
            {
              role: 'user',
              content: `Please analyze these symptoms: ${symptomText}`
            }
          ],
          model,
          stream: false,
          temperature: 0.7
        })
      });

      if (response.ok) break;

      // Try to detect model deprecation / unsupported model and retry with next candidate.
      lastErrText = await response.text().catch(() => '<no body>');
      try { lastErrJson = JSON.parse(lastErrText); } catch { lastErrJson = undefined; }

      const msg = (lastErrJson && lastErrJson.error && lastErrJson.error.message)
        ? String(lastErrJson.error.message)
        : String(lastErrText || '');
      const code = (lastErrJson && lastErrJson.error && lastErrJson.error.code)
        ? String(lastErrJson.error.code)
        : '';
      const looksLikeModelIssue =
        code === 'model_decommissioned' ||
        /decommissioned|no longer supported|unsupported model|model not found/i.test(msg);

      if (looksLikeModelIssue && idx < modelCandidates.length - 1) {
        console.warn(`Groq model "${model}" not usable (${code || 'model_error'}). Retrying with next model...`);
        continue;
      }

      // Non-model-related error or no more models to try -> break and handle below.
      break;
    }

    if (!response.ok) {
      const text = lastErrText || await response.text().catch(() => '<no body>');
      console.error('AI API returned error status', response.status, text);
      // if groq failed with authentication or other error, try fallback to grok
      if (isGroq && process.env.XAI_API_KEY) {
        console.warn('Falling back to grok because groq request failed');
        return analyzeWithGrokFallback(symptomText);
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    // try to interpret as JSON
    try {
      return JSON.parse(content);
    } catch (e) {
      const extracted = extractJsonFromText(content);
      if (extracted) {
        try {
          return JSON.parse(extracted);
        } catch (e2) {
          // ignore and fall back to raw
        }
      }
      // if parsing fails, put raw content into analysis field
      return { analysis: content };
    }
  } catch (error) {
    console.error('AI API call failed:', error && error.name ? `${error.name}: ${error.message}` : error);
    return localStructuredAnalysis(symptomText, preferredLang);
  } finally {
    clearTimeout(timeout);
  }
}

exports.createEntry = async (req, res) => {
  // accept either text or symptoms field for backward compatibility
  const textInput = req.body.text || req.body.symptoms;
  const { language } = req.body;
  if (!textInput) return res.status(400).json({ error: 'text is required' });

  try {
    // Get structured AI analysis (object) from Grok/Groq
    const preferredLang = typeof language === 'string' ? language : undefined;
    const aiDataRaw = await analyzeWithGrok(textInput, preferredLang);
    const aiData = normalizeAiData(aiDataRaw, textInput, preferredLang);

    // Parse basic symptoms for categorization (keep simple keyword matching for now)
    const parsedSymptoms = parseText(textInput);
    const severity = parsedSymptoms.length >= 3 ? 'severe' : parsedSymptoms.length >= 2 ? 'moderate' : 'mild';

    const entry = {
      id: Date.now().toString(),
      userId: req.user?.id || req.body.userId || 'anonymous',
      text: textInput,
      parsedSymptoms,
      severity,
      symptomsCount: parsedSymptoms.length,
      ...aiData,
      language: language || 'en',
      timestamp: new Date().toISOString()
    };

    // Compatibility: some UIs expect aiAnalysis or analysis. Ensure both exist as strings when possible.
    if (!entry.aiAnalysis && typeof entry.analysis === 'string') entry.aiAnalysis = entry.analysis;
    if (!entry.analysis && typeof entry.aiAnalysis === 'string') entry.analysis = entry.aiAnalysis;

    if (db) {
      await db.collection('symptoms').doc(entry.id).set(entry);
    } else {
      store.addSymptom(entry);
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

exports.clearForUser = (req, res) => {
  (async () => {
    const userId = (req.user && req.user.id) || req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    if (db) {
      try {
        const snap = await db.collection('symptoms').where('userId', '==', userId).get();
        let deleted = 0;
        let batch = db.batch();
        let ops = 0;
        // Firestore batch limit is 500 operations; keep some headroom.
        for (const doc of snap.docs) {
          batch.delete(doc.ref);
          deleted += 1;
          ops += 1;
          if (ops >= 450) {
            // eslint-disable-next-line no-await-in-loop
            await batch.commit();
            batch = db.batch();
            ops = 0;
          }
        }
        if (ops > 0) await batch.commit();
        return res.json({ deleted });
      } catch (e) {
        console.error('Firestore clear symptoms failed:', e.message);
        return res.status(500).json({ error: 'Failed to clear symptoms' });
      }
    }

    // In-memory store fallback
    let deleted = 0;
    for (let i = store.symptoms.length - 1; i >= 0; i -= 1) {
      if (store.symptoms[i] && store.symptoms[i].userId === userId) {
        store.symptoms.splice(i, 1);
        deleted += 1;
      }
    }
    store.save();
    return res.json({ deleted });
  })();
};
