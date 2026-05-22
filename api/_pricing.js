const ticketPrices = new Map([
  ['One-Time Entry', 1500],
  ['Gift Ticket', 1500],
  ['Group Day Visit', 1500],
])

const membershipPlans = [
  { name: 'Individual Fun Pass', basePrice: 2999, baseMembers: 1 },
  { name: 'Family Duo Pass', basePrice: 5499, baseMembers: 2 },
  { name: 'Family Magic Pass', basePrice: 9499, baseMembers: 4 },
]

const membershipAddOnPrice = 2000

function ticketTotal(ticketName, guests) {
  if (!ticketPrices.has(ticketName)) return null
  const guestCount = Math.max(Number(guests) || 0, 0)
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) return null
  const subtotal = ticketPrices.get(ticketName) * guestCount
  const discountRate = guestCount >= 10 ? 0.1 : guestCount > 5 ? 0.05 : 0
  return subtotal - Math.round(subtotal * discountRate)
}

function membershipTotal(totalMembers) {
  const memberCount = Math.max(Number(totalMembers) || 0, 0)
  if (!Number.isInteger(memberCount) || memberCount < 1 || memberCount > 24) return null
  const plan = memberCount >= 4 ? membershipPlans[2] : memberCount >= 2 ? membershipPlans[1] : membershipPlans[0]
  const addOnMembers = Math.max(memberCount - plan.baseMembers, 0)
  return plan.basePrice + (addOnMembers * membershipAddOnPrice)
}

export function validatePaymentAmount(body) {
  const amount = Number(body.amount)
  const productType = String(body.productType || '').trim()
  const purchaseOrderName = String(body.purchaseOrderName || '').trim()
  let expectedAmount = null

  if (productType === 'ticket') {
    expectedAmount = ticketTotal(purchaseOrderName, Number(body.guests))
  }

  if (productType === 'membership') {
    expectedAmount = membershipTotal(Number(body.totalMembers))
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
