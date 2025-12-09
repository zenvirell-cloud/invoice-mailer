// serverless handler pour Vercel — envoie un e-mail via SMTP (nodemailer)
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { to, name, amount, invoiceNumber, date, messageOptional } = body || {};

    if (!to) {
      return res.status(400).json({ ok: false, error: 'Missing "to" field' });
    }

    // Variables d'environnement (doivent être configurées dans Vercel)
    const {
      EMAIL_USER,
      EMAIL_PASS,
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_FROM_NAME,
      EMAIL_REPLY_TO,
      COMPANY_NAME
    } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_HOST || !EMAIL_PORT) {
      return res.status(500).json({ ok: false, error: 'Missing email configuration in environment' });
    }

    const portNum = Number(EMAIL_PORT) || 587;
    const secure = portNum === 465; // true pour 465, false pour 587

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: portNum,
      secure,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      },
      tls: {
        // Autoriser les certificats autosignés si nécessaire (retirer si non requis)
        rejectUnauthorized: false
      }
    });

    const fromName = EMAIL_FROM_NAME || COMPANY_NAME || 'Invoice Mailer';
    const from = `${fromName} <${EMAIL_USER}>`;
    const replyTo = EMAIL_REPLY_TO || EMAIL_USER;

    const html = `
      <h2>Facture ${invoiceNumber || ''}</h2>
      <p>Bonjour ${name || ''},</p>
      <p>${messageOptional || 'Veuillez trouver votre facture ci‑dessous.'}</p>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Montant</strong></td><td>${amount || ''}</td></tr>
        <tr><td><strong>Numéro</strong></td><td>${invoiceNumber || ''}</td></tr>
        <tr><td><strong>Date</strong></td><td>${date || ''}</td></tr>
      </table>
      <p>Cordialement,<br/>${fromName}</p>
    `;

    const mailOptions = {
      from,
      to,
      replyTo,
      subject: `Facture ${invoiceNumber || ''} — ${COMPANY_NAME || ''}`,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });
  } catch (err) {
    console.error('send-invoice error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'internal error' });
  }
};
