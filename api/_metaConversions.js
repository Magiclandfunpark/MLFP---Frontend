import crypto from 'node:crypto'

/* global process */

const cleanEnvValue = (value, keyName = '') => {
  let nextValue = String(value || '').trim()
  if (!nextValue) return ''
  if (keyName) nextValue = nextValue.replace(new RegExp(`^${keyName}\\s*=\\s*`, 'i'), '').trim()
  return nextValue.replace(/^["']|["']$/g, '')
}

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('977')) return digits
  if (digits.length === 10) return `977${digits}`
  return digits
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

const firstHeader = (value) => String(Array.isArray(value) ? value[0] : value || '').split(',')[0].trim()

const getCookieValue = (request, name) => {
  const cookieHeader = String(request.headers.cookie || '')
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim())
  const cookie = cookies.find((item) => item.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : ''
}

const safeSourceUrl = (request, fallbackPath = '/') => {
  const referrer = firstHeader(request.headers.referer || request.headers.referrer)
  if (/^https?:\/\//i.test(referrer)) return referrer

  const protocol = firstHeader(request.headers['x-forwarded-proto']) || 'https'
  const host = firstHeader(request.headers['x-forwarded-host'] || request.headers.host)
  if (!host) return 'https://magiclandfunpark.com/'
  return `${protocol}://${host}${fallbackPath}`
}

export async function sendMetaConversionEvent(request, {
  eventName,
  eventId,
  eventSourceUrl,
  user = {},
  customData = {},
  originalEventData = {},
}) {
  const accessToken = cleanEnvValue(process.env.META_CAPI_ACCESS_TOKEN, 'META_CAPI_ACCESS_TOKEN')
  const pixelId = cleanEnvValue(process.env.META_PIXEL_ID, 'META_PIXEL_ID')
  if (!accessToken || !pixelId || !eventName) return { skipped: true, reason: 'not_configured' }

  const apiVersion = cleanEnvValue(process.env.META_GRAPH_API_VERSION, 'META_GRAPH_API_VERSION') || 'v23.0'
  const testEventCode = cleanEnvValue(process.env.META_TEST_EVENT_CODE, 'META_TEST_EVENT_CODE')
  const email = normalizeEmail(user.email)
  const phone = normalizePhone(user.phone)
  const externalId = String(user.externalId || user.purchaseOrderId || eventId || '').trim().toLowerCase()
  const userData = {
    client_ip_address: firstHeader(request.headers['x-forwarded-for'] || request.socket?.remoteAddress),
    client_user_agent: firstHeader(request.headers['user-agent']),
    fbp: getCookieValue(request, '_fbp'),
    fbc: getCookieValue(request, '_fbc'),
  }

  if (email) userData.em = [sha256(email)]
  if (phone) userData.ph = [sha256(phone)]
  if (externalId) userData.external_id = [sha256(externalId)]

  Object.keys(userData).forEach((key) => {
    if (!userData[key] || (Array.isArray(userData[key]) && userData[key].length === 0)) delete userData[key]
  })

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl || safeSourceUrl(request),
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: 'NPR',
          ...customData,
        },
        original_event_data: {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          ...originalEventData,
        },
      },
    ],
  }

  if (testEventCode) payload.test_event_code = testEventCode

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, access_token: accessToken }),
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch (error) {
    return { ok: false, status: 0, error: error.message }
  }
}
