// Netlify Function: send-invoice
// Requires environment var RESEND_API_KEY in Netlify site settings

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }
  try {
    const { to, subject, html } = JSON.parse(event.body || '{}')
    if (!to || !subject || !html) return json(400, { error: 'Missing to/subject/html' })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return json(500, { error: 'Missing RESEND_API_KEY' })

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'Facturación <no-reply@yourdomain.com>', to: [to], subject, html }),
    })
    const data = await r.json()
    if (!r.ok) return json(500, { error: data?.message || 'Failed to send email' })
    return json(200, { ok: true, id: data?.id })
  } catch (e) {
    return json(500, { error: e?.message || 'Unexpected error' })
  }
}

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
