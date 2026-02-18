import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

export async function GET() {
  try {
    const apps = getApps();
    const status = {
      initialized: apps.length > 0,
      apps: apps.map(a => a.name),
      hasKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      keyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length
    };

    if (!apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
            });
            status.initialized = true;
            status.apps = getApps().map(a => a.name);
        } catch (e: any) {
            return NextResponse.json({ error: `Init failed: ${e.message}`, status }, { status: 500 });
        }
    }

    return NextResponse.json({ status: 'ok', firebase: status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
