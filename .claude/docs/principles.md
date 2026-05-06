# PayFlow — Engineering Principles

## SOLID

### Single Responsibility
Each class has one reason to change. When a class changes for multiple unrelated reasons, those concerns are entangled — a bug fix in one risks breaking the other.

**✅ Good**
```java
// PaymentCommandHandler — one job: handle payment commands
@Service
public class PaymentCommandHandler {
    public void handle(InitiatePaymentCommand cmd) { ... }
    public void handle(CancelPaymentCommand cmd) { ... }
}

// OutboxRelay — one job: relay outbox entries to Kafka
@Component
public class OutboxRelay {
    @Scheduled(fixedDelay = 500)
    public void relay() { ... }
}

// LedgerService — one job: post ledger entries
@Service
public class LedgerService {
    public void post(Payment payment) { ... }
}
```

**❌ Bad**
```java
// PaymentService doing five different jobs — five reasons to change
@Service
public class PaymentService {
    public void initiatePayment(InitiatePaymentCommand cmd) { ... }
    public void sendConfirmationEmail(Payment payment) { ... }  // notification concern
    public void updateLedger(Payment payment) { ... }           // ledger concern
    public void publishToKafka(Payment payment) { ... }         // infrastructure concern
    public void checkFraud(Payment payment) { ... }             // fraud concern
}
```

---

### Open/Closed
Open for extension, closed for modification. Adding new behaviour means adding new classes — not editing existing ones.

**✅ Good**
```java
// Adding RefundInitiated handling = new class, zero changes to existing consumers
public interface DomainEventHandler<T extends DomainEvent> {
    void handle(T event, Acknowledgment ack);
}

@Component
public class PaymentInitiatedHandler implements DomainEventHandler<PaymentInitiated> {
    @Override public void handle(PaymentInitiated event, Acknowledgment ack) { ... }
}

// New event type — new class, existing handler untouched
@Component
public class RefundInitiatedHandler implements DomainEventHandler<RefundInitiated> {
    @Override public void handle(RefundInitiated event, Acknowledgment ack) { ... }
}
```

**❌ Bad**
```java
// Every new event type = editing this method — grows without bound
public void processEvent(DomainEvent event) {
    switch (event.type()) {
        case "PAYMENT_INITIATED" -> handlePaymentInitiated((PaymentInitiated) event);
        case "PAYMENT_COMPLETED" -> handlePaymentCompleted((PaymentCompleted) event);
        case "REFUND_INITIATED"  -> handleRefundInitiated((RefundInitiated) event); // ← edit here every time
    }
}
```

---

### Liskov Substitution
Subtypes must be substitutable for their base type without breaking correctness. If the interface contract says idempotency is guaranteed, every implementation must honour that — not just the convenient ones.

**✅ Good**
```java
// Every DomainEventHandler implementation upholds the idempotency contract
public class PaymentInitiatedHandler implements DomainEventHandler<PaymentInitiated> {
    public void handle(PaymentInitiated event, Acknowledgment ack) {
        if (processedEventRepository.existsByEventId(event.eventId())) return; // idempotent
        // process...
    }
}

public class RefundInitiatedHandler implements DomainEventHandler<RefundInitiated> {
    public void handle(RefundInitiated event, Acknowledgment ack) {
        if (processedEventRepository.existsByEventId(event.eventId())) return; // same guarantee
        // process...
    }
}
```

**❌ Bad**
```java
// RefundInitiatedHandler skips idempotency — LSP violation, redelivery = double refund
public class RefundInitiatedHandler implements DomainEventHandler<RefundInitiated> {
    public void handle(RefundInitiated event, Acknowledgment ack) {
        // "refunds are rare, we'll skip the check" — now the subtype breaks the caller's assumption
        applyRefund(event);
        ack.acknowledge();
    }
}
```

---

### Interface Segregation
Don't force implementors to depend on methods they don't need. Fat interfaces create unnecessary coupling and make mocking painful in tests.

**✅ Good**
```java
// Focused interfaces — each has a clear, single purpose
public interface EventStoreRepository {
    void save(List<DomainEvent> events);
    List<DomainEvent> findByAggregateId(UUID aggregateId);
}

public interface OutboxRepository {
    void save(OutboxEvent event);
    List<OutboxEvent> findUnprocessed(int limit);
    void markProcessed(List<OutboxEvent> events);
}
```

**❌ Bad**
```java
// God interface — implementations are forced to stub methods they don't use
public interface PaymentRepository {
    void save(Payment payment);
    Payment findById(UUID id);
    void sendConfirmationEmail(Payment payment);    // not a repository concern
    void publishToKafka(DomainEvent event);         // not a repository concern
    void updateProjection(Payment payment);         // not a repository concern
}
```

---

### Dependency Inversion
High-level modules depend on abstractions, not implementations. `PaymentCommandHandler` (high-level) must not import anything from `infrastructure/` (low-level). It imports interfaces from `domain/repository/` only.

**✅ Good**
```java
// commandhandler imports the domain interface — not the JPA implementation
import com.payflow.domain.repository.EventStoreRepository;  // ✅ domain interface
import com.payflow.domain.repository.OutboxRepository;      // ✅ domain interface

@Service
public class PaymentCommandHandler {
    private final EventStoreRepository eventStore;
    private final OutboxRepository outbox;

    public PaymentCommandHandler(EventStoreRepository eventStore, OutboxRepository outbox) {
        this.eventStore = eventStore;
        this.outbox = outbox;
    }
}
```

**❌ Bad**
```java
// commandhandler reaching into infrastructure — high-level coupled to low-level
import com.payflow.infrastructure.persistence.JpaEventStoreRepository;  // ❌ JPA impl
import org.springframework.kafka.core.KafkaTemplate;                     // ❌ infra in app layer

@Service
public class PaymentCommandHandler {
    private final JpaEventStoreRepository eventStore;   // tied to JPA impl
    private final KafkaTemplate<String, Object> kafka;  // bypasses outbox pattern too
}
```

---

## YAGNI (You Aren't Gonna Need It)

Build what PayFlow needs now. Abstractions exist to solve real problems in the current codebase — not to prepare for imagined future requirements.

**✅ Good**
```java
// PayFlow has one payment processing flow — implement it directly
@Service
public class PaymentCommandHandler {
    public void handle(InitiatePaymentCommand cmd) {
        Payment payment = Payment.initiate(cmd.sourceAccountId(), cmd.targetAccountId(), cmd.amountCents());
        eventStore.save(payment.domainEvents());
        outboxRepository.save(OutboxEvent.from(payment.domainEvents().getLast()));
    }
}
```

**❌ Bad**
```java
// Plugin architecture for a use case that doesn't exist — complexity for zero current value
public interface PaymentProcessorPlugin {
    boolean supports(PaymentType type);
    Payment process(InitiatePaymentCommand cmd);
}

@Component
public class PaymentProcessorRegistry {
    private final List<PaymentProcessorPlugin> plugins;

    public Payment process(InitiatePaymentCommand cmd) {
        return plugins.stream()
            .filter(p -> p.supports(cmd.paymentType()))
            .findFirst()
            .orElseThrow()
            .process(cmd);
    }
}
// PayFlow has one payment type. This solves nothing today.
```

---

## DRY (Don't Repeat Yourself)

Every piece of knowledge has one authoritative location. Duplication means two places to update, two places to get wrong.

DRY applies to **knowledge**, not code shape. Two methods that look alike but represent distinct concepts should stay separate — forced unification creates the wrong abstraction.

**✅ Good**
```java
// Batch size configured once — one place to change
@Value("${payflow.outbox.batch-size}")
private int batchSize;

// Kafka topic names are constants — one source of truth
public final class KafkaTopics {
    public static final String PAYMENT_EVENTS = "payment.events";
    public static final String LEDGER_EVENTS  = "ledger.events";

    private KafkaTopics() {}
}
```

**❌ Bad**
```java
// Same constant in three places — change one, forget the others
// OutboxRelay.java
List<OutboxEvent> batch = outboxRepository.findUnprocessed(100);

// OutboxRelayTest.java
assertThat(relay.getBatchSize()).isEqualTo(100);

// application.yml comment
# batch size is 100
```

---

## DDD Alignment

The domain layer is the core of PayFlow. It has no knowledge of Spring, JPA, Kafka, or any framework. Business rules live in aggregates — nothing outside the aggregate root mutates its internal state.

**✅ Good**
```java
// domain/model/Payment.java — zero framework imports
public class Payment {
    private UUID id;
    private PaymentStatus status;
    private long amountCents;
    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    // Aggregate enforces its own invariants
    public void complete() {
        if (this.status != PaymentStatus.PENDING) {
            throw new InvalidPaymentStateTransitionException(this.id, this.status, PaymentStatus.COMPLETED);
        }
        this.status = PaymentStatus.COMPLETED;
        recordEvent(new PaymentCompleted(this.id, this.amountCents));
    }

    public List<DomainEvent> domainEvents() {
        return List.copyOf(uncommittedEvents);
    }
}
```

**❌ Bad**
```java
// External code mutating aggregate state — aggregate has no say
Payment payment = paymentRepository.findById(paymentId);

if (payment.getStatus().equals("PENDING")) {
    payment.setStatus("COMPLETED");         // setter bypasses all invariant checks
    payment.setUpdatedAt(Instant.now());    // aggregate state changed from outside
    paymentRepository.save(payment);
}
```

---

## Fail Fast

Validate at the boundary. Reject invalid input before it touches the domain. Inside the domain, throw immediately on invariant violation — never return null, never set a flag, never swallow the error silently.

**✅ Good**
```java
// DTO validation rejects bad input at the HTTP boundary
public record InitiatePaymentRequest(
    @NotNull UUID sourceAccountId,
    @NotNull UUID targetAccountId,
    @Positive long amountCents
) {}

// Domain throws immediately on invariant violation — no silent failures
public static Payment initiate(UUID sourceAccountId, UUID targetAccountId, long amountCents) {
    if (amountCents <= 0) throw new InvalidPaymentAmountException(amountCents);
    if (sourceAccountId.equals(targetAccountId)) throw new SelfTransferException(sourceAccountId);
    // ...
}
```

**❌ Bad**
```java
// Silent failure — caller has no idea the payment wasn't created
public Optional<Payment> initiate(InitiatePaymentCommand cmd) {
    if (cmd.amountCents() <= 0) return Optional.empty(); // fail silently
    // ...
}

// No boundary validation — invalid data reaches the domain
@PostMapping("/payments")
public ResponseEntity<?> initiate(@RequestBody Map<String, Object> body) {
    long amount = (long) body.get("amount"); // no validation, ClassCastException in prod
    // ...
}
```
