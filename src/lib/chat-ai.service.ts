import { AICommandRequest, ChatMessage } from './chat.types';
import { raftAIService } from './raftai.service';

export class ChatAIService {
  private static instance: ChatAIService;
  
  public static getInstance(): ChatAIService {
    if (!ChatAIService.instance) {
      ChatAIService.instance = new ChatAIService();
    }
    return ChatAIService.instance;
  }

  async processCommand(
    command: AICommandRequest, 
    messages: ChatMessage[], 
    roomContext?: any
  ): Promise<string> {
    try {
      switch (command.command) {
        case 'summarize':
          return await this.handleSummarize(messages, command.context);
        
        case 'risks':
          return await this.handleRisks(messages, command.context);
        
        case 'draft':
          return await this.handleDraft(messages, command.tone, command.context);
        
        case 'action-items':
          return await this.handleActionItems(messages);
        
        case 'translate':
          return await this.handleTranslate(messages, command.language);
        
        case 'compliance':
          return await this.handleCompliance(messages, roomContext);
        
        case 'redact':
          return await this.handleRedact(messages, command.context);
        
        case 'brief':
          return await this.handleBrief(messages, command.context);
        
        default:
          return `Unknown command: ${command.command}. Available commands: summarize, risks, draft, action-items, translate, compliance, redact, brief`;
      }
    } catch (error) {
      console.error('AI command processing failed:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }

  private async handleSummarize(messages: ChatMessage[], context?: string): Promise<string> {
    const recentMessages = messages.slice(-20); // Last 20 messages
    const conversationText = recentMessages
      .filter(m => m.type === 'text' && m.senderId !== 'raftai')
      .map(m => `${m.senderId}: ${m.text}`)
      .join('\n');

    const prompt = `Summarize the following conversation${context ? ` with focus on: ${context}` : ''}:\n\n${conversationText}`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Summary${context ? ` (${context})` : ''}\n\n${response.summary || response.text || 'Unable to generate summary.'}`;
    } catch (error) {
      return 'Unable to generate summary at this time.';
    }
  }

  private async handleRisks(messages: ChatMessage[], context?: string): Promise<string> {
    const recentMessages = messages.slice(-30);
    const conversationText = recentMessages
      .filter(m => m.type === 'text' && m.senderId !== 'raftai')
      .map(m => `${m.senderId}: ${m.text}`)
      .join('\n');

    const prompt = `Analyze the following conversation for potential risks${context ? ` related to: ${context}` : ''}. Focus on legal, financial, operational, and reputational risks:\n\n${conversationText}`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Risk Analysis${context ? ` (${context})` : ''}\n\n${response.risks || response.text || 'No significant risks identified.'}`;
    } catch (error) {
      return 'Unable to analyze risks at this time.';
    }
  }

  private async handleDraft(messages: ChatMessage[], tone?: string, context?: string): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.senderId === 'raftai') {
      return 'Please provide context for what you\'d like me to draft.';
    }

    const prompt = `Draft a response to: "${lastMessage.text}"${tone ? ` in a ${tone} tone` : ''}${context ? ` focusing on: ${context}` : ''}. Make it professional and appropriate for a business context.`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Draft Response${tone ? ` (${tone} tone)` : ''}\n\n${response.draft || response.text || 'Unable to generate draft.'}`;
    } catch (error) {
      return 'Unable to generate draft at this time.';
    }
  }

  private async handleActionItems(messages: ChatMessage[]): Promise<string> {
    const recentMessages = messages.slice(-20);
    const conversationText = recentMessages
      .filter(m => m.type === 'text' && m.senderId !== 'raftai')
      .map(m => `${m.senderId}: ${m.text}`)
      .join('\n');

    const prompt = `Extract action items and tasks from the following conversation. Format as a clear list with assignees if mentioned:\n\n${conversationText}`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Action Items\n\n${response.actionItems || response.text || 'No action items identified.'}`;
    } catch (error) {
      return 'Unable to extract action items at this time.';
    }
  }

  private async handleTranslate(messages: ChatMessage[], language?: string): Promise<string> {
    if (!language) {
      return 'Please specify a language. Usage: /raftai translate [language]';
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.senderId === 'raftai') {
      return 'Please provide text to translate.';
    }

    const prompt = `Translate the following text to ${language}: "${lastMessage.text}"`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Translation to ${language}\n\n${response.translation || response.text || 'Unable to translate.'}`;
    } catch (error) {
      return 'Unable to translate at this time.';
    }
  }

  private async handleCompliance(messages: ChatMessage[], roomContext?: any): Promise<string> {
    const recentMessages = messages.slice(-30);
    const conversationText = recentMessages
      .filter(m => m.type === 'text' && m.senderId !== 'raftai')
      .map(m => `${m.senderId}: ${m.text}`)
      .join('\n');

    const roomType = roomContext?.type || 'general';
    const prompt = `Analyze the following conversation for compliance issues in a ${roomType} context. Focus on regulatory, legal, and policy compliance:\n\n${conversationText}`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Compliance Analysis (${roomType})\n\n${response.compliance || response.text || 'No compliance issues identified.'}`;
    } catch (error) {
      return 'Unable to analyze compliance at this time.';
    }
  }

  private async handleRedact(messages: ChatMessage[], context?: string): Promise<string> {
    const recentMessages = messages.slice(-10);
    const conversationText = recentMessages
      .filter(m => m.type === 'text' && m.senderId !== 'raftai')
      .map(m => `${m.senderId}: ${m.text}`)
      .join('\n');

    const prompt = `Identify sensitive information in the following conversation that should be redacted${context ? ` (focus on: ${context})` : ''}:\n\n${conversationText}`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Redaction Recommendations${context ? ` (${context})` : ''}\n\n${response.redactions || response.text || 'No sensitive information identified.'}`;
    } catch (error) {
      return 'Unable to analyze for redaction at this time.';
    }
  }

  private async handleBrief(messages: ChatMessage[], context?: string): Promise<string> {
    const recentMessages = messages.slice(-50);
    const conversationText = recentMessages
      .filter(m => m.type === 'text' && m.senderId !== 'raftai')
      .map(m => `${m.senderId}: ${m.text}`)
      .join('\n');

    const prompt = `Create a comprehensive brief of the following conversation${context ? ` focusing on: ${context}` : ''}. Include key points, decisions, and next steps:\n\n${conversationText}`;
    
    try {
      const response = await raftAIService.analyzeText(prompt);
      return `## Brief${context ? ` (${context})` : ''}\n\n${response.brief || response.text || 'Unable to generate brief.'}`;
    } catch (error) {
      return 'Unable to generate brief at this time.';
    }
  }

  // Helper method to get available commands
  getAvailableCommands(): string[] {
    return [
      'summarize - Summarize recent conversation',
      'risks - Analyze potential risks',
      'draft [tone] - Draft a response with specified tone',
      'action-items - Extract action items and tasks',
      'translate [language] - Translate text to specified language',
      'compliance - Check for compliance issues',
      'redact - Identify sensitive information',
      'brief - Create comprehensive brief'
    ];
  }

  // Helper method to validate command
  isValidCommand(command: string): boolean {
    const validCommands = ['summarize', 'risks', 'draft', 'action-items', 'translate', 'compliance', 'redact', 'brief'];
    return validCommands.includes(command);
  }
}

export const chatAIService = ChatAIService.getInstance();
