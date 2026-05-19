import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getDatabase, onValue, ref, set, update } from 'firebase/database'
import { addDoc, collection, doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'default',
}

const hasEnvConfig = Boolean(envConfig.apiKey && envConfig.projectId && envConfig.appId)

let appPromise
let dbPromise
let realtimeDbPromise
let authPromise
let analyticsPromise
let phoneRecaptchaVerifier
let sessionId

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      globalThis.setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
    }),
  ])
}

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
    dbPromise = getApp().then((app) => (app ? getFirestore(app, envConfig.firestoreDatabaseId) : null))
  }
  return dbPromise
}

async function getRealtimeDb() {
  if (!realtimeDbPromise) {
    realtimeDbPromise = getApp().then((app) => (app ? getDatabase(app) : null))
  }
  return realtimeDbPromise
}

async function getAuthClient() {
  if (!authPromise) {
    authPromise = getApp().then((app) => (app ? getAuth(app) : null))
  }
  return authPromise
}

async function getAnalyticsClient() {
  if (!analyticsPromise) {
    analyticsPromise = Promise.all([getApp(), isSupported()])
      .then(([app, supported]) => (app && supported ? getAnalytics(app) : null))
      .catch(() => null)
  }
  return analyticsPromise
}

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

function getAttributionParams() {
  try {
    const search = new URLSearchParams(globalThis.location?.search || '')
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']
    return Object.fromEntries(keys.map((key) => [key, search.get(key)]).filter(([, value]) => value))
  } catch {
    return {}
  }
}

function createId(prefix) {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 100000)}`
  return `${prefix}_${id}`
}

function getVisitorId() {
  const key = 'magicland:visitorId'
  try {
    const existing = globalThis.localStorage?.getItem(key)
    if (existing) return existing
    const nextId = createId('visitor')
    globalThis.localStorage?.setItem(key, nextId)
    return nextId
  } catch {
    return createId('visitor')
  }
}

function getSessionId() {
  if (sessionId) return sessionId
  const key = 'magicland:sessionId'
  try {
    const existing = globalThis.sessionStorage?.getItem(key)
    if (existing) {
      sessionId = existing
      return sessionId
    }
    sessionId = createId('session')
    globalThis.sessionStorage?.setItem(key, sessionId)
    return sessionId
  } catch {
    sessionId = createId('session')
    return sessionId
  }
}

export async function trackEvent(name, params = {}) {
  try {
    const analytics = await getAnalyticsClient()
    if (analytics) logEvent(analytics, name, cleanParams({ ...getAttributionParams(), ...params }))
  } catch {
    // Analytics should never block booking, auth, or page navigation.
  }
}

export function trackPageView(pageId) {
  trackEvent('page_view', {
    page_title: pageId,
    page_path: globalThis.location?.pathname ?? '',
    page_location: globalThis.location?.href ?? '',
    ...getAttributionParams(),
  })
}

function publicUserProfile(user) {
  return {
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    phoneNumber: user.phoneNumber ?? '',
    photoURL: user.photoURL ?? '',
    providerIds: user.providerData?.map((provider) => provider.providerId) ?? [],
    lastSeenAt: new Date().toISOString(),
  }
}

async function saveUserProfile(user) {
  if (!user?.uid) return
  const profile = {
    ...publicUserProfile(user),
    visitorId: getVisitorId(),
  }

  const db = await getDb()
  if (db) {
    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {})
  }

  const realtimeDb = await getRealtimeDb()
  if (realtimeDb) {
    await update(ref(realtimeDb, `users/${user.uid}`), profile).catch(() => {})
  }
}

export async function subscribeAuthUser(onChange) {
  const auth = await getAuthClient()
  if (!auth) {
    onChange(null)
    return () => {}
  }

  return onAuthStateChanged(auth, (user) => {
    onChange(user)
    if (user) saveUserProfile(user).catch(() => {})
  })
}

export async function signInWithGoogle() {
  const auth = await getAuthClient()
  if (!auth) throw new Error('Firebase Auth is not configured.')
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  await saveUserProfile(result.user)
  return result.user
}

export async function signInWithEmail(email, password) {
  const auth = await getAuthClient()
  if (!auth) throw new Error('Firebase Auth is not configured.')
  const result = await signInWithEmailAndPassword(auth, email, password)
  await saveUserProfile(result.user)
  return result.user
}

export async function createEmailAccount(email, password) {
  const auth = await getAuthClient()
  if (!auth) throw new Error('Firebase Auth is not configured.')
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await saveUserProfile(result.user)
  return result.user
}

export async function sendPhoneOtp(phoneNumber, containerId = 'magicland-phone-recaptcha') {
  const auth = await getAuthClient()
  if (!auth) throw new Error('Firebase Auth is not configured.')
  if (!phoneRecaptchaVerifier) {
    phoneRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
  }
  return signInWithPhoneNumber(auth, phoneNumber, phoneRecaptchaVerifier)
}

export async function confirmPhoneOtp(confirmationResult, code) {
  const result = await confirmationResult.confirm(code)
  await saveUserProfile(result.user)
  return result.user
}

export async function signOutUser() {
  const auth = await getAuthClient()
  if (!auth) return
  await signOut(auth)
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
  const auth = await getAuthClient()
  const enrichedPayload = {
    ...payload,
    source: 'website',
    pagePath: globalThis.location?.pathname ?? '',
    userAgent: globalThis.navigator?.userAgent ?? '',
    authUid: auth?.currentUser?.uid ?? '',
    authEmail: auth?.currentUser?.email ?? '',
    authPhone: auth?.currentUser?.phoneNumber ?? '',
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    ...getAttributionParams(),
  }

  const db = await getDb()
  if (db) {
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, collectionName), {
          ...enrichedPayload,
          status: 'new',
          createdAt: serverTimestamp(),
        }),
        7000,
        'Firestore request save',
      )

      try {
        const realtimeDb = await getRealtimeDb()
        if (realtimeDb) {
          await withTimeout(
            set(ref(realtimeDb, `publicRequests/${collectionName}/${docRef.id}`), {
              ...enrichedPayload,
              status: 'new',
              createdAt: new Date().toISOString(),
              firestoreId: docRef.id,
            }),
            4000,
            'Realtime Database mirror',
          )
        }
      } catch {
        // Firestore is the source of truth for reservations. RTDB mirroring is
        // only a convenience for live previews and existing notification hooks.
      }

      return { id: docRef.id, offline: false, store: 'firestore' }
    } catch {
      // If Firestore rules are not deployed yet, keep the public reservation
      // path working by falling back to RTDB.
    }
  }

  const realtimeDb = await getRealtimeDb()
  if (realtimeDb) {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 100000)}`
    await withTimeout(
      set(ref(realtimeDb, `publicRequests/${collectionName}/${id}`), {
        ...enrichedPayload,
        status: 'new',
        createdAt: new Date().toISOString(),
      }),
      7000,
      'Realtime Database request save',
    )
    return { id, offline: false, store: 'realtime-database' }
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
