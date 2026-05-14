export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Formulaire de contact
    if ((url.pathname === '/contact' || url.pathname === '/contact/') && request.method === 'POST') {
      return handleContact(request, env);
    }

    // Tout le reste → assets statiques
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  try {
    const formData = await request.formData();
    const nom            = formData.get('nom')?.trim();
    const email          = formData.get('email')?.trim();
    const objet          = formData.get('objet')?.trim();
    const message        = formData.get('message')?.trim();
    const turnstileToken = formData.get('cf-turnstile-response');

    if (!nom || !email || !objet || !message || !turnstileToken) {
      return redirect(request, '/contact/?error=missing_fields');
    }

    // Validation Turnstile
    const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP'),
      }),
    });
    const tsData = await tsRes.json();
    if (!tsData.success) {
      return redirect(request, '/contact/?error=captcha');
    }

    // Envoi via Brevo
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Afrique Amitié — Contact', email: env.SENDER_EMAIL },
        to: [{ email: env.RECIPIENT_EMAIL }],
        replyTo: { email, name: nom },
        subject: `[Contact] ${objet}`,
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
      console.error('Brevo error:', await brevoRes.text());
      return redirect(request, '/contact/?error=send_failed');
    }

    return redirect(request, '/contact/?sent=1');

  } catch (err) {
    console.error(err);
    return redirect(request, '/contact/?error=server_error');
  }
}

function redirect(request, path) {
  return Response.redirect(new URL(path, request.url).toString(), 303);
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
