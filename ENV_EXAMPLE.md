# Environment Variables Configuration

Copy this file to `.env.local` and fill in your actual values.

**⚠️ NEVER commit `.env.local` to version control!**

```env
# ============================================
# FIREBASE CONFIGURATION (REQUIRED)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com

# ============================================
# FIREBASE ADMIN SDK (REQUIRED FOR SERVER-SIDE)
# ============================================
FIREBASE_SERVICE_ACCOUNT_B64=your_base64_encoded_service_account_json_here

# ============================================
# ADMIN CONFIGURATION (REQUIRED)
# ============================================
ADMIN_EMAIL=your_admin_email@example.com
SUPER_ADMIN_EMAIL=your_super_admin_email@example.com

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ============================================
# RAFTAI / AI CONFIGURATION (REQUIRED FOR AI FEATURES)
# ============================================
NEXT_PUBLIC_RAFTAI_LOCAL=true
NEXT_PUBLIC_RAFTAI_SERVICE_URL=http://localhost:8080
RAFT_AI_API_KEY=your_raftai_api_key_here
NEXT_PUBLIC_RAFTAI_API_KEY=your_raftai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# ============================================
# EMAIL CONFIGURATION (REQUIRED FOR EMAIL FEATURES)
# ============================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_app_password_here
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=your_email@example.com
EMAIL_RATE_LIMIT_DELAY=1000
EMAIL_MAX_RETRIES=3

# ============================================
# SOCIAL MEDIA / BLOG AUTOMATION (OPTIONAL)
# ============================================
N8N_WEBHOOK_URL=https://your_n8n_instance.com/webhook/cryptorafts-publish
DEFAULT_PUBLISH_MODE=false
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# ============================================
# TWITTER/X API (OPTIONAL)
# ============================================
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret_here

# ============================================
# STRIPE / PAYMENT (OPTIONAL)
# ============================================
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# ============================================
# SECURITY / SESSION (OPTIONAL BUT RECOMMENDED)
# ============================================
NEXTAUTH_SECRET=your_random_secret_here_change_this_in_production
NEXTAUTH_URL=http://localhost:3000
```




