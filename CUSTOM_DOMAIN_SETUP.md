# 🔧 Custom Domain Authentication Fix

## Problem
Firebase Authentication error: "Illegal url for new iframe" when accessing `pokemon.ultharcr.com`

## Root Cause
Your custom domain `pokemon.ultharcr.com` is not added to Firebase Authentication's authorized domains list.

## Solution

### Step 1: Add Domain to Firebase Authentication

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/pokemon-battles-86a0d/authentication/settings

2. **Navigate to Authorized Domains:**
   - Click on "Authentication" in the left sidebar
   - Click on "Settings" tab
   - Scroll down to "Authorized domains" section

3. **Add Your Custom Domain:**
   - Click "Add domain"
   - Enter: `pokemon.ultharcr.com`
   - Click "Add"

### Step 2: Verify Domain Configuration

Your authorized domains should now include:
- ✅ `localhost` (for development)
- ✅ `pokemon-battles-86a0d.web.app` (default Firebase hosting)
- ✅ `pokemon-battles-86a0d.firebaseapp.com` (default Firebase hosting)
- ✅ `pokemon.ultharcr.com` (your custom domain)

### Step 3: Verify DNS Configuration

Make sure your custom domain is properly configured:

1. **Check DNS Records:**
   ```bash
   # Verify your domain points to Firebase
   dig pokemon.ultharcr.com
   ```

2. **Expected Configuration:**
   - Should point to Firebase hosting IPs
   - CNAME record pointing to `pokemon-battles-86a0d.web.app`

### Step 4: Test Authentication

1. **Wait for Propagation:**
   - Changes may take 5-10 minutes to propagate

2. **Test Sign In:**
   - Visit: `https://pokemon.ultharcr.com`
   - Try to sign in
   - Authentication should work without the iframe error

## Troubleshooting

### If Authentication Still Fails:

1. **Check Browser Console:**
   - Look for any remaining authentication errors
   - Verify the domain is correctly added

2. **Verify Firebase Project:**
   - Ensure you're using the correct Firebase project
   - Check that your environment variables are correct

3. **Clear Browser Cache:**
   - Clear cookies and local storage
   - Try in an incognito/private window

### Common Issues:

- **DNS Propagation:** Wait up to 24 hours for DNS changes
- **Firebase Cache:** Firebase changes may take 5-10 minutes
- **Browser Cache:** Clear browser cache and cookies
- **Wrong Project:** Ensure you're adding the domain to the correct Firebase project

## Verification Commands

```bash
# Check Firebase project
firebase projects:list

# Check hosting configuration
firebase hosting:channel:list

# Verify deployment
firebase hosting:sites:list
```

## Success Indicators

✅ No "Illegal url for new iframe" error  
✅ Sign in modal loads without errors  
✅ Authentication works on custom domain  
✅ Users can sign in and access battle features  

## Next Steps

After fixing authentication:
1. Test all authentication flows
2. Verify battle system works on custom domain
3. Test both online and offline battles
4. Ensure all permissions work correctly

---

**Need Help?** Check the Firebase Console for any additional errors or contact Firebase support if issues persist.