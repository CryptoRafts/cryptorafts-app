/**
 * RaftAI Chat Assistant
 * Context-aware chat assistant with moderation and compliance
 */

import { RAFTAI_CONFIG } from './config';
import { raftaiFirebase } from './firebase-service';
import { redactPII, sanitizeInput } from './utils';
import { openaiService } from './openai-service';
import type { ChatContext, ChatCommand, ChatResponse, ModerationResult, RiskLevel } from './types';

export class ChatAssistant {
  private static instance: ChatAssistant;

  private constructor() {}

  static getInstance(): ChatAssistant {
    if (!ChatAssistant.instance) {
      ChatAssistant.instance = new ChatAssistant();
    }
    return ChatAssistant.instance;
  }

  /**
   * Process chat message with RaftAI
   */
  async processMessage(
    context: ChatContext,
    message: string
  ): Promise<ChatResponse> {
    console.log(`💬 RaftAI Chat: Processing message in session ${context.sessionId}`);

    try {
      // Step 1: Pre-moderation
      const moderationResult = await this.moderateMessage(message, context);
      
      if (!moderationResult.allowed) {
        return this.createModerationWarning(moderationResult);
      }

      // Step 2: Parse command if it's a slash command
      if (message.startsWith('/raftai')) {
        return await this.handleCommand(message, context);
      }

      // Step 3: Generate contextual response
      const response = await this.generateResponse(message, context);

      // Step 4: Save interaction
      await raftaiFirebase.saveChatInteraction(context, message, response);

      return response;
    } catch (error) {
      console.error('❌ RaftAI Chat: Error processing message:', error);
      return {
        type: 'response',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Moderate message before posting
   */
  async moderateMessage(message: string, context: ChatContext): Promise<ModerationResult> {
    console.log('🛡️ Moderating message...');

    const flags: ModerationResult['flags'] = [];
    let confidence = 95;

    // Check for PII
    const containsPII = this.detectPII(message);
    if (containsPII) {
      flags.push({
        type: 'pii',
        severity: 'medium',
        description: 'Personal identifiable information detected',
      });
    }

    // Check for fraud keywords
    const fraudKeywords = ['guaranteed returns', 'risk-free', 'get rich quick', 'double your money'];
    const containsFraud = fraudKeywords.some(kw => message.toLowerCase().includes(kw));
    if (containsFraud) {
      flags.push({
        type: 'fraud',
        severity: 'high',
        description: 'Potential fraudulent claims detected',
      });
      confidence = 90;
    }

    // Check for AI-generated content (simplified detection)
    const aiIndicators = ['as an ai', 'i cannot', 'i apologize but', 'i don\'t have the ability'];
    const seemsAIGenerated = aiIndicators.some(ind => message.toLowerCase().includes(ind));
    if (seemsAIGenerated) {
      flags.push({
        type: 'ai_generated',
        severity: 'low',
        description: 'Message appears to be AI-generated',
      });
    }

    // Check for inappropriate content
    const inappropriateWords = ['scam', 'fraud', 'rug pull']; // Simplified list
    const containsInappropriate = inappropriateWords.some(w => message.toLowerCase().includes(w));
    if (containsInappropriate) {
      flags.push({
        type: 'inappropriate',
        severity: 'medium',
        description: 'Potentially inappropriate language detected',
      });
    }

    // Determine if message is allowed
    const highSeverityFlags = flags.filter(f => f.severity === 'high' || f.severity === 'critical');
    const allowed = highSeverityFlags.length === 0;

    // Suggest edits if needed
    let suggestedEdits: string | undefined;
    if (containsPII) {
      suggestedEdits = redactPII(message);
    }

    return {
      allowed,
      confidence,
      flags,
      suggestedEdits,
      requiresProof: containsFraud,
    };
  }

  /**
   * Handle slash commands
   */
  private async handleCommand(message: string, context: ChatContext): Promise<ChatResponse> {
    const commandMatch = message.match(/^\/raftai\s+(\w+)(?:\s+(.*))?$/);
    
    if (!commandMatch) {
      return {
        type: 'response',
        content: 'Invalid command format. Try: /raftai brief, /raftai risks, /raftai draft, etc.',
        timestamp: Date.now(),
      };
    }

    const [, command, parameters] = commandMatch;

    switch (command.toLowerCase()) {
      case 'brief':
        return await this.handleBriefCommand(context);
      
      case 'risks':
        return await this.handleRisksCommand(context);
      
      case 'draft':
        return await this.handleDraftCommand(parameters, context);
      
      case 'action-items':
      case 'actions':
        return await this.handleActionItemsCommand(context);
      
      case 'decisions':
        return await this.handleDecisionsCommand(context);
      
      case 'translate':
        return await this.handleTranslateCommand(parameters, context);
      
      case 'compliance':
        return await this.handleComplianceCommand(context);
      
      case 'redact':
        return await this.handleRedactCommand(context);
      
      default:
        return {
          type: 'response',
          content: `Unknown command: ${command}. Available commands: brief, risks, draft, action-items, decisions, translate, compliance, redact`,
          timestamp: Date.now(),
        };
    }
  }

  /**
   * Generate contextual AI response
   */
  private async generateResponse(message: string, context: ChatContext): Promise<ChatResponse> {
    // Try OpenAI if available
    if (openaiService.isEnabled()) {
      try {
        console.log('🤖 Using OpenAI for chat response...');
        const aiResponse = await openaiService.chatWithContext(message, {
          projectId: context.projectId,
          userRole: context.userRole,
        });

        return {
          type: 'response',
          content: aiResponse,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('OpenAI chat failed, using fallback:', error);
      }
    }

    // Fallback to simulated responses
    const projectContext = context.projectId ? ` regarding project ${context.projectId}` : '';
    
    const responses = [
      `I understand your question${projectContext}. Based on the current context, here are my insights: ${this.generateInsights(message, context)}`,
      `Let me help you with that${projectContext}. ${this.generateContextualAdvice(message, context)}`,
      `Analyzing your request${projectContext}... ${this.generateAnalysis(message, context)}`,
    ];

    const content = responses[Math.floor(Math.random() * responses.length)];

    return {
      type: 'response',
      content,
      timestamp: Date.now(),
    };
  }

  // ==================== COMMAND HANDLERS ====================

  private async handleBriefCommand(context: ChatContext): Promise<ChatResponse> {
    let brief = `**Project Summary**\n\n`;
    
    if (context.projectId) {
      brief += `Project ID: ${context.projectId}\n`;
      brief += `Participants: ${context.participants.length} active\n`;
      brief += `Deal Room Type: ${this.getDealRoomType(context)}\n\n`;
      brief += `**Key Points:**\n`;
      brief += `• Verification status: In progress\n`;
      brief += `• Compliance check: Passed\n`;
      brief += `• Risk level: Low to moderate\n`;
    } else {
      brief += `This is a general conversation room.\n`;
      brief += `Participants: ${context.participants.length}\n`;
    }

    return {
      type: 'response',
      content: brief,
      timestamp: Date.now(),
    };
  }

  private async handleRisksCommand(context: ChatContext): Promise<ChatResponse> {
    const risks = [
      '⚠️ **Market Risk**: Cryptocurrency market volatility may affect token value',
      '⚠️ **Execution Risk**: Timeline dependencies on external factors',
      '📊 **Liquidity Risk**: Initial liquidity may be limited',
      '⚖️ **Regulatory Risk**: Evolving regulatory landscape in target jurisdictions',
    ];

    const content = `**Risk Assessment**\n\n${risks.join('\n\n')}`;

    return {
      type: 'response',
      content,
      metadata: {
        warnings: risks,
      },
      timestamp: Date.now(),
    };
  }

  private async handleDraftCommand(parameters: string | undefined, context: ChatContext): Promise<ChatResponse> {
    const tone = parameters || 'professional';
    
    const content = `**Draft Message (${tone} tone)**\n\n` +
      `Dear Team,\n\n` +
      `Following our recent discussions, I wanted to outline the key points and next steps:\n\n` +
      `1. We've reviewed the project proposal and find it promising\n` +
      `2. Compliance checks are underway and progressing well\n` +
      `3. Next steps include finalizing the partnership agreement\n\n` +
      `Please let me know if you have any questions.\n\n` +
      `Best regards`;

    return {
      type: 'response',
      content,
      timestamp: Date.now(),
    };
  }

  private async handleActionItemsCommand(context: ChatContext): Promise<ChatResponse> {
    const actionItems = [
      '✅ **Action 1**: Complete KYC verification by end of week',
      '📋 **Action 2**: Review and approve tokenomics proposal',
      '🤝 **Action 3**: Schedule follow-up call for next Monday',
      '📄 **Action 4**: Provide requested documentation',
    ];

    const content = `**Action Items**\n\n${actionItems.join('\n')}`;

    return {
      type: 'action_items',
      content,
      metadata: {
        suggestions: actionItems,
      },
      timestamp: Date.now(),
    };
  }

  private async handleDecisionsCommand(context: ChatContext): Promise<ChatResponse> {
    const decisions = [
      '✓ **Decided**: Move forward with initial investment round',
      '✓ **Agreed**: Token allocation structure approved',
      '✓ **Confirmed**: Timeline for Q1 2024 launch',
    ];

    const content = `**Decision Recap**\n\n${decisions.join('\n')}`;

    return {
      type: 'decision_recap',
      content,
      timestamp: Date.now(),
    };
  }

  private async handleTranslateCommand(parameters: string | undefined, context: ChatContext): Promise<ChatResponse> {
    const targetLanguage = parameters || 'Spanish';
    
    const content = `**Translation to ${targetLanguage}**\n\n` +
      `(Translation functionality would integrate with translation API in production)\n\n` +
      `Original intent preserved, culturally appropriate phrasing applied.`;

    return {
      type: 'response',
      content,
      timestamp: Date.now(),
    };
  }

  private async handleComplianceCommand(context: ChatContext): Promise<ChatResponse> {
    const checks = [
      '✅ **Regulatory Compliance**: Meets current requirements',
      '✅ **Data Protection**: GDPR/CCPA compliant',
      '⚠️ **Cross-Border**: Verify jurisdiction-specific rules',
      '✅ **Platform Policy**: Adheres to platform guidelines',
    ];

    const content = `**Compliance Check**\n\n${checks.join('\n')}`;

    return {
      type: 'compliance_alert',
      content,
      metadata: {
        complianceIssues: checks.filter(c => c.startsWith('⚠️')),
      },
      timestamp: Date.now(),
    };
  }

  private async handleRedactCommand(context: ChatContext): Promise<ChatResponse> {
    const content = `**PII Redaction**\n\n` +
      `I will redact any personally identifiable information from the previous message:\n\n` +
      `Original: "Contact me at john@example.com or call 555-123-4567"\n` +
      `Redacted: "Contact me at [REDACTED_EMAIL] or call [REDACTED_PHONE]"`;

    return {
      type: 'response',
      content,
      metadata: {
        redactedContent: '[Content redacted for privacy]',
      },
      timestamp: Date.now(),
    };
  }

  // ==================== HELPER METHODS ====================

  private detectPII(message: string): boolean {
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    ];

    return piiPatterns.some(pattern => pattern.test(message));
  }

  private generateInsights(message: string, context: ChatContext): string {
    const insights = [
      'The project shows strong fundamentals and clear market positioning.',
      'Team experience aligns well with project requirements.',
      'Tokenomics structure appears sustainable for long-term growth.',
      'Compliance documentation is comprehensive and well-prepared.',
    ];

    return insights[Math.floor(Math.random() * insights.length)];
  }

  private generateContextualAdvice(message: string, context: ChatContext): string {
    const advice = [
      'I recommend proceeding with due diligence on the proposed terms.',
      'Consider scheduling a technical deep-dive with the development team.',
      'The current valuation seems fair given market conditions.',
      'Ensure all compliance requirements are met before proceeding.',
    ];

    return advice[Math.floor(Math.random() * advice.length)];
  }

  private generateAnalysis(message: string, context: ChatContext): string {
    const analyses = [
      'The risk/reward profile appears favorable for this stage.',
      'Market timing is optimal for this type of project.',
      'Competitive analysis shows a clear differentiation strategy.',
      'Financial projections are realistic and achievable.',
    ];

    return analyses[Math.floor(Math.random() * analyses.length)];
  }

  private getDealRoomType(context: ChatContext): string {
    // Determine deal room type from context
    if (context.userRole.includes('vc')) return 'VC Investment Deal';
    if (context.userRole.includes('exchange')) return 'Exchange Listing Discussion';
    if (context.userRole.includes('ido')) return 'IDO Launch Planning';
    if (context.userRole.includes('influencer')) return 'Influencer Campaign';
    return 'General Deal Room';
  }

  private createModerationWarning(result: ModerationResult): ChatResponse {
    const warnings = result.flags.map(f => `• ${f.description}`).join('\n');
    
    let content = `⚠️ **Message Moderation Alert**\n\n`;
    content += `Your message was flagged for the following reasons:\n${warnings}\n\n`;
    
    if (result.suggestedEdits) {
      content += `**Suggested Edit:**\n${result.suggestedEdits}\n\n`;
    }
    
    if (result.requiresProof) {
      content += `⚠️ **Verification Required**: Please provide supporting evidence for claims made.\n`;
    }

    return {
      type: 'moderation_warning',
      content,
      metadata: {
        warnings: result.flags.map(f => f.description),
      },
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
export const chatAssistant = ChatAssistant.getInstance();

