# 🤖 Automated Firebase Admin Setup

## Quick Start

Run the automated setup script:

### Windows (PowerShell)
```powershell
.\scripts\auto-setup-firebase.ps1
```

### Mac/Linux (Bash)
```bash
chmod +x scripts/auto-setup-firebase.sh
./scripts/auto-setup-firebase.sh
```

## What the Script Does

1. ✅ Checks for existing service account files
2. ✅ Validates the JSON file
3. ✅ Encodes to Base64
4. ✅ Copies to clipboard
5. ✅ Provides step-by-step Vercel instructions

## Manual Alternative

If you prefer to do it manually, see:
- **Quick Guide**: `QUICK_VERCEL_SETUP.md` (5 minutes)
- **Detailed Guide**: `VERCEL_FIREBASE_CREDENTIALS_SETUP.md` (comprehensive)

## After Running the Script

1. The Base64 string will be in your clipboard
2. Go to Vercel: https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables
3. Add the variable `FIREBASE_SERVICE_ACCOUNT_B64`
4. Paste the value
5. Select all environments
6. Save and redeploy

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script can't find file | Make sure you provide the full path to the JSON file |
| "Invalid JSON" error | Download a fresh service account from Firebase Console |
| Clipboard not working | The script will show the Base64 string - copy it manually |

