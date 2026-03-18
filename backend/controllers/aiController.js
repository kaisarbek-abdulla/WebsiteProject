// Doctor AI assistant (expo demo)
// Uses Groq (OpenAI-compatible) chat completions to provide clinician-oriented guidance.

// Railway/Node safety: ensure we have fetch available.
// Node 18+ has global fetch, older runtimes need node-fetch.
// eslint-disable-next-line global-require
const fetchFn = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');

function languageName(lang) {
  const l = (lang || '').toLowerCase();
  if (l === 'ru') return 'Russian';
  if (l === 'kz' || l === 'kk') return 'Kazakh';
  return 'English';
}

exports.doctorAssistant = async (req, res) => {
  if (req.user?.role !== 'doctor') return res.status(403).json({ error: 'Access denied' });

  const question = (req.body && (req.body.question || req.body.text)) ? String(req.body.question || req.body.text) : '';
  const lang = (req.body && req.body.language) ? String(req.body.language) : 'en';
  if (!question.trim()) return res.status(400).json({ error: 'question is required' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const ln = languageName(lang);
    const fallback =
      ln === 'Russian'
        ? 'Демо-режим: ключ GROQ_API_KEY не настроен. Я могу помочь структурировать мысли: уточни локализацию/травму/отёк/покраснение/температуру/неврологию, красные флаги и план наблюдения.'
        : ln === 'Kazakh'
          ? 'Demo mode: GROQ_API_KEY жок. Кызыл жалаушалар, анамнез, тексеру және next steps бойынша құрылымдап берем.'
          : 'Demo mode: GROQ_API_KEY is not configured. I can help structure history, red flags, exam, and next steps.';
    return res.json({ answer: fallback });
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const ln = languageName(lang);
    const system = [
      `You are a clinician support assistant. Respond in ${ln}.`,
      'Be concise but helpful. Use bullet points when appropriate.',
      'Make advice specific to the question (avoid generic lifestyle tips unless directly relevant).',
      'Include red flags relevant to the symptom/body area.',
      'Do NOT diagnose with certainty; provide differential considerations and what to ask/check next.',
      'Do not mention you are an AI.',
      'Always include a short disclaimer that this is not a substitute for professional judgement or local guidelines.'
    ].join(' ');

    const resp = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.4,
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: question }
        ]
      })
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '<no body>');
      console.error('Groq doctor assistant error', resp.status, text);
      return res.status(502).json({ error: 'AI provider error' });
    }

    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content || '';
    return res.json({ answer: String(answer || '').trim() });
  } catch (e) {
    console.error('Doctor assistant failed', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'Failed to get assistant response' });
  } finally {
    clearTimeout(timeout);
  }
};

