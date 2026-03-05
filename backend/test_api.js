const fetch = require('node-fetch');

// Simple test script: register -> login -> create symptom
(async () => {
  try {
    const base = 'http://localhost:5000';
    const email = 'auto+test@example.com';
    // register (ignore failures)
    try {
      const r1 = await fetch(base + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'auto', email, password: 'pass123' })
      });
      const j1 = await r1.json().catch(() => null);
      console.log('register:', j1 || r1.status);
    } catch (e) {
      console.log('register error', e.message);
    }

    // login
    const r2 = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'pass123' })
    });
    const j2 = await r2.json();
    console.log('login:', j2);
    if (!j2 || !j2.token) throw new Error('no token from login');

    // create symptom
    const r3 = await fetch(base + '/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + j2.token },
      body: JSON.stringify({ text: 'I have fever and cough' })
    });
    const j3 = await r3.json();
    console.log('create symptom:', j3);
    // create a reminder for ~1 minute from now
    const due = new Date(Date.now() + 60 * 1000).toISOString();
    const r4 = await fetch(base + '/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + j2.token },
      body: JSON.stringify({ title: 'Test reminder', message: 'This is a test', time: due })
    });
    const j4 = await r4.json();
    console.log('create reminder:', j4);
  } catch (err) {
    console.error('test failed:', err.message);
    process.exitCode = 2;
  }
})();
