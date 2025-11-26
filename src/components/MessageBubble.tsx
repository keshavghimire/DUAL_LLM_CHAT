import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  timestamp: string;
  side: "llm1" | "llm2";
}

export const MessageBubble = ({ message, timestamp, side }: MessageBubbleProps) => {
  return (
    <div className={cn("flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300")}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        side === "llm1" ? "bg-llm1/10 text-llm1" : "bg-llm2/10 text-llm2"
      )}>
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm backdrop-blur-sm",
          side === "llm1" 
            ? "bg-llm1/5 border border-llm1/10" 
            : "bg-llm2/5 border border-llm2/10"
        )}>
          <p className="text-sm text-foreground leading-relaxed">{message}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">{timestamp}</span>
      </div>
    </div>
  );
};
