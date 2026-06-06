/* global process */

const json = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  response.end(JSON.stringify(body))
}

const placeFields = [
  'displayName',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'reviews',
].join(',')

const findPlaceId = async (apiKey) => {
  if (process.env.GOOGLE_PLACE_ID) return process.env.GOOGLE_PLACE_ID.trim()

  const result = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({
      textQuery: 'Magic Land Family Fun Park Tarakeshwar Nepal',
      languageCode: 'en',
      locationBias: {
        circle: {
          center: { latitude: 27.7836311, longitude: 85.3239042 },
          radius: 1000,
        },
      },
    }),
  })

  if (!result.ok) throw new Error(`Google place search failed with ${result.status}`)
  const data = await result.json()
  return data.places?.[0]?.id
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return json(response, 405, { error: 'Method not allowed' })
  }

  const apiKey = String(process.env.GOOGLE_PLACES_API_KEY || '').trim()
  if (!apiKey) return json(response, 503, { error: 'Google reviews are not configured.' })

  try {
    const placeId = await findPlaceId(apiKey)
    if (!placeId) return json(response, 404, { error: 'Magic Land Google place was not found.' })

    const placeResponse = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': placeFields,
      },
    })
    if (!placeResponse.ok) throw new Error(`Google place details failed with ${placeResponse.status}`)

    const place = await placeResponse.json()
    return json(response, 200, {
      name: place.displayName?.text || 'Magic Land Family Fun Park',
      rating: place.rating || null,
      userRatingCount: place.userRatingCount || 0,
      googleMapsUri: place.googleMapsUri || null,
      reviews: (place.reviews || []).map((review) => ({
        authorName: review.authorAttribution?.displayName || 'Google reviewer',
        authorUri: review.authorAttribution?.uri || null,
        authorPhotoUri: review.authorAttribution?.photoUri || null,
        rating: review.rating || 0,
        relativePublishTimeDescription: review.relativePublishTimeDescription || '',
        text: review.text?.text || '',
      })).filter((review) => review.text),
    })
  } catch (error) {
    return json(response, 502, { error: 'Could not load Google reviews.', details: error.message })
  }
}
