/* global process */

const json = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

const cleanBaseUrl = (request) => {
  const configured = process.env.PAYMENT_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (configured) return configured.startsWith('http') ? configured.replace(/\/$/, '') : `https://${configured.replace(/\/$/, '')}`
  const protocol = request.headers['x-forwarded-proto'] || 'https'
  const host = request.headers['x-forwarded-host'] || request.headers.host
  return `${protocol}://${host}`
}

const buildTrackingReturnUrl = (baseUrl, path, gateway, purchaseOrderId) => {
  const url = new URL(path, baseUrl)
  url.searchParams.set('utm_source', 'website')
  url.searchParams.set('utm_medium', 'checkout')
  url.searchParams.set('utm_campaign', 'magicland_booking')
  url.searchParams.set('utm_content', gateway)
  url.searchParams.set('booking_id', purchaseOrderId)
  return url.toString()
}

const cleanEnvValue = (value, keyName = '') => {
  let nextValue = String(value || '').trim()
  if (!nextValue) return ''
  if (keyName) nextValue = nextValue.replace(new RegExp(`^${keyName}\\s*=\\s*`, 'i'), '').trim()
  return nextValue.replace(/^["']|["']$/g, '')
}

const khaltiMode = () => {
  const configuredMode = cleanEnvValue(process.env.KHALTI_ENV, 'KHALTI_ENV').toLowerCase()
  if (configuredMode === 'production' || configuredMode === 'live') return 'production'
  if (configuredMode === 'test' || configuredMode === 'sandbox') return 'test'
  return 'production'
}

const khaltiInitiateUrlForMode = (mode) => (
  mode === 'test'
    ? 'https://dev.khalti.com/api/v2/epayment/initiate/'
    : 'https://khalti.com/api/v2/epayment/initiate/'
)

const cleanConfiguredUrl = (value) => {
  let nextValue = cleanEnvValue(value, 'KHALTI_INITIATE_URL')
  if (!nextValue) return ''
  nextValue = nextValue.replace(/^https:\//i, 'https://').replace(/^http:\//i, 'http://')
  nextValue = nextValue.replace('https://a.khalti.com/api/v2/', 'https://khalti.com/api/v2/')
  return /^https?:\/\//i.test(nextValue) ? nextValue : ''
}

const safeInitiateUrl = (mode) => {
  const configured = cleanConfiguredUrl(process.env.KHALTI_INITIATE_URL)
  if (!configured) return khaltiInitiateUrlForMode(mode)
  const isTestUrl = configured.includes('dev.khalti.com')
  const isLiveUrl = configured.includes('khalti.com') && !isTestUrl
  if (mode === 'production' && isTestUrl) return khaltiInitiateUrlForMode('production')
  if (mode === 'test' && isLiveUrl) return khaltiInitiateUrlForMode('test')
  return configured
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'Method not allowed' })
  }

  const secretKey = cleanEnvValue(process.env.KHALTI_SECRET_KEY, 'KHALTI_SECRET_KEY')
  if (!secretKey) return json(response, 500, { error: 'Khalti secret key is not configured.' })

  try {
    const body = request.body || {}
    const amount = Number(body.amount)
    const purchaseOrderId = String(body.purchaseOrderId || '').trim()
    const purchaseOrderName = String(body.purchaseOrderName || 'Magic Land Booking').trim()
    const customer = body.customerInfo || {}

    if (!Number.isFinite(amount) || amount <= 0 || !purchaseOrderId) {
      return json(response, 400, { error: 'Missing or invalid payment details.' })
    }

    const baseUrl = cleanBaseUrl(request)
    const payload = {
      return_url: buildTrackingReturnUrl(baseUrl, '/payment/khalti/return', 'khalti', purchaseOrderId),
      website_url: baseUrl,
      amount: Math.round(amount * 100),
      purchase_order_id: purchaseOrderId,
      purchase_order_name: purchaseOrderName,
      customer_info: {
        name: String(customer.name || 'Magic Land Guest').slice(0, 120),
        email: String(customer.email || 'guest@magiclandfunpark.com').slice(0, 180),
        phone: String(customer.phone || '9800000000').slice(0, 30),
      },
    }

    const mode = khaltiMode()
    const khaltiResponse = await fetch(
      safeInitiateUrl(mode),
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )

    const data = await khaltiResponse.json().catch(() => ({}))
    if (!khaltiResponse.ok) {
      return json(response, khaltiResponse.status, { error: 'Khalti initiation failed.', details: data })
    }

    return json(response, 200, {
      pidx: data.pidx,
      payment_url: data.payment_url,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
    })
  } catch (error) {
    return json(response, 500, { error: 'Could not initiate Khalti payment.', details: error.message })
  }
}
