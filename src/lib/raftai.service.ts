// Client-side RaftAI service

// Simple mock crypto for client-side (in production, use proper crypto)
const crypto = {
  randomUUID: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
};

export interface RaftAIRequest {
  type: 'pitch_analysis' | 'deal_analysis' | 'compliance_check' | 'risk_assessment' | 'chat';
  userId: string;
  role: string;
  data: any;
  context?: any;
}

export interface RaftAIResponse {
  success: boolean;
  result?: any;
  analysis?: {
    score: number;
    confidence: number;
    insights: string[];
    risks: string[];
    recommendations: string[];
  };
  error?: string;
  idempotencyKey?: string;
}

export interface DealRoomData {
  type: 'vc_deal' | 'exchange_listing' | 'ido_launch' | 'influencer_campaign' | 'agency_proposal';
  participants: string[];
  projectId?: string;
  metadata: any;
}

class RaftAIService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor() {
    this.apiUrl = process.env.RAFTAI_API_URL || 'http://localhost:3001/api/raftai';
    this.apiKey = process.env.RAFTAI_API_KEY || '';
    this.webhookSecret = process.env.RAFTAI_WEBHOOK_SECRET || '';
  }

  // Generate idempotency key
  private generateIdempotencyKey(type: string, userId: string, data: any): string {
    const dataString = JSON.stringify(data);
    // Simple hash for browser compatibility
    const input = `${type}_${userId}_${dataString}_${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 32);
  }

  // Analyze pitch
  public async analyzePitch(userId: string, pitchData: {
    title: string;
    description: string;
    problem: string;
    solution: string;
    market: string;
    businessModel: string;
    team: any[];
    funding: {
      amount: number;
      use: string;
    };
    timeline: string;
    documents?: any[];
  }): Promise<RaftAIResponse> {
    try {
      const idempotencyKey = this.generateIdempotencyKey('pitch_analysis', userId, pitchData);
      
      const request: RaftAIRequest = {
        type: 'pitch_analysis',
        userId,
        role: 'founder',
        data: pitchData,
        context: {
          timestamp: new Date().toISOString(),
          idempotencyKey
        }
      };

      const response = await this.makeRequest('/analyze/pitch', request, idempotencyKey);
      return response;
    } catch (error) {
      console.error('Error analyzing pitch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Analyze deal for VCs
  public async analyzeDeal(userId: string, dealData: {
    projectId: string;
    pitchData: any;
    marketData: any;
    teamData: any;
    financialProjections: any;
    competitiveAnalysis: any;
  }): Promise<RaftAIResponse> {
    try {
      const idempotencyKey = this.generateIdempotencyKey('deal_analysis', userId, dealData);
      
      const request: RaftAIRequest = {
        type: 'deal_analysis',
        userId,
        role: 'vc',
        data: dealData,
        context: {
          timestamp: new Date().toISOString(),
          idempotencyKey
        }
      };

      const response = await this.makeRequest('/analyze/deal', request, idempotencyKey);
      return response;
    } catch (error) {
      console.error('Error analyzing deal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Compliance check
  public async complianceCheck(userId: string, checkData: {
    type: 'kyc' | 'kyb' | 'aml' | 'sanctions';
    userData?: any;
    companyData?: any;
    transactionData?: any;
  }): Promise<RaftAIResponse> {
    try {
      const idempotencyKey = this.generateIdempotencyKey('compliance_check', userId, checkData);
      
      const request: RaftAIRequest = {
        type: 'compliance_check',
        userId,
        role: 'compliance',
        data: checkData,
        context: {
          timestamp: new Date().toISOString(),
          idempotencyKey
        }
      };

      const response = await this.makeRequest('/compliance/check', request, idempotencyKey);
      return response;
    } catch (error) {
      console.error('Error in compliance check:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Risk assessment
  public async riskAssessment(userId: string, riskData: {
    type: 'project' | 'deal' | 'transaction' | 'user';
    data: any;
    context: any;
  }): Promise<RaftAIResponse> {
    try {
      const idempotencyKey = this.generateIdempotencyKey('risk_assessment', userId, riskData);
      
      const request: RaftAIRequest = {
        type: 'risk_assessment',
        userId,
        role: 'risk',
        data: riskData,
        context: {
          timestamp: new Date().toISOString(),
          idempotencyKey
        }
      };

      const response = await this.makeRequest('/risk/assess', request, idempotencyKey);
      return response;
    } catch (error) {
      console.error('Error in risk assessment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Chat with RaftAI
  public async chat(userId: string, message: string, context?: any): Promise<RaftAIResponse> {
    try {
      const idempotencyKey = this.generateIdempotencyKey('chat', userId, { message, context });
      
      // Simple mock response for now
      const mockResponse = `I'm RaftAI, your Web3 assistant. I received your message: "${message}". I'm here to help with crypto investments, pitch analysis, compliance checks, and more. How can I assist you today?`;
      
      return {
        success: true,
        result: {
          message: mockResponse,
          type: 'chat',
          timestamp: new Date().toISOString(),
          context: context
        },
        idempotencyKey
      };
    } catch (error) {
      console.error('Error in RaftAI chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generic text analysis helper used by chat AI service
  public async analyzeText(prompt: string, options?: { userId?: string; context?: any }): Promise<any> {
    const userId = options?.userId ?? 'system';
    const response = await this.chat(userId, prompt, options?.context);

    if (!response.success) {
      throw new Error(response.error || 'Text analysis failed');
    }

    const message = response.result?.message || '';
    return {
      text: message,
      summary: message,
      risks: message,
      draft: message,
      actionItems: message,
      translation: message,
      compliance: message,
      redactions: message,
      brief: message
    };
  }

  // Create deal room
  public async createDealRoom(dealRoomData: DealRoomData): Promise<RaftAIResponse> {
    try {
      const idempotencyKey = this.generateIdempotencyKey('deal_room', 'system', dealRoomData);
      
      const request = {
        type: 'create_deal_room',
        data: dealRoomData,
        context: {
          timestamp: new Date().toISOString(),
          idempotencyKey
        }
      };

      const response = await this.makeRequest('/deal-room/create', request, idempotencyKey);
      return response;
    } catch (error) {
      console.error('Error creating deal room:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Process webhook
  public async processWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        throw new Error('Invalid webhook signature');
      }

      const { type, userId, result, analysis } = payload;

      // Process based on type
      switch (type) {
        case 'pitch_analysis_complete':
          await this.handlePitchAnalysisComplete(userId, result, analysis);
          break;
        case 'deal_analysis_complete':
          await this.handleDealAnalysisComplete(userId, result, analysis);
          break;
        case 'compliance_check_complete':
          await this.handleComplianceCheckComplete(userId, result, analysis);
          break;
        case 'risk_assessment_complete':
          await this.handleRiskAssessmentComplete(userId, result, analysis);
          break;
        default:
          console.log('Unknown webhook type:', type);
      }
    } catch (error) {
      console.error('Error processing RaftAI webhook:', error);
      throw error;
    }
  }

  // Verify webhook signature
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  // Make API request
  private async makeRequest(endpoint: string, data: any, idempotencyKey: string): Promise<RaftAIResponse> {
    try {
      // Mock response for development
      const mockResult = {
        success: true,
        result: `Mock response for ${endpoint}`,
        analysis: {
          score: 85,
          confidence: 0.9,
          insights: ['Mock insight 1', 'Mock insight 2'],
          risks: ['Mock risk 1'],
          recommendations: ['Mock recommendation 1']
        },
        idempotencyKey
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return mockResult;
    } catch (error) {
      console.error('RaftAI API request failed:', error);
      throw error;
    }
  }

  // Handle pitch analysis completion
  private async handlePitchAnalysisComplete(userId: string, result: any, analysis: any): Promise<void> {
    // Implementation for handling pitch analysis completion
    console.log('Pitch analysis completed for user:', userId, result, analysis);
  }

  // Handle deal analysis completion
  private async handleDealAnalysisComplete(userId: string, result: any, analysis: any): Promise<void> {
    // Implementation for handling deal analysis completion
    console.log('Deal analysis completed for user:', userId, result, analysis);
  }

  // Handle compliance check completion
  private async handleComplianceCheckComplete(userId: string, result: any, analysis: any): Promise<void> {
    // Implementation for handling compliance check completion
    console.log('Compliance check completed for user:', userId, result, analysis);
  }

  // Handle risk assessment completion
  private async handleRiskAssessmentComplete(userId: string, result: any, analysis: any): Promise<void> {
    // Implementation for handling risk assessment completion
    console.log('Risk assessment completed for user:', userId, result, analysis);
  }
}

export const raftAIService = new RaftAIService();
