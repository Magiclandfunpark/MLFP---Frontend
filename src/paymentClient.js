export async function initiateKhaltiPayment({ amount, purchaseOrderId, purchaseOrderName, customerInfo }) {
  const response = await fetch('/api/khalti/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, purchaseOrderId, purchaseOrderName, customerInfo }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.payment_url) {
    throw new Error(data.error || 'Khalti payment could not be started.')
  }
  return data
}

export async function verifyKhaltiPayment({ pidx, amount }) {
  const response = await fetch('/api/khalti/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pidx, amount }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Khalti payment could not be verified.')
  }
  return data
}

