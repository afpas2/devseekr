import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface MetricSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const MetricSlider = ({ label, value, onChange }: MetricSliderProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-semibold text-primary">{value}/5</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={1}
        max={5}
        step={1}
        className="w-full"
      />
    </div>
  );
};
