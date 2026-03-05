const nodemailer = require('nodemailer');
const { CONTACT_EMAIL } = process.env;

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    // Use explicit SMTP config if provided
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      return nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for 465
        auth: { user, pass }
      });
    }

    // Otherwise create an Ethereal test account (for local dev)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  })();
  return transporterPromise;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const from = CONTACT_EMAIL || 'no-reply@example.com';
  const info = await transporter.sendMail({ from, to, subject, text, html });
  // If Ethereal, return preview URL
  const preview = nodemailer.getTestMessageUrl(info) || null;
  return { info, preview };
}

module.exports = { sendMail };
