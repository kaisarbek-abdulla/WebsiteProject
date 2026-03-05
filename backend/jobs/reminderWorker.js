const { db } = require('../firebase/admin');
const store = require('../models/inMemoryStore');
const { sendMail } = require('../mailer/mailer');

const CHECK_INTERVAL_MS = 60 * 1000; // check every minute

async function checkAndSend() {
  const now = new Date();
  try {
    if (db) {
      const q = await db.collection('reminders').where('notified', '==', false).get();
      for (const doc of q.docs) {
        const r = doc.data();
        const t = new Date(r.time);
        if (t <= now) {
          // send email
          const to = r.userEmail || process.env.CONTACT_EMAIL || 'unknown@example.com';
          const subject = `Reminder: ${r.title}`;
          const text = r.message || `Reminder at ${r.time}`;
          try {
            const res = await sendMail({ to, subject, text });
            console.log('Reminder sent:', r.id, 'preview:', res.preview || 'n/a');
          } catch (e) { console.error('SendMail error:', e.message); }
          await db.collection('reminders').doc(r.id).update({ notified: true, sentAt: new Date().toISOString() });
        }
      }
    } else {
      for (const r of store.reminders.filter(x => !x.notified)) {
        const t = new Date(r.time);
        if (t <= now) {
          const to = r.userEmail || process.env.CONTACT_EMAIL || 'unknown@example.com';
          const subject = `Reminder: ${r.title}`;
          const text = r.message || `Reminder at ${r.time}`;
          try {
            const res = await sendMail({ to, subject, text });
            console.log('Reminder sent (in-memory):', r.id, 'preview:', res.preview || 'n/a');
          } catch (e) { console.error('SendMail error:', e.message); }
          r.notified = true;
          r.sentAt = new Date().toISOString();
        }
      }
    }
  } catch (err) {
    console.error('Reminder worker error:', err.message);
  }
}

let interval = null;
function start() {
  if (interval) return;
  interval = setInterval(checkAndSend, CHECK_INTERVAL_MS);
  console.log('Reminder worker started (interval', CHECK_INTERVAL_MS, 'ms)');
}

function stop() {
  if (interval) clearInterval(interval);
  interval = null;
}

module.exports = { start, stop };
