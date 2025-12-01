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
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
          <span className="text-xs text-foreground font-medium">{value}</span>
        </div>
      )}
      {type === "slider" ? (
        <div className="flex items-center h-9">
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
        </div>
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
