import { dealRoomManager, DealRoom, DealRoomMessage, NotePoint } from './deal-room-manager';

interface AISummary {
  id: string;
  type: 'call' | 'daily' | 'weekly' | 'chat_analysis';
  content: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  risks: string[];
  questions: string[];
  createdAt: Date;
  metadata: {
    messageCount?: number;
    callDuration?: number;
    participants?: string[];
    timeRange?: { start: Date; end: Date };
  };
}

interface AIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  category: 'technical' | 'business' | 'legal' | 'financial' | 'operational';
  confidence: number; // 0-1
  keywords: string[];
  entities: {
    people: string[];
    organizations: string[];
    dates: string[];
    amounts: string[];
    locations: string[];
  };
}

class RaftAIBotService {
  private static instance: RaftAIBotService;
  private analysisCache: Map<string, AIAnalysis> = new Map();

  static getInstance(): RaftAIBotService {
    if (!RaftAIBotService.instance) {
      RaftAIBotService.instance = new RaftAIBotService();
    }
    return RaftAIBotService.instance;
  }

  // Analyze chat message for auto note point extraction
  async analyzeMessage(message: DealRoomMessage, roomId: string): Promise<void> {
    try {
      if (message.type !== 'text' || message.senderId === 'raftai-bot') return;

      const analysis = await this.performMessageAnalysis(message.content);
      this.analysisCache.set(message.id, analysis);

      // Extract note points based on analysis
      await this.extractNotePoints(message, analysis, roomId);
    } catch (error) {
      console.error('Error analyzing message:', error);
    }
  }

  // Perform AI analysis on message content
  private async performMessageAnalysis(content: string): Promise<AIAnalysis> {
    // Simulate AI processing with realistic delays
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Extract keywords and entities
    const keywords = this.extractKeywords(content);
    const entities = this.extractEntities(content);
    
    // Determine sentiment
    const sentiment = this.analyzeSentiment(content);
    
    // Determine urgency based on keywords and patterns
    const urgency = this.determineUrgency(content, keywords);
    
    // Determine category
    const category = this.categorizeContent(content, keywords);
    
    // Calculate confidence based on content quality and clarity
    const confidence = this.calculateConfidence(content, keywords, entities);

    return {
      sentiment,
      urgency,
      category,
      confidence,
      keywords,
      entities
    };
  }

  // Extract keywords from content
  private extractKeywords(content: string): string[] {
    const keywords = [];
    const lowerContent = content.toLowerCase();

    // Decision indicators
    if (lowerContent.includes('decide') || lowerContent.includes('decision')) keywords.push('decision');
    if (lowerContent.includes('agree') || lowerContent.includes('agreement')) keywords.push('agreement');
    if (lowerContent.includes('approve') || lowerContent.includes('approval')) keywords.push('approval');

    // Action indicators
    if (lowerContent.includes('action') || lowerContent.includes('todo') || lowerContent.includes('task')) keywords.push('action');
    if (lowerContent.includes('follow up') || lowerContent.includes('followup')) keywords.push('follow_up');
    if (lowerContent.includes('schedule') || lowerContent.includes('meeting')) keywords.push('scheduling');

    // Risk indicators
    if (lowerContent.includes('risk') || lowerContent.includes('concern') || lowerContent.includes('issue')) keywords.push('risk');
    if (lowerContent.includes('problem') || lowerContent.includes('challenge')) keywords.push('problem');
    if (lowerContent.includes('blocker') || lowerContent.includes('obstacle')) keywords.push('blocker');

    // Question indicators
    if (lowerContent.includes('?') || lowerContent.includes('question')) keywords.push('question');
    if (lowerContent.includes('clarify') || lowerContent.includes('understand')) keywords.push('clarification');

    // Milestone indicators
    if (lowerContent.includes('milestone') || lowerContent.includes('deadline')) keywords.push('milestone');
    if (lowerContent.includes('launch') || lowerContent.includes('release')) keywords.push('launch');
    if (lowerContent.includes('phase') || lowerContent.includes('stage')) keywords.push('phase');

    return [...new Set(keywords)]; // Remove duplicates
  }

  // Extract entities from content
  private extractEntities(content: string): AIAnalysis['entities'] {
    const entities = {
      people: [],
      organizations: [],
      dates: [],
      amounts: [],
      locations: []
    };

    // Extract dates (basic patterns)
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b(next|this|last)\s+(week|month|year|quarter)\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) entities.dates.push(...matches);
    });

    // Extract amounts (basic patterns)
    const amountPatterns = [
      /\$[\d,]+(?:\.\d{2})?\b/g,
      /\b\d+(?:\.\d+)?\s*(?:million|billion|thousand|k|m|b)\b/gi,
      /\b\d+(?:\.\d+)?\s*(?:%|percent)\b/g
    ];

    amountPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) entities.amounts.push(...matches);
    });

    // Extract people (capitalized words that could be names)
    const peoplePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const peopleMatches = content.match(peoplePattern);
    if (peopleMatches) {
      entities.people.push(...peopleMatches.filter(name => 
        !['The', 'This', 'That', 'There', 'Then', 'When', 'Where', 'What', 'How'].includes(name.split(' ')[0])
      ));
    }

    // Extract organizations (common company indicators)
    const orgPatterns = [
      /\b[A-Z][a-z]+\s+(?:Inc|LLC|Corp|Company|Ltd|Limited)\b/g,
      /\b[A-Z][A-Z]+\b/g // Acronyms
    ];

    orgPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) entities.organizations.push(...matches);
    });

    return entities;
  }

  // Analyze sentiment
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'fantastic', 'perfect', 'love', 'happy', 'excited', 'confident'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'concerned', 'worried', 'disappointed', 'problem'];

    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Determine urgency
  private determineUrgency(content: string, keywords: string[]): 'low' | 'medium' | 'high' {
    const highUrgencyKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline', 'blocker'];
    const mediumUrgencyKeywords = ['soon', 'priority', 'important', 'schedule', 'follow up'];

    const lowerContent = content.toLowerCase();
    
    if (highUrgencyKeywords.some(keyword => lowerContent.includes(keyword))) return 'high';
    if (mediumUrgencyKeywords.some(keyword => lowerContent.includes(keyword))) return 'medium';
    if (keywords.includes('risk') || keywords.includes('problem')) return 'medium';
    
    return 'low';
  }

  // Categorize content
  private categorizeContent(content: string, keywords: string[]): AIAnalysis['category'] {
    const lowerContent = content.toLowerCase();
    
    if (keywords.includes('technical') || lowerContent.includes('code') || lowerContent.includes('development')) {
      return 'technical';
    }
    if (keywords.includes('financial') || lowerContent.includes('money') || lowerContent.includes('funding')) {
      return 'financial';
    }
    if (lowerContent.includes('legal') || lowerContent.includes('contract') || lowerContent.includes('agreement')) {
      return 'legal';
    }
    if (lowerContent.includes('business') || lowerContent.includes('market') || lowerContent.includes('customer')) {
      return 'business';
    }
    
    return 'operational';
  }

  // Calculate confidence
  private calculateConfidence(content: string, keywords: string[], entities: AIAnalysis['entities']): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on content length and clarity
    if (content.length > 50) confidence += 0.1;
    if (content.length > 100) confidence += 0.1;
    
    // Increase confidence based on keywords found
    confidence += Math.min(keywords.length * 0.05, 0.2);
    
    // Increase confidence based on entities found
    const entityCount = Object.values(entities).flat().length;
    confidence += Math.min(entityCount * 0.02, 0.1);
    
    // Decrease confidence for unclear content
    if (content.includes('???') || content.includes('...')) confidence -= 0.1;
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  // Extract note points from message analysis
  private async extractNotePoints(message: DealRoomMessage, analysis: AIAnalysis, roomId: string): Promise<void> {
    const notePoints = [];

    // Extract decisions
    if (analysis.keywords.includes('decision') || analysis.keywords.includes('agree')) {
      notePoints.push({
        content: `Decision made: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
        type: 'decision' as const,
        status: 'open' as const,
        createdBy: 'raftai-bot',
        source: { type: 'chat' as const, reference: message.id },
        tags: ['auto', 'decision'],
        followers: [message.senderId]
      });
    }

    // Extract actions
    if (analysis.keywords.includes('action') || analysis.keywords.includes('todo') || analysis.keywords.includes('task')) {
      notePoints.push({
        content: `Action item: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
        type: 'action' as const,
        status: 'open' as const,
        createdBy: 'raftai-bot',
        assignedTo: message.senderId,
        source: { type: 'chat' as const, reference: message.id },
        tags: ['auto', 'action'],
        followers: [message.senderId]
      });
    }

    // Extract risks
    if (analysis.keywords.includes('risk') || analysis.keywords.includes('concern') || analysis.keywords.includes('problem')) {
      notePoints.push({
        content: `Risk identified: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
        type: 'risk' as const,
        status: 'open' as const,
        createdBy: 'raftai-bot',
        source: { type: 'chat' as const, reference: message.id },
        tags: ['auto', 'risk'],
        followers: [message.senderId]
      });
    }

    // Extract questions
    if (analysis.keywords.includes('question') || message.content.includes('?')) {
      notePoints.push({
        content: `Question raised: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
        type: 'question' as const,
        status: 'open' as const,
        createdBy: 'raftai-bot',
        source: { type: 'chat' as const, reference: message.id },
        tags: ['auto', 'question'],
        followers: [message.senderId]
      });
    }

    // Extract milestones
    if (analysis.keywords.includes('milestone') || analysis.keywords.includes('deadline') || analysis.keywords.includes('launch')) {
      notePoints.push({
        content: `Milestone mentioned: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
        type: 'milestone' as const,
        status: 'open' as const,
        createdBy: 'raftai-bot',
        source: { type: 'chat' as const, reference: message.id },
        tags: ['auto', 'milestone'],
        followers: [message.senderId]
      });
    }

    // Add note points if confidence is high enough
    if (analysis.confidence > 0.6 && notePoints.length > 0) {
      for (const notePoint of notePoints) {
        await dealRoomManager.addNotePoint(roomId, notePoint);
      }
    }
  }

  // Generate daily summary
  async generateDailySummary(roomId: string): Promise<{ success: boolean; summaryId?: string; error?: string }> {
    try {
      const roomResult = await dealRoomManager.getDealRoom(roomId);
      if (!roomResult.success || !roomResult.dealRoom) {
        return { success: false, error: 'Room not found' };
      }

      const room = roomResult.dealRoom;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayMessages = room.messages.filter(msg => 
        msg.type === 'text' && 
        new Date(msg.timestamp) >= today &&
        msg.senderId !== 'raftai-bot'
      );

      const summary = this.createDailySummary(todayMessages, room);
      
      await dealRoomManager.addMessage(roomId, {
        content: summary,
        type: 'summary',
        senderId: 'raftai-bot',
        senderName: 'RaftAI',
        metadata: {
          summaryType: 'daily'
        }
      });

      return { success: true, summaryId: `daily-${Date.now()}` };
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Create daily summary content
  private createDailySummary(messages: DealRoomMessage[], room: DealRoom): string {
    const messageCount = messages.length;
    const participants = [...new Set(messages.map(msg => msg.senderId))];
    
    let summary = `📊 Daily Summary - ${new Date().toLocaleDateString()}\n\n`;
    summary += `• ${messageCount} messages exchanged\n`;
    summary += `• ${participants.length} active participants\n`;
    
    if (messageCount === 0) {
      summary += `• No activity today\n\n`;
      summary += `💡 Tip: Start a conversation to begin tracking progress!`;
      return summary;
    }

    // Analyze message topics
    const topics = this.extractTopics(messages);
    if (topics.length > 0) {
      summary += `• Key topics: ${topics.join(', ')}\n`;
    }

    // Count note points created today
    const todayNotes = room.notePoints.filter(note => 
      new Date(note.createdAt) >= new Date().setHours(0, 0, 0, 0)
    );
    
    if (todayNotes.length > 0) {
      summary += `• ${todayNotes.length} note points created\n`;
    }

    summary += `\n📝 RaftAI posted a summary to Note Points.`;

    return summary;
  }

  // Extract topics from messages
  private extractTopics(messages: DealRoomMessage[]): string[] {
    const allContent = messages.map(msg => msg.content).join(' ');
    const keywords = this.extractKeywords(allContent);
    
    // Map keywords to readable topics
    const topicMap = {
      'decision': 'Decisions',
      'action': 'Action Items',
      'risk': 'Risk Discussion',
      'question': 'Questions',
      'milestone': 'Milestones',
      'technical': 'Technical Discussion',
      'business': 'Business Strategy',
      'financial': 'Financial Planning'
    };

    return keywords
      .filter(keyword => topicMap[keyword])
      .map(keyword => topicMap[keyword])
      .slice(0, 5); // Limit to 5 topics
  }

  // Generate weekly summary
  async generateWeeklySummary(roomId: string): Promise<{ success: boolean; summaryId?: string; error?: string }> {
    try {
      const roomResult = await dealRoomManager.getDealRoom(roomId);
      if (!roomResult.success || !roomResult.dealRoom) {
        return { success: false, error: 'Room not found' };
      }

      const room = roomResult.dealRoom;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekMessages = room.messages.filter(msg => 
        msg.type === 'text' && 
        new Date(msg.timestamp) >= weekAgo &&
        msg.senderId !== 'raftai-bot'
      );

      const summary = this.createWeeklySummary(weekMessages, room);
      
      await dealRoomManager.addMessage(roomId, {
        content: summary,
        type: 'summary',
        senderId: 'raftai-bot',
        senderName: 'RaftAI',
        metadata: {
          summaryType: 'weekly'
        }
      });

      return { success: true, summaryId: `weekly-${Date.now()}` };
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Create weekly summary content
  private createWeeklySummary(messages: DealRoomMessage[], room: DealRoom): string {
    const messageCount = messages.length;
    const participants = [...new Set(messages.map(msg => msg.senderId))];
    
    let summary = `📈 Weekly Summary - Last 7 Days\n\n`;
    summary += `• ${messageCount} total messages\n`;
    summary += `• ${participants.length} active participants\n`;
    
    if (messageCount === 0) {
      summary += `• No activity this week\n\n`;
      summary += `💡 Tip: Regular communication helps track progress!`;
      return summary;
    }

    // Analyze progress
    const completedNotes = room.notePoints.filter(note => note.status === 'done');
    const openNotes = room.notePoints.filter(note => note.status === 'open');
    
    summary += `• ${completedNotes.length} completed note points\n`;
    summary += `• ${openNotes.length} open note points\n`;

    // Activity trends
    const dailyActivity = this.calculateDailyActivity(messages);
    const mostActiveDay = Object.entries(dailyActivity).reduce((a, b) => a[1] > b[1] ? a : b);
    
    if (mostActiveDay) {
      summary += `• Most active day: ${mostActiveDay[0]} (${mostActiveDay[1]} messages)\n`;
    }

    summary += `\n📝 RaftAI posted a summary to Note Points.`;

    return summary;
  }

  // Calculate daily activity
  private calculateDailyActivity(messages: DealRoomMessage[]): { [day: string]: number } {
    const activity = {};
    
    messages.forEach(msg => {
      const day = new Date(msg.timestamp).toLocaleDateString();
      activity[day] = (activity[day] || 0) + 1;
    });
    
    return activity;
  }

  // Get analysis for message
  getMessageAnalysis(messageId: string): AIAnalysis | null {
    return this.analysisCache.get(messageId) || null;
  }

  // Clear analysis cache
  clearCache(): void {
    this.analysisCache.clear();
  }
}

export const raftaiBotService = RaftAIBotService.getInstance();
