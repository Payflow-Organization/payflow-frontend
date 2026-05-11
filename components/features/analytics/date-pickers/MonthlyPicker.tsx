import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format, endOfMonth, getMonth, getYear } from "date-fns";
import { DateRange, PartialDateRange } from ".";

export function MonthlyPicker({
  value,
  onApply,
}: {
  value: DateRange;
  onApply: (r: DateRange) => void;
}) {
  const [pending, setPending] = useState<PartialDateRange>({
    from: value.from,
    to: value.to,
  });

  const isComplete = !!(pending.from && pending.to);

  return (
    <div>
      <Calendar
        mode="range"
        selected={pending}
        onSelect={(r) => setPending({ from: r?.from, to: r?.to })}
        numberOfMonths={2}
        defaultMonth={value.from}
        className="rounded-t-lg border-b border-border"
        classNames={{
          today:
            "rounded-[--cell-radius] text-foreground data-[selected=true]:rounded-none",
          range_start:
            "rounded-l-[--cell-radius] bg-transparent after:bg-transparent",
          range_end:
            "rounded-r-[--cell-radius] bg-transparent after:bg-transparent",
        }}
        components={{
          DayButton: ({ className, day, modifiers, ...props }) => (
            <CalendarDayButton
              day={day}
              modifiers={modifiers}
              className={cn(
                className,
                modifiers.today &&
                  !modifiers.range_start &&
                  !modifiers.range_end &&
                  !modifiers.range_middle &&
                  !modifiers.selected &&
                  "bg-muted/50 text-black",
                "data-[range-start=true]:bg-primary data-[range-start=true]:text-white data-[range-start=true]:rounded-[--cell-radius]",
                "data-[range-end=true]:bg-primary   data-[range-end=true]:text-white   data-[range-end=true]:rounded-[--cell-radius]",
                "data-[range-middle=true]:bg-primary/10 data-[range-middle=true]:text-primary data-[range-middle=true]:rounded-none",
                "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-white",
              )}
              {...props}
            />
          ),
        }}
      />
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {pending.from && pending.to
            ? `${format(pending.from, "MMM d, yyyy")} → ${format(pending.to, "MMM d, yyyy")}`
            : pending.from
              ? `${format(pending.from, "MMM d, yyyy")} → pick end`
              : "Pick start date"}
        </span>
        <Button
          size="sm"
          disabled={!isComplete}
          onClick={() =>
            pending.from &&
            pending.to &&
            onApply({ from: pending.from, to: pending.to })
          }
          className="h-7 px-4 text-xs bg-primary hover:bg-[#138d75] text-white rounded-full"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
