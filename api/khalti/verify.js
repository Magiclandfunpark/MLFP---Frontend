/* global process */

const json = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'Method not allowed' })
  }

  const secretKey = process.env.KHALTI_SECRET_KEY
  if (!secretKey) return json(response, 500, { error: 'Khalti secret key is not configured.' })

  try {
    const body = request.body || {}
    const pidx = String(body.pidx || '').trim()
    const expectedAmount = Number(body.amount || 0)

    if (!pidx) return json(response, 400, { error: 'Missing Khalti pidx.' })

    const khaltiResponse = await fetch(
      process.env.KHALTI_LOOKUP_URL || 'https://a.khalti.com/api/v2/epayment/lookup/',
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
    const amountMatches = expectedAmount > 0 ? Math.abs(paidAmount - expectedAmount) < 0.01 : true
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
