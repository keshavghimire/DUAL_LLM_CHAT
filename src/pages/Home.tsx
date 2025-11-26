import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const Home = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [startingLlm, setStartingLlm] = useState<"llm1" | "llm2">("llm1");

  const handleStart = () => {
    if (!topic.trim()) {
      return; // Could add validation/error message here
    }
    
    navigate("/chat", {
      state: {
        topic: topic.trim(),
        startingLlm,
      },
    });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl mx-auto px-6">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Dual Chat AI</h1>
            <p className="text-muted-foreground">
              Start a conversation between two AI models
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Conversation Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-semibold">
                Conversation Topic / Prompt
              </Label>
              <Textarea
                id="topic"
                placeholder="Enter a topic or prompt to start the conversation... (e.g., 'Discuss the future of artificial intelligence', 'Debate climate change solutions', etc.)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[120px] text-sm resize-none"
              />
            </div>

            {/* Starting LLM Selector */}
            <div className="space-y-2">
              <Label htmlFor="starting-llm" className="text-sm font-semibold">
                Which LLM should start the conversation?
              </Label>
              <Select
                value={startingLlm}
                onValueChange={(value: "llm1" | "llm2") => setStartingLlm(value)}
              >
                <SelectTrigger id="starting-llm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llm1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-llm1"></div>
                      <span>LLM 1</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="llm2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-llm2"></div>
                      <span>LLM 2</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStart}
              disabled={!topic.trim()}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Start Conversation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

