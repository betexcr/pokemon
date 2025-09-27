import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const trimmed = (value?: string) => (typeof value === 'string' ? value.trim() : value)

const config = {
  apiKey: trimmed(process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: trimmed(process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: trimmed(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: trimmed(process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trimmed(process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: trimmed(process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  databaseURL: trimmed(process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
  measurementId: trimmed(process.env.FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
}

let app
const requiredKeys: Array<keyof typeof config> = ['apiKey', 'projectId', 'appId']
const hasConfig = requiredKeys.every((key) => Boolean(config[key]))

if (hasConfig) {
  const apps = getApps()
  app = apps.length ? getApp() : initializeApp(config)
}

export const firestoreAdmin = hasConfig ? getFirestore(app!) : null
