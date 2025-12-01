import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChatPanel } from "@/components/ChatPanel";
import { GlobalControls } from "@/components/GlobalControls";
import { generateLLMResponseStream, formatMessagesForAPI } from "@/services/api";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender?: "llm1" | "llm2";
}

interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, startingLlm } = (location.state as { topic?: string; startingLlm?: "llm1" | "llm2" }) || {};

  // Redirect to home if no topic provided
  useEffect(() => {
    if (!topic) {
      navigate("/", { replace: true });
    }
  }, [topic, navigate]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<"llm1" | "llm2" | null>(null);
  const [turnCount, setTurnCount] = useState(0);

  const getSystemPrompt = (llmNumber: 1 | 2) => {
    const basePrompt = llmNumber === 1
      ? "You are having a natural, human-like conversation. Keep your responses concise, conversational, and engaging. Aim for 2-3 sentences maximum. Be friendly and authentic, like chatting with a friend."
      : "You are having a natural, human-like conversation. Keep your responses concise, conversational, and engaging. Aim for 2-3 sentences maximum. Be thoughtful and authentic, like chatting with a friend.";
    
    if (topic) {
      return `${basePrompt} The conversation topic is: "${topic}". Keep responses short and natural.`;
    }
    return basePrompt;
  };

  // Memoize initial values based on topic
  const initialLlm1SystemPrompt = useMemo(() => getSystemPrompt(1), [topic]);
  const initialLlm2SystemPrompt = useMemo(() => getSystemPrompt(2), [topic]);

  const [llm1Messages, setLlm1Messages] = useState<Message[]>([]);
  const [llm2Messages, setLlm2Messages] = useState<Message[]>([]);

  const [llm1Config, setLlm1Config] = useState<LLMConfig>({
    model: "groq-llama-8b",
    temperature: 0.7,
    maxTokens: 200,
    systemPrompt: initialLlm1SystemPrompt,
  });

  const [llm2Config, setLlm2Config] = useState<LLMConfig>({
    model: "groq-llama-8b",
    temperature: 0.7,
    maxTokens: 200,
    systemPrompt: initialLlm2SystemPrompt,
  });

  const [isLlm1Typing, setIsLlm1Typing] = useState(false);
  const [isLlm2Typing, setIsLlm2Typing] = useState(false);
  const [isLlm1Thinking, setIsLlm1Thinking] = useState(false);
  const [isLlm2Thinking, setIsLlm2Thinking] = useState(false);
  const [isLlm1Generating, setIsLlm1Generating] = useState(false);
  const [isLlm2Generating, setIsLlm2Generating] = useState(false);
  const [streamingMessageIds, setStreamingMessageIds] = useState<Set<string>>(new Set());
  const hasAutoStarted = useRef(false);

  // Combine all messages for unified chat view
  const allMessages = useMemo(() => {
    const combined: Message[] = [];
    
    // Add all LLM1 messages with sender info
    llm1Messages.forEach(msg => {
      combined.push({ ...msg, sender: "llm1" });
    });
    
    // Add all LLM2 messages with sender info
    llm2Messages.forEach(msg => {
      combined.push({ ...msg, sender: "llm2" });
    });
    
    // Sort by ID (which includes timestamp) to maintain chronological order
    // Messages are added with Date.now() so higher ID = later message
    return combined.sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idA - idB;
    });
  }, [llm1Messages, llm2Messages]);

  // Filter messages for each panel: show streaming messages only on the generating panel
  const llm1PanelMessages = useMemo(() => {
    return allMessages.filter(msg => {
      // Show all messages, including LLM1's streaming messages
      // But hide LLM2's streaming messages (only show completed ones)
      if (msg.sender === "llm2" && streamingMessageIds.has(msg.id)) {
        return false; // Hide LLM2's streaming messages from LLM1 panel
      }
      return true;
    });
  }, [allMessages, streamingMessageIds]);

  const llm2PanelMessages = useMemo(() => {
    return allMessages.filter(msg => {
      // Show all messages, including LLM2's streaming messages
      // But hide LLM1's streaming messages (only show completed ones)
      if (msg.sender === "llm1" && streamingMessageIds.has(msg.id)) {
        return false; // Hide LLM1's streaming messages from LLM2 panel
      }
      return true;
    });
  }, [allMessages, streamingMessageIds]);

  const handleStart = () => {
    setIsRunning(true);
    // Use the starting LLM from navigation state, default to llm1
    setCurrentTurn(startingLlm || "llm1");
    setTurnCount(1);
  };

  const handlePause = () => {
    setIsRunning(false);
    setCurrentTurn(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentTurn(null);
    setTurnCount(0);
    hasAutoStarted.current = false; // Reset auto-start flag
    setLlm1Messages([]);
    setLlm2Messages([]);
    setIsLlm1Typing(false);
    setIsLlm2Typing(false);
    setIsLlm1Thinking(false);
    setIsLlm2Thinking(false);
    setStreamingMessageIds(new Set());
  };

  const handleLlm1SendMessage = async () => {
    if (!isRunning && turnCount === 0) {
      // First message - need to start the conversation
      setIsRunning(true);
      setCurrentTurn("llm1");
      setTurnCount(1);
    }

    // Show "thinking" for 2 seconds before starting generation (only on LLM1 side)
    setIsLlm1Thinking(true);
    setIsLlm1Generating(true); // Disable send button
    
    // Use requestAnimationFrame to ensure React renders the thinking state
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 100);
      });
    });
    
    // Wait 2 seconds before starting generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLlm1Thinking(false);
    // Only show typing on LLM2 side while LLM1 is generating
    setIsLlm2Typing(true);

    try {
      // Format conversation history for API
      const conversationHistory = formatMessagesForAPI(
        llm1Messages,
        llm2Messages,
        'llm1'
      );

      // If no conversation history yet, use the topic as the initial message
      if (conversationHistory.length === 0 && topic) {
        conversationHistory.push({
          role: 'user',
          content: `Let's discuss: "${topic}". Please start the conversation.`
        });
      }

      // Create a temporary message for streaming
      const tempMessageId = Date.now().toString();
      const tempMessage: Message = {
        id: tempMessageId,
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        sender: "llm1",
      };
      setLlm1Messages([...llm1Messages, tempMessage]);
      setStreamingMessageIds(prev => new Set(prev).add(tempMessageId)); // Mark as streaming

      // Call the streaming API
      let accumulatedContent = '';
      await generateLLMResponseStream(
        {
          model: llm1Config.model,
          temperature: llm1Config.temperature,
          maxTokens: llm1Config.maxTokens,
          systemPrompt: llm1Config.systemPrompt,
          conversationHistory,
        },
        async (chunk: string) => {
          // Update message character-by-character for slower, smoother streaming
          for (let i = 0; i < chunk.length; i++) {
            accumulatedContent += chunk[i];
            setLlm1Messages(prev => 
              prev.map(msg => 
                msg.id === tempMessageId 
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
            // Small delay for character-by-character effect (slower)
            await new Promise(resolve => setTimeout(resolve, 15));
          }
        },
        () => {
          // Streaming complete
          setIsLlm2Typing(false);
          setIsLlm1Thinking(false);
          setIsLlm1Generating(false);
          setStreamingMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempMessageId); // Remove from streaming set
            return newSet;
          });
          if (!accumulatedContent || accumulatedContent.trim() === '') {
            // Remove empty message
            setLlm1Messages(prev => prev.filter(msg => msg.id !== tempMessageId));
            toast.error(`LLM 1 Error: Received empty response.`, {
              duration: 6000,
            });
          } else {
            setCurrentTurn("llm2");
            setTurnCount(turnCount + 1);
          }
        },
        (error: string) => {
          // Error occurred
          setIsLlm2Typing(false);
          setIsLlm1Thinking(false);
          setIsLlm1Generating(false);
          setStreamingMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempMessageId); // Remove from streaming set
            return newSet;
          });
          setLlm1Messages(prev => prev.filter(msg => msg.id !== tempMessageId));
          console.error(`[LLM1] Streaming Error:`, error);
          toast.error(`LLM 1 Error: ${error}`, {
            duration: 6000,
          });
        }
      );
    } catch (error) {
      setIsLlm2Typing(false);
      setIsLlm1Thinking(false);
      setIsLlm1Generating(false);
      console.error('Error generating LLM1 response:', error);
      toast.error(`LLM 1 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLlm2SendMessage = async () => {
    if (!isRunning && turnCount === 0) {
      // First message - need to start the conversation
      setIsRunning(true);
      setCurrentTurn("llm2");
      setTurnCount(1);
    }

    // Show "thinking" for 2 seconds before starting generation (only on LLM2 side)
    setIsLlm2Thinking(true);
    setIsLlm2Generating(true); // Disable send button
    
    // Use requestAnimationFrame to ensure React renders the thinking state
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 100);
      });
    });
    
    // Wait 2 seconds before starting generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLlm2Thinking(false);
    // Only show typing on LLM1 side while LLM2 is generating
    setIsLlm1Typing(true);

    try {
      // Format conversation history for API
      const conversationHistory = formatMessagesForAPI(
        llm1Messages,
        llm2Messages,
        'llm2'
      );

      // If no conversation history yet, use the topic as the initial message
      if (conversationHistory.length === 0 && topic) {
        conversationHistory.push({
          role: 'user',
          content: `Let's discuss: "${topic}". Please start the conversation.`
        });
      }

      // Create a temporary message for streaming
      const tempMessageId = Date.now().toString();
      const tempMessage: Message = {
        id: tempMessageId,
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        sender: "llm2",
      };
      setLlm2Messages([...llm2Messages, tempMessage]);
      setStreamingMessageIds(prev => new Set(prev).add(tempMessageId)); // Mark as streaming

      // Call the streaming API
      let accumulatedContent = '';
      await generateLLMResponseStream(
        {
          model: llm2Config.model,
          temperature: llm2Config.temperature,
          maxTokens: llm2Config.maxTokens,
          systemPrompt: llm2Config.systemPrompt,
          conversationHistory,
        },
        async (chunk: string) => {
          // Update message character-by-character for slower, smoother streaming
          for (let i = 0; i < chunk.length; i++) {
            accumulatedContent += chunk[i];
            setLlm2Messages(prev => 
              prev.map(msg => 
                msg.id === tempMessageId 
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
            // Small delay for character-by-character effect (slower)
            await new Promise(resolve => setTimeout(resolve, 15));
          }
        },
        () => {
          // Streaming complete
          setIsLlm1Typing(false);
          setIsLlm2Thinking(false);
          setIsLlm2Generating(false);
          setStreamingMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempMessageId); // Remove from streaming set
            return newSet;
          });
          if (!accumulatedContent || accumulatedContent.trim() === '') {
            // Remove empty message
            setLlm2Messages(prev => prev.filter(msg => msg.id !== tempMessageId));
            toast.error(`LLM 2 Error: Received empty response.`, {
              duration: 6000,
            });
          } else {
            setCurrentTurn("llm1");
            setTurnCount(turnCount + 1);
          }
        },
        (error: string) => {
          // Error occurred
          setIsLlm1Typing(false);
          setIsLlm2Thinking(false);
          setIsLlm2Generating(false);
          setStreamingMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempMessageId); // Remove from streaming set
            return newSet;
          });
          setLlm2Messages(prev => prev.filter(msg => msg.id !== tempMessageId));
          console.error(`[LLM2] Streaming Error:`, error);
          toast.error(`LLM 2 Error: ${error}`, {
            duration: 6000,
          });
        }
      );
    } catch (error) {
      setIsLlm1Typing(false);
      setIsLlm2Thinking(false);
      setIsLlm2Generating(false);
      console.error('Error generating LLM2 response:', error);
      toast.error(`LLM 2 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Auto-start conversation when topic and starting LLM are provided
  useEffect(() => {
    if (topic && startingLlm && !hasAutoStarted.current && !isRunning && turnCount === 0) {
      hasAutoStarted.current = true;
      // Small delay to ensure component is fully mounted and handlers are ready
      const timer = setTimeout(() => {
        if (startingLlm === "llm1") {
          handleLlm1SendMessage();
        } else {
          handleLlm2SendMessage();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, startingLlm, isRunning, turnCount]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <GlobalControls
        isRunning={isRunning}
        currentTurn={currentTurn}
        turnCount={turnCount}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />

      <div className="flex-1 grid grid-cols-2 divide-x divide-border overflow-hidden">
        {/* LLM 1 Panel */}
        <div className="bg-card/30 h-full overflow-hidden">
          <ChatPanel
            side="llm1"
            title="LLM 1"
            messages={llm1PanelMessages}
            isTyping={isLlm1Typing}
            isThinking={isLlm1Thinking}
            isGenerating={isLlm1Generating}
            model={llm1Config.model}
            temperature={llm1Config.temperature}
            maxTokens={llm1Config.maxTokens}
            systemPrompt={llm1Config.systemPrompt}
            onModelChange={(model) => setLlm1Config({ ...llm1Config, model })}
            onTemperatureChange={(temperature) => setLlm1Config({ ...llm1Config, temperature })}
            onMaxTokensChange={(maxTokens) => setLlm1Config({ ...llm1Config, maxTokens })}
            onSystemPromptChange={(systemPrompt) => setLlm1Config({ ...llm1Config, systemPrompt })}
            onSendMessage={handleLlm1SendMessage}
            currentTurn={currentTurn}
            isRunning={isRunning}
          />
        </div>

        {/* LLM 2 Panel */}
        <div className="bg-card/30 h-full overflow-hidden">
          <ChatPanel
            side="llm2"
            title="LLM 2"
            messages={llm2PanelMessages}
            isTyping={isLlm2Typing}
            isThinking={isLlm2Thinking}
            isGenerating={isLlm2Generating}
            model={llm2Config.model}
            temperature={llm2Config.temperature}
            maxTokens={llm2Config.maxTokens}
            systemPrompt={llm2Config.systemPrompt}
            onModelChange={(model) => setLlm2Config({ ...llm2Config, model })}
            onTemperatureChange={(temperature) => setLlm2Config({ ...llm2Config, temperature })}
            onMaxTokensChange={(maxTokens) => setLlm2Config({ ...llm2Config, maxTokens })}
            onSystemPromptChange={(systemPrompt) => setLlm2Config({ ...llm2Config, systemPrompt })}
            onSendMessage={handleLlm2SendMessage}
            currentTurn={currentTurn}
            isRunning={isRunning}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
