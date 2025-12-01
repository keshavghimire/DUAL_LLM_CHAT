import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

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
          <div className="text-xs text-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0">{children}</ol>,
                li: ({ children }) => <li className="my-0">{children}</li>,
                code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-[0.7rem] font-mono">{children}</code>,
                h1: ({ children }) => <h1 className="text-sm font-bold mt-2 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xs font-bold mt-2 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-semibold mt-1 mb-0.5">{children}</h3>,
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        </div>
        <span className={cn(
          "text-[10px] text-muted-foreground mt-1 block",
          isRightAligned && "text-right"
        )}>{timestamp}</span>
      </div>
    </div>
  );
};
