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

export async function initiateKhaltiPayment({ amount, purchaseOrderId, purchaseOrderName, customerInfo }) {
  const response = await withTimeout(
    fetch('/api/khalti/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, purchaseOrderId, purchaseOrderName, customerInfo }),
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

export async function verifyKhaltiPayment({ pidx, amount }) {
  const response = await withTimeout(
    fetch('/api/khalti/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pidx, amount }),
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
