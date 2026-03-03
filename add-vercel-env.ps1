# Add FIREBASE_SERVICE_ACCOUNT_KEY to Vercel
$serviceAccountKey = Get-Content .env | Select-String "FIREBASE_SERVICE_ACCOUNT_KEY" | ForEach-Object { $_.ToString().Split("=", 2)[1] }

# Remove quotes if present
$serviceAccountKey = $serviceAccountKey.Trim("'").Trim('"')

echo $serviceAccountKey | npx vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production --yes
