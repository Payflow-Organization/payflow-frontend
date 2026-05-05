# PayFlow

Payment processing backend. University assignment (due mid-May) + portfolio piece targeting distributed systems roles.
Every pattern here solves a real failure mode. The code must be defensible in a senior system design interview.

## Environment
| | |
|---|---|
| Java | 25 |
| Spring Boot | 4.0.x |
| Build | Maven, Jar |
| Kafka | 3.9.0 — KRaft mode, no ZooKeeper |
| Database | PostgreSQL 18 alpine |
| Cache | Redis 8 alpine |
| Schema | Flyway migrations only |
| Tests | Testcontainers — real infra, never H2 or embedded Kafka |

## Package Structure
```
com.payflow
├── application/
│   ├── command/          ← POJOs, zero Spring imports
│   ├── commandhandler/   ← write side, @Transactional(SERIALIZABLE)
│   └── query/            ← read side, @Transactional(readOnly=true)
├── domain/
│   ├── model/            ← aggregates, value objects — NO framework deps, ever
│   ├── event/            ← domain event POJOs
│   └── repository/       ← interfaces only
├── infrastructure/
│   ├── persistence/      ← JPA entities, Spring Data impls
│   ├── kafka/            ← OutboxRelay, consumers, KafkaConfig
│   ├── security/         ← JwtFilter, SecurityConfig
│   ├── metrics/          ← LedgerMetrics, OutboxMetrics
│   └── projection/       ← read model tables + updaters
└── api/
    ├── controller/       ← thin, delegates only — no business logic
    ├── dto/              ← request/response DTOs
    └── exception/        ← @ControllerAdvice
```

## Transaction Rules (quick ref)
| Context | Config |
|---|---|
| Command handlers | `@Transactional(isolation = Isolation.SERIALIZABLE)` |
| Query handlers | `@Transactional(readOnly = true)` |
| Outbox relay | `@Transactional(propagation = Propagation.REQUIRES_NEW)` |
| Consumer idempotency | `TransactionTemplate` wrapping check + process + ack |
| Controllers | never `@Transactional` |
| Read replica routing | `@Transactional(readOnly = true)` routes to replica automatically via `AbstractRoutingDataSource` |

Self-invocation bypasses the AOP proxy — `@Transactional` silently does nothing when called via `this`.

## Data Rules (quick ref)
- Money: `BIGINT` cents — never `DECIMAL`, never `FLOAT`
- PKs: `UUID` generated at domain layer, not by the DB
- Balance: cached `BIGINT` column on `wallets` for O(1) reads — ledger entries are the audit trail and source of truth; ledger is always written before the cached balance is updated; nightly reconciliation detects drift
- Schema: Flyway only — `ddl-auto: validate` everywhere
- Cache: Redis, not Caffeine — distributed, survives restarts, production-realistic; cache key is `walletId + ':' + userId` — both required for ownership isolation
- Analytics: TimescaleDB hypertable on `ledger_entries` — time-series queries only; ledger remains source of truth

## Observability Rules (quick ref)
- Metrics: Micrometer with Prometheus registry — dot-separated lowercase names (`payflow.wallet.create.success`)
- Tags: low-cardinality only — `currency`, `reason`, `command_type`, `path`; never `wallet_id` or `user_id`
- Trace propagation: W3C `traceparent` header injected into every Kafka message; consumers extract and put into MDC
- Gauges registered via `@PostConstruct` no-arg method — never pass `MeterRegistry` as a method parameter

## Hard Rules (never do these)
- `@Transactional` on a controller
- Spring/JPA imports in `domain/`
- Direct `kafkaTemplate.send()` inside a command handler — use outbox
- H2 or embedded Kafka in tests
- `DECIMAL`/`FLOAT` for money
- `ddl-auto: create` or `update`
- Business logic in a controller or DTO
- Aggregate state mutated from outside the aggregate root
- Hardcoded constants duplicated across classes
- Abstractions for requirements that don't exist yet
- Cache key with `walletId` alone — must include `userId` for ownership isolation
- Kafka publish without `traceparent` header — trace context must cross the async boundary
- High-cardinality tags (user_id, wallet_id) on Micrometer metrics
- `@PostConstruct` method with parameters — Spring lifecycle methods must be no-arg

## Reference Docs
Read these when working on anything touching the relevant area:

| Topic | File |
|---|---|
| Outbox, CQRS, Saga, Idempotent Consumer, Event Sourcing, Double-Entry, Read/Write Routing, Redis Cache, Reconciliation, Trace Propagation | `.claude/docs/architecture-patterns.md` |
| Repository, Factory, Strategy, Observer | `.claude/docs/design-patterns.md` |
| SOLID, YAGNI, DRY, DDD, Fail Fast | `.claude/docs/principles.md` |