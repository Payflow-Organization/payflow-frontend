# PayFlow — Design Patterns

## Repository Pattern

**Problem it solves:** Domain logic shouldn't know or care how data is stored. Direct JPA usage in aggregates or command handlers couples business logic to infrastructure, making the domain impossible to test without a database.

**How it works:** `domain/repository/` defines interfaces with domain language. `infrastructure/persistence/` implements them with Spring Data JPA. The domain layer imports only the interface — never the implementation.

**✅ Good**
```java
// domain/repository/EventStoreRepository.java — zero Spring/JPA imports
public interface EventStoreRepository {
    void save(List<DomainEvent> events);
    List<DomainEvent> findByAggregateId(UUID aggregateId);
    List<DomainEvent> findByAggregateIdFromVersion(UUID aggregateId, long fromVersion);
}

// infrastructure/persistence/JpaEventStoreRepository.java
@Repository
public class JpaEventStoreRepository implements EventStoreRepository {
    private final EventStoreJpaRepository jpa; // Spring Data repo

    @Override
    public void save(List<DomainEvent> events) {
        jpa.saveAll(events.stream().map(EventStoreEntity::from).toList());
    }

    @Override
    public List<DomainEvent> findByAggregateId(UUID aggregateId) {
        return jpa.findByAggregateIdOrderByVersion(aggregateId)
                  .stream().map(EventStoreEntity::toDomain).toList();
    }
}

// PaymentCommandHandler depends on the interface — not the JPA impl
@Service
public class PaymentCommandHandler {
    private final EventStoreRepository eventStore; // domain interface

    public PaymentCommandHandler(EventStoreRepository eventStore) {
        this.eventStore = eventStore;
    }
}
```

**❌ Bad**
```java
// Domain aggregate directly using Spring Data — Spring in the domain layer
@Entity
public class Payment {
    @Autowired
    private PaymentJpaRepository repo; // Spring dep inside domain — kills testability

    public void complete() {
        this.status = "COMPLETED";
        repo.save(this); // aggregate persisting itself via infrastructure
    }
}
```

---

## Factory Pattern

**Problem it solves:** Complex object construction scattered across handlers creates duplication and makes invariant enforcement unreliable. If constructing a `Payment` requires 6 fields and a validation step, that logic should live in one place.

**How it works:** Named static factory methods on aggregates and domain events handle construction. They enforce invariants at creation time and make intent explicit. Handlers call `Payment.initiate(cmd)` — not `new Payment()` with a dozen setters.

**✅ Good**
```java
// Aggregate — named factory method enforces invariants at creation
public class Payment {
    private Payment() {} // no public constructor

    public static Payment initiate(UUID sourceAccountId, UUID targetAccountId, long amountCents) {
        if (amountCents <= 0) throw new InvalidPaymentAmountException(amountCents);
        if (sourceAccountId.equals(targetAccountId)) throw new SelfTransferException(sourceAccountId);

        Payment payment = new Payment();
        payment.id = UUID.randomUUID(); // generated here, not by DB
        payment.sourceAccountId = sourceAccountId;
        payment.targetAccountId = targetAccountId;
        payment.amountCents = amountCents;
        payment.status = PaymentStatus.PENDING;

        payment.recordEvent(new PaymentInitiated(payment.id, sourceAccountId, targetAccountId, amountCents));
        return payment;
    }
}

// OutboxEvent — factory method from domain event keeps mapping in one place
public class OutboxEvent {
    public static OutboxEvent from(DomainEvent event) {
        return new OutboxEvent(
            UUID.randomUUID(),
            event.aggregateId(),
            event.getClass().getSimpleName(),
            serialize(event),
            Instant.now()
        );
    }
}

// Handler stays clean — construction logic not its concern
@Transactional(isolation = Isolation.SERIALIZABLE)
public void handle(InitiatePaymentCommand cmd) {
    Payment payment = Payment.initiate(cmd.sourceAccountId(), cmd.targetAccountId(), cmd.amountCents());
    eventStore.save(payment.domainEvents());
    outboxRepository.save(OutboxEvent.from(payment.domainEvents().getLast()));
}
```

**❌ Bad**
```java
// Construction logic duplicated in every handler — invariants enforced nowhere
@Transactional(isolation = Isolation.SERIALIZABLE)
public void handle(InitiatePaymentCommand cmd) {
    Payment payment = new Payment();
    payment.setId(UUID.randomUUID());
    payment.setSourceAccountId(cmd.sourceAccountId());
    payment.setTargetAccountId(cmd.targetAccountId());
    payment.setAmountCents(cmd.amountCents());
    payment.setStatus("PENDING");
    payment.setCreatedAt(Instant.now());
    // No validation — nothing stops amountCents = -500 from getting through
    eventStore.save(payment);
}
```

---

## Strategy Pattern

**Problem it solves:** When behaviour needs to be swappable at runtime or easily replaceable without touching the caller, hardcoding the algorithm couples the caller to the implementation. Strategy externalises the algorithm behind an interface.

**How it works:** Define an interface for the algorithm. Inject whichever implementation is needed. The caller knows the interface, not the implementation. Swap implementations without modifying the handler.

**✅ Good**
```java
// Interface — algorithm is interchangeable
public interface IdempotencyKeyStrategy {
    String generate(InitiatePaymentCommand cmd);
}

// One implementation
@Component
public class HmacIdempotencyKeyStrategy implements IdempotencyKeyStrategy {
    @Override
    public String generate(InitiatePaymentCommand cmd) {
        return Hmac.sha256(cmd.sourceAccountId() + cmd.targetAccountId() + cmd.amountCents());
    }
}

// Another — swap in tests or for different contexts without touching handler
@Component
public class UuidIdempotencyKeyStrategy implements IdempotencyKeyStrategy {
    @Override
    public String generate(InitiatePaymentCommand cmd) {
        return UUID.randomUUID().toString();
    }
}

// Handler doesn't know which strategy it's using
@Service
public class PaymentCommandHandler {
    private final IdempotencyKeyStrategy idempotencyKeyStrategy;

    public PaymentCommandHandler(IdempotencyKeyStrategy idempotencyKeyStrategy, ...) {
        this.idempotencyKeyStrategy = idempotencyKeyStrategy;
    }

    public void handle(InitiatePaymentCommand cmd) {
        String key = idempotencyKeyStrategy.generate(cmd);
        // ... rest of handler
    }
}
```

**❌ Bad**
```java
// Algorithm hardcoded in handler — changing it means modifying the handler
public void handle(InitiatePaymentCommand cmd) {
    // Idempotency logic inline — not testable in isolation, not swappable
    String key = Hmac.sha256(cmd.sourceAccountId() + cmd.targetAccountId() + cmd.amountCents());
    if (processedKeyRepository.existsByKey(key)) return;
    // ...
}
```

---

## Observer Pattern (via Kafka)

**Problem it solves:** When a payment completes, multiple downstream concerns need to react — update projections, trigger notifications, update the ledger, run fraud checks. Coupling the payment handler to every downstream consumer makes it a god class and forces redeployment on every new consumer.

**How it works:** The payment handler publishes a domain event (via outbox → Kafka). Each downstream concern is an independent `@KafkaListener` in its own consumer group. New consumers can be added without touching the publisher.

**✅ Good**
```java
// Publisher knows nothing about who's listening
@Transactional(isolation = Isolation.SERIALIZABLE)
public void handle(InitiatePaymentCommand cmd) {
    Payment payment = Payment.initiate(cmd.sourceAccountId(), cmd.targetAccountId(), cmd.amountCents());
    eventStore.save(payment.domainEvents());
    outboxRepository.save(OutboxEvent.from(new PaymentInitiated(payment.id())));
    // Done — doesn't call projectionService, notificationService, fraudService
}

// Each observer is independent — adding one doesn't touch any other class
@KafkaListener(topics = "payment.events", groupId = "projection-updater")
public void onPaymentInitiated(PaymentInitiated event, Acknowledgment ack) { ... }

@KafkaListener(topics = "payment.events", groupId = "fraud-checker")
public void onPaymentInitiated(PaymentInitiated event, Acknowledgment ack) { ... }

@KafkaListener(topics = "payment.events", groupId = "notification-sender")
public void onPaymentInitiated(PaymentInitiated event, Acknowledgment ack) { ... }
```

**❌ Bad**
```java
// Handler coupled to every downstream concern — grows forever
@Transactional(isolation = Isolation.SERIALIZABLE)
public void handle(InitiatePaymentCommand cmd) {
    Payment payment = Payment.initiate(...);
    eventStore.save(payment.domainEvents());

    // Direct calls — every new consumer = modifying this class
    projectionService.update(payment);
    notificationService.send(payment);
    fraudService.check(payment);
    ledgerService.post(payment);
}
```
