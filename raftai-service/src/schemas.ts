import { z } from 'zod';

// KYC Input Schema
export const KycInput = z.object({
  userId: z.string(),
  vendorRef: z.string().optional(),
  ids: z.array(z.object({ 
    type: z.enum(["passport","driver_license","national_id"]), 
    url: z.string().url() 
  })).optional(),
  proofOfAddressUrl: z.string().url().optional(),
  selfieUrl: z.string().url().optional(),
  livenessScore: z.number().min(0).max(1).optional(),
  faceMatchScore: z.number().min(0).max(1).optional()
});

// Decision Schema
export const Decision = z.object({
  status: z.enum(["approved","pending","rejected"]),
  riskScore: z.number().int().min(0).max(100),
  reasons: z.array(z.string())
});

// KYB Input Schema
export const KybInput = z.object({
  orgId: z.string(),
  name: z.string(),
  jurisdiction: z.string(),
  registrationNumber: z.string().optional(),
  directors: z.array(z.object({ 
    name: z.string(), 
    dob: z.string().optional() 
  })).optional(),
  docs: z.array(z.object({ 
    kind: z.enum(["registration","bylaws","shareholders","financials"]), 
    url: z.string().url() 
  }))
});

// Pitch Input Schema
export const PitchInput = z.object({
  projectId: z.string(),
  title: z.string(),
  sector: z.string(),
  chain: z.string(),
  stage: z.string(),
  summary: z.string().max(2000),
  tokenomics: z.object({
    totalSupply: z.number().positive(),
    tge: z.string().optional(),
    vesting: z.array(z.object({ 
      pool: z.string(), 
      percent: z.number(), 
      cliffMonths: z.number().int(), 
      vestMonths: z.number().int() 
    }))
  }),
  docs: z.array(z.object({ 
    name: z.string(), 
    url: z.string().url() 
  }))
});

// Pitch Decision Schema
export const PitchDecision = z.object({
  rating: z.enum(["High","Normal","Low"]),
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  risks: z.array(z.string()),
  recs: z.array(z.string())
});

// Chat Input Schema
export const ChatInput = z.object({
  command: z.enum(["summarize","risks","brief","draft","action-items","decisions","translate","compliance","redact"]),
  text: z.string().max(8000),
  projectId: z.string().optional(),
  lang: z.string().optional(),
  tone: z.enum(["polite","firm","neutral"]).optional()
});

// Chat Output Schema
export const ChatOutput = z.object({
  ok: z.literal(true),
  result: z.string(),
  citations: z.array(z.object({ 
    title: z.string(), 
    url: z.string().url() 
  })).optional()
});

// Listing Input/Output Schemas
export const ListingInput = z.object({ projectId: z.string() });
export const ListingOutput = z.object({
  readinessScore: z.number().int().min(0).max(100),
  status: z.enum(["Ready","Not Ready"]),
  missing: z.array(z.string())
});

// Liquidity Input/Output Schemas
export const LiquidityInput = z.object({ projectId: z.string() });
export const LiquidityOutput = z.object({
  liquidityNeed: z.enum(["High","Medium","Low"]),
  score: z.number().int().min(0).max(100),
  reasons: z.array(z.string())
});

// Reputation Input/Output Schemas
export const ReputationInput = z.object({ handle: z.string() });
export const ReputationOutput = z.object({
  score: z.number().int().min(0).max(100),
  label: z.enum(["Excellent","Good","Fair","Poor"]),
  reasons: z.array(z.string())
});

// Compliance Input/Output Schemas
export const ComplianceInput = z.object({ text: z.string().max(4000) });
export const ComplianceOutput = z.object({
  flags: z.array(z.string()),
  severity: z.enum(["none","low","medium","high"])
});

// IDO Input/Output Schemas
export const IdoInput = z.object({
  projectId: z.string(),
  token: z.object({
    symbol: z.string(),
    supply: z.number().positive(),
    salePrice: z.number().positive(),
    hardCap: z.number().positive(),
    whitelist: z.boolean()
  }),
  jurisdiction: z.string()
});

export const IdoOutput = z.object({
  ok: z.literal(true),
  issues: z.array(z.string()),
  riskScore: z.number().int().min(0).max(100)
});

// Type exports
export type KycInputType = z.infer<typeof KycInput>;
export type DecisionType = z.infer<typeof Decision>;
export type KybInputType = z.infer<typeof KybInput>;
export type PitchInputType = z.infer<typeof PitchInput>;
export type PitchDecisionType = z.infer<typeof PitchDecision>;
export type ChatInputType = z.infer<typeof ChatInput>;
export type ChatOutputType = z.infer<typeof ChatOutput>;
export type ListingInputType = z.infer<typeof ListingInput>;
export type ListingOutputType = z.infer<typeof ListingOutput>;
export type LiquidityInputType = z.infer<typeof LiquidityInput>;
export type LiquidityOutputType = z.infer<typeof LiquidityOutput>;
export type ReputationInputType = z.infer<typeof ReputationInput>;
export type ReputationOutputType = z.infer<typeof ReputationOutput>;
export type ComplianceInputType = z.infer<typeof ComplianceInput>;
export type ComplianceOutputType = z.infer<typeof ComplianceOutput>;
export type IdoInputType = z.infer<typeof IdoInput>;
export type IdoOutputType = z.infer<typeof IdoOutput>;
