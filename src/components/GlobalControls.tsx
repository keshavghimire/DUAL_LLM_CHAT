import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GlobalControlsProps {
  isRunning: boolean;
  currentTurn: "llm1" | "llm2" | null;
  turnCount: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export const GlobalControls = ({
  isRunning,
  currentTurn,
  turnCount,
  onStart,
  onPause,
  onReset,
}: GlobalControlsProps) => {
  return (
    <div className="px-6 py-4 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Dual LLM Conversation</h1>
          <Badge variant="secondary" className="text-xs">
            Turn {turnCount}
          </Badge>
          {currentTurn && (
            <Badge 
              variant="outline" 
              className={currentTurn === "llm1" ? "border-llm1 text-llm1" : "border-llm2 text-llm2"}
            >
              Current: LLM {currentTurn === "llm1" ? "1" : "2"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button onClick={onStart} size="sm" className="gap-2">
              <Play className="w-4 h-4" />
              Start Conversation
            </Button>
          ) : (
            <Button onClick={onPause} variant="secondary" size="sm" className="gap-2">
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}
          <Button onClick={onReset} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
