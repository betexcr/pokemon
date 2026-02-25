# Environment Variables for Netlify

Copy these to Netlify dashboard (Settings → Build & deploy → Environment variables):

## Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pokemon-battles-86a0d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pokemon-battles-86a0d
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://pokemon-battles-86a0d-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_APP_ID=pokemon-battles-86a0d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pokemon-battles-86a0d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=(leave empty)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-503930717

## Firebase Admin (for multiplayer)
FIREBASE_SERVICE_ACCOUNT_KEY=(copy from .env file)

## Redis
UPSTASH_REDIS_REST_URL=https://hardy-jackass-16664.upstash.io
UPSTASH_REDIS_REST_TOKEN=AUEYAAIncDIzZGVmMmQ1ZTVmMTg0MzI1Yjk3ZmEwMDBiZWRkNTg4YnAyMTY2NjQ

## Other
NEXT_PUBLIC_BASE_URL=(will be auto-filled by Netlify)
