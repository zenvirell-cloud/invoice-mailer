import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
const createTransporter = require('../../lib/mailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, name, amount, invoiceNumber, date, messageOptional } = req.body || {};

  if (!to || !invoiceNumber || !amount) {
    return res.status(400).json({ error: 'to, invoiceNumber and amount are required' });
  }

  try {
    // Charge le template HTML
    const templatePath = path.join(process.cwd(), 'emails', 'invoice.html');
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(source);

    // Prépare les données pour le template
    const html = template({
      clientName: name || 'Client',
      amount,
      invoiceNumber,
      date: date || new Date().toLocaleDateString(),
      messageOptional: messageOptional || '',
      companyName: process.env.COMPANY_NAME || 'BNP PARIBAS',
      IBAN: process.env.COMPANY_IBAN || '',
      BIC: process.env.COMPANY_BIC || '',
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
      companyLegal: process.env.COMPANY_LEGAL || ''
    });

    // Version texte (fallback) — ton texte final transformé avec placeholders
    const text = `Objet : Action requise — Virement bloqué pour la facture n° : ${invoiceNumber || 'FCT-203-210'}

Bonjour ${name || 'André Guillauma'},

Nous vous informons que le virement relatif à la facture n° : ${invoiceNumber || 'FCT-203-210'} d’un montant de ${amount || '23000.00'}€ datée du ${date || '26/11/2025'} a été bloqué par notre établissement bancaire.

Raison indiquée : ${messageOptional || 'irrégularité procédurale constatée'}

Nous vous prions de bien vouloir accepter nos excuses pour tout désagrément occasionné. Conformément à nos procédures internes, la régularisation du statut de vos biens est en cours.
Nous vous informons que la restitution de vos biens sera effectuée dans un délai maximal de quarante-huit (48) heures, sous réserve du respect intégral des étapes prévues par la procédure de régularisation en vigueur.
Nous vous remercions de votre compréhension et restons à votre disposition pour toute information complémentaire.

Ceci est un message automatisé. Merci de ne pas répondre.

© 2024 ${process.env.COMPANY_NAME || 'BNP Paribas'} – Tous droits réservés.

${process.env.COMPANY_LEGAL || 'BNP Paribas S.A. – Société Anonyme au capital de 2 489 572 260 € – RCS Paris 662 042 449 – Siège social : 16 boulevard des Italiens, 75009 Paris, France.'}
`;

    // Envoi du mail
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Facturation'}" <${process.env.EMAIL_USER}>`,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
      to,
      subject: `Action requise — Virement bloqué : ${invoiceNumber}`,
      text,
      html
    });

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Impossible d'envoyer le mail", details: err.message });
  }
}
