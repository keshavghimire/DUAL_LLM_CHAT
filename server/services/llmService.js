import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import OpenAI from 'openai';

/**
 * Creates a Langchain LLM instance based on the model name
 * Supports OpenAI and DeepSeek models
 */
export function createLLM(model, temperature, maxTokens, systemPrompt) {
  const isDeepSeek = model.startsWith('deepseek');
  
  const apiKey = isDeepSeek 
    ? process.env.DEEPSEEK_API_KEY 
    : process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    const serviceName = isDeepSeek ? 'DeepSeek' : 'OpenAI';
    throw new Error(
      `${serviceName} API key is not configured. ` +
      `Please set ${isDeepSeek ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY'} in your .env file. ` +
      `See ENV_SETUP.md for instructions.`
    );
  }

  // For DeepSeek, configure ChatOpenAI with DeepSeek's base URL
  if (isDeepSeek) {
    const deepSeekBaseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    // Configure ChatOpenAI to use DeepSeek's API
    // Use both modelName (for compatibility) and configuration with baseURL
    const llm = new ChatOpenAI({
      modelName: model, // 'deepseek-chat'
      temperature: temperature,
      maxTokens: maxTokens,
      openAIApiKey: apiKey,
      configuration: {
        baseURL: deepSeekBaseURL,
      },
    });
    
    return {
      llm,
      systemPrompt,
    };
  }

  // For OpenAI models, use standard configuration
  const config = {
    modelName: model,
    temperature: temperature,
    maxTokens: maxTokens,
    openAIApiKey: apiKey,
  };

  const llm = new ChatOpenAI(config);

  return {
    llm,
    systemPrompt,
  };
}

/**
 * Generates a response from an LLM given conversation history
 */
export async function generateResponse(
  model,
  temperature,
  maxTokens,
  systemPrompt,
  conversationHistory
) {
  try {
    const isDeepSeek = model.toLowerCase().startsWith('deepseek');
    const isGroq = model.toLowerCase().startsWith('groq-') || model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral');
    console.log(`[LLM Service] Model: ${model}, isDeepSeek: ${isDeepSeek}, isGroq: ${isGroq}`);
    
    // For Groq (free tier available), use OpenAI SDK directly
    if (isGroq) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured. Please set it in your .env file. Get your free API key at: https://console.groq.com/keys');
      }
      
      const groqBaseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
      console.log(`[LLM Service] Using Groq with baseURL: ${groqBaseURL}`);
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: groqBaseURL,
      });
      
      // Build messages array for OpenAI format
      const messages = [];
      
      // Add system message if provided
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add conversation history
      for (const msg of conversationHistory) {
        if (msg.role === 'user' || msg.role === 'human') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant' || msg.role === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        } else if (msg.role === 'system') {
          messages.push({ role: 'system', content: msg.content });
        }
      }
      
      // Ensure we have at least one user message
      if (messages.filter(m => m.role === 'user').length === 0) {
        messages.push({ role: 'user', content: 'Hello' });
      }
      
      // Log messages for debugging
      console.log(`[LLM Service] Groq messages:`, JSON.stringify(messages.map(m => ({
        role: m.role,
        contentLength: m.content?.length || 0,
        contentPreview: m.content?.substring(0, 50) || 'empty'
      })), null, 2));
      
      // Map model names to Groq's model identifiers
      let groqModelName = model;
      if (model.toLowerCase().includes('llama-3.1-8b') || model.toLowerCase() === 'groq-llama-8b') {
        groqModelName = 'llama-3.1-8b-instant';
      } else if (model.toLowerCase().includes('llama-3.1-70b') || model.toLowerCase() === 'groq-llama-70b') {
        groqModelName = 'llama-3.1-70b-versatile';
      } else if (model.toLowerCase().includes('mixtral') || model.toLowerCase() === 'groq-mixtral') {
        groqModelName = 'mixtral-8x7b-32768';
      } else if (model.toLowerCase().includes('gemma')) {
        groqModelName = 'gemma2-9b-it';
      }
      
      console.log(`[LLM Service] Making Groq API call with model: ${groqModelName}, messages count: ${messages.length}`);
      
      try {
        const completion = await client.chat.completions.create({
          model: groqModelName,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
        });
        
        console.log(`[LLM Service] Groq API call successful`);
        console.log(`[LLM Service] Response structure:`, JSON.stringify({
          choices: completion.choices?.length,
          firstChoice: completion.choices?.[0] ? {
            message: completion.choices[0].message ? {
              role: completion.choices[0].message.role,
              contentLength: completion.choices[0].message.content?.length || 0,
              contentPreview: completion.choices[0].message.content?.substring(0, 100) || 'empty'
            } : 'no message',
            finishReason: completion.choices[0].finish_reason
          } : 'no choices'
        }, null, 2));
        
        // Try multiple ways to extract content
        let responseContent = completion.choices?.[0]?.message?.content;
        
        // If content is empty, try alternative paths
        if (!responseContent && completion.choices?.[0]) {
          const choice = completion.choices[0];
          responseContent = choice.message?.content || 
                          choice.text || 
                          choice.content ||
                          (typeof choice === 'string' ? choice : null);
        }
        
        // If still empty, log the full response for debugging
        if (!responseContent || responseContent.trim() === '') {
          console.error(`[LLM Service] Empty response from Groq. Full response:`, JSON.stringify(completion, null, 2));
          console.error(`[LLM Service] Response type:`, typeof completion);
          console.error(`[LLM Service] Response keys:`, Object.keys(completion || {}));
          console.error(`[LLM Service] Messages sent:`, JSON.stringify(messages.map(m => ({
            role: m.role,
            contentLength: m.content?.length || 0
          })), null, 2));
          
          // Return a helpful error instead of empty content
          return {
            content: `Error: Groq API returned empty response. Please check:\n` +
                    `1. Your API key is valid\n` +
                    `2. The model name is correct (${groqModelName})\n` +
                    `3. Check server logs for detailed error information\n` +
                    `4. Try reducing max_tokens or adjusting temperature`,
            success: false,
            error: 'Empty response from Groq API'
          };
        }
        
        // Ensure content is not just whitespace
        const trimmedContent = responseContent.trim();
        if (trimmedContent === '') {
          console.error(`[LLM Service] Response content is only whitespace`);
          return {
            content: `Error: Response contained only whitespace. Try adjusting parameters.`,
            success: false,
            error: 'Whitespace-only response'
          };
        }
        
        return {
          content: trimmedContent,
          success: true,
        };
      } catch (apiError) {
        console.error(`[LLM Service] Groq API call failed:`, apiError);
        throw new Error(
          `Groq API error: ${apiError.message || 'Unknown error'}. ` +
          `Model: ${groqModelName}, BaseURL: ${groqBaseURL}. ` +
          `Get your free API key at: https://console.groq.com/keys`
        );
      }
    }
    
    // For DeepSeek, use OpenAI SDK directly to avoid LangChain validation issues
    if (isDeepSeek) {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY is not configured. Please set it in your .env file. Get your API key at: https://platform.deepseek.com/usage');
      }
      
      const deepSeekBaseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
      console.log(`[LLM Service] Using DeepSeek with baseURL: ${deepSeekBaseURL}`);
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: deepSeekBaseURL,
      });
      
      // Build messages array for OpenAI format
      const messages = [];
      
      // Add system message if provided
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add conversation history
      for (const msg of conversationHistory) {
        if (msg.role === 'user' || msg.role === 'human') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant' || msg.role === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        } else if (msg.role === 'system') {
          messages.push({ role: 'system', content: msg.content });
        }
      }
      
      // Ensure we have at least one user message
      if (messages.filter(m => m.role === 'user').length === 0) {
        messages.push({ role: 'user', content: 'Hello' });
      }
      
      // Make direct API call to DeepSeek
      // Use 'deepseek-chat' as the model name (DeepSeek's standard model identifier)
      const modelName = 'deepseek-chat'; // Always use the standard model name
      console.log(`[LLM Service] Making DeepSeek API call with model: ${modelName}, messages count: ${messages.length}`);
      console.log(`[LLM Service] Base URL: ${deepSeekBaseURL}, API Key present: ${!!apiKey}`);
      
      try {
        const completion = await client.chat.completions.create({
          model: modelName,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
        });
        console.log(`[LLM Service] DeepSeek API call successful`);
        
        return {
          content: completion.choices[0]?.message?.content || 'No response generated',
          success: true,
        };
      } catch (apiError) {
        console.error(`[LLM Service] DeepSeek API call failed:`, apiError);
        // Re-throw with more context
        throw new Error(
          `DeepSeek API error: ${apiError.message || 'Unknown error'}. ` +
          `Model: ${modelName}, BaseURL: ${deepSeekBaseURL}. ` +
          `Please verify your DEEPSEEK_API_KEY is correct.`
        );
      }
      
    }
    
    // For OpenAI models, use LangChain
    // Safety check: ensure we're not accidentally using LangChain for DeepSeek or Groq
    if (model.toLowerCase().startsWith('deepseek') || model.toLowerCase().startsWith('groq-') || model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral')) {
      throw new Error(`Model detected but not handled correctly. This should not happen. Model: ${model}`);
    }
    
    const { llm } = createLLM(model, temperature, maxTokens, systemPrompt);

    // Build messages array
    const messages = [];

    // Add system message if provided
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }

    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === 'user' || msg.role === 'human') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant' || msg.role === 'ai') {
        messages.push(new AIMessage(msg.content));
      } else if (msg.role === 'system') {
        messages.push(new SystemMessage(msg.content));
      }
    }

    // Generate response
    const response = await llm.invoke(messages);
    
    return {
      content: response.content,
      success: true,
    };
  } catch (error) {
    console.error('[LLM Service] Error generating LLM response:', error);
    console.error('[LLM Service] Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      response: error.response?.data,
      model: model
    });
    
    // Provide more helpful error messages for DeepSeek
    let errorMessage = error.message || 'Failed to generate response';
    
    // Check for OpenAI SDK error format
    const errorStatus = error.status || error.response?.status || error.statusCode;
    const errorData = error.response?.data || error.error || {};
    
    if (errorStatus === 404 || errorMessage.includes('does not exist') || errorMessage.includes('MODEL_NOT_FOUND') || errorData.code === 'model_not_found') {
      const isDeepSeek = model.toLowerCase().startsWith('deepseek');
      if (isDeepSeek) {
        errorMessage = `DeepSeek model "${model}" not found (404). Please verify:\n` +
          `1. DEEPSEEK_API_KEY is set correctly in your .env file\n` +
          `2. The model name is correct (should be "deepseek-chat")\n` +
          `3. Your API key has access to this model\n` +
          `4. The base URL is correct (https://api.deepseek.com)\n\n` +
          `Get your API key at: https://platform.deepseek.com/usage`;
      }
    } else if (errorStatus === 401 || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid API key') || errorData.code === 'invalid_api_key') {
      const isDeepSeek = model.toLowerCase().startsWith('deepseek');
      if (isDeepSeek) {
        errorMessage = `Invalid DeepSeek API key (401). Please check your DEEPSEEK_API_KEY in the .env file.\n\n` +
          `Get your API key at: https://platform.deepseek.com/usage`;
      }
    }
    
    return {
      content: `Error: ${errorMessage}`,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Formats conversation history for Langchain
 * Converts our message format to Langchain message format
 */
/**
 * Generates a streaming response from an LLM
 */
export async function generateStreamingResponse(
  model,
  temperature,
  maxTokens,
  systemPrompt,
  conversationHistory,
  onChunk
) {
  try {
    const isDeepSeek = model.toLowerCase().startsWith('deepseek');
    const isGroq = model.toLowerCase().startsWith('groq-') || model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral');
    
    if (isGroq) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured.');
      }
      
      const groqBaseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: groqBaseURL,
      });
      
      // Build messages array
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      for (const msg of conversationHistory) {
        if (msg.role === 'user' || msg.role === 'human') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant' || msg.role === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        } else if (msg.role === 'system') {
          messages.push({ role: 'system', content: msg.content });
        }
      }
      
      if (messages.filter(m => m.role === 'user').length === 0) {
        messages.push({ role: 'user', content: 'Hello' });
      }
      
      // Map model names
      let groqModelName = model;
      if (model.toLowerCase().includes('llama-3.1-8b') || model.toLowerCase() === 'groq-llama-8b') {
        groqModelName = 'llama-3.1-8b-instant';
      } else if (model.toLowerCase().includes('llama-3.1-70b') || model.toLowerCase() === 'groq-llama-70b') {
        groqModelName = 'llama-3.1-70b-versatile';
      } else if (model.toLowerCase().includes('mixtral') || model.toLowerCase() === 'groq-mixtral') {
        groqModelName = 'mixtral-8x7b-32768';
      } else if (model.toLowerCase().includes('gemma')) {
        groqModelName = 'gemma2-9b-it';
      }
      
      // Stream response
      const stream = await client.chat.completions.create({
        model: groqModelName,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } else if (isDeepSeek) {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY is not configured.');
      }
      
      const deepSeekBaseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: deepSeekBaseURL,
      });
      
      // Build messages array
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      for (const msg of conversationHistory) {
        if (msg.role === 'user' || msg.role === 'human') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant' || msg.role === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        } else if (msg.role === 'system') {
          messages.push({ role: 'system', content: msg.content });
        }
      }
      
      if (messages.filter(m => m.role === 'user').length === 0) {
        messages.push({ role: 'user', content: 'Hello' });
      }
      
      // Stream response
      const stream = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } else {
      // For OpenAI, use LangChain streaming (if supported)
      throw new Error('Streaming not yet implemented for OpenAI models');
    }
  } catch (error) {
    console.error('Error in generateStreamingResponse:', error);
    throw error;
  }
}

export function formatConversationHistory(messages) {
  return messages.map((msg) => ({
    role: msg.side === 'llm1' || msg.side === 'llm2' ? 'assistant' : 'user',
    content: msg.content,
  }));
}

