# Firebase Setup for Multiplayer Battles

## 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

## 2. Login to Firebase

```bash
firebase login
```

## 3. Create Firebase Project

```bash
firebase projects:create your-project-id --display-name "Pokemon Battles"
```

Or create manually at [Firebase Console](https://console.firebase.google.com/)

## 4. Initialize Firebase in Project

```bash
firebase init
```

Select the following features:
- **Firestore**: Configure security rules and indexes files for Firestore
- **Hosting**: Configure files for Firebase Hosting

## 5. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 6. Environment Variables

The Firebase CLI will automatically generate a `.env.local` file, or create one manually:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 7. Security Features

The included `firestore.rules` file provides:

- **User Team Security**: Users can only access their own teams
- **Battle Room Security**: Players can only access battles they're participating in
- **Data Validation**: Ensures proper data structure and limits
- **Performance Optimization**: Indexed queries for fast lookups
- **Future-Ready**: Support for leaderboards, matchmaking, and statistics

## 8. Local Development

Start Firebase emulators for local development:

```bash
firebase emulators:start
```

This will start:
- Auth emulator on port 9099
- Firestore emulator on port 8080
- Hosting emulator on port 5000
- Emulator UI on port 4000

## 9. Test the Setup

1. Run `npm run dev`
2. Navigate to `/team` or `/battle`
3. You should see the authentication modal
4. Create an account and test the login flow

## 10. Deploy to Production

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

## Next Steps

- Implement team CRUD operations with Firestore
- Add multiplayer battle matching system
- Implement real-time battle updates
- Add user profiles and statistics
- Set up Cloud Functions for server-side logic
