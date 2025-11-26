import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ModelSelector } from "./ModelSelector";
import { ParameterControl } from "./ParameterControl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  side: "llm1" | "llm2";
  title: string;
  messages: Message[];
  isTyping: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temp: number) => void;
  onMaxTokensChange: (tokens: number) => void;
  onSystemPromptChange: (prompt: string) => void;
  onSendMessage: () => void;
}

export const ChatPanel = ({
  side,
  title,
  messages,
  isTyping,
  model,
  temperature,
  maxTokens,
  systemPrompt,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  onSystemPromptChange,
  onSendMessage,
}: ChatPanelProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully updated
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        // Find the viewport element inside ScrollArea
        // Radix UI ScrollArea creates a viewport div
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        
        if (viewport) {
          // Scroll to bottom
          viewport.scrollTop = viewport.scrollHeight;
        } else {
          // Fallback: try to find any scrollable element
          const scrollable = scrollAreaRef.current.querySelector('div[style*="overflow"]') as HTMLElement;
          if (scrollable) {
            scrollable.scrollTop = scrollable.scrollHeight;
          }
        }
      }
    };

    // Use both requestAnimationFrame and setTimeout for reliability
    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 0);
    });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm",
        "shadow-sm flex-shrink-0"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            side === "llm1" ? "bg-llm1/10" : "bg-llm2/10"
          )}>
            <span className={cn(
              "text-lg font-bold",
              side === "llm1" ? "text-llm1" : "text-llm2"
            )}>
              {side === "llm1" ? "1" : "2"}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ScrollArea ref={scrollAreaRef} className="h-full w-full">
          <div ref={messagesContainerRef} className="px-6 py-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message.content}
                timestamp={message.timestamp}
                side={side}
              />
            ))}
            <TypingIndicator side={side} isTyping={isTyping} />
          </div>
        </ScrollArea>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-t border-border bg-card/50 backdrop-blur-sm space-y-4 flex-shrink-0">
        <div className="grid grid-cols-2 gap-4">
          <ModelSelector value={model} onChange={onModelChange} side={side} />
          <ParameterControl
            label="Temperature"
            value={temperature}
            onChange={onTemperatureChange}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        <ParameterControl
          label="Max Tokens"
          value={maxTokens}
          onChange={onMaxTokensChange}
          min={100}
          max={4000}
          step={100}
          type="input"
        />

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">System Prompt</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder="Enter system prompt..."
            className="min-h-[80px] text-sm resize-none"
          />
        </div>

        <Button 
          onClick={onSendMessage}
          className="w-full gap-2"
          size="sm"
        >
          <Send className="w-4 h-4" />
          Send Message
        </Button>
      </div>
    </div>
  );
};
