# Security Policy

## 🔒 Protecting Passwords and API Keys

**All passwords, API keys, and sensitive credentials are stored in environment variables and are NEVER committed to the repository.**

### ✅ Protected Files (Not in Repository)

The following files are protected by `.gitignore` and will NEVER be committed:

- `.env.local` - All environment variables (API keys, passwords, secrets)
- `.env` - Environment variables
- `serviceAccount.json` - Firebase Admin SDK credentials
- `*-service-account.json` - Firebase service account files
- `firebase-adminsdk-*.json` - Firebase Admin SDK files
- `secure-email-config.env` - Email credentials
- `email-config.env` - Email configuration
- Any file containing `password`, `secret`, `key`, `token`, or `credential`

### 📋 Required Environment Variables

All sensitive data must be configured in `.env.local` (see `env.template` for reference):

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_B64=your_base64_encoded_service_account
```

#### Email Configuration
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
```

#### API Keys
```
OPENAI_API_KEY=your_openai_key
RAFT_AI_API_KEY=your_raftai_key
```

#### Admin Configuration
```
ADMIN_EMAIL=your_admin@example.com
SUPER_ADMIN_EMAIL=your_super_admin@example.com
```

### ⚠️ Security Best Practices

1. **NEVER commit `.env.local`** - It's in `.gitignore` for a reason
2. **NEVER hardcode credentials** - Always use `process.env.VARIABLE_NAME`
3. **Use environment variables** - All secrets must come from `.env.local`
4. **Rotate keys regularly** - Change API keys and passwords periodically
5. **Use strong passwords** - Generate secure passwords for all services

### 🔍 Code Review Checklist

Before committing, ensure:
- [ ] No hardcoded API keys in code
- [ ] No hardcoded passwords in code
- [ ] No credentials in test files
- [ ] All secrets use `process.env.*`
- [ ] `.env.local` is not committed
- [ ] `serviceAccount.json` is not committed

### 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate the exposed credentials**
2. **Remove from Git history** (if possible)
3. **Update `.gitignore`** to prevent future commits
4. **Notify the team** if working in a team

### 📞 Security Contact

For security concerns, contact: business@cryptorafts.com

---

**Remember: When in doubt, use environment variables!**

