# RaftAI Microservice

A Node.js/Express microservice for KYC/KYB verification, pitch analysis, and AI-powered chat functionality for the Cryptorafts platform.

## Features

- **KYC Processing**: Individual identity verification with face matching and liveness detection
- **KYB Processing**: Organization verification with document validation
- **Pitch Analysis**: AI-powered project evaluation and scoring
- **Chat Commands**: Structured AI responses for various commands
- **Compliance Checking**: Content moderation and regulatory compliance
- **Scoring Services**: Listing readiness, liquidity needs, and reputation scoring
- **IDO Intake**: Initial DEX Offering validation and risk assessment

## Architecture

- **Express.js** with TypeScript
- **Zod** for input validation and type safety
- **Firebase Admin SDK** for Firestore integration
- **HMAC** webhook verification
- **Idempotency** support for state-changing operations
- **Rate limiting** and security middleware
- **Structured logging** with Winston

## Environment Setup

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

### Required Environment Variables

```env
# Server
PORT=8080
NODE_ENV=production

# Authentication
RAFTAI_API_KEY=your-secure-api-key
RAFTAI_SIGNING_SECRET=your-hmac-secret

# Firebase
FIREBASE_PROJECT_ID=cryptorafts-b9067
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# KYC/KYB Providers
KYC_VENDOR=sumsub
SUMSUB_APP_TOKEN=your-sumsub-token
SUMSUB_SECRET=your-sumsub-secret

# AI/LLM Providers
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-key
LLM_MODEL=gpt-4o-mini

# Security
MOCK_MODE=false
ALLOW_SEEDING=false
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /healthz` - Service health and provider status

### KYC/KYB Processing
- `POST /processKYC` - Individual identity verification
- `POST /processKYB` - Organization verification

### Pitch Analysis
- `POST /analyzePitch` - Project evaluation and scoring

### Chat & AI
- `POST /chat` - AI-powered chat commands
- `POST /compliance` - Content compliance checking

### Scoring Services
- `POST /scores/listing` - Listing readiness score
- `POST /scores/liquidity` - Liquidity need assessment
- `POST /scores/reputation` - Influencer reputation score

### IDO Services
- `POST /ido` - IDO intake validation

## Authentication

All endpoints (except `/healthz`) require:
```
Authorization: Bearer <RAFTAI_API_KEY>
```

## Idempotency

State-changing operations require:
```
Idempotency-Key: <unique-key>
```

## Webhook Verification

Webhook endpoints verify HMAC signatures:
```
X-Signature-SHA256: <hmac-signature>
```

## Error Handling

All errors return structured JSON:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Restricted to configured origins
- **Helmet**: Security headers
- **Input Validation**: Zod schemas for all inputs
- **HMAC Verification**: Webhook signature validation
- **Idempotency**: Prevents duplicate operations
- **Audit Logging**: All decisions logged to Firestore

## Monitoring

- **Health Checks**: `/healthz` endpoint for monitoring
- **Structured Logging**: JSON logs with correlation IDs
- **Metrics**: Request timing and error rates
- **Audit Trail**: All decisions stored in Firestore

## Development Notes

- Uses ES modules (`"type": "module"`)
- TypeScript with strict type checking
- No mock data in production (`MOCK_MODE=false`)
- All providers are pluggable via environment variables
- Firebase Admin SDK for server-side operations
- Comprehensive error handling and logging

## Testing

```bash
npm test
```

## Deployment

1. Set environment variables
2. Build the application: `npm run build`
3. Start the service: `npm start`
4. Configure reverse proxy (nginx/traefik)
5. Set up monitoring and health checks

## Integration

The service integrates with:
- **Next.js Web App**: Via API proxy routes
- **Firebase**: For data persistence and user management
- **External Providers**: KYC/KYB vendors, LLM services
- **Monitoring**: Health checks and structured logging
