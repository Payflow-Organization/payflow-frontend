# /review

Review the provided code or diff against PayFlow's standards.
Read `.claude/docs/architecture-patterns.md`, `.claude/docs/design-patterns.md`, and `.claude/docs/principles.md` before starting.

## Checklist

**Architecture**
- [ ] State change and outbox entry written in the same transaction?
- [ ] CQRS boundary respected — no business logic on read side, no SERIALIZABLE on reads?
- [ ] Consumer checks `processed_events` before processing, inside the same transaction?
- [ ] Domain layer (`domain/`) has zero Spring/JPA/Kafka imports?
- [ ] Aggregate state only mutated through the aggregate root?

**Transactions**
- [ ] Command handlers: `Isolation.SERIALIZABLE`?
- [ ] Query handlers: `readOnly = true`?
- [ ] Outbox relay: `Propagation.REQUIRES_NEW`?
- [ ] `@Transactional` on a controller? (never allowed)
- [ ] Any risk of self-invocation bypassing the AOP proxy?
- [ ] Read queries annotated `readOnly = true` so routing hits the replica?

**Kafka**
- [ ] `enable-auto-commit: false`?
- [ ] `ack.acknowledge()` called only after transaction commits?
- [ ] Producer going through outbox — not direct `kafkaTemplate.send()` in a handler?
- [ ] Dead letter topic configured?
- [ ] `traceparent` W3C header injected on every publish?
- [ ] Consumer extracts `traceparent` and puts `trace.id` / `span.id` into MDC?

**Data**
- [ ] Money as `BIGINT` cents — not `DECIMAL`, not `FLOAT`?
- [ ] UUID generated at domain layer, not DB?
- [ ] Balance derived from ledger, not stored as mutable column?
- [ ] `@Version` on aggregates with concurrent write risk?

**Caching**
- [ ] Cache key includes both `walletId` and `userId` — not `walletId` alone?
- [ ] `@CacheEvict` fires on every `save` — no stale balance after a write?
- [ ] Redis used, not Caffeine?

**Observability**
- [ ] Metric names dot-separated lowercase (`payflow.wallet.create.success`)?
- [ ] Tags low-cardinality only — `currency`, `reason`, `command_type`, `path`?
- [ ] No `wallet_id` or `user_id` as metric tags?
- [ ] `.increment()` called on every counter — not just `meterRegistry.counter(...)`?
- [ ] `Timer.Sample` stopped in `finally` block so latency records on both success and failure?
- [ ] `@PostConstruct` gauge registration method is no-arg?

**Design**
- [ ] Any class doing more than one job? (SRP)
- [ ] New event types added without modifying existing classes? (OCP)
- [ ] Domain interfaces kept focused — no fat interfaces? (ISP)
- [ ] High-level modules importing only domain interfaces, not infra impls? (DIP)
- [ ] Any abstractions built for requirements that don't exist? (YAGNI)
- [ ] Any duplicated constants or knowledge? (DRY)

**Tests**
- [ ] Integration tests use Testcontainers — real Postgres 18, real Kafka 3.9.0?
- [ ] No H2, no embedded Kafka?
- [ ] Naming follows `should[expected]when[condition]`?
- [ ] Idempotency case covered?
- [ ] Concurrent write case covered?
- [ ] Unit tests with `MeterRegistry` use `SimpleMeterRegistry` — not a Mockito mock?

## Output Format

For each issue:
1. **Severity**: `BLOCKER` | `WARNING` | `SUGGESTION`
2. **Location**: class + method/line
3. **Problem**: what's wrong and which failure mode it introduces
4. **Fix**: corrected code snippet

Then a summary:
- Overall assessment (1–2 sentences)
- BLOCKER / WARNING / SUGGESTION counts
- Merge-ready: Yes / No / Yes with caveats

$ARGUMENTS