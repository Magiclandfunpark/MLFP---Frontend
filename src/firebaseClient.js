import { initializeApp } from 'firebase/app'
import { getDatabase, onValue, ref, set } from 'firebase/database'
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const hasEnvConfig = Boolean(envConfig.apiKey && envConfig.projectId && envConfig.appId)

let appPromise
let dbPromise
let realtimeDbPromise

async function getFirebaseConfig() {
  if (hasEnvConfig) return envConfig

  if (['localhost', '127.0.0.1'].includes(globalThis.location?.hostname)) {
    return null
  }

  try {
    const response = await fetch('/__/firebase/init.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('Firebase Hosting config is not available.')
    return response.json()
  } catch {
    return null
  }
}

async function getApp() {
  if (!appPromise) {
    appPromise = getFirebaseConfig().then((config) => {
      if (!config?.apiKey || !config?.projectId) return null
      return initializeApp(config)
    })
  }
  return appPromise
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = getApp().then((app) => (app ? getFirestore(app) : null))
  }
  return dbPromise
}

async function getRealtimeDb() {
  if (!realtimeDbPromise) {
    realtimeDbPromise = getApp().then((app) => (app ? getDatabase(app) : null))
  }
  return realtimeDbPromise
}

function saveLocalFallback(collectionName, payload) {
  const key = `magicland:${collectionName}`
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 100000)}`
  const entry = {
    ...payload,
    id,
    createdAt: new Date().toISOString(),
    source: 'local-preview',
  }

  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([entry, ...existing].slice(0, 50)))
  } catch {
    try {
      sessionStorage.setItem(key, JSON.stringify([entry]))
    } catch {
      // Preview storage can be blocked in some browser contexts. The visible
      // success state still confirms the request flow is wired correctly.
    }
  }

  return entry
}

export async function createPublicRequest(collectionName, payload) {
  const enrichedPayload = {
    ...payload,
    source: 'website',
    pagePath: globalThis.location?.pathname ?? '',
    userAgent: globalThis.navigator?.userAgent ?? '',
  }

  const realtimeDb = await getRealtimeDb()
  if (realtimeDb) {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 100000)}`
    await set(ref(realtimeDb, `publicRequests/${collectionName}/${id}`), {
      ...enrichedPayload,
      status: 'new',
      createdAt: new Date().toISOString(),
    })
    return { id, offline: false, store: 'realtime-database' }
  }

  const db = await getDb()
  if (db) {
    const docRef = await addDoc(collection(db, collectionName), {
      ...enrichedPayload,
      status: 'new',
      createdAt: serverTimestamp(),
    })

    return { id: docRef.id, offline: false, store: 'firestore' }
  }

  return { id: saveLocalFallback(collectionName, enrichedPayload).id, offline: true, store: 'local-preview' }
}

export async function subscribePublicLiveStatus(onChange) {
  const realtimeDb = await getRealtimeDb()
  if (!realtimeDb) return () => {}

  return onValue(ref(realtimeDb, 'publicLiveStatus'), (snapshot) => {
    if (snapshot.exists()) onChange(snapshot.val())
  })
}
