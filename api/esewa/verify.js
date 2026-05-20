/* global process, Buffer */

const json = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

function decodeEsewaData(data) {
  const decoded = Buffer.from(data, 'base64').toString('utf8')
  return JSON.parse(decoded)
}

const esewaMode = (productCode) => {
  const configuredMode = String(process.env.ESEWA_ENV || '').trim().toLowerCase()
  if (configuredMode === 'production' || configuredMode === 'live') return 'production'
  if (configuredMode === 'test' || configuredMode === 'sandbox') return 'test'
  return productCode === 'EPAYTEST' ? 'test' : 'production'
}

const verifyUrlForMode = (mode) => (
  mode === 'production'
    ? 'https://esewa.com.np/api/epay/transaction/status/'
    : 'https://rc.esewa.com.np/api/epay/transaction/status/'
)

const cleanConfiguredUrl = (value) => {
  let nextValue = String(value || '').trim()
  if (!nextValue) return ''

  nextValue = nextValue.replace(/^ESEWA_VERIFY_URL\s*=\s*/i, '').trim()
  nextValue = nextValue.replace(/^["']|["']$/g, '')
  nextValue = nextValue.replace(/^https:\//i, 'https://').replace(/^http:\//i, 'http://')

  return /^https?:\/\//i.test(nextValue) ? nextValue : ''
}

const safeVerifyUrl = (mode) => {
  const configured = cleanConfiguredUrl(process.env.ESEWA_VERIFY_URL)
  if (!configured) return verifyUrlForMode(mode)

  const isSandboxUrl = configured.includes('rc.esewa.com.np')
  const isProductionUrl = configured.includes('esewa.com.np') && !isSandboxUrl
  if (mode === 'production' && isSandboxUrl) return verifyUrlForMode('production')
  if (mode === 'test' && isProductionUrl) return verifyUrlForMode('test')
  return configured
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'Method not allowed' })
  }

  try {
    const body = request.body || {}
    const dataParam = String(body.data || '').trim()
    if (!dataParam) return json(response, 400, { error: 'Missing eSewa return data.' })

    const decoded = decodeEsewaData(dataParam)
    const productCode = String(process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST').trim()
    const mode = esewaMode(productCode)
    const totalAmount = Number(decoded.total_amount || 0)
    const transactionUuid = String(decoded.transaction_uuid || '')

    if (!transactionUuid || !totalAmount) {
      return json(response, 400, { error: 'Invalid eSewa return data.', decoded })
    }

    const verifyUrl = new URL(safeVerifyUrl(mode))
    verifyUrl.searchParams.set('product_code', productCode)
    verifyUrl.searchParams.set('total_amount', String(totalAmount))
    verifyUrl.searchParams.set('transaction_uuid', transactionUuid)

    const verifyResponse = await fetch(verifyUrl, { method: 'GET' })
    const verifyData = await verifyResponse.json().catch(() => ({}))
    if (!verifyResponse.ok) {
      return json(response, verifyResponse.status, { error: 'eSewa verification failed.', details: verifyData, decoded })
    }

    const completed = verifyData.status === 'COMPLETE' || decoded.status === 'COMPLETE'
    const sameTransaction = !verifyData.transaction_uuid || verifyData.transaction_uuid === transactionUuid

    return json(response, completed && sameTransaction ? 200 : 400, {
      status: completed && sameTransaction ? 'verified' : 'not_verified',
      decoded,
      data: verifyData,
    })
  } catch (error) {
    return json(response, 500, { error: 'Could not verify eSewa payment.', details: error.message })
  }
}
