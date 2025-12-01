import express from 'express';
import { generateResponse, generateStreamingResponse } from '../services/llmService.js';

const router = express.Router();

/**
 * POST /api/llm/generate
 * Generates a response from an LLM
 * 
 * Body:
 * {
 *   model: string,
 *   temperature: number,
 *   maxTokens: number,
 *   systemPrompt: string,
 *   conversationHistory: Array<{role: string, content: string}>
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { model, temperature, maxTokens, systemPrompt, conversationHistory } = req.body;

    // Validation
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Conversation history must be an array' });
    }

    // Check API keys
    const isDeepSeek = model.toLowerCase().startsWith('deepseek');
    const isGroq = model.toLowerCase().startsWith('groq-') || model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral');
    let apiKey;
    let serviceName;
    
    if (isGroq) {
      apiKey = process.env.GROQ_API_KEY;
      serviceName = 'Groq';
    } else if (isDeepSeek) {
      apiKey = process.env.DEEPSEEK_API_KEY;
      serviceName = 'DeepSeek';
    } else {
      apiKey = process.env.OPENAI_API_KEY;
      serviceName = 'OpenAI';
    }
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: `API key not configured for ${serviceName}. ` +
          (isGroq ? 'Get your free API key at: https://console.groq.com/keys' : 
           isDeepSeek ? 'Get your API key at: https://platform.deepseek.com/usage' : 
           'Set OPENAI_API_KEY in your .env file')
      });
    }

    // Generate response
    const result = await generateResponse(
      model,
      temperature || 0.7,
      maxTokens || 200,
      systemPrompt || '',
      conversationHistory
    );

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to generate response',
        content: result.content 
      });
    }

    res.json({
      content: result.content,
      success: true,
    });
  } catch (error) {
    console.error('Error in /api/llm/generate:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/llm/stream
 * Generates a streaming response from an LLM
 */
router.post('/stream', async (req, res) => {
  // Set up Server-Sent Events headers first
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { model, temperature, maxTokens, systemPrompt, conversationHistory } = req.body;

    // Validation - send errors via SSE
    if (!model) {
      res.write(`data: ${JSON.stringify({ error: 'Model is required', done: true })}\n\n`);
      res.end();
      return;
    }

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      res.write(`data: ${JSON.stringify({ error: 'Conversation history must be an array', done: true })}\n\n`);
      res.end();
      return;
    }

    // Check API keys
    const isDeepSeek = model.toLowerCase().startsWith('deepseek');
    const isGroq = model.toLowerCase().startsWith('groq-') || model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral');
    let apiKey;
    let serviceName;
    
    if (isGroq) {
      apiKey = process.env.GROQ_API_KEY;
      serviceName = 'Groq';
    } else if (isDeepSeek) {
      apiKey = process.env.DEEPSEEK_API_KEY;
      serviceName = 'DeepSeek';
    } else {
      apiKey = process.env.OPENAI_API_KEY;
      serviceName = 'OpenAI';
    }
    
    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ 
        error: `API key not configured for ${serviceName}. ` +
          (isGroq ? 'Get your free API key at: https://console.groq.com/keys' : 
           isDeepSeek ? 'Get your API key at: https://platform.deepseek.com/usage' : 
           'Set OPENAI_API_KEY in your .env file'),
        done: true 
      })}\n\n`);
      res.end();
      return;
    }

    // Generate streaming response
    await generateStreamingResponse(
      model,
      temperature || 0.7,
      maxTokens || 200,
      systemPrompt || '',
      conversationHistory,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
      }
    );

    // Send completion signal
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in /api/llm/stream:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Internal server error', done: true })}\n\n`);
    res.end();
  }
});

export { router as llmRouter };

