const { onValueCreated } = require('firebase-functions/v2/database')
const { defineSecret } = require('firebase-functions/params')

const gmailClientId = defineSecret('GMAIL_CLIENT_ID')
const gmailClientSecret = defineSecret('GMAIL_CLIENT_SECRET')
const gmailRefreshToken = defineSecret('GMAIL_REFRESH_TOKEN')
const gmailSenderEmail = defineSecret('GMAIL_SENDER_EMAIL')
const mailTo = defineSecret('BOOKING_NOTIFICATION_EMAIL')
const defaultSenderEmail = 'info@magiclandfunpark.com'
const defaultStaffRecipients = ['info@magiclandfunpark.com', 'prabinthapaliyaus@gmail.com']

const brand = {
  name: 'Magic Land Family Fun Park',
  primary: '#1f62b5',
  accent: '#f35f69',
  ink: '#071452',
  surface: '#fff8fb',
  line: '#eadfe8',
}

function money(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount <= 0) return '-'
  return `Rs. ${amount.toLocaleString('en-NP')}`
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function requestLabel(type) {
  if (type === 'membershipRequests') return 'Membership request'
  if (type === 'eventRequests') return 'Event request'
  if (type === 'contactRequests') return 'Guest care message'
  if (type === 'newsletterSubscribers') return 'Newsletter signup'
  return 'Booking request'
}

function requestSubject(type, data) {
  if (type === 'membershipRequests') return `New Magic Land membership request - ${data.planName || 'Membership'}`
  if (type === 'eventRequests') return `New Magic Land event request - ${data.eventType || 'Event'}`
  if (type === 'contactRequests') return `New Magic Land contact request - ${data.topic || 'Guest care'}`
  if (type === 'newsletterSubscribers') return `New Magic Land newsletter signup - ${data.email || 'Guest'}`
  return `New Magic Land booking request - ${data.ticketName || 'Ticket'}`
}

function guestRequestSubject(type, data) {
  if (type === 'membershipRequests') return `We received your Magic Land membership request`
  if (type === 'eventRequests') return `We received your Magic Land event request`
  if (type === 'contactRequests') return `We received your Magic Land message`
  if (type === 'newsletterSubscribers') return `Welcome to Magic Land updates`
  return `Your Magic Land booking request is received`
}

function rows(items) {
  return items
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 0;color:#667085;font-size:13px;border-bottom:1px solid ${brand.line};">${escapeHtml(label)}</td>
        <td style="padding:10px 0;color:${brand.ink};font-size:14px;font-weight:800;text-align:right;border-bottom:1px solid ${brand.line};">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('')
}

function emailShell({ eyebrow, title, intro, children, ctaLabel, ctaUrl }) {
  return `
  <!doctype html>
  <html>
    <body style="margin:0;background:${brand.surface};font-family:Arial,Helvetica,sans-serif;color:${brand.ink};">
      <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(intro)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.surface};padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid ${brand.line};border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(7,20,82,.08);">
              <tr>
                <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#fff,#fff5f7);">
                  <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${brand.accent};font-weight:900;">${escapeHtml(eyebrow)}</div>
                  <h1 style="margin:10px 0 0;font-size:30px;line-height:1.15;color:${brand.primary};">${escapeHtml(title)}</h1>
                  <p style="margin:12px 0 0;color:#4f5b76;font-size:16px;line-height:1.7;">${escapeHtml(intro)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 28px 28px;">
                  ${children}
                  ${ctaLabel && ctaUrl ? `
                    <div style="margin-top:26px;">
                      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${brand.accent};color:#fff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:900;">${escapeHtml(ctaLabel)}</a>
                    </div>
                  ` : ''}
                  <p style="margin:28px 0 0;color:#667085;font-size:12px;line-height:1.7;">Magic Land Family Fun Park<br/>A place where kids laugh, families bond, and memories become magic.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

function requestRows(type, data) {
  return rows([
    ['Request type', requestLabel(type)],
    ['Name', data.name || '-'],
    ['Phone', data.phone || '-'],
    ['Email', data.email || '-'],
    ['Ticket / plan / topic', data.ticketName || data.planName || data.eventType || data.topic || '-'],
    ['Date', data.visitDate || data.startDate || data.eventDate || '-'],
    ['Guests', data.guests || data.guestCount || '-'],
    ['Total / price', data.total ? money(data.total) : data.price || '-'],
    ['Payment choice', data.paymentMethod || '-'],
    ['Note', data.note || data.message || '-'],
    ['Reference', data.firestoreId || data.requestId || '-'],
    ['Source', data.source || '-'],
    ['Created at', data.createdAt || '-'],
  ])
}

function staffRequestHtml(type, data) {
  return emailShell({
    eyebrow: 'New website request',
    title: requestSubject(type, data),
    intro: 'A new guest request was submitted from the Magic Land website. Please follow up from the details below.',
    children: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${requestRows(type, data)}</table>`,
    ctaLabel: 'Open Firebase Console',
    ctaUrl: 'https://console.firebase.google.com/project/magic-land-fun-park/database',
  })
}

function guestRequestHtml(type, data) {
  const isBooking = type === 'bookingRequests'
  return emailShell({
    eyebrow: requestLabel(type),
    title: guestRequestSubject(type, data),
    intro: isBooking
      ? 'Thank you for planning your visit. Our team will confirm your booking details by phone or email soon.'
      : 'Thank you for reaching out. Our team will review your request and get back to you soon.',
    children: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${requestRows(type, data)}</table>
      <div style="margin-top:22px;padding:16px;border-radius:18px;background:#f6f7ff;color:#4f5b76;line-height:1.7;font-size:14px;">
        Please keep this email for reference. If anything needs to change, reply to this email or contact Magic Land.
      </div>
    `,
    ctaLabel: 'Plan your day',
    ctaUrl: 'https://magiclandfunpark.com/home',
  })
}

function receiptSubject(data) {
  const gateway = data.gateway ? String(data.gateway).toUpperCase() : 'Payment'
  return `Magic Land payment received - ${gateway}`
}

function receiptRows(data) {
  return rows([
    ['Gateway', data.gateway || '-'],
    ['Name', data.name || '-'],
    ['Phone', data.phone || '-'],
    ['Email', data.email || '-'],
    ['Ticket', data.ticketName || '-'],
    ['Amount paid', money(data.amount || data.paidAmount || data.total)],
    ['Booking reference', data.bookingId || data.requestId || '-'],
    ['Gateway reference', data.gatewayReference || data.pidx || data.transactionUuid || '-'],
    ['Verified at', data.verifiedAt || '-'],
  ])
}

function staffReceiptHtml(data) {
  return emailShell({
    eyebrow: 'Payment verified',
    title: receiptSubject(data),
    intro: 'A website payment was verified. Please reconcile this with the booking request and confirm the visit if needed.',
    children: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${receiptRows(data)}</table>`,
    ctaLabel: 'Open Firebase Console',
    ctaUrl: 'https://console.firebase.google.com/project/magic-land-fun-park/database',
  })
}

function guestReceiptHtml(data) {
  return emailShell({
    eyebrow: 'Payment received',
    title: 'Thank you. Your Magic Land payment is received.',
    intro: 'Your payment has been verified. Magic Land will confirm the final visit details by phone or email if needed.',
    children: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${receiptRows(data)}</table>
      <div style="margin-top:22px;padding:16px;border-radius:18px;background:#f6f7ff;color:#4f5b76;line-height:1.7;font-size:14px;">
        Please show this email or your payment wallet receipt at the park if requested.
      </div>
    `,
    ctaLabel: 'View Magic Land',
    ctaUrl: 'https://magiclandfunpark.com/home',
  })
}

function requestText(type, data) {
  return [
    requestSubject(type, data),
    '',
    `Request type: ${requestLabel(type)}`,
    `Name: ${data.name || '-'}`,
    `Phone: ${data.phone || '-'}`,
    `Email: ${data.email || '-'}`,
    `Ticket/Plan/Event: ${data.ticketName || data.planName || data.eventType || data.topic || '-'}`,
    `Visit/Start/Event date: ${data.visitDate || data.startDate || data.eventDate || '-'}`,
    `Guests: ${data.guests || data.guestCount || '-'}`,
    `Total/Price: ${data.total ? money(data.total) : data.price || '-'}`,
    `Payment choice: ${data.paymentMethod || '-'}`,
    `Reference: ${data.firestoreId || data.requestId || '-'}`,
    `Note: ${data.note || data.message || '-'}`,
  ].join('\n')
}

function receiptText(data) {
  return [
    receiptSubject(data),
    '',
    `Gateway: ${data.gateway || '-'}`,
    `Name: ${data.name || '-'}`,
    `Phone: ${data.phone || '-'}`,
    `Email: ${data.email || '-'}`,
    `Ticket: ${data.ticketName || '-'}`,
    `Amount paid: ${money(data.amount || data.paidAmount || data.total)}`,
    `Booking reference: ${data.bookingId || data.requestId || '-'}`,
    `Gateway reference: ${data.gatewayReference || data.pidx || data.transactionUuid || '-'}`,
  ].join('\n')
}

function userWelcomeHtml(data) {
  return emailShell({
    eyebrow: 'Magic Land Account',
    title: 'Welcome to Magic Land Family Fun Park',
    intro: 'Your Magic Land account is ready. You can now use it for secure online payments, booking references, and future membership experiences.',
    children: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${rows([
          ['Name', data.displayName || 'Magic Land Guest'],
          ['Email', data.email || '-'],
          ['Phone', data.phoneNumber || '-'],
          ['Guest ID', data.uid || '-'],
        ])}
      </table>
      <div style="margin-top:22px;padding:16px;border-radius:18px;background:#f6f7ff;color:#4f5b76;line-height:1.7;font-size:14px;">
        Keep this email for reference. Magic Land will never ask for your wallet password, OTP, or payment PIN.
      </div>
    `,
    ctaLabel: 'Book your visit',
    ctaUrl: 'https://magiclandfunpark.com/tickets',
  })
}

function userWelcomeText(data) {
  return [
    'Welcome to Magic Land Family Fun Park',
    '',
    'Your Magic Land account is ready.',
    `Name: ${data.displayName || 'Magic Land Guest'}`,
    `Email: ${data.email || '-'}`,
    `Phone: ${data.phoneNumber || '-'}`,
    `Guest ID: ${data.uid || '-'}`,
  ].join('\n')
}

function staffRecipients() {
  const configured = mailTo.value()
  const recipients = configured
    ? configured.split(',').map((item) => item.trim()).filter(Boolean)
    : defaultStaffRecipients
  return [...new Set([...recipients, ...defaultStaffRecipients])].join(', ')
}

function senderEmail() {
  return gmailSenderEmail.value() || defaultSenderEmail
}

function encodeHeader(value = '') {
  return String(value).replace(/[\r\n]+/g, ' ').trim()
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function recipientList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  return String(value || '').trim()
}

function createRawEmail({ from, to, replyTo, subject, text, html }) {
  const boundary = `magicland-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const headers = [
    `From: ${encodeHeader(from)}`,
    `To: ${encodeHeader(recipientList(to))}`,
    replyTo ? `Reply-To: ${encodeHeader(replyTo)}` : '',
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean)

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text || '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html || '',
    `--${boundary}--`,
  ].join('\r\n')

  return base64Url(`${headers.join('\r\n')}\r\n\r\n${body}`)
}

async function gmailAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: gmailClientId.value(),
      client_secret: gmailClientSecret.value(),
      refresh_token: gmailRefreshToken.value(),
      grant_type: 'refresh_token',
    }),
  })

  const json = await response.json()
  if (!response.ok || !json.access_token) {
    throw new Error(`Gmail token refresh failed: ${JSON.stringify(json)}`)
  }

  return json.access_token
}

async function sendGmail({ to, replyTo, subject, text, html }) {
  const accessToken = await gmailAccessToken()
  const fromEmail = senderEmail()
  const raw = createRawEmail({
    from: `"Magic Land Family Fun Park" <${fromEmail}>`,
    to,
    replyTo,
    subject,
    text,
    html,
  })

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(fromEmail)}/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  )

  const json = await response.json()
  if (!response.ok) {
    throw new Error(`Gmail send failed: ${JSON.stringify(json)}`)
  }

  return json
}

async function sendStaffAndGuest({ staffSubject, staffHtml, staffText, guestEmail, guestSubject, guestHtml, guestText, replyTo }) {
  const to = staffRecipients()

  await sendGmail({
    to,
    replyTo: replyTo || guestEmail || undefined,
    subject: staffSubject,
    text: staffText,
    html: staffHtml,
  })

  if (guestEmail) {
    await sendGmail({
      to: guestEmail,
      replyTo: to,
      subject: guestSubject,
      text: guestText,
      html: guestHtml,
    })
  }
}

exports.emailPublicRequest = onValueCreated(
  {
    ref: '/publicRequests/{requestType}/{requestId}',
    region: 'us-central1',
    secrets: [gmailClientId, gmailClientSecret, gmailRefreshToken, gmailSenderEmail, mailTo],
  },
  async (event) => {
    const data = event.data.val() || {}
    const requestType = event.params.requestType
    await sendStaffAndGuest({
      staffSubject: requestSubject(requestType, data),
      staffHtml: staffRequestHtml(requestType, data),
      staffText: requestText(requestType, data),
      guestEmail: data.email,
      guestSubject: guestRequestSubject(requestType, data),
      guestHtml: guestRequestHtml(requestType, data),
      guestText: requestText(requestType, data),
      replyTo: data.email,
    })
  }
)

exports.emailPaymentReceipt = onValueCreated(
  {
    ref: '/paymentReceipts/{gateway}/{receiptId}',
    region: 'us-central1',
    secrets: [gmailClientId, gmailClientSecret, gmailRefreshToken, gmailSenderEmail, mailTo],
  },
  async (event) => {
    const data = { ...(event.data.val() || {}), gateway: event.params.gateway }
    await sendStaffAndGuest({
      staffSubject: receiptSubject(data),
      staffHtml: staffReceiptHtml(data),
      staffText: receiptText(data),
      guestEmail: data.email,
      guestSubject: 'Magic Land payment receipt',
      guestHtml: guestReceiptHtml(data),
      guestText: receiptText(data),
      replyTo: data.email,
    })
  }
)

exports.emailUserWelcome = onValueCreated(
  {
    ref: '/users/{uid}',
    region: 'us-central1',
    secrets: [gmailClientId, gmailClientSecret, gmailRefreshToken, gmailSenderEmail, mailTo],
  },
  async (event) => {
    const data = event.data.val() || {}
    if (!data.email) return

    await sendGmail({
      to: data.email,
      replyTo: staffRecipients(),
      subject: 'Welcome to Magic Land Family Fun Park',
      text: userWelcomeText(data),
      html: userWelcomeHtml(data),
    })
  }
)
