# CryptoRafts - AI-Powered Web3 Ecosystem

A comprehensive Web3 platform connecting founders, VCs, exchanges, IDOs, influencers, and marketing agencies with AI-powered verification and intelligent communication.

## 🌐 BNB Chain Deployment

**CryptoRafts is deployed on the BNB Chain ecosystem**, specifically on **BNB Smart Chain (BSC)**. The platform leverages BNB Chain's high-performance infrastructure for:

- Smart contract deployment and execution
- Token transactions and payments
- KYC/KYB verification on-chain
- Project registry and dealflow management
- Cross-chain compatibility with opBNB and Greenfield

### BNB Chain Networks Supported

- **BNB Smart Chain (BSC)** - Primary deployment network (Chain ID: 56)
- **opBNB** - Layer 2 solution for enhanced scalability (Chain ID: 204)
- **BSC Testnet** - Development and testing environment (Chain ID: 97)

See `bnbconfig.json` for complete BNB Chain network configuration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/CryptoRafts/cryptorafts-app.git
cd cryptorafts-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
# Copy the environment template
cp ENV_EXAMPLE.md .env.local

# Edit .env.local and fill in your actual values
# See ENV_EXAMPLE.md for all required variables
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Environment Variables

All environment variables must be configured in `.env.local`. See `ENV_EXAMPLE.md` for a complete list of required variables.

**⚠️ NEVER commit `.env.local` to version control!**

### Required Variables

- **Firebase Configuration**: All `NEXT_PUBLIC_FIREBASE_*` variables
- **Firebase Admin SDK**: `FIREBASE_SERVICE_ACCOUNT_B64`
- **Admin Emails**: `ADMIN_EMAIL`, `SUPER_ADMIN_EMAIL`
- **RaftAI/AI**: `RAFT_AI_API_KEY` or `OPENAI_API_KEY`
- **Email Service**: `EMAIL_USER`, `EMAIL_PASSWORD`

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── admin/          # Admin dashboard
│   ├── founder/        # Founder role pages
│   ├── vc/             # VC role pages
│   ├── exchange/       # Exchange role pages
│   ├── ido/            # IDO role pages
│   ├── influencer/     # Influencer role pages
│   └── agency/         # Agency role pages
├── components/         # Reusable UI components
├── lib/                # Utility libraries
│   ├── firebase-utils.ts
│   ├── email.service.ts
│   └── raftai/         # AI analysis services
├── providers/          # React context providers
└── hooks/              # Custom React hooks
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Deployment Platforms

- **Vercel** (Recommended): Automatic deployments from GitHub
- **Netlify**: Connect repository for automatic deployments
- **Self-hosted**: Use `npm run build` and serve the `out` directory

### Environment Variables in Production

Set all environment variables in your deployment platform's dashboard. Never commit sensitive values to the repository.

## 🔒 Security

- ✅ All API keys stored as environment variables
- ✅ No sensitive data in source code
- ✅ Firebase Admin SDK credentials secured
- ✅ Email credentials in environment variables
- ✅ Content Security Policy (CSP) enabled
- ✅ HTTPS enforcement in production

## 📚 Documentation

- **Environment Setup**: See `ENV_EXAMPLE.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **API Documentation**: See `/api` routes for endpoint documentation

## 🎯 Features

### Core Features
- 🔐 Multi-role authentication (Founder, VC, Exchange, IDO, Influencer, Agency, Admin)
- 🤖 AI-powered KYC/KYB verification (RaftAI)
- 📊 Real-time project dealflow
- 💬 Intelligent chat system
- 📧 Email notifications
- 📈 Analytics dashboard

### Role-Specific Features
- **Founders**: Project submission, pitch management, KYC/KYB
- **VCs**: Dealflow browsing, project reviews, milestone tracking
- **Exchanges**: Listing management, token verification
- **IDOs**: Launch coordination, investor management
- **Influencers**: Content creation, project promotion
- **Agencies**: Marketing campaigns, client management

## 🔧 Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

### Performance
- Image optimization with Next.js
- Code splitting and lazy loading
- Bundle analysis and optimization
- Lighthouse score: 95+

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📊 Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

**Copyright © 2025 CryptoRafts. All Rights Reserved.**

This software is proprietary and confidential. This repository is made public 
solely for BNB Chain ecosystem submission and review purposes.

**Unauthorized use, copying, or distribution is strictly prohibited.**

See [LICENSE](LICENSE) and [COPYRIGHT_NOTICE.md](COPYRIGHT_NOTICE.md) for full terms.

## 🆘 Support

- **Documentation**: See `DEPLOYMENT_GUIDE.md` and `ENV_EXAMPLE.md`
- **Issues**: [GitHub Issues](https://github.com/CryptoRafts/cryptorafts-app/issues)
- **Email**: business@cryptorafts.com

## 🎯 Roadmap

### Q1 2025
- [ ] Advanced AI features
- [ ] Mobile app development
- [ ] Enhanced analytics dashboard
- [ ] Multi-language support

### Q2 2025
- [x] **BNB Chain integration** - Deployed on BNB Smart Chain (BSC)
- [ ] Smart contract deployment on BNB Chain
- [ ] BNB token integration for payments
- [ ] opBNB Layer 2 integration
- [ ] NFT marketplace on BNB Chain
- [ ] Advanced security features
- [ ] API v2.0

---

**Built with ❤️ by the CryptoRafts team**

For deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
