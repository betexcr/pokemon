
# 🔧 Custom Domain Setup for Firebase Authentication

## 📋 Current Configuration
- **Project ID:** pokemon-battles-86a0d
- **Custom Domain:** pokemon.ultharcr.com
- **Current App URL:** https://pokemon-battles-86a0d.web.app

## 🎯 Required Steps

### 1. Add Custom Domain to Firebase Auth (REQUIRED)
**Direct Link:** https://console.firebase.google.com/project/pokemon-battles-86a0d/authentication/settings

**Steps:**
1. Click on **"Authorized domains"** tab
2. Click **"Add domain"** button
3. Enter: `pokemon.ultharcr.com`
4. Click **"Add"**

### 2. Configure Custom Domain for Hosting (OPTIONAL)
**Direct Link:** https://console.firebase.google.com/project/pokemon-battles-86a0d/hosting

**Steps:**
1. Click **"Add custom domain"**
2. Enter: `pokemon.ultharcr.com`
3. Follow the verification steps
4. Update your DNS records as instructed

### 3. DNS Configuration (if using custom domain for hosting)
Add these DNS records with your domain provider:
- **Type:** CNAME
- **Name:** pokemon (or @ for root domain)
- **Value:** pokemon-battles-86a0d.web.app

## ✅ Verification
After completing the steps above:
- **Auth will work on:** https://pokemon.ultharcr.com
- **App will be accessible at:** https://pokemon.ultharcr.com (if hosting is configured)

## 🔗 Quick Links
- **Firebase Console:** https://console.firebase.google.com/project/pokemon-battles-86a0d
- **Auth Settings:** https://console.firebase.google.com/project/pokemon-battles-86a0d/authentication/settings
- **Hosting Settings:** https://console.firebase.google.com/project/pokemon-battles-86a0d/hosting
- **Current App:** https://pokemon-battles-86a0d.web.app

## 🚀 Current Status
✅ App deployed and working
✅ Firebase Auth configured
⏳ Custom domain needs to be added to authorized domains
