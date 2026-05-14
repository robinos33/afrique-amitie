export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const nom             = formData.get('nom')?.trim();
    const email           = formData.get('email')?.trim();
    const objet           = formData.get('objet')?.trim();
    const message         = formData.get('message')?.trim();
    const turnstileToken  = formData.get('cf-turnstile-response');

    // Champs obligatoires
    if (!nom || !email || !objet || !message || !turnstileToken) {
      return errorRedirect(request, 'missing_fields');
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
      return errorRedirect(request, 'captcha');
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
      return errorRedirect(request, 'send_failed');
    }

    return Response.redirect(new URL('/contact/?sent=1', request.url), 303);

  } catch (err) {
    console.error(err);
    return errorRedirect(request, 'server_error');
  }
}

function errorRedirect(request, code) {
  return Response.redirect(new URL(`/contact/?error=${code}`, request.url), 303);
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
