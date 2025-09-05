# GitHub Deployment Setup

This guide will help you set up automatic deployment to Firebase Hosting via GitHub Actions.

## 1. GitHub Secrets Setup

You need to add the following secrets to your GitHub repository:

### Go to your GitHub repository:
1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each of the following:

### Required Secrets:

#### Firebase Environment Variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`: `AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `pokemon-battles-86a0d.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `pokemon-battles-86a0d`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `pokemon-battles-86a0d.firebasestorage.app`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: `665621845004`
- `NEXT_PUBLIC_FIREBASE_APP_ID`: `1:665621845004:web:2c5505206389d807ed0a29`

#### Firebase CLI Token:
- `FIREBASE_TOKEN`: `YOUR_FIREBASE_TOKEN_HERE` (See step 2 below)

## 2. Firebase CLI Token Setup

To enable automatic deployment, you need to generate a Firebase CLI token:

### Generate Firebase Token:
1. Install Firebase CLI locally (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Generate a CI token:
   ```bash
   firebase login:ci
   ```

4. Copy the generated token (it will look like: `YOUR_FIREBASE_TOKEN_HERE`)
5. Add it as a GitHub secret named `FIREBASE_TOKEN`

## 3. How It Works

### CI Workflow (`.github/workflows/ci.yml`):
- Runs on every push and pull request
- Installs dependencies
- Runs linting and tests
- Builds the application (to catch build errors early)

### Deploy Workflow (`.github/workflows/deploy-simple.yml`):
- Runs only on pushes to `main` branch
- Builds the application with environment variables
- Deploys to Firebase Hosting automatically using Firebase CLI
- Can also be triggered manually via GitHub Actions tab

## 4. Deployment URLs

After setup, your app will be automatically deployed to:
- **Main site**: https://pokemon-battles-86a0d.web.app
- **Battle page**: https://pokemon-battles-86a0d.web.app/battle

## 5. Manual Deployment

You can still deploy manually using:
```bash
npm run deploy
```

Or directly with Firebase CLI:
```bash
firebase deploy --only hosting
```

## 6. Environment Variables

The environment variables are now configured in two places:
- **Local development**: `.env.local` file (already set up)
- **GitHub Actions**: Repository secrets (needs to be set up as described above)

## 7. Benefits of GitHub Actions Deployment

✅ **Automatic deployment** on every push to main  
✅ **Build verification** before deployment  
✅ **Environment variable management** via GitHub secrets  
✅ **Deployment history** in GitHub Actions  
✅ **Manual deployment** option when needed  
✅ **Rollback capability** via Firebase console  

## 8. Troubleshooting

If deployment fails:
1. Check GitHub Actions logs for specific errors
2. Verify all secrets are set correctly
3. Ensure Firebase service account has proper permissions
4. Check Firebase project ID matches in all configurations