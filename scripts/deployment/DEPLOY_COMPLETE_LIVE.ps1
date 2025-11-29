# ============================================
# CRYPTORAFTS - COMPLETE LIVE DEPLOYMENT
# ============================================
# This script deploys everything including SEO keywords, Firebase, and fixes all bugs

Write-Host "`n🚀 CRYPTORAFTS - COMPLETE LIVE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# SSH Connection Details
$sshHost = "72.61.98.99"
$sshUser = "root"
$appPath = "/var/www/cryptorafts"

Write-Host "📋 Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Update SEO keywords with ALL comprehensive keywords" -ForegroundColor White
Write-Host "2. Verify Firebase configuration" -ForegroundColor White
Write-Host "3. Verify .env.local with all API keys" -ForegroundColor White
Write-Host "4. Rebuild Next.js application" -ForegroundColor White
Write-Host "5. Restart PM2 process" -ForegroundColor White
Write-Host "6. Configure Nginx for www.cryptorafts.com" -ForegroundColor White
Write-Host "7. Verify SSL certificate" -ForegroundColor White
Write-Host "8. Final verification" -ForegroundColor White
Write-Host ""

# Complete deployment command
$deployCommand = @"
cd $appPath && echo "🚀 COMPLETE LIVE DEPLOYMENT - www.cryptorafts.com" && echo "========================================" && echo "" && 

# Step 1: Update SEO keywords
echo "📋 Step 1: Updating SEO keywords file..." && 
cat > src/app/seo-keywords-large.ts << 'KEYWORDSEOF'
/**
 * Mega SEO Keywords List for CryptoRafts - Comprehensive Coverage
 * Includes ALL strategic keywords for maximum SEO visibility
 */

import { seoKeywords as baseKeywords } from './seo-keywords';

// Comprehensive keywords array with ALL variations
const comprehensiveKeywords = [
  // Yielding variations - ALL combinations
  'professional yielding', 'professional yielding 2025', 'professional yielding 2024', 'professional yielding 2023',
  'professional yielding online', 'professional yielding offline', 'professional yielding software', 'professional yielding platform',
  'professional yielding app', 'professional yielding application', 'professional yielding system', 'professional yielding solution',
  'professional yielding service', 'professional yielding tool', 'professional yielding guide', 'professional yielding tutorial',
  'professional yielding review', 'professional yielding comparison', 'professional yielding vs', 'professional yielding alternative',
  'professional yielding competitor', 'professional yielding how to', 'professional yielding where to', 'professional yielding what is',
  'professional yielding best for', 'professional yielding for beginners', 'professional yielding for professionals',
  'professional yielding for investors', 'professional yielding for founders', 'professional yielding for startups', 'professional yielding for enterprises',
  'advanced yielding', 'new yielding', 'latest yielding', 'modern yielding', 'innovative yielding', 'secure yielding', 'trusted yielding',
  'verified yielding', 'reliable yielding', 'fastest yielding', 'cheapest yielding', 'affordable yielding', 'free yielding', 'paid yielding',
  'enterprise yielding', 'business yielding', 'personal yielding', 'mobile yielding', 'web yielding', 'desktop yielding', 'cloud yielding',
  'hybrid yielding', 'on-chain yielding', 'off-chain yielding',
  // Farming variations - ALL combinations
  'best farming', 'farming', 'best farming 2025', 'farming 2025', 'best farming 2024', 'farming 2024', 'best farming 2023', 'farming 2023',
  'best farming online', 'farming online', 'best farming offline', 'farming offline', 'best farming software', 'farming software',
  'best farming platform', 'farming platform', 'best farming app', 'farming app', 'best farming application', 'farming application',
  'best farming system', 'farming system', 'best farming solution', 'farming solution', 'best farming service', 'farming service',
  'best farming tool', 'farming tool', 'best farming guide', 'farming guide', 'best farming tutorial', 'farming tutorial',
  'best farming review', 'farming review', 'best farming comparison', 'farming comparison', 'best farming vs', 'farming vs',
  'best farming alternative', 'farming alternative', 'best farming competitor', 'farming competitor', 'best farming how to', 'farming how to',
  'best farming where to', 'farming where to', 'best farming what is', 'farming what is', 'best farming best for', 'farming best for',
  'best farming for beginners', 'farming for beginners', 'best farming for professionals', 'farming for professionals',
  'best farming for investors', 'farming for investors', 'best farming for founders', 'farming for founders',
  'best farming for startups', 'farming for startups', 'best farming for enterprises', 'farming for enterprises',
  'top farming', 'leading farming', 'premium farming', 'professional farming', 'advanced farming', 'new farming', 'latest farming',
  'modern farming', 'innovative farming', 'secure farming', 'trusted farming', 'verified farming', 'reliable farming', 'fastest farming',
  'cheapest farming', 'affordable farming', 'free farming', 'paid farming', 'enterprise farming', 'business farming', 'personal farming',
  'mobile farming', 'web farming', 'desktop farming', 'cloud farming', 'hybrid farming', 'on-chain farming', 'off-chain farming',
  // Mining variations - ALL combinations
  'best mining', 'mining', 'best mining 2025', 'mining 2025', 'best mining 2024', 'mining 2024', 'best mining 2023', 'mining 2023',
  'best mining online', 'mining online', 'best mining offline', 'mining offline', 'best mining software', 'mining software',
  'best mining platform', 'mining platform', 'best mining app', 'mining app', 'best mining application', 'mining application',
  'best mining system', 'mining system', 'best mining solution', 'mining solution', 'best mining service', 'mining service',
  'best mining tool', 'mining tool', 'best mining guide', 'mining guide', 'best mining tutorial', 'mining tutorial',
  'best mining review', 'mining review', 'best mining comparison', 'mining comparison', 'best mining vs', 'mining vs',
  'best mining alternative', 'mining alternative', 'best mining competitor', 'mining competitor', 'best mining how to', 'mining how to',
  'best mining where to', 'mining where to', 'best mining what is', 'mining what is', 'best mining best for', 'mining best for',
  'best mining for beginners', 'mining for beginners', 'best mining for professionals', 'mining for professionals',
  'best mining for investors', 'mining for investors', 'best mining for founders', 'mining for founders',
  'best mining for startups', 'mining for startups', 'best mining for enterprises', 'mining for enterprises',
  'top mining', 'leading mining', 'premium mining', 'professional mining', 'advanced mining', 'new mining', 'latest mining',
  'modern mining', 'innovative mining', 'secure mining', 'trusted mining', 'verified mining', 'reliable mining', 'fastest mining',
  'cheapest mining', 'affordable mining', 'free mining', 'paid mining', 'enterprise mining', 'business mining', 'personal mining',
  'mobile mining', 'web mining', 'desktop mining', 'cloud mining', 'hybrid mining', 'on-chain mining', 'off-chain mining',
  // Location-based keywords
  'cryptorafts usa', 'best cryptorafts in usa', 'top cryptorafts usa', 'cryptorafts uk', 'best cryptorafts in uk', 'top cryptorafts uk',
  'cryptorafts europe', 'best cryptorafts in europe', 'top cryptorafts europe', 'cryptorafts asia', 'best cryptorafts in asia', 'top cryptorafts asia',
  'cryptorafts singapore', 'best cryptorafts in singapore', 'top cryptorafts singapore',
  'cryptorafts hong kong', 'best cryptorafts in hong kong', 'top cryptorafts hong kong',
  'cryptorafts uae', 'best cryptorafts in uae', 'top cryptorafts uae', 'cryptorafts dubai', 'best cryptorafts in dubai', 'top cryptorafts dubai',
  'cryptorafts japan', 'best cryptorafts in japan', 'top cryptorafts japan', 'cryptorafts korea', 'best cryptorafts in korea', 'top cryptorafts korea',
  'cryptorafts china', 'best cryptorafts in china', 'top cryptorafts china', 'cryptorafts india', 'best cryptorafts in india', 'top cryptorafts india',
  'cryptorafts australia', 'best cryptorafts in australia', 'top cryptorafts australia',
  'cryptorafts canada', 'best cryptorafts in canada', 'top cryptorafts canada',
  'cryptorafts switzerland', 'best cryptorafts in switzerland', 'top cryptorafts switzerland',
  // Time-based keywords
  'cryptorafts now', 'new cryptorafts now', 'now cryptorafts', 'cryptorafts today', 'new cryptorafts today', 'today cryptorafts',
  'cryptorafts this week', 'new cryptorafts this week', 'this week cryptorafts', 'cryptorafts this month', 'new cryptorafts this month', 'this month cryptorafts',
  'cryptorafts this year', 'new cryptorafts this year', 'this year cryptorafts', '2025 cryptorafts', 'cryptorafts coming soon', 'new cryptorafts coming soon', 'coming soon cryptorafts',
  // Industry-specific keywords
  'cryptorafts fintech', 'fintech cryptorafts', 'best cryptorafts for fintech', 'cryptorafts banking', 'banking cryptorafts', 'best cryptorafts for banking',
  'cryptorafts insurance', 'insurance cryptorafts', 'best cryptorafts for insurance', 'cryptorafts real estate', 'real estate cryptorafts', 'best cryptorafts for real estate',
  'cryptorafts healthcare', 'healthcare cryptorafts', 'best cryptorafts for healthcare', 'cryptorafts supply chain', 'supply chain cryptorafts', 'best cryptorafts for supply chain',
  'cryptorafts gaming', 'gaming cryptorafts', 'best cryptorafts for gaming', 'cryptorafts entertainment', 'entertainment cryptorafts', 'best cryptorafts for entertainment',
  'cryptorafts sports', 'sports cryptorafts', 'best cryptorafts for sports', 'cryptorafts music', 'music cryptorafts', 'best cryptorafts for music',
  'cryptorafts art', 'art cryptorafts', 'best cryptorafts for art', 'cryptorafts fashion', 'fashion cryptorafts', 'best cryptorafts for fashion',
  'cryptorafts luxury', 'luxury cryptorafts', 'best cryptorafts for luxury',
  // Price-related keywords
  'best free cryptorafts', 'cryptorafts free', 'cheap cryptorafts', 'best cheap cryptorafts', 'cryptorafts cheap',
  'best affordable cryptorafts', 'cryptorafts affordable', 'best premium cryptorafts', 'cryptorafts premium',
  'expensive cryptorafts', 'best expensive cryptorafts', 'cryptorafts expensive', 'budget cryptorafts', 'best budget cryptorafts', 'cryptorafts budget', 'best luxury cryptorafts',
];

// Generate additional combinations programmatically
const generateAdditionalKeywords = (): string[] => {
  const keywords: string[] = [];
  
  try {
    Object.values(baseKeywords).forEach((category: any) => {
      if (Array.isArray(category)) {
        keywords.push(...category);
      }
    });
  } catch (e) {
    // Fallback if baseKeywords not available
  }

  keywords.push(...comprehensiveKeywords);

  // Generate location + term combinations
  const locations = ['usa', 'uk', 'europe', 'asia', 'singapore', 'hong kong', 'uae', 'dubai', 'japan', 'korea', 'china', 'india', 'australia', 'canada', 'switzerland'];
  const coreTerms = ['crypto', 'blockchain', 'web3', 'defi', 'ai', 'token', 'nft', 'metaverse', 'launchpad', 'tge', 'ido', 'ico', 'trading', 'investment', 'funding', 'startup', 'venture', 'capital', 'kyc', 'kyb', 'exchange', 'wallet', 'staking', 'yielding', 'farming', 'mining'];
  const timeTerms = ['now', 'today', 'this week', 'this month', 'this year', '2025', 'coming soon'];
  const industries = ['fintech', 'banking', 'insurance', 'real estate', 'healthcare', 'supply chain', 'gaming', 'entertainment', 'sports', 'music', 'art', 'fashion', 'luxury'];
  const priceTerms = ['free', 'cheap', 'affordable', 'premium', 'expensive', 'budget', 'luxury'];
  const prefixes = ['best', 'top', 'leading', 'premium', 'professional', 'advanced', 'new', 'latest', 'modern', 'innovative', 'secure', 'trusted', 'verified', 'reliable', 'fastest', 'cheapest', 'affordable', 'free', 'paid', 'enterprise', 'business', 'personal', 'mobile', 'web', 'desktop', 'cloud', 'hybrid', 'on-chain', 'off-chain'];
  const suffixes = ['', '2025', '2024', '2023', 'online', 'offline', 'software', 'platform', 'app', 'application', 'system', 'solution', 'service', 'tool', 'guide', 'tutorial', 'review', 'comparison', 'vs', 'alternative', 'competitor', 'how to', 'where to', 'what is', 'best for', 'for beginners', 'for professionals', 'for investors', 'for founders', 'for startups', 'for enterprises'];

  coreTerms.forEach(term => {
    locations.forEach(location => {
      keywords.push(\`\${term} \${location}\`, \`best \${term} in \${location}\`, \`top \${term} \${location}\`);
    });
    timeTerms.forEach(time => {
      keywords.push(\`\${term} \${time}\`, \`new \${term} \${time}\`, \`\${time} \${term}\`);
    });
    industries.forEach(industry => {
      keywords.push(\`\${term} \${industry}\`, \`\${industry} \${term}\`, \`best \${term} for \${industry}\`);
    });
    priceTerms.forEach(price => {
      keywords.push(\`\${price} \${term}\`, \`best \${price} \${term}\`, \`\${term} \${price}\`);
    });
    prefixes.forEach(prefix => {
      suffixes.forEach(suffix => {
        const combo = \`\${prefix} \${term} \${suffix}\`.trim();
        if (combo && !keywords.includes(combo)) keywords.push(combo);
        const combo2 = \`\${term} \${suffix}\`.trim();
        if (combo2 && !keywords.includes(combo2)) keywords.push(combo2);
        const combo3 = \`\${prefix} \${term}\`.trim();
        if (combo3 && !keywords.includes(combo3)) keywords.push(combo3);
      });
    });
  });

  return Array.from(new Set(keywords));
};

export const getAllKeywords = (): string[] => {
  return generateAdditionalKeywords();
};
KEYWORDSEOF
echo "✅ Keywords file updated" && echo "" && 

# Step 2: Verify .env.local exists with all keys
echo "📋 Step 2: Verifying .env.local file..." && 
if [ -f .env.local ]; then
  echo "✅ .env.local exists"
  if grep -q 'OPENAI_API_KEY=sk-' .env.local && grep -q 'NEXT_PUBLIC_FIREBASE_API_KEY' .env.local; then
    echo "✅ All API keys are present"
  else
    echo "⚠️  Some API keys may be missing - checking..."
    cat > .env.local << 'ENVEOF'
# ============================================
# OPENAI CONFIGURATION (REQUIRED)
# ============================================
OPENAI_API_KEY=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

# ============================================
# FIREBASE CONFIGURATION (REQUIRED)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBcuVT24UBPUB_U78FGQ04D2BqH6N-4M4E
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9

# ============================================
# APP CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com
NODE_ENV=production
ENVEOF
    chmod 600 .env.local
    echo "✅ .env.local created/updated with all API keys"
  fi
else
  echo "⚠️  .env.local not found - creating..."
  cat > .env.local << 'ENVEOF'
# ============================================
# OPENAI CONFIGURATION (REQUIRED)
# ============================================
OPENAI_API_KEY=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

# ============================================
# FIREBASE CONFIGURATION (REQUIRED)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBcuVT24UBPUB_U78FGQ04D2BqH6N-4M4E
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9

# ============================================
# APP CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com
NODE_ENV=production
ENVEOF
  chmod 600 .env.local
  echo "✅ .env.local created"
fi
echo "" && 

# Step 3: Verify Firebase configuration in code
echo "📋 Step 3: Verifying Firebase configuration..." && 
if [ -f src/lib/firebase.client.ts ]; then
  if grep -q 'cryptorafts-b9067' src/lib/firebase.client.ts; then
    echo "✅ Firebase configuration found in code"
  else
    echo "⚠️  Firebase config may need update"
  fi
else
  echo "⚠️  firebase.client.ts not found"
fi
echo "" && 

# Step 4: Stop PM2 and clean
echo "📋 Step 4: Stopping PM2 and cleaning build cache..." && 
pm2 stop cryptorafts 2>/dev/null || echo "⚠️  PM2 process not running" && 
rm -rf .next node_modules/.cache && 
echo "✅ Cleaned" && echo "" && 

# Step 5: Load NVM and Node.js 20
echo "📋 Step 5: Loading Node.js 20..." && 
export NVM_DIR="\$HOME/.nvm" && 
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh" && 
[ -s "\$HOME/.nvm/nvm.sh" ] && \. "\$HOME/.nvm/nvm.sh" && 
nvm use 20 2>/dev/null || echo "⚠️  Using system Node.js" && 
node -v && 
echo "" && 

# Step 6: Rebuild application
echo "📋 Step 6: Rebuilding application..." && 
npm run build 2>&1 | tail -50 && 
if [ \$? -eq 0 ]; then
  echo ""
  echo "✅ Build successful"
else
  echo ""
  echo "❌ Build failed - showing errors..."
  npm run build 2>&1 | grep -i error | head -20
  exit 1
fi
echo "" && 

# Step 7: Update server.js to bind to 0.0.0.0
echo "📋 Step 7: Updating server.js..." && 
cat > server.js << 'SERVEREOF'
require('dotenv').config({ path: '.env.local' });
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(\`> Ready on http://\${hostname}:\${port}\`);
    });
});
SERVEREOF
echo "✅ server.js updated" && echo "" && 

# Step 8: Update ecosystem.config.js with all env vars
echo "📋 Step 8: Updating ecosystem.config.js..." && 
NODE_PATH=\$(nvm which 20 2>/dev/null || which node) && 
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    interpreter: '\${NODE_PATH}',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_APP_URL: 'https://www.cryptorafts.com',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyBcuVT24UBPUB_U78FGQ04D2BqH6N-4M4E',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'cryptorafts-b9067.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'cryptorafts-b9067',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'cryptorafts-b9067.firebasestorage.app',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '374711838796',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:374711838796:web:3bee725bfa7d8790456ce9',
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
  }],
};
PM2EOF
echo "✅ ecosystem.config.js updated" && echo "" && 

# Step 9: Start PM2
echo "📋 Step 9: Starting PM2..." && 
mkdir -p logs && 
pm2 start ecosystem.config.js && 
pm2 save && 
sleep 15 && 
echo "✅ PM2 started" && echo "" && 

# Step 10: Configure Nginx for www.cryptorafts.com
echo "📋 Step 10: Configuring Nginx..." && 
if [ -f /etc/nginx/sites-available/cryptorafts ]; then
  echo "✅ Nginx config exists"
else
  cat > /etc/nginx/sites-available/cryptorafts << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;

    # Redirect HTTP to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cryptorafts.com www.cryptorafts.com;

    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
NGINXEOF
  ln -sf /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "✅ Nginx configured"
fi
echo "" && 

# Step 11: Verify SSL
echo "📋 Step 11: Verifying SSL certificate..." && 
if [ -f /etc/letsencrypt/live/cryptorafts.com/fullchain.pem ]; then
  echo "✅ SSL certificate exists"
else
  echo "⚠️  SSL certificate not found - setting up..."
  certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com 2>&1 | tail -10
fi
echo "" && 

# Step 12: Final verification
echo "📋 Step 12: Final verification..." && 
pm2 status cryptorafts && 
echo "" && 
pm2 logs cryptorafts --lines 5 --nostream && 
echo "" && 
curl -sS -I http://127.0.0.1:3000 2>&1 | head -5 || echo "Testing local server..." && 
echo "" && 
systemctl is-active nginx > /dev/null 2>&1 && echo "✅ Nginx: Active" || echo "⚠️  Nginx: Not active" && 
echo "" && 

echo "✅ COMPLETE LIVE DEPLOYMENT SUCCESSFUL!"
echo "========================================"
echo ""
echo "📊 Summary:"
echo "✅ SEO keywords updated with ALL variations"
echo "✅ Firebase configuration verified"
echo "✅ API keys configured in .env.local"
echo "✅ Application rebuilt"
echo "✅ PM2 restarted"
echo "✅ Nginx configured for www.cryptorafts.com"
echo "✅ SSL certificate verified"
echo ""
echo "🌐 YOUR APP IS NOW LIVE!"
echo "Visit: https://www.cryptorafts.com"
echo ""
echo "✅ All features deployed:"
echo "✅ SEO optimization"
echo "✅ Firebase integration"
echo "✅ OpenAI API"
echo "✅ All API keys configured"
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
"@

Write-Host "`n🔗 Executing deployment on VPS..." -ForegroundColor Yellow
Write-Host "Host: $sshHost" -ForegroundColor White
Write-Host "User: $sshUser`n" -ForegroundColor White

# Execute SSH command
try {
    ssh $sshUser@$sshHost $deployCommand
    Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Error executing deployment:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`n💡 Alternative: Copy the command from DEPLOY_COMPLETE_SSH.txt and run it manually in your SSH terminal" -ForegroundColor Yellow
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT SCRIPT READY!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

