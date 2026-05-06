# /test

Write tests for the provided class or feature.
Read `.claude/docs/architecture-patterns.md` before writing integration tests.

## Test Types

**Domain unit tests** — no Spring context, no Testcontainers
- Pure Java, JUnit 5 only
- Test aggregate behaviour: given events → assert state, emitted events, thrown exceptions
- Fast — no infra required

**Integration tests** — `@SpringBootTest` + `@Testcontainers`
- Real PostgreSQL 18 alpine via Testcontainers
- Real Apache Kafka 3.9.0 via Testcontainers
- Test the full flow: HTTP request → command handler → DB → outbox relay → Kafka → consumer → projection
- Assert on actual DB state — not on mocks or captures
- Never H2, never embedded Kafka

## What NOT to Mock
- `JpaRepository` implementations — use real DB via Testcontainers
- `KafkaTemplate` — use real Kafka via Testcontainers
- Domain collaborators that have infrastructure concerns — test the real thing

## Naming Convention
```
should[expected outcome]when[condition]

shouldCreatePaymentWhenCommandIsValid()
shouldRejectPaymentWhenInsufficientFunds()
shouldBeIdempotentWhenSameEventIdReceivedTwice()
shouldThrowWhenSourceAndTargetAccountsAreIdentical()
shouldRollbackOutboxEntryWhenEventStoreWriteFails()
```

## Required Cases for Every Financial Operation
1. Happy path — valid input, expected state after
2. Invalid input — bad amounts, missing fields, wrong state
3. Idempotency — same event delivered twice → second is a no-op, state unchanged
4. Concurrent modification — two operations on same aggregate simultaneously → optimistic lock exception, handled gracefully
5. Outbox atomicity — consumer crashes after event store write → outbox entry still present and unpublished

## Request
$ARGUMENTS
