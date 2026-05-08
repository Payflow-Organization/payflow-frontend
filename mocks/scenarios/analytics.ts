// mocks/scenarios/analytics.ts
import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";

export const analyticsHandlers = [
  http.get("/api/v1/analytics/monthly-summary", () =>
    HttpResponse.json({
      totalDepositsCents: faker.number.int({ min: 100000, max: 500000 }),
      totalWithdrawalsCents: faker.number.int({ min: 50000, max: 300000 }),
      netCents: faker.number.int({ min: -100000, max: 200000 }),
      transactionCount: faker.number.int({ min: 5, max: 50 }),
    }),
  ),

  http.get("/api/v1/analytics/balance-history", ({ request }) => {
    const url = new URL(request.url);
    const from = new Date(url.searchParams.get("from") ?? "2026-01-01");
    const to = new Date(url.searchParams.get("to") ?? new Date().toISOString());

    const days = Math.ceil(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );
    const points = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      return {
        interval: date.toISOString(),
        lastBalanceCents: faker.number.int({ min: 50000, max: 500000 }),
      };
    });

    return HttpResponse.json(points);
  }),

  http.get("/api/v1/analytics/spending-by-category", () =>
    HttpResponse.json([
      {
        transactionType: "DEPOSIT",
        totalCents: faker.number.int({ min: 100000, max: 500000 }),
        count: faker.number.int({ min: 3, max: 20 }),
      },
      {
        transactionType: "WITHDRAW",
        totalCents: faker.number.int({ min: 50000, max: 300000 }),
        count: faker.number.int({ min: 2, max: 15 }),
      },
      {
        transactionType: "TRANSFER",
        totalCents: faker.number.int({ min: 10000, max: 100000 }),
        count: faker.number.int({ min: 1, max: 10 }),
      },
    ]),
  ),
];
