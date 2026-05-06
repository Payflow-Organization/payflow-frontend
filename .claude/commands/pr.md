# /pr

Create a GitHub pull request from the current branch using the `gh` CLI.
Reads the diff, generates the description, picks labels, and runs `gh pr create`.

## Steps

1. Run `git diff main --stat` to see what files changed
2. Run `git diff main` to read the actual diff
3. Run `git log main..HEAD --oneline` to see commits on this branch
4. Infer the linked issue number from the branch name (e.g. `feature/12-outbox-relay` → `#12`)
5. Generate title, body, and labels (see rules below)
6. Run `gh pr create` with all of it — do not ask for confirmation, just run it

## Title Rules
- Imperative, specific, ≤72 chars
- ✅ `Add idempotent consumer for PaymentInitiated events`
- ❌ `Fix some payment stuff` / `WIP` / `Updates`

## Body Format
```
## What
One sentence. What does this PR do at the code level?

## Linked Issue
Closes #N

## Why
The failure mode this prevents or the requirement it fulfils.
Reference the pattern by name if relevant (Outbox, Idempotent Consumer, CQRS, etc.).

## Changes
- bullet list of meaningful changes grouped by layer
- skip mechanical things: imports, formatting, renames

## Testing
- what test classes were added
- which failure cases are covered (idempotency, concurrent writes, outbox atomicity, etc.)
- confirm Testcontainers used for integration tests, not H2

## Notes
Deliberate trade-offs, known limitations, follow-up issues — omit section if none.
```

## Label Rules

Pick from PayFlow's label taxonomy only. Apply all that match.

**Type (pick one):**
- `type: feature` — new behaviour
- `type: bug` — fixing broken behaviour
- `type: chore` — tooling, config, scaffolding, no business logic
- `type: research` — investigation, spike, reading

**Layer (pick all that apply):**
- `layer: domain` — anything in `domain/`
- `layer: persistence` — JPA, Flyway migrations, `infrastructure/persistence/`
- `layer: kafka` — Kafka consumers, producers, OutboxRelay, `infrastructure/kafka/`
- `layer: api` — controllers, DTOs, `api/`
- `layer: security` — JWT, filters, `infrastructure/security/`
- `layer: infra` — Docker, CI/CD, config, `infrastructure/` general

**Always add:**
- `status: in-progress` is for issues — PRs don't get status labels

## Command to Run
```bash
gh pr create \
  --title "<generated title>" \
  --body "<generated body>" \
  --label "<label1>" \
  --label "<label2>" \
  --label "<label3>"
```

If `gh` is not authenticated or the remote is not set, report the error clearly and print the generated title and body so it can be copy-pasted manually.