# 🚀 CryptoRafts - Deployment Guide

This guide will help you deploy your CryptoRafts application to a private GitHub repository for external review.

## Prerequisites

1. **Git** - Install from [git-scm.com](https://git-scm.com/download/win)
2. **GitHub Account** - Access to the CryptoRafts organization: https://github.com/CryptoRafts
3. **GitHub Personal Access Token** - For repository creation and pushing

## Step 1: Install Git (if not already installed)

1. Download Git for Windows: https://git-scm.com/download/win
2. Run the installer with default settings
3. Restart your terminal/PowerShell after installation

## Step 2: Verify Git Installation

Open PowerShell and run:
```powershell
git --version
```

You should see something like: `git version 2.x.x`

## Step 3: Configure Git (if first time)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "CryptoRafts Deployment"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `write:org` (if creating org repo)
5. Click "Generate token"
6. **COPY THE TOKEN** - You won't see it again!

## Step 5: Initialize Git Repository

Open PowerShell in your project directory and run:

```powershell
# Navigate to project directory
cd C:\Users\dell\cryptorafts-starter

# Initialize git repository
git init

# Add all files (except those in .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: CryptoRafts production-ready codebase"
```

## Step 6: Create Private GitHub Repository

### Option A: Using GitHub CLI (if installed)

```powershell
gh repo create CryptoRafts/cryptorafts-app --private --source=. --remote=origin --push
```

### Option B: Using GitHub Web Interface

1. Go to https://github.com/organizations/CryptoRafts/repositories/new
2. Repository name: `cryptorafts-app` (or your preferred name)
3. Description: "AI-powered Web3 ecosystem for global fundraising and project launches"
4. Select: **Private**
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 7: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```powershell
# Add remote repository (replace YOUR_TOKEN with your actual token)
git remote add origin https://YOUR_TOKEN@github.com/CryptoRafts/cryptorafts-app.git

# Or if you prefer SSH (requires SSH key setup):
# git remote add origin git@github.com:CryptoRafts/cryptorafts-app.git

# Verify remote was added
git remote -v
```

## Step 8: Push Code to GitHub

```powershell
# Push to main branch
git branch -M main
git push -u origin main
```

If prompted for credentials:
- Username: Your GitHub username
- Password: Your Personal Access Token (NOT your GitHub password)

## Step 9: Verify Deployment

1. Go to https://github.com/CryptoRafts/cryptorafts-app
2. Verify all files are present
3. Check that `.env.local` and sensitive files are NOT in the repository
4. Verify repository is **Private**

## Step 10: Create Temporary Access Token for Review

For external reviewers, create a temporary collaborator access:

1. Go to repository Settings → Collaborators
2. Click "Add people"
3. Enter reviewer's GitHub username or email
4. Select permission: **Read** (or **Triage** for limited access)
5. Click "Add [username] to this repository"

**Alternative: Deploy Token (More Secure)**

1. Go to Settings → Developer settings → Personal access tokens
2. Create a token with `repo` scope
3. Share this token with reviewers (expires when you revoke it)

## Step 11: Environment Variables Setup

### For Local Development

1. Copy `ENV_EXAMPLE.md` to `.env.local`
2. Fill in all required values
3. **Never commit `.env.local`**

### For Production Deployment (Vercel/Netlify)

1. Go to your deployment platform's environment variables section
2. Add all variables from `ENV_EXAMPLE.md`
3. Mark sensitive variables as "Secret"

## Security Checklist

Before submission, verify:

- ✅ No API keys in code
- ✅ No passwords in code
- ✅ `.env.local` is in `.gitignore`
- ✅ `serviceAccount.json` is in `.gitignore`
- ✅ All sensitive files are excluded
- ✅ Repository is **Private**
- ✅ Only necessary collaborators have access

## Repository Structure

Your repository should have:

```
cryptorafts-app/
├── src/                    # Source code
├── public/                 # Static assets
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
├── README.md              # Project documentation
├── ENV_EXAMPLE.md         # Environment variables template
├── DEPLOYMENT_GUIDE.md     # This file
└── ...                    # Other project files
```

**Should NOT have:**
- ❌ `.env.local`
- ❌ `serviceAccount.json`
- ❌ `email-config.env`
- ❌ Any files with passwords or API keys

## Troubleshooting

### Git not found
- Install Git from https://git-scm.com/download/win
- Restart terminal after installation

### Authentication failed
- Use Personal Access Token, not password
- Token must have `repo` scope

### Push rejected
- Check if repository exists
- Verify remote URL is correct
- Ensure you have write access

### Files not ignored
- Check `.gitignore` syntax
- Remove files from git cache: `git rm --cached filename`
- Commit the removal

## Next Steps

1. ✅ Code is cleaned and polished
2. ✅ Environment variables are secured
3. ✅ Repository is private on GitHub
4. ✅ Ready for external review

## Support

If you encounter issues:
1. Check Git documentation: https://git-scm.com/doc
2. Check GitHub documentation: https://docs.github.com
3. Review error messages for specific guidance

---

**Good luck with your submission! 🚀**
