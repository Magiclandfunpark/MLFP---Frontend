const { onValueCreated } = require('firebase-functions/v2/database')
const { defineSecret } = require('firebase-functions/params')
const nodemailer = require('nodemailer')

const smtpHost = defineSecret('SMTP_HOST')
const smtpPort = defineSecret('SMTP_PORT')
const smtpUser = defineSecret('SMTP_USER')
const smtpPass = defineSecret('SMTP_PASS')
const mailTo = defineSecret('BOOKING_NOTIFICATION_EMAIL')

function requestSubject(type, data) {
  if (type === 'membershipRequests') return `New Magic Land membership request - ${data.planName || 'Membership'}`
  if (type === 'eventRequests') return `New Magic Land event request - ${data.eventType || 'Event'}`
  if (type === 'contactRequests') return `New Magic Land contact request - ${data.topic || 'Guest care'}`
  return `New Magic Land booking request - ${data.ticketName || 'Ticket'}`
}

function requestBody(type, data) {
  return [
    `Request type: ${type}`,
    `Name: ${data.name || '-'}`,
    `Phone: ${data.phone || '-'}`,
    `Email: ${data.email || '-'}`,
    `Ticket/Plan/Event: ${data.ticketName || data.planName || data.eventType || data.topic || '-'}`,
    `Visit/Start/Event date: ${data.visitDate || data.startDate || data.eventDate || '-'}`,
    `Guests: ${data.guests || data.guestCount || '-'}`,
    `Total/Price: ${data.total || data.price || '-'}`,
    `Note: ${data.note || data.message || '-'}`,
    `Source: ${data.source || '-'}`,
    `Created at: ${data.createdAt || '-'}`,
  ].join('\n')
}

exports.emailPublicRequest = onValueCreated(
  {
    ref: '/publicRequests/{requestType}/{requestId}',
    region: 'us-central1',
    secrets: [smtpHost, smtpPort, smtpUser, smtpPass, mailTo],
  },
  async (event) => {
    const data = event.data.val()
    const requestType = event.params.requestType
    const transporter = nodemailer.createTransport({
      host: smtpHost.value(),
      port: Number(smtpPort.value() || 587),
      secure: Number(smtpPort.value()) === 465,
      auth: {
        user: smtpUser.value(),
        pass: smtpPass.value(),
      },
    })

    await transporter.sendMail({
      from: `"Magic Land Website" <${smtpUser.value()}>`,
      to: mailTo.value() || 'info@magiclandfunpark.com',
      replyTo: data.email || undefined,
      subject: requestSubject(requestType, data),
      text: requestBody(requestType, data),
    })
  }
)
