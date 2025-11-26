import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  side: "llm1" | "llm2";
}

export const ModelSelector = ({ value, onChange, side }: ModelSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Model</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm bg-card border-border">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4">GPT-4</SelectItem>
          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
