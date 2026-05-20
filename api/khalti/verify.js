/* global process */

const json = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
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

const khaltiLookupUrlForMode = (mode) => (
  mode === 'test'
    ? 'https://dev.khalti.com/api/v2/epayment/lookup/'
    : 'https://a.khalti.com/api/v2/epayment/lookup/'
)

const cleanConfiguredUrl = (value) => {
  let nextValue = cleanEnvValue(value, 'KHALTI_LOOKUP_URL')
  if (!nextValue) return ''
  nextValue = nextValue.replace(/^https:\//i, 'https://').replace(/^http:\//i, 'http://')
  return /^https?:\/\//i.test(nextValue) ? nextValue : ''
}

const safeLookupUrl = (mode) => {
  const configured = cleanConfiguredUrl(process.env.KHALTI_LOOKUP_URL)
  if (!configured) return khaltiLookupUrlForMode(mode)
  const isTestUrl = configured.includes('dev.khalti.com')
  const isLiveUrl = configured.includes('a.khalti.com')
  if (mode === 'production' && isTestUrl) return khaltiLookupUrlForMode('production')
  if (mode === 'test' && isLiveUrl) return khaltiLookupUrlForMode('test')
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
    const pidx = String(body.pidx || '').trim()
    const expectedAmount = Number(body.amount || 0)

    if (!pidx) return json(response, 400, { error: 'Missing Khalti pidx.' })

    const mode = khaltiMode()
    const khaltiResponse = await fetch(
      safeLookupUrl(mode),
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      },
    )

    const data = await khaltiResponse.json().catch(() => ({}))
    if (!khaltiResponse.ok) {
      return json(response, khaltiResponse.status, { error: 'Khalti verification failed.', details: data })
    }

    const paidAmount = Number(data.total_amount || 0) / 100
    const expectedAmountNpr = expectedAmount > 100000 ? expectedAmount / 100 : expectedAmount
    const amountMatches = expectedAmountNpr > 0 ? Math.abs(paidAmount - expectedAmountNpr) < 0.01 : true
    const completed = data.status === 'Completed' || data.state?.name === 'Completed'

    return json(response, completed && amountMatches ? 200 : 400, {
      status: completed && amountMatches ? 'verified' : 'not_verified',
      amountMatches,
      paidAmount,
      rawStatus: data.status || data.state?.name || '',
      data,
    })
  } catch (error) {
    return json(response, 500, { error: 'Could not verify Khalti payment.', details: error.message })
  }
}
