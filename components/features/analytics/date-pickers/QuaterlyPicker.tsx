import { Button } from "@/components/ui/button";
import { endOfMonth, getMonth, getYear } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from ".";

const QUARTER_LABELS = [
  "Q1 (Jan – Mar)",
  "Q2 (Apr – Jun)",
  "Q3 (Jul – Sep)",
  "Q4 (Oct – Dec)",
];

export function QuarterPicker({
  value,
  onApply,
}: {
  value: DateRange;
  onApply: (r: DateRange) => void;
}) {
  const [year, setYear] = useState(getYear(value.from));
  const [step, setStep] = useState<"start" | "end">("start");
  const [startQ, setStartQ] = useState(Math.floor(getMonth(value.from) / 3));
  const [endQ, setEndQ] = useState(Math.floor(getMonth(value.to) / 3));

  const select = (q: number) => {
    if (step === "start") {
      setStartQ(q);
      setEndQ(q);
      setStep("end");
    } else {
      const s = Math.min(q, startQ),
        e = Math.max(q, startQ);
      setStartQ(s);
      setEndQ(e);
      setStep("start");
    }
  };

  return (
    <div className="w-72">
      <div className="p-4">
        <p className="text-xs font-semibold text-foreground mb-0.5">
          Select Quarter Range
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          {step === "start"
            ? "Click a quarter to set start"
            : `Q${startQ + 1} ${year} selected — click end quarter`}
        </p>
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-semibold">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUARTER_LABELS.map((ql, q) => (
            <Button
              key={q}
              variant="outline"
              onClick={() => select(q)}
              className="border-border font-normal text-xs"
            >
              {ql}
            </Button>
          ))}
        </div>
      </div>
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {step === "end"
            ? `Q${startQ + 1} ${year} → pick end`
            : `Q${startQ + 1} – Q${endQ + 1} ${year}`}
        </span>
        <Button
          size="sm"
          disabled={step === "end"}
          onClick={() =>
            onApply({
              from: new Date(year, startQ * 3, 1),
              to: endOfMonth(new Date(year, endQ * 3 + 2, 1)),
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
