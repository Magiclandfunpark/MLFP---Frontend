/* global process */

import crypto from 'node:crypto'

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

const signEsewaPayload = (secretKey, message) => crypto
  .createHmac('sha256', secretKey)
  .update(message)
  .digest('base64')

const esewaMode = (productCode) => {
  const configuredMode = String(process.env.ESEWA_ENV || '').trim().toLowerCase()
  if (configuredMode === 'production' || configuredMode === 'live') return 'production'
  if (configuredMode === 'test' || configuredMode === 'sandbox') return 'test'
  return productCode === 'EPAYTEST' ? 'test' : 'production'
}

const paymentUrlForMode = (mode) => (
  mode === 'production'
    ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
    : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
)

const safePaymentUrl = (mode) => {
  const configured = String(process.env.ESEWA_PAYMENT_URL || '').trim()
  if (!configured) return paymentUrlForMode(mode)

  const isSandboxUrl = configured.includes('rc-epay.esewa.com.np')
  const isProductionUrl = configured.includes('epay.esewa.com.np') && !isSandboxUrl
  if (mode === 'production' && isSandboxUrl) return paymentUrlForMode('production')
  if (mode === 'test' && isProductionUrl) return paymentUrlForMode('test')
  return configured
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'Method not allowed' })
  }

  const secretKey = String(process.env.ESEWA_SECRET_KEY || '').trim()
  const productCode = String(process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST').trim()
  if (!secretKey) return json(response, 500, { error: 'eSewa secret key is not configured.' })

  try {
    const body = request.body || {}
    const amount = Number(body.amount)
    const purchaseOrderId = String(body.purchaseOrderId || '').trim()

    if (!Number.isFinite(amount) || amount <= 0 || !purchaseOrderId) {
      return json(response, 400, { error: 'Missing or invalid payment details.' })
    }

    const totalAmount = amount.toFixed(0)
    const transactionUuid = `${purchaseOrderId.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}`
    const baseUrl = cleanBaseUrl(request)
    const fields = {
      amount: totalAmount,
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: buildTrackingReturnUrl(baseUrl, '/payment/esewa/return', 'esewa', purchaseOrderId),
      failure_url: buildTrackingReturnUrl(baseUrl, '/payment/esewa/failure', 'esewa', purchaseOrderId),
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    }
    const signatureMessage = `total_amount=${fields.total_amount},transaction_uuid=${fields.transaction_uuid},product_code=${fields.product_code}`
    const mode = esewaMode(productCode)

    return json(response, 200, {
      action: safePaymentUrl(mode),
      fields: {
        ...fields,
        signature: signEsewaPayload(secretKey, signatureMessage),
      },
      mode,
    })
  } catch (error) {
    return json(response, 500, { error: 'Could not initiate eSewa payment.', details: error.message })
  }
}
