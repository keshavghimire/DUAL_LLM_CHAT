import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface ParameterControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  type?: "slider" | "input";
}

export const ParameterControl = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step,
  type = "slider"
}: ParameterControlProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <span className="text-xs text-foreground font-medium">{value}</span>
      </div>
      {type === "slider" ? (
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      ) : (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="h-9 text-sm"
        />
      )}
    </div>
  );
};
