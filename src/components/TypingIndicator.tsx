import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  side: "llm1" | "llm2";
  isTyping: boolean;
  isWaiting?: boolean; // Show "thinking" when waiting for other LLM
}

export const TypingIndicator = ({ side, isTyping, isWaiting = false }: TypingIndicatorProps) => {
  if (!isTyping && !isWaiting) return null;

  const isRightAligned = side === "llm2";
  // Prioritize thinking over typing - if waiting, show thinking
  const isThinking = isWaiting;
  const displayText = isThinking ? "Thinking..." : "Typing...";

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground animate-in fade-in duration-200",
      isRightAligned && "flex-row-reverse justify-end"
    )}>
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
      <span>{displayText}</span>
    </div>
  );
};
