import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  side: "llm1" | "llm2";
}

export const ModelSelector = ({ value, onChange, side }: ModelSelectorProps) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">Model</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm bg-card border-border">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="groq-llama-8b">Groq Llama 3.1 8B - FREE ⭐⭐⭐</SelectItem>
          <SelectItem value="groq-mixtral">Groq Mixtral 8x7B - FREE ⭐⭐</SelectItem>
          <SelectItem value="groq-llama-70b">Groq Llama 3.1 70B - FREE ⭐</SelectItem>
          <SelectItem value="deepseek-chat">DeepSeek Chat - Free Tier Available ⭐</SelectItem>
          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</SelectItem>
          <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
          <SelectItem value="gpt-4o-mini">GPT-4o Mini (OpenAI)</SelectItem>
          <SelectItem value="gpt-4">GPT-4 (OpenAI) - Requires Access</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
