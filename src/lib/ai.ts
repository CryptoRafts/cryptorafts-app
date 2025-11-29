// AI Service Configuration and Utilities
export const AI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || "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",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4",
  maxTokens: 2000,
  temperature: 0.7,
};

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PitchAnalysis {
  rating: "High" | "Normal" | "Low";
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskFactors: string[];
  marketFit: number;
  teamScore: number;
  tokenomicsScore: number;
  technicalScore: number;
}

export interface MarketInsight {
  trend: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  keyPoints: string[];
  recommendations: string[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

// AI Service Functions
export class AIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = AI_CONFIG.apiKey;
    this.baseURL = AI_CONFIG.baseURL;
  }

  private async makeRequest(endpoint: string, data: any): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        usage: result.usage,
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async analyzePitch(pitchData: {
    title: string;
    summary: string;
    sector: string;
    chain: string;
    stage: string;
    tokenomics: any;
  }): Promise<PitchAnalysis> {
    const prompt = `
Analyze this crypto project pitch and provide a comprehensive assessment:

Project: ${pitchData.title}
Summary: ${pitchData.summary}
Sector: ${pitchData.sector}
Blockchain: ${pitchData.chain}
Stage: ${pitchData.stage}
Tokenomics: ${JSON.stringify(pitchData.tokenomics)}

Please provide a JSON response with the following structure:
{
  "rating": "High|Normal|Low",
  "score": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["rec1", "rec2"],
  "riskFactors": ["risk1", "risk2"],
  "marketFit": 0-100,
  "teamScore": 0-100,
  "tokenomicsScore": 0-100,
  "technicalScore": 0-100
}

Focus on:
- Market opportunity and competitive advantage
- Technical feasibility and innovation
- Tokenomics design and sustainability
- Team capabilities and track record
- Risk assessment and mitigation
- Overall investment potential
`;

    const response = await this.makeRequest("/chat/completions", {
      model: AI_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are a crypto investment analyst with expertise in DeFi, blockchain technology, and tokenomics. Provide objective, data-driven analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    });

    if (response.success && response.data?.choices?.[0]?.message?.content) {
      try {
        const analysis = JSON.parse(response.data.choices[0].message.content);
        return analysis as PitchAnalysis;
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return this.getDefaultPitchAnalysis();
      }
    }

    return this.getDefaultPitchAnalysis();
  }

  async getMarketInsights(query: string): Promise<MarketInsight> {
    const prompt = `
Provide market insights for the crypto sector based on this query: "${query}"

Please provide a JSON response with:
{
  "trend": "brief trend description",
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0-100,
  "keyPoints": ["point1", "point2"],
  "recommendations": ["rec1", "rec2"]
}

Focus on current market conditions, regulatory developments, and investment opportunities.
`;

    const response = await this.makeRequest("/chat/completions", {
      model: AI_CONFIG.model,
      messages: [
        {
          role: "system",
          content: "You are a crypto market analyst providing real-time insights and investment recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    });

    if (response.success && response.data?.choices?.[0]?.message?.content) {
      try {
        const insight = JSON.parse(response.data.choices[0].message.content);
        return insight as MarketInsight;
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return this.getDefaultMarketInsight();
      }
    }

    return this.getDefaultMarketInsight();
  }

  async chatWithAI(messages: ChatMessage[]): Promise<string> {
    const response = await this.makeRequest("/chat/completions", {
      model: AI_CONFIG.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    });

    if (response.success && response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    }

    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }

  private getDefaultPitchAnalysis(): PitchAnalysis {
    return {
      rating: "Normal",
      score: 65,
      strengths: ["Solid concept", "Clear value proposition"],
      weaknesses: ["Limited information provided", "Unclear execution plan"],
      recommendations: ["Provide more detailed roadmap", "Clarify tokenomics"],
      riskFactors: ["Market volatility", "Regulatory uncertainty"],
      marketFit: 70,
      teamScore: 60,
      tokenomicsScore: 65,
      technicalScore: 70,
    };
  }

  private getDefaultMarketInsight(): MarketInsight {
    return {
      trend: "Market showing mixed signals with continued institutional adoption",
      sentiment: "neutral",
      confidence: 75,
      keyPoints: ["Institutional adoption continues", "Regulatory clarity improving"],
      recommendations: ["Diversify portfolio", "Focus on fundamentals"],
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
