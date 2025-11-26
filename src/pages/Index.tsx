import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChatPanel } from "@/components/ChatPanel";
import { GlobalControls } from "@/components/GlobalControls";

interface Message {
  id: string;
  content: string;
  timestamp: string;
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

  // Initialize messages with topic-based content
  const getInitialMessage = (llmNumber: 1 | 2, isStarter: boolean) => {
    if (isStarter && topic) {
      return `I'd like to discuss: "${topic}". Let's begin our conversation on this topic.`;
    }
    return `Hello! I'm LLM ${llmNumber}. Ready to engage in our conversation${topic ? ` about "${topic}"` : ""}.`;
  };

  const getSystemPrompt = (llmNumber: 1 | 2) => {
    const basePrompt = llmNumber === 1
      ? "You are a helpful AI assistant engaging in a collaborative conversation."
      : "You are a thoughtful AI assistant participating in an intellectual exchange.";
    
    if (topic) {
      return `${basePrompt} The conversation topic is: "${topic}". Engage thoughtfully on this subject.`;
    }
    return basePrompt;
  };

  // Memoize initial values based on topic and startingLlm
  const initialLlm1Message = useMemo(() => getInitialMessage(1, startingLlm === "llm1"), [topic, startingLlm]);
  const initialLlm2Message = useMemo(() => getInitialMessage(2, startingLlm === "llm2"), [topic, startingLlm]);
  const initialLlm1SystemPrompt = useMemo(() => getSystemPrompt(1), [topic]);
  const initialLlm2SystemPrompt = useMemo(() => getSystemPrompt(2), [topic]);

  const [llm1Messages, setLlm1Messages] = useState<Message[]>([
    {
      id: "1",
      content: initialLlm1Message,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [llm2Messages, setLlm2Messages] = useState<Message[]>([
    {
      id: "1",
      content: initialLlm2Message,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [llm1Config, setLlm1Config] = useState<LLMConfig>({
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: initialLlm1SystemPrompt,
  });

  const [llm2Config, setLlm2Config] = useState<LLMConfig>({
    model: "claude-3-opus",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: initialLlm2SystemPrompt,
  });

  const [isLlm1Typing, setIsLlm1Typing] = useState(false);
  const [isLlm2Typing, setIsLlm2Typing] = useState(false);

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
    const resetLlm1Message = getInitialMessage(1, startingLlm === "llm1");
    const resetLlm2Message = getInitialMessage(2, startingLlm === "llm2");
    setLlm1Messages([
      {
        id: "1",
        content: resetLlm1Message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setLlm2Messages([
      {
        id: "1",
        content: resetLlm2Message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleLlm1SendMessage = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: "This is a sample message from LLM 1. In a real implementation, this would come from the AI model.",
      timestamp: new Date().toLocaleTimeString(),
    };
    setLlm1Messages([...llm1Messages, newMessage]);
    setCurrentTurn("llm2");
    setTurnCount(turnCount + 1);
  };

  const handleLlm2SendMessage = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: "This is a sample message from LLM 2. In a real implementation, this would come from the AI model.",
      timestamp: new Date().toLocaleTimeString(),
    };
    setLlm2Messages([...llm2Messages, newMessage]);
    setCurrentTurn("llm1");
    setTurnCount(turnCount + 1);
  };

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
            messages={llm1Messages}
            isTyping={isLlm1Typing}
            model={llm1Config.model}
            temperature={llm1Config.temperature}
            maxTokens={llm1Config.maxTokens}
            systemPrompt={llm1Config.systemPrompt}
            onModelChange={(model) => setLlm1Config({ ...llm1Config, model })}
            onTemperatureChange={(temperature) => setLlm1Config({ ...llm1Config, temperature })}
            onMaxTokensChange={(maxTokens) => setLlm1Config({ ...llm1Config, maxTokens })}
            onSystemPromptChange={(systemPrompt) => setLlm1Config({ ...llm1Config, systemPrompt })}
            onSendMessage={handleLlm1SendMessage}
          />
        </div>

        {/* LLM 2 Panel */}
        <div className="bg-card/30 h-full overflow-hidden">
          <ChatPanel
            side="llm2"
            title="LLM 2"
            messages={llm2Messages}
            isTyping={isLlm2Typing}
            model={llm2Config.model}
            temperature={llm2Config.temperature}
            maxTokens={llm2Config.maxTokens}
            systemPrompt={llm2Config.systemPrompt}
            onModelChange={(model) => setLlm2Config({ ...llm2Config, model })}
            onTemperatureChange={(temperature) => setLlm2Config({ ...llm2Config, temperature })}
            onMaxTokensChange={(maxTokens) => setLlm2Config({ ...llm2Config, maxTokens })}
            onSystemPromptChange={(systemPrompt) => setLlm2Config({ ...llm2Config, systemPrompt })}
            onSendMessage={handleLlm2SendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
