const CORS = {
  'Access-Control-Allow-Origin': 'https://afrique-amitie.fr',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports.handle = async (event) => {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  // Parse body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return respond(400, { error: 'Invalid JSON' });
  }

  const { nom, email, objet, message, turnstileToken } = data;

  if (!nom || !email || !objet || !message || !turnstileToken) {
    return respond(400, { error: 'Champs manquants' });
  }

  // Vérification Turnstile
  const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: turnstileToken,
    }),
  });
  const tsData = await tsRes.json();
  if (!tsData.success) {
    return respond(400, { error: 'Captcha invalide' });
  }

  // Envoi via Brevo
  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: 'Afrique Amitié — Contact', email: process.env.SENDER_EMAIL },
      to:          [{ email: process.env.RECIPIENT_EMAIL }],
      replyTo:     { email, name: nom },
      subject:     `[Contact] ${esc(objet)}`,
      htmlContent: `
        <p><strong>Nom :</strong> ${esc(nom)}</p>
        <p><strong>Email :</strong> ${esc(email)}</p>
        <p><strong>Objet :</strong> ${esc(objet)}</p>
        <hr/>
        <p>${esc(message).replace(/\n/g, '<br>')}</p>
      `,
    }),
  });

  if (!brevoRes.ok) {
    const err = await brevoRes.text();
    console.error('Brevo error:', err);
    return respond(500, { error: 'Erreur lors de l\'envoi' });
  }

  return respond(200, { ok: true });
};
