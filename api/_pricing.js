const ticketPrices = new Map([
  ['One-Time Entry', 1500],
  ['Gift Ticket', 1500],
  ['Group Day Visit', 1500],
])

function ticketTotal(ticketName, guests) {
  if (!ticketPrices.has(ticketName)) return null
  const guestCount = Math.max(Number(guests) || 0, 0)
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) return null
  const subtotal = ticketPrices.get(ticketName) * guestCount
  const discountRate = guestCount >= 10 ? 0.1 : guestCount > 5 ? 0.05 : 0
  return subtotal - Math.round(subtotal * discountRate)
}

export function validatePaymentAmount(body) {
  const amount = Number(body.amount)
  const productType = String(body.productType || '').trim()
  const purchaseOrderName = String(body.purchaseOrderName || '').trim()
  let expectedAmount = null

  if (productType === 'ticket') {
    expectedAmount = ticketTotal(purchaseOrderName, Number(body.guests))
  }

  if (!Number.isFinite(amount) || amount <= 0 || expectedAmount == null) {
    return { ok: false, error: 'Missing or invalid payment details.' }
  }

  if (amount !== expectedAmount) {
    return {
      ok: false,
      error: 'Payment amount does not match Magic Land pricing.',
      expectedAmount,
    }
  }

  return { ok: true, amount: expectedAmount }
}

export function sanitizeOrderId(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9-]/g, '-')
}
