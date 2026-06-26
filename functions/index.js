const { onValueCreated } = require('firebase-functions/v2/database')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { defineSecret } = require('firebase-functions/params')
const MailComposer = require('nodemailer/lib/mail-composer')
const QRCode = require('qrcode')

const gmailClientId = defineSecret('GMAIL_CLIENT_ID')
const gmailClientSecret = defineSecret('GMAIL_CLIENT_SECRET')
const gmailRefreshToken = defineSecret('GMAIL_REFRESH_TOKEN')
const gmailSenderEmail = defineSecret('GMAIL_SENDER_EMAIL')
const mailTo = defineSecret('BOOKING_NOTIFICATION_EMAIL')
const localApiBaseUrl = defineSecret('LOCAL_API_BASE_URL')
const localApiBearerToken = defineSecret('LOCAL_API_BEARER_TOKEN')
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
  if (type === 'eventRequests') return 'Event request'
  if (type === 'contactRequests') return 'Guest care message'
  if (type === 'newsletterSubscribers') return 'Newsletter signup'
  return 'Booking request'
}

function requestSubject(type, data) {
  if (type === 'eventRequests') return `New Magic Land event request - ${data.eventType || 'Event'}`
  if (type === 'contactRequests') return `New Magic Land contact request - ${data.topic || 'Guest care'}`
  if (type === 'newsletterSubscribers') return `New Magic Land newsletter signup - ${data.email || 'Guest'}`
  return `New Magic Land booking request - ${data.ticketName || 'Ticket'}`
}

function guestRequestSubject(type, data) {
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
    ['Ticket / topic', data.ticketName || data.eventType || data.topic || '-'],
    ['Date', data.visitDate || data.eventDate || '-'],
    ['Guests', data.guests || data.guestCount || '-'],
    ['Total / price', data.total ? money(data.total) : data.price || '-'],
    ['Payment choice', data.paymentMethod || '-'],
    ['Note', data.note || data.message || '-'],
    ['Reference', data.firestoreId || data.requestId || '-'],
    ['Source', data.source || '-'],
    ['Created at', data.createdAt || '-'],
  ])
}

function isQrRequest(type) {
  return type === 'bookingRequests'
}

function staffRequestHtml(type, data) {
  return emailShell({
    eyebrow: 'New website request',
    title: requestSubject(type, data),
    intro: 'A new guest request was submitted from the Magic Land website. Please follow up from the details below.',
    children: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${requestRows(type, data)}</table>
      ${isQrRequest(type) ? ticketPanelHtml(data) : ''}
    `,
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
      ${isQrRequest(type) ? ticketPanelHtml(data) : ''}
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

function ticketReference(data) {
  return data.ticketId || data.bookingId || data.requestId || data.gatewayReference || data.pidx || data.transactionUuid || ''
}

function visitCount(data) {
  const guests = Number(data.guests || data.quantity || data.visitCredits || 1)
  return Number.isFinite(guests) && guests > 0 ? guests : 1
}

function ticketQrPayload(data) {
  return {
    type: 'magic_land_ticket',
    version: 1,
    reference: ticketReference(data),
    gateway: data.gateway || '',
    gatewayReference: data.gatewayReference || data.pidx || data.transactionUuid || '',
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    item: data.ticketName || 'Magic Land Entry',
    visitDate: data.visitDate || data.startDate || '',
    quantity: visitCount(data),
    amount: Number(data.amount || data.paidAmount || data.total || 0),
    verifiedAt: data.verifiedAt || data.createdAt || '',
  }
}

function localApiBase() {
  return (localApiBaseUrl.value() || '').replace(/\/+$/, '')
}

function localApiHeaders() {
  const token = localApiBearerToken.value()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function localApiConfigured() {
  return Boolean(localApiBase() && localApiBearerToken.value())
}

function productCodeForTicket(ticketName = '') {
  const normalized = String(ticketName).toLowerCase()
  if (normalized.includes('yearly') || normalized.includes('annual')) return 'PASS_YEARLY_UNLIMITED'
  if (normalized.includes('group')) return 'GROUP_DAY_VISIT'
  if (normalized.includes('gift')) return 'GIFT_TICKET'
  return 'TICKET_DAY_ENTRY'
}

function syncExternalId(prefix, id = '') {
  return `${prefix}_${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

async function localApiRequest(path, { method = 'GET', body } = {}) {
  if (!localApiConfigured()) {
    throw new Error('Local API secrets are not configured.')
  }

  const response = await fetch(`${localApiBase()}${path}`, {
    method,
    headers: localApiHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch (_) {
    json = { raw: text }
  }
  if (!response.ok || json?.success === false) {
    throw new Error(`Local API ${method} ${path} failed (${response.status}): ${text}`)
  }
  return json
}

function bookingSyncPayload(data, requestId) {
  const guests = visitCount(data)
  const unitPrice = Number(data.unitPrice || 0)
  const total = Number(data.total || (unitPrice * guests) || 0)
  const externalCustomerId = syncExternalId('web_customer', data.visitorId || data.email || data.phone || requestId)
  const externalOrderId = syncExternalId('web_order', requestId)
  const productName = data.ticketName || 'Magic Land Entry'

  return {
    externalCustomerId,
    externalOrderId,
    customer: {
      fullName: data.name || 'Guest',
      phone: data.phone || '',
      email: data.email || '',
      source: 'website',
      consent: {
        transactionalEmail: true,
        marketingEmail: false,
      },
      websiteCreatedAt: data.createdAt || new Date().toISOString(),
    },
    order: {
      externalCustomerId,
      productCode: productCodeForTicket(productName),
      productName,
      quantity: guests,
      unitPrice,
      subtotalAmount: unitPrice * guests,
      totalAmount: total,
      visitOrActivationDate: data.visitDate || '',
      paymentMethod: data.paymentMethod || 'pay_at_park',
      customer: {
        fullName: data.name || 'Guest',
        phone: data.phone || '',
        email: data.email || '',
      },
    },
  }
}

function normalizeFirestoreData(data = {}) {
  return Object.entries(data).reduce((normalized, [key, value]) => {
    if (value && typeof value.toDate === 'function') {
      normalized[key] = value.toDate().toISOString()
    } else {
      normalized[key] = value
    }
    return normalized
  }, {})
}

async function safeWriteSyncStatus(path, status) {
  console.log('Local sync status', { path, ...status })
}

async function syncBookingToLocal(requestId, data) {
  const payload = bookingSyncPayload(data, requestId)
  await localApiRequest(`/api/v1/customers/${encodeURIComponent(payload.externalCustomerId)}`, {
    method: 'PUT',
    body: payload.customer,
  })
  await localApiRequest(`/api/v1/orders/${encodeURIComponent(payload.externalOrderId)}`, {
    method: 'PUT',
    body: payload.order,
  })
  return payload
}

async function syncPaymentReceiptToLocal(receiptId, data) {
  const orderId = syncExternalId('web_order', data.bookingId || data.requestId || receiptId)
  const paymentId = syncExternalId(`${data.gateway || 'payment'}_payment`, data.gatewayReference || data.pidx || data.transactionUuid || receiptId)
  await localApiRequest(`/api/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'PUT',
    body: {
      externalOrderId: orderId,
      gateway: data.gateway || '',
      gatewayTransactionId: data.gatewayReference || data.pidx || data.transactionUuid || '',
      amount: Number(data.amount || data.paidAmount || data.total || 0),
      status: 'paid',
      verifiedAt: data.verifiedAt || new Date().toISOString(),
    },
  })
  await localApiRequest(`/api/v1/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    body: { status: 'confirmed' },
  })
  return { externalOrderId: orderId, externalPaymentId: paymentId }
}

async function ticketQrAttachment(data) {
  const payload = ticketQrPayload(data)
  const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 360,
    color: {
      dark: brand.ink,
      light: '#ffffff',
    },
  })

  return {
    cid: 'magicland-ticket-qr',
    filename: `magic-land-ticket-${payload.reference || Date.now()}.png`,
    content: Buffer.from(dataUrl.split(',')[1], 'base64'),
    contentType: 'image/png',
    payload,
  }
}

function receiptRows(data) {
  return rows([
    ['Gateway', data.gateway || '-'],
    ['Name', data.name || '-'],
    ['Phone', data.phone || '-'],
    ['Email', data.email || '-'],
    ['Ticket', data.ticketName || '-'],
    ['Visit date', data.visitDate || data.startDate || '-'],
    ['Entry quantity', visitCount(data)],
    ['Amount paid', money(data.amount || data.paidAmount || data.total)],
    ['Booking reference', data.bookingId || data.requestId || '-'],
    ['Gateway reference', data.gatewayReference || data.pidx || data.transactionUuid || '-'],
    ['Verified at', data.verifiedAt || '-'],
  ])
}

function ticketPanelHtml(data, qrCid = 'magicland-ticket-qr') {
  const payload = ticketQrPayload(data)
  const instruction = data.paymentMethod === 'pay_at_park'
    ? 'Show this QR at the ticket counter. Staff will confirm payment before entry.'
    : 'Show this QR at the park entrance. Each person entry counts as one use.'
  return `
    <div style="margin-top:24px;padding:18px;border-radius:22px;background:#fff8fb;border:1px solid ${brand.line};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align:top;padding-right:16px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${brand.accent};font-weight:900;">Entry QR</div>
            <h2 style="margin:8px 0 10px;color:${brand.primary};font-size:24px;line-height:1.15;">Magic Land Ticket</h2>
            <p style="margin:0;color:#4f5b76;font-size:14px;line-height:1.7;">
              ${escapeHtml(instruction)}
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
              ${rows([
                ['Ticket reference', payload.reference || '-'],
                ['Ticket / plan', payload.item || '-'],
                ['Guest name', payload.name || '-'],
                ['Email', payload.email || '-'],
                ['Phone', payload.phone || '-'],
                ['Visit date', payload.visitDate || '-'],
                ['Entries included', payload.quantity || 1],
              ])}
            </table>
          </td>
          <td width="150" style="vertical-align:top;text-align:center;">
            <img src="cid:${qrCid}" width="148" height="148" alt="Magic Land ticket QR code" style="display:block;width:148px;height:148px;border-radius:18px;border:1px solid ${brand.line};background:#fff;padding:8px;" />
          </td>
        </tr>
      </table>
    </div>
  `
}

function staffReceiptHtml(data) {
  return emailShell({
    eyebrow: 'Payment verified',
    title: receiptSubject(data),
    intro: 'A website payment was verified. Please reconcile this with the booking request and confirm the visit if needed.',
    children: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${receiptRows(data)}</table>
      ${ticketPanelHtml(data)}
    `,
    ctaLabel: 'Open Firebase Console',
    ctaUrl: 'https://console.firebase.google.com/project/magic-land-fun-park/database',
  })
}

function guestReceiptHtml(data) {
  return emailShell({
    eyebrow: 'Payment received',
    title: 'Your Magic Land ticket is ready.',
    intro: 'Your payment has been verified. Please keep this email and show the QR code at the park entrance.',
    children: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${receiptRows(data)}</table>
      ${ticketPanelHtml(data)}
      <div style="margin-top:22px;padding:16px;border-radius:18px;background:#f6f7ff;color:#4f5b76;line-height:1.7;font-size:14px;">
        For security, Magic Land staff may verify the name, phone number, payment reference, and QR details before entry.
      </div>
    `,
    ctaLabel: 'View Magic Land',
    ctaUrl: 'https://magiclandfunpark.com/home',
  })
}

function requestText(type, data) {
  const lines = [
    requestSubject(type, data),
    '',
    `Request type: ${requestLabel(type)}`,
    `Name: ${data.name || '-'}`,
    `Phone: ${data.phone || '-'}`,
    `Email: ${data.email || '-'}`,
    `Ticket/Event: ${data.ticketName || data.eventType || data.topic || '-'}`,
    `Visit/Start/Event date: ${data.visitDate || data.startDate || data.eventDate || '-'}`,
    `Guests: ${data.guests || data.guestCount || '-'}`,
    `Total/Price: ${data.total ? money(data.total) : data.price || '-'}`,
    `Payment choice: ${data.paymentMethod || '-'}`,
    `Reference: ${data.firestoreId || data.requestId || '-'}`,
    `Note: ${data.note || data.message || '-'}`,
  ]
  if (isQrRequest(type)) {
    lines.push('', 'A QR code is attached to this email. Pay-at-park guests should show it at the ticket counter for confirmation.')
  }
  return lines.join('\n')
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
    `Visit date: ${data.visitDate || data.startDate || '-'}`,
    `Entry quantity: ${visitCount(data)}`,
    `Amount paid: ${money(data.amount || data.paidAmount || data.total)}`,
    `Booking reference: ${data.bookingId || data.requestId || '-'}`,
    `Gateway reference: ${data.gatewayReference || data.pidx || data.transactionUuid || '-'}`,
    '',
    'A QR ticket is attached to this email. Show it at the Magic Land entrance.',
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

async function createRawEmail({ from, to, replyTo, subject, text, html, attachments = [] }) {
  const message = new MailComposer({
    from: encodeHeader(from),
    to: recipientList(to),
    replyTo: replyTo ? encodeHeader(replyTo) : undefined,
    subject: encodeHeader(subject),
    text: text || '',
    html: html || '',
    attachments,
  })

  const compiled = await message.compile().build()
  return base64Url(compiled)
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

async function sendGmail({ to, replyTo, subject, text, html, attachments = [] }) {
  const accessToken = await gmailAccessToken()
  const fromEmail = senderEmail()
  const raw = await createRawEmail({
    from: `"Magic Land Family Fun Park" <${fromEmail}>`,
    to,
    replyTo,
    subject,
    text,
    html,
    attachments,
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

async function sendStaffAndGuest({ staffSubject, staffHtml, staffText, guestEmail, guestSubject, guestHtml, guestText, replyTo, attachments = [] }) {
  const to = staffRecipients()

  await sendGmail({
    to,
    replyTo: replyTo || guestEmail || undefined,
    subject: staffSubject,
    text: staffText,
    html: staffHtml,
    attachments,
  })

  if (guestEmail) {
    await sendGmail({
      to: guestEmail,
      replyTo: to,
      subject: guestSubject,
      text: guestText,
      html: guestHtml,
      attachments,
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
    const requestType = event.params.requestType
    const data = {
      ...(event.data.val() || {}),
      requestId: event.params.requestId,
    }
    let attachments = []
    if (isQrRequest(requestType)) {
      const qr = await ticketQrAttachment(data)
      attachments = [{
        filename: qr.filename,
        content: qr.content,
        contentType: qr.contentType,
        cid: qr.cid,
      }]
    }
    await sendStaffAndGuest({
      staffSubject: requestSubject(requestType, data),
      staffHtml: staffRequestHtml(requestType, data),
      staffText: requestText(requestType, data),
      guestEmail: data.email,
      guestSubject: guestRequestSubject(requestType, data),
      guestHtml: guestRequestHtml(requestType, data),
      guestText: requestText(requestType, data),
      replyTo: data.email,
      attachments,
    })
  }
)

exports.syncBookingRequestToLocal = onValueCreated(
  {
    ref: '/publicRequests/bookingRequests/{requestId}',
    region: 'us-central1',
    secrets: [localApiBaseUrl, localApiBearerToken],
  },
  async (event) => {
    const requestId = event.params.requestId
    const data = {
      ...(event.data.val() || {}),
      requestId,
    }
    const statusPath = `/localSync/bookingRequests/${requestId}`
    try {
      console.log('Local booking sync started', { requestId, ticketName: data.ticketName })
      const payload = await syncBookingToLocal(requestId, data)
      await safeWriteSyncStatus(statusPath, {
        status: 'synced',
        externalCustomerId: payload.externalCustomerId,
        externalOrderId: payload.externalOrderId,
        endpoint: localApiBase(),
      })
      console.log('Local booking sync completed', {
        requestId,
        externalCustomerId: payload.externalCustomerId,
        externalOrderId: payload.externalOrderId,
      })
    } catch (error) {
      await safeWriteSyncStatus(statusPath, {
        status: 'failed',
        error: error?.message || String(error),
        endpoint: localApiBase() || 'not configured',
      })
      console.error('Local booking sync failed', { requestId, error: error?.message || String(error) })
      throw error
    }
  }
)

exports.syncFirestoreBookingRequestToLocal = onDocumentCreated(
  {
    document: 'bookingRequests/{requestId}',
    database: 'default',
    region: 'us-central1',
    secrets: [localApiBaseUrl, localApiBearerToken],
  },
  async (event) => {
    const requestId = event.params.requestId
    const data = {
      ...normalizeFirestoreData(event.data?.data() || {}),
      requestId,
    }
    const statusPath = `/localSync/bookingRequests/${requestId}`
    try {
      console.log('Local Firestore booking sync started', { requestId, ticketName: data.ticketName })
      const payload = await syncBookingToLocal(requestId, data)
      await safeWriteSyncStatus(statusPath, {
        status: 'synced',
        source: 'firestore',
        externalCustomerId: payload.externalCustomerId,
        externalOrderId: payload.externalOrderId,
        endpoint: localApiBase(),
      })
      console.log('Local Firestore booking sync completed', {
        requestId,
        externalCustomerId: payload.externalCustomerId,
        externalOrderId: payload.externalOrderId,
      })
    } catch (error) {
      await safeWriteSyncStatus(statusPath, {
        status: 'failed',
        source: 'firestore',
        error: error?.message || String(error),
        endpoint: localApiBase() || 'not configured',
      })
      console.error('Local Firestore booking sync failed', { requestId, error: error?.message || String(error) })
      throw error
    }
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
    const qr = await ticketQrAttachment(data)
    const attachments = [{
      filename: qr.filename,
      content: qr.content,
      contentType: qr.contentType,
      cid: qr.cid,
    }]
    await sendStaffAndGuest({
      staffSubject: receiptSubject(data),
      staffHtml: staffReceiptHtml(data),
      staffText: receiptText(data),
      guestEmail: data.email,
      guestSubject: 'Magic Land payment receipt',
      guestHtml: guestReceiptHtml(data),
      guestText: receiptText(data),
      replyTo: data.email,
      attachments,
    })
  }
)

exports.syncPaymentReceiptToLocal = onValueCreated(
  {
    ref: '/paymentReceipts/{gateway}/{receiptId}',
    region: 'us-central1',
    secrets: [localApiBaseUrl, localApiBearerToken],
  },
  async (event) => {
    const receiptId = event.params.receiptId
    const gateway = event.params.gateway
    const data = {
      ...(event.data.val() || {}),
      gateway,
      receiptId,
    }
    const statusPath = `/localSync/paymentReceipts/${gateway}/${receiptId}`
    try {
      console.log('Local payment sync started', { gateway, receiptId })
      const payload = await syncPaymentReceiptToLocal(receiptId, data)
      await safeWriteSyncStatus(statusPath, {
        status: 'synced',
        externalOrderId: payload.externalOrderId,
        externalPaymentId: payload.externalPaymentId,
        endpoint: localApiBase(),
      })
      console.log('Local payment sync completed', {
        gateway,
        receiptId,
        externalOrderId: payload.externalOrderId,
        externalPaymentId: payload.externalPaymentId,
      })
    } catch (error) {
      await safeWriteSyncStatus(statusPath, {
        status: 'failed',
        error: error?.message || String(error),
        endpoint: localApiBase() || 'not configured',
      })
      console.error('Local payment sync failed', { gateway, receiptId, error: error?.message || String(error) })
      throw error
    }
  }
)
