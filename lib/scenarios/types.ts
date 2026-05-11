export type RowStatus = "pass" | "fail" | "neutral";

export type ResultRow = {
  label: string;
  value: string;
  mono?: boolean;
  status?: RowStatus;
};

export type ScenarioResult = {
  status: "pass" | "fail" | "warn";
  summary: string;
  rows: ResultRow[];
  durationMs: number;
  // Shown in the UI so it's clear exactly what to replace when connecting the real backend
  swapNote: string;
};
