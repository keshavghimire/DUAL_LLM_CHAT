import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ModelSelector } from "./ModelSelector";
import { ParameterControl } from "./ParameterControl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender?: "llm1" | "llm2";
}

interface ChatPanelProps {
  side: "llm1" | "llm2";
  title: string;
  messages: Message[];
  isTyping: boolean;
  isThinking?: boolean;
  isGenerating?: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temp: number) => void;
  onMaxTokensChange: (tokens: number) => void;
  onSystemPromptChange: (prompt: string) => void;
  onSendMessage: () => void;
  currentTurn?: "llm1" | "llm2" | null;
  isRunning?: boolean;
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
  currentTurn,
  isRunning = false,
  isThinking = false,
  isGenerating = false,
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
        "px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm",
        "shadow-sm flex-shrink-0"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            side === "llm1" ? "bg-llm1/10" : "bg-llm2/10"
          )}>
            <span className={cn(
              "text-base font-bold",
              side === "llm1" ? "text-llm1" : "text-llm2"
            )}>
              {side === "llm1" ? "1" : "2"}
            </span>
          </div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ScrollArea ref={scrollAreaRef} className="h-full w-full">
          <div ref={messagesContainerRef} className="px-4 py-3 space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message.content}
                timestamp={message.timestamp}
                side={message.sender || side}
                panelSide={side}
              />
            ))}
            <TypingIndicator 
              side={side} 
              isTyping={isThinking ? false : isTyping}
              isWaiting={isThinking}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Controls */}
      <div className="px-4 py-2.5 border-t border-border bg-card/50 backdrop-blur-sm space-y-2.5 flex-shrink-0">
        {/* Model, Temperature, and Max Tokens on same line */}
        <div className="grid grid-cols-3 gap-3 items-start">
          <ModelSelector value={model} onChange={onModelChange} side={side} />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 h-5">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Temperature</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        <strong>Temperature</strong> controls randomness:<br/>
                        • <strong>0.0-0.3</strong>: More focused, deterministic<br/>
                        • <strong>0.7</strong>: Balanced (default)<br/>
                        • <strong>1.0-2.0</strong>: More creative, varied
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs text-foreground font-medium">{temperature}</span>
            </div>
            <ParameterControl
              label=""
              value={temperature}
              onChange={onTemperatureChange}
              min={0}
              max={2}
              step={0.1}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 h-5">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Max Tokens</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        <strong>Max Tokens</strong> limits response length:<br/>
                        • <strong>50-200</strong>: Very short responses<br/>
                        • <strong>500</strong>: Short, concise (default)<br/>
                        • <strong>1000-2000</strong>: Longer, detailed responses
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs text-foreground font-medium">{maxTokens}</span>
            </div>
            <ParameterControl
              label=""
              value={maxTokens}
              onChange={onMaxTokensChange}
              min={50}
              max={500}
              step={50}
              type="input"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="Enter system prompt (optional)..."
              className={cn(
                "min-h-[50px] text-xs resize-none transition-all",
                "bg-muted/30 border-border/60",
                "focus:bg-background focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
                "placeholder:text-muted-foreground/60"
              )}
            />
          </div>
          <Button 
            onClick={onSendMessage}
            className={cn(
              "w-full gap-2 h-10 font-semibold shadow-md hover:shadow-lg transition-all",
              "rounded-lg",
              side === "llm1" 
                ? "bg-llm1 hover:bg-llm1/90 text-white active:bg-llm1/95" 
                : "bg-llm2 hover:bg-llm2/90 text-white active:bg-llm2/95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-sm"
            )}
            size="default"
            disabled={
              isGenerating ||
              isTyping || 
              (isRunning && currentTurn !== side)
            }
          >
            <Send className="w-4 h-4" />
            {(isRunning && currentTurn !== side)
              ? `Waiting for ${currentTurn === "llm1" ? "LLM 1" : "LLM 2"}...`
              : "Send Message"
            }
          </Button>
        </div>
      </div>
    </div>
  );
};
