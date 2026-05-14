// Module-level demo state — written by Scenarios page, read by mocks and components.
// Uses localStorage so flags survive page refresh within the same browser session.

export type DemoFlags = {
  kafkaLagMs: number;
  forceNextFailure: boolean;
  frozenWalletId: string | null;
};

const DEFAULTS: DemoFlags = { kafkaLagMs: 0, forceNextFailure: false, frozenWalletId: null };

export function getDemoFlags(): DemoFlags {
  if (typeof window === "undefined") return DEFAULTS;
  return {
    kafkaLagMs: Number(localStorage.getItem("demo_kafkaLagMs") ?? 0),
    forceNextFailure: localStorage.getItem("demo_forceNextFailure") === "true",
    frozenWalletId: localStorage.getItem("demo_frozenWalletId"),
  };
}

export function setDemoFlag<K extends keyof DemoFlags>(key: K, value: DemoFlags[K]) {
  if (typeof window === "undefined") return;
  const stored = value === null || value === false || value === 0
    ? null
    : String(value);
  if (stored === null) localStorage.removeItem(`demo_${key}`);
  else localStorage.setItem(`demo_${key}`, stored);
}

export function clearDemoFlags() {
  if (typeof window === "undefined") return;
  (Object.keys(DEFAULTS) as (keyof DemoFlags)[]).forEach((k) =>
    localStorage.removeItem(`demo_${k}`),
  );
}
