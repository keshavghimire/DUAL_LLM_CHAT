// Get API URL from environment, or construct from server port
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const serverPort = import.meta.env.VITE_SERVER_PORT || '3002';
  return `http://localhost:${serverPort}/api`;
};

const API_BASE_URL = getApiUrl();

export interface LLMRequest {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system' | 'human' | 'ai';
    content: string;
  }>;
}

export interface LLMResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Calls the backend API to generate an LLM response
 */
export async function generateLLMResponse(request: LLMRequest): Promise<LLMResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      
      // Provide helpful suggestions for common errors
      if (errorMessage.includes('does not exist') || errorMessage.includes('MODEL_NOT_FOUND')) {
        throw new Error(
          `${errorMessage}\n\n💡 Tips:\n` +
          `1. For DeepSeek: Make sure DEEPSEEK_API_KEY is set in your .env file\n` +
          `2. Try using "deepseek-chat" (free tier available) or "gpt-3.5-turbo"\n` +
          `3. You can change the model in the Model selector above\n\n` +
          `Get DeepSeek API key at: https://platform.deepseek.com/usage`
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('exceeded')) {
        throw new Error(
          `OpenAI API Quota Exceeded\n\n` +
          `💡 Solutions:\n` +
          `1. Switch to DeepSeek Chat (free tier available) - Change model to "deepseek-chat" in the Model selector\n` +
          `2. Add billing to your OpenAI account: https://platform.openai.com/account/billing\n` +
          `3. Wait for your quota to reset (usually monthly)\n\n` +
          `DeepSeek is a great free alternative! Get your API key at: https://platform.deepseek.com/usage`
        );
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling LLM API:', error);
    return {
      content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calls the backend API to generate a streaming LLM response
 */
export async function generateLLMResponseStream(
  request: LLMRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // If 404, fallback to non-streaming endpoint
      if (response.status === 404) {
        console.warn('Streaming endpoint not available, falling back to non-streaming...');
        const fallbackResponse = await generateLLMResponse(request);
        if (fallbackResponse.success && fallbackResponse.content) {
          // Simulate streaming by sending content character by character
          const content = fallbackResponse.content;
          for (let i = 0; i < content.length; i++) {
            onChunk(content[i]);
            // Slower delay for character-by-character effect
            await new Promise(resolve => setTimeout(resolve, 15));
          }
          onComplete();
          return;
        } else {
          onError(fallbackResponse.error || 'Failed to generate response');
          return;
        }
      }
      
      // Try to read error from SSE stream if it's text/event-stream
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          try {
            const { value } = await reader.read();
            const text = decoder.decode(value);
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  onError(data.error);
                  return;
                }
              }
            }
          } catch (e) {
            // Fall through to default error
          }
        }
      } else {
        // Try to parse as JSON
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        onError(errorMessage);
        return;
      }
      onError(`HTTP error! status: ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError('Failed to get response stream');
      return;
    }

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              onError(data.error);
              return;
            }
            if (data.content) {
              onChunk(data.content);
            }
            if (data.done) {
              onComplete();
              return;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in streaming LLM API:', error);
    onError(error instanceof Error ? error.message : 'Failed to stream response');
  }
}

/**
 * Converts frontend message format to API format
 * For dual LLM conversation: each LLM responds to the other LLM's messages
 */
export function formatMessagesForAPI(
  llm1Messages: Array<{ content: string; id: string }>,
  llm2Messages: Array<{ content: string; id: string }>,
  currentSide: 'llm1' | 'llm2'
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
  
  // Build conversation history by interleaving messages
  // Each LLM sees the other's messages as "user" input and its own as "assistant"
  const maxHistory = 20; // Keep last 20 messages for context
  
  // Get recent messages (skip initial greetings)
  const recentLlm1 = llm1Messages.slice(1).slice(-maxHistory);
  const recentLlm2 = llm2Messages.slice(1).slice(-maxHistory);
  
  if (currentSide === 'llm1') {
    // LLM1 is responding, so LLM2's messages are the "user" input
    // Build history: alternate between user (llm2) and assistant (llm1)
    const maxPairs = Math.max(recentLlm1.length, recentLlm2.length);
    for (let i = 0; i < maxPairs; i++) {
      if (i < recentLlm2.length && recentLlm2[i].content.trim()) {
        history.push({ role: 'user', content: recentLlm2[i].content });
      }
      if (i < recentLlm1.length && recentLlm1[i].content.trim()) {
        history.push({ role: 'assistant', content: recentLlm1[i].content });
      }
    }
    // Ensure the last message is a user message (what we're responding to)
    if (recentLlm2.length > 0 && recentLlm2[recentLlm2.length - 1].content.trim()) {
      // Remove any trailing assistant messages and add the last user message
      while (history.length > 0 && history[history.length - 1].role === 'assistant') {
        history.pop();
      }
      history.push({ role: 'user', content: recentLlm2[recentLlm2.length - 1].content });
    }
  } else {
    // LLM2 is responding, so LLM1's messages are the "user" input
    const maxPairs = Math.max(recentLlm1.length, recentLlm2.length);
    for (let i = 0; i < maxPairs; i++) {
      if (i < recentLlm1.length && recentLlm1[i].content.trim()) {
        history.push({ role: 'user', content: recentLlm1[i].content });
      }
      if (i < recentLlm2.length && recentLlm2[i].content.trim()) {
        history.push({ role: 'assistant', content: recentLlm2[i].content });
      }
    }
    // Ensure the last message is a user message (what we're responding to)
    if (recentLlm1.length > 0 && recentLlm1[recentLlm1.length - 1].content.trim()) {
      // Remove any trailing assistant messages and add the last user message
      while (history.length > 0 && history[history.length - 1].role === 'assistant') {
        history.pop();
      }
      history.push({ role: 'user', content: recentLlm1[recentLlm1.length - 1].content });
    }
  }
  
  // Filter out empty messages and ensure we have at least one user message
  const filteredHistory = history.filter(msg => msg.content && msg.content.trim());
  const hasUserMessage = filteredHistory.some(msg => msg.role === 'user');
  
  return hasUserMessage ? filteredHistory : [];
}

