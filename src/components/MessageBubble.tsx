import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  timestamp: string;
  side: "llm1" | "llm2";
  panelSide?: "llm1" | "llm2"; // Which panel is showing this message
}

export const MessageBubble = ({ message, timestamp, side, panelSide }: MessageBubbleProps) => {
  const isRightAligned = side === "llm2";
  const isOwnMessage = panelSide === side; // Message from this panel's LLM
  
  return (
    <div className={cn(
      "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isRightAligned && "flex-row-reverse"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        side === "llm1" ? "bg-llm1/10 text-llm1" : "bg-llm2/10 text-llm2"
      )}>
        <Bot className="w-4 h-4" />
      </div>
      <div className={cn(
        "flex-1 min-w-0",
        isRightAligned && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-2xl px-3 py-2 shadow-sm backdrop-blur-sm",
          side === "llm1" 
            ? isOwnMessage
              ? "bg-llm1/15 border border-llm1/20 dark:bg-llm1/25" 
              : "bg-llm1/5 border border-llm1/10"
            : isOwnMessage
              ? "bg-llm2/15 border border-llm2/20 dark:bg-llm2/25"
              : "bg-llm2/5 border border-llm2/10",
          isRightAligned && "max-w-[80%]"
        )}>
          <p className="text-xs text-foreground leading-relaxed">{message}</p>
        </div>
        <span className={cn(
          "text-[10px] text-muted-foreground mt-1 block",
          isRightAligned && "text-right"
        )}>{timestamp}</span>
      </div>
    </div>
  );
};
