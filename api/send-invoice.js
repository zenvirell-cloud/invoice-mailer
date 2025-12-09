export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // req.body peut déjà être parsé par Vercel, mais on protège au cas où
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Réponse de test : retourne ce qu'on a reçu — ne fait pas encore l'envoi d'email.
    return res.status(200).json({
      ok: true,
      note: 'Endpoint working — email sending not enabled in test handler',
      received: body
    });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'internal error' });
  }
}
