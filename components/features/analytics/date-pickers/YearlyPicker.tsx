import { getYear } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from ".";

export function YearPicker({
  value,
  onApply,
}: {
  value: DateRange;
  onApply: (r: DateRange) => void;
}) {
  const initY = getYear(value.from);
  const [decadeBase, setDecadeBase] = useState(Math.floor(initY / 9) * 9);
  const [step, setStep] = useState<"start" | "end">("start");
  const [startY, setStartY] = useState(initY);
  const [endY, setEndY] = useState(getYear(value.to));

  const select = (y: number) => {
    if (step === "start") {
      setStartY(y);
      setEndY(y);
      setStep("end");
    } else {
      const s = Math.min(y, startY),
        e = Math.max(y, startY);
      setStartY(s);
      setEndY(e);
      setStep("start");
    }
  };

  const years = Array.from({ length: 9 }, (_, i) => decadeBase + i);

  return (
    <div className="w-64">
      <div className="p-4">
        <p className="text-xs font-semibold text-foreground mb-0.5">
          Select Year Range
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          {step === "start"
            ? "Click a year to set start"
            : `${startY} selected — click end year`}
        </p>
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDecadeBase((d) => d - 9)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-semibold">
            {decadeBase}–{decadeBase + 8}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDecadeBase((d) => d + 9)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((y) => {
            const isStart = step === "end" && y === startY;
            const isEnd = step === "end" && y === endY && y !== startY;
            const inRange = step === "end" && y > startY && y < endY;
            return (
              <button
                key={y}
                onClick={() => select(y)}
                className={cn(
                  "rounded-lg border py-2 text-xs font-medium transition-colors",
                  isStart || isEnd
                    ? "bg-primary text-white border-primary"
                    : inRange
                      ? "bg-[#e8f5f0] text-primary border-[#c8eae2]"
                      : "border-border hover:bg-muted text-foreground",
                )}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {step === "end"
            ? `${startY} → pick end`
            : startY === endY
              ? `${startY}`
              : `${startY} – ${endY}`}
        </span>
        <Button
          size="sm"
          disabled={step === "end"}
          onClick={() =>
            onApply({
              from: new Date(startY, 0, 1),
              to: new Date(endY, 11, 31),
            })
          }
          className="h-7 px-4 text-xs bg-primary hover:bg-[#138d75] text-white rounded-full disabled:opacity-40"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
