module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const keys = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_HOST', 'EMAIL_PORT'];
  const presence = {};
  keys.forEach(k => { presence[k] = !!process.env[k]; });

  // Log for Vercel (will appear in function logs, without revealing secrets)
  console.log('env presence check:', presence);

  // Return presence so we can see immediately which keys are missing
  return res.status(200).json({ ok: true, env_presence: presence });
};
