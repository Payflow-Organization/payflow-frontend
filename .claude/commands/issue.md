# /issue

Create a GitHub issue via `gh` CLI based on the issue templates in `.github/ISSUE_TEMPLATE/`.

## Steps

1. **Determine the type** from the argument — feature, bug, chore, or research. If unclear, ask one question before proceeding.

2. **Read the corresponding YAML** from `.github/ISSUE_TEMPLATE/<type>.yml`. This is the source of truth for all fields, labels, validations, and structure. Do not hardcode field names — derive them from the YAML.

3. **Populate every field** marked `required: true` in the YAML. Infer values from the argument where possible. If a required field cannot be inferred, ask for it before running the command.

4. **Infer the milestone** from this map:
   | Content | Milestone |
   |---|---|
   | DB schema, Flyway, domain model, aggregates | `M1 — Core Domain & DB Schema` |
   | Kafka, Outbox, OutboxRelay, producers, consumers | `M2 — Kafka + Outbox Pipeline` |
   | Projections, query handlers, read model | `M3 — CQRS Read Side` |
   | JWT, security filters, auth | `M4 — Security` |
   | Tests, Testcontainers, CI/CD, coverage | `M5 — Testing & CI/CD` |
   | Docs, polish, submission prep | `M6 — University Submission Polish` |

5. **Run:**
   ```bash
   gh issue create \
     --title "<title>" \
     --body "<body>" \
     --label "<label>" \
     --milestone "<milestone>"
   ```
   The body must follow the section structure from the YAML — use the field `label` values as markdown headers, in the same order they appear in the YAML.

   If `gh` is not authenticated, print the full title and body for manual copy-paste instead.

## Request
$ARGUMENTS