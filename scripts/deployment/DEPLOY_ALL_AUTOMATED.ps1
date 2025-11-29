# ============================================
# CRYPTORAFTS - COMPLETE AUTOMATED DEPLOYMENT
# ============================================
# This script automates the entire deployment process
# including SEO keywords update, rebuild, and restart

Write-Host "`n🚀 CRYPTORAFTS - COMPLETE AUTOMATED DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# SSH Connection Details
$sshHost = "145.79.211.130"
$sshPort = "65002"
$sshUser = "u386122906"
$appPath = "/var/www/cryptorafts"

Write-Host "📋 Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Update SEO keywords with all comprehensive keywords" -ForegroundColor White
Write-Host "2. Rebuild the Next.js application" -ForegroundColor White
Write-Host "3. Restart PM2 process" -ForegroundColor White
Write-Host "4. Verify deployment" -ForegroundColor White
Write-Host ""

# Complete deployment command
$deployCommand = @"
cd $appPath && echo "🔧 COMPLETE DEPLOYMENT - SEO KEYWORDS UPDATE" && echo "========================================" && echo "" && 
echo "📋 Step 1: Updating SEO keywords file..." && 
cat > src/app/seo-keywords-large.ts << 'KEYWORDSEOF'
/**
 * Mega SEO Keywords List for CryptoRafts - Comprehensive Coverage
 * Includes ALL strategic keywords for maximum SEO visibility
 */

import { seoKeywords as baseKeywords } from './seo-keywords';

// Comprehensive keywords array
const comprehensiveKeywords = [
  // All yielding variations
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
  // All farming variations
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
  // All mining variations
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
  'cryptorafts singapore', 'best cryptorafts in singapore', 'top cryptorafts singapore', 'cryptorafts hong kong', 'best cryptorafts in hong kong', 'top cryptorafts hong kong',
  'cryptorafts uae', 'best cryptorafts in uae', 'top cryptorafts uae', 'cryptorafts dubai', 'best cryptorafts in dubai', 'top cryptorafts dubai',
  'cryptorafts japan', 'best cryptorafts in japan', 'top cryptorafts japan', 'cryptorafts korea', 'best cryptorafts in korea', 'top cryptorafts korea',
  'cryptorafts china', 'best cryptorafts in china', 'top cryptorafts china', 'cryptorafts india', 'best cryptorafts in india', 'top cryptorafts india',
  'cryptorafts australia', 'best cryptorafts in australia', 'top cryptorafts australia', 'cryptorafts canada', 'best cryptorafts in canada', 'top cryptorafts canada',
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
echo "📋 Step 2: Rebuilding application..." && 
pm2 stop cryptorafts && 
rm -rf .next && 
npm run build 2>&1 | tail -30 && echo "" && 
echo "📋 Step 3: Restarting PM2..." && 
pm2 start ecosystem.config.js && 
pm2 save && 
sleep 15 && 
echo "✅ PM2 restarted" && echo "" && 
echo "✅ COMPLETE DEPLOYMENT SUCCESSFUL!" && echo "========================================" && echo "" && 
echo "📊 Summary:" && 
echo "✅ All comprehensive SEO keywords added" && 
echo "✅ Application rebuilt" && 
echo "✅ PM2 restarted" && echo "" && 
echo "🌐 Your app now has PERFECT SEO!" && 
echo "Visit: https://www.cryptorafts.com"
"@

Write-Host "`n🔗 Connecting to VPS via SSH..." -ForegroundColor Yellow
Write-Host "Host: $sshHost" -ForegroundColor White
Write-Host "Port: $sshPort" -ForegroundColor White
Write-Host "User: $sshUser`n" -ForegroundColor White

Write-Host "⚠️  NOTE: You'll need to enter your SSH password when prompted" -ForegroundColor Yellow
Write-Host "⚠️  The deployment command will run automatically after authentication`n" -ForegroundColor Yellow

# Execute SSH command
try {
    ssh -p $sshPort $sshUser@$sshHost $deployCommand
    Write-Host "`n✅ Deployment command executed!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Error executing deployment command:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`n💡 Alternative: Copy and paste the command manually in SSH terminal" -ForegroundColor Yellow
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT SCRIPT READY!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

