import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  side: "llm1" | "llm2";
  isTyping: boolean;
}

export const TypingIndicator = ({ side, isTyping }: TypingIndicatorProps) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground animate-in fade-in duration-200">
      <div className="flex gap-1">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full animate-bounce",
          side === "llm1" ? "bg-llm1" : "bg-llm2"
        )} style={{ animationDelay: "0ms" }} />
        <div className={cn(
          "w-1.5 h-1.5 rounded-full animate-bounce",
          side === "llm1" ? "bg-llm1" : "bg-llm2"
        )} style={{ animationDelay: "150ms" }} />
        <div className={cn(
          "w-1.5 h-1.5 rounded-full animate-bounce",
          side === "llm1" ? "bg-llm1" : "bg-llm2"
        )} style={{ animationDelay: "300ms" }} />
      </div>
      <span>Thinking...</span>
    </div>
  );
};
