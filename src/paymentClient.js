function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      globalThis.setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
    }),
  ])
}

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Payment API is not available in this preview. Use the Vercel deployment or run vercel dev.')
  }
  return response.json()
}

export async function initiateKhaltiPayment({ amount, purchaseOrderId, purchaseOrderName, customerInfo, productType, guests }) {
  const response = await withTimeout(
    fetch('/api/khalti/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, purchaseOrderId, purchaseOrderName, customerInfo, productType, guests }),
    }),
    15000,
    'Khalti initiation',
  )
  const data = await readJsonResponse(response)
  if (!response.ok || !data.payment_url) {
    throw new Error(data.error || 'Khalti payment could not be started.')
  }
  return data
}

export async function initiateEsewaPayment({ amount, purchaseOrderId, purchaseOrderName, customerInfo, productType, guests }) {
  const response = await withTimeout(
    fetch('/api/esewa/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, purchaseOrderId, purchaseOrderName, customerInfo, productType, guests }),
    }),
    15000,
    'eSewa initiation',
  )
  const data = await readJsonResponse(response)
  if (!response.ok || !data.action || !data.fields) {
    throw new Error(data.error || 'eSewa payment could not be started.')
  }
  return data
}

export function submitEsewaForm({ action, fields }) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = String(value)
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

export async function verifyKhaltiPayment({ pidx, amount, purchaseOrderId, customerInfo }) {
  const response = await withTimeout(
    fetch('/api/khalti/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pidx, amount, purchaseOrderId, customerInfo }),
    }),
    15000,
    'Khalti verification',
  )
  const data = await readJsonResponse(response)
  if (!response.ok) {
    throw new Error(data.error || 'Khalti payment could not be verified.')
  }
  return data
}

export async function verifyEsewaPayment({ data, purchaseOrderId, customerInfo }) {
  const response = await withTimeout(
    fetch('/api/esewa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, purchaseOrderId, customerInfo }),
    }),
    15000,
    'eSewa verification',
  )
  const result = await readJsonResponse(response)
  if (!response.ok) {
    throw new Error(result.error || 'eSewa payment could not be verified.')
  }
  return result
}
