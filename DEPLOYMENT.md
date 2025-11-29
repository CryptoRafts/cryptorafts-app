# Deployment Guide

## 🚀 Staging Deployment

### Prerequisites
- Vercel account (recommended) or your preferred hosting platform
- Firebase project configured
- Environment variables set up

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy to Staging**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Alternative: Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   npm run export
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `out`

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY . .
   COPY --from=deps /app/node_modules ./node_modules
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Build and run**
   ```bash
   docker build -t cryptorafts .
   docker run -p 3000:3000 cryptorafts
   ```

## 🔧 Production Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_prod_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_prod_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_prod_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_prod_app_id
   ```

2. **Security Headers**
   Add to `next.config.js`:
   ```javascript
   const securityHeaders = [
     {
       key: 'X-DNS-Prefetch-Control',
       value: 'on'
     },
     {
       key: 'Strict-Transport-Security',
       value: 'max-age=63072000; includeSubDomains; preload'
     },
     {
       key: 'X-XSS-Protection',
       value: '1; mode=block'
     },
     {
       key: 'X-Frame-Options',
       value: 'SAMEORIGIN'
     },
     {
       key: 'X-Content-Type-Options',
       value: 'nosniff'
     },
     {
       key: 'Referrer-Policy',
       value: 'origin-when-cross-origin'
     }
   ]

   module.exports = {
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: securityHeaders,
         },
       ]
     },
   }
   ```

### Performance Optimization

1. **Image Optimization**
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       domains: ['your-domain.com'],
       formats: ['image/webp', 'image/avif'],
     },
   }
   ```

2. **Bundle Analysis**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```

3. **Enable Compression**
   ```bash
   npm install --save-dev compression
   ```

## 📊 Monitoring & Analytics

### Performance Monitoring

1. **Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```

2. **Google Analytics**
   ```bash
   npm install gtag
   ```

### Error Tracking

1. **Sentry Setup**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure Sentry**
   ```javascript
   // sentry.client.config.js
   import * as Sentry from '@sentry/nextjs'

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 1.0,
   })
   ```

## 🔍 Health Checks

### API Health Check
```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  })
}
```

### Database Health Check
```javascript
// pages/api/health/db.js
import { db } from '@/lib/firebase.client'

export default async function handler(req, res) {
  try {
    // Test database connection
    await db.collection('health').doc('test').get()
    res.status(200).json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message })
  }
}
```

## 🚨 Rollback Strategy

### Quick Rollback
```bash
# Vercel
vercel rollback [deployment-url]

# Docker
docker run -p 3000:3000 cryptorafts:previous-version
```

### Database Rollback
```bash
# Firebase
firebase deploy --only firestore:rules
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement CDN (Cloudflare, AWS CloudFront)
- Database read replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies

## 🔐 Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database rules properly configured
- [ ] API rate limiting implemented
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

## 📱 Mobile Optimization

- [ ] Responsive design tested
- [ ] Touch targets ≥ 44px
- [ ] Viewport meta tag configured
- [ ] Mobile performance optimized
- [ ] PWA features implemented

## ♿ Accessibility Checklist

- [ ] WCAG AA compliance
- [ ] Screen reader testing
- [ ] Keyboard navigation
- [ ] Color contrast validation
- [ ] Alt text for images
- [ ] ARIA labels implemented

---

**Staging URL**: https://cryptorafts-staging.vercel.app
**Production URL**: https://cryptorafts.com
