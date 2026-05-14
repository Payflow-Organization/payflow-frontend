"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  LayoutList,
  ListFilter,
  RotateCcw,
  XCircle,
} from "lucide-react";

const TYPE_OPTIONS = [
  { label: "All Types", value: "all", icon: <LayoutList size={14} /> },
  {
    label: "Deposit",
    value: "DEPOSIT",
    icon: <ArrowDownLeft size={14} className="text-primary" />,
  },
  { label: "Withdraw", value: "WITHDRAW", icon: <ArrowUpRight size={14} /> },
  { label: "Transfer", value: "TRANSFER", icon: <ArrowLeftRight size={14} /> },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all", icon: <LayoutList size={14} /> },
  {
    label: "Pending",
    value: "PENDING",
    icon: <Clock size={14} className="text-yellow-500" />,
  },
  {
    label: "Complete",
    value: "SUCCESS",
    icon: <CheckCircle size={14} className="text-green-600" />,
  },
  {
    label: "Failed",
    value: "FAILED",
    icon: <XCircle size={14} className="text-red-500" />,
  },
];

type Props = {
  pendingType: string;
  pendingStatus: string;
  appliedType: string;
  appliedStatus: string;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function TransactionFilters({
  pendingType,
  pendingStatus,
  appliedType,
  appliedStatus,
  onTypeChange,
  onStatusChange,
  onApply,
  onReset,
}: Props) {
  const hasActiveFilters = appliedType !== "all" || appliedStatus !== "all";

  return (
    <Card className="rounded-2xl border border-border">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:gap-10 sm:items-end">
        <div className="flex flex-col gap-1.5 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <ListFilter size={12} />
            Transaction Type
          </p>
          <Select value={pendingType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <span className="flex items-center gap-2">
                    {o.icon}
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <CheckCircle size={12} />
            Status
          </p>
          <Select value={pendingStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <span className="flex items-center gap-2">
                    {o.icon}
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onApply}
          className="rounded-lg bg-foreground text-background hover:bg-foreground/90"
        >
          Apply Filters
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onReset}
            className="rounded-lg gap-2"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
