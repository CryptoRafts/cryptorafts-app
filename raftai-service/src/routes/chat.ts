import { Router } from 'express';
import { ChatInput, ChatOutput } from '../schemas.js';
import { logger } from '../utils/logger.js';
import { openaiClient } from '../utils/openai-client.js';

const router = Router();

// Simple chat command processor (expand with LLM integration)
async function processChatCommand(input: ChatInput): Promise<ChatOutput> {
  logger.info('Processing chat command', {
    command: input.command,
    projectId: input.projectId,
    textLength: input.text.length
  });

  const { command, text, projectId, lang, tone } = input;

  switch (command) {
    case 'summarize':
      return {
        ok: true,
        result: `Summary: ${text.substring(0, 200)}...`,
        citations: []
      };

    case 'risks':
      return {
        ok: true,
        result: 'Key risks identified:\n1. Market volatility\n2. Regulatory changes\n3. Technical implementation challenges\n4. Competition\n5. Team execution risk',
        citations: []
      };

    case 'brief':
      return {
        ok: true,
        result: `Executive Brief: ${text.substring(0, 150)}... This project shows potential in the current market conditions.`,
        citations: []
      };

    case 'draft':
      const draftTone = tone || 'neutral';
      return {
        ok: true,
        result: `Draft response (${draftTone} tone): Thank you for your interest. We appreciate your feedback and will consider your suggestions.`,
        citations: []
      };

    case 'action-items':
      return {
        ok: true,
        result: 'Action items:\n1. Review technical documentation\n2. Schedule follow-up meeting\n3. Prepare due diligence materials\n4. Assess market opportunity\n5. Evaluate team capabilities',
        citations: []
      };

    case 'decisions':
      return {
        ok: true,
        result: 'Key decisions needed:\n1. Investment amount\n2. Timeline for decision\n3. Due diligence scope\n4. Legal structure\n5. Post-investment support',
        citations: []
      };

    case 'translate':
      const targetLang = lang || 'es';
      return {
        ok: true,
        result: `Translation to ${targetLang}: [Translation would be provided by LLM service]`,
        citations: []
      };

    case 'compliance':
      return {
        ok: true,
        result: 'Compliance check:\n- Jurisdiction: Verify regulatory requirements\n- KYC/KYB: Ensure proper verification\n- Documentation: Review legal documents\n- Risk assessment: Evaluate compliance risks',
        citations: []
      };

    case 'redact':
      return {
        ok: true,
        result: 'Redacted content: [PII and sensitive information would be removed]',
        citations: []
      };

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate input
    const input = ChatInput.parse(req.body);
    
    // TODO: Add moderation check
    // const moderationResult = await moderateContent(input.text);
    // if (moderationResult.blocked) {
    //   return res.status(403).json({
    //     blocked: true,
    //     reason: moderationResult.reason
    //   });
    // }

    // Process command
    const result = await processChatCommand(input);

    const processingTime = Date.now() - startTime;
    
    logger.info('Chat command completed', {
      command: input.command,
      processingTimeMs: processingTime
    });

    res.status(200).json(result);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'ZodError') {
      logger.warn('Invalid chat input', {
        error: error.message,
        body: req.body,
        processingTimeMs: processingTime
      });
      
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.message,
        code: 'VALIDATION_ERROR'
      });
    }

    logger.error('Chat processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});

// Add chat summarize endpoint
router.post('/summarize', async (req, res) => {
  try {
    const { chatId, messages } = req.body;
    
    logger.info('Generating chat summary with OpenAI', { chatId, messageCount: messages?.length || 0 });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required',
        code: 'INVALID_INPUT'
      });
    }

    // Generate AI-powered chat summary
    const aiSummary = await openaiClient.summarizeChat(messages);

    const summary = {
      summary: aiSummary.summary,
      keyPoints: aiSummary.keyPoints,
      actions: aiSummary.actions,
      sentiment: aiSummary.sentiment,
      messageCount: messages.length,
      analyzedAt: new Date().toISOString()
    };

    logger.info('Chat summary generated', { chatId, sentiment: aiSummary.sentiment });

    res.status(200).json(summary);
  } catch (error) {
    logger.error('Chat summary error:', error);
    res.status(500).json({
      error: 'Failed to generate chat summary',
      code: 'SUMMARY_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as chatRouter };
