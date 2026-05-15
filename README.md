# PayFlow Dashboard

![CI](https://github.com/Payflow-Organization/payflow-frontend/actions/workflows/ci.yml/badge.svg)
[![Deploy Status](https://deploy-badge.vercel.app/vercel/payflow-frontend)](https://payflowplatform.vercel.app)

Next.js frontend for the PayFlow payment platform.
## Pages
- **Login / Register** - JWT-based auth with token refresh and logout
- **Overview** - wallet balances and summary dashboard
- **Analytics** - portfolio charts with period switching, wallet switcher,
  content skeletons
- **Banking** - deposit, withdraw, transfer via React Hook Form + Zod,
  URL-driven tab switching
- **Transactions** - paginated ledger with filter options
- **Demo Scenarios** - interactive simulator for backend failure modes
  and a distributed system guarantees

## Demo scenarios
Used to simulate backend failure modes and distributed system guarantees. Controls persist in `localStorage`. Live scenarios (runners) hit the real backend.
**System Controls**
- **Kafka Lag** - delays balance refresh after mutation, surfaces
  outbox → Kafka → projection latency in the banking UI
- **Freeze Wallet** - calls `POST /wallets/{id}/freeze` on the real
  backend, locks the banking UI on success

---
**Distributed Systems**
| Scenario | What it proves | Backend guarantee |
|---|---|---|
| Idempotency Guarantee | 3 concurrent deposits with the same key return identical transaction IDs | `SERIALIZABLE` + idempotency cache |
| Concurrent Double-Spend | Two simultaneous 60% withdrawals — second must be rejected | `@Transactional(SERIALIZABLE)` |
| Overdraft Rejection | Withdrawal £100 over balance — backend rejects, no debit applied | Balance check inside `SERIALIZABLE` transaction |
| Ledger Reconciliation | Sums all ledger entries vs cached balance — drift must always be 0 | Double-entry ledger + reconciliation job |
| Silent Token Refresh | 401 intercepted, refresh exchanged, original request retried transparently | Axios interceptor in `lib/api/client.ts` |

---
**Setup**

Seed script creates 3 wallets and fires real deposits, withdrawals and
transfers through the API. Idempotent, safe to run multiple times.

## Mock Scenarios

MSW handlers for all domains (auth, wallets, transactions) with error
scenarios — enables frontend development independently of the backend in the dev env.

## Stack

Next.js · TypeScript · shadcn/ui · Recharts · React Hook Form · Zod ·
TanStack Query · Axios · MSW

## Running locally

```bash
npm install
npm run dev
```

Set environment variables as defined in `.env.local.example`.

## Architecture

See [payflow-backend](link) for full system architecture, distributed
systems patterns, and ADRs.  
