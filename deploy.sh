#!/bin/bash

# Deploy script for Pokemon app with Firebase environment variables

echo "🚀 Starting deployment process..."

# Load environment variables
if [ -f .env.local ]; then
    echo "📋 Loading environment variables from .env.local"
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ .env.local file not found!"
    exit 1
fi

# Verify required environment variables
required_vars=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

echo "🔍 Verifying environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Build the application
echo "🔨 Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy Firestore rules first
echo "🔒 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy to Firebase Hosting using Next.js integration
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo "🔗 Your app is available at: https://pokemon-battles-86a0d.web.app"
    echo "🔗 Battle page: https://pokemon-battles-86a0d.web.app/battle"
else
    echo "❌ Deployment failed!"
    exit 1
fi
