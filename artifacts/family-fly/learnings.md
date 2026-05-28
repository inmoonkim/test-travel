# FamilyFly — Learnings

## Task Execution Order

Tasks executed in plan order (1→9). Dependencies were respected: 1 and 7 were independent; 2 depended on 1; 3-5 depended on 1-2 types; 6 depended on 3-5; 8 depended on 6-7; 9 depended on 2+7.

## Judgments & Pivots

### ComboboxCollection → removed
- **What**: `@base-ui/react`'s `Combobox.Collection` crashes in jsdom (TypeError: object is not a function)
- **Decision**: Removed `ComboboxCollection` wrapper; items render without server-side filtering. 12 static airports → no filtering needed for MVP.
- **applied: not-yet** (Monitor if real Combobox filtering becomes needed with more airports)

### type="email" → type="text" + inputMode="email"
- **What**: `fireEvent.change` with invalid email values on `type="email"` inputs doesn't update React state in jsdom — tests can't verify email validation
- **Decision**: Changed to `type="text" inputMode="email"` with our own regex. Keeps mobile UX (numeric keyboard hint) while making tests reliable.
- **applied: rule** → See below

### Cancel endpoint GET→POST
- **What**: Email prefetchers (Outlook Safe Links, Gmail) fire GET requests on all links at delivery time. A GET-to-deactivate endpoint would silently cancel alerts before users click them.
- **Decision**: Changed to POST + confirmation page
- **applied: rule** → See below

### Timezone-safe date keys
- **What**: `new Date("2026-06-15").toISOString().slice(0,10)` returns "2026-06-14" in KST (UTC+9). Used as API response keys and calendar lookup keys, this causes a 1-day mismatch making all calendar cells unclickable.
- **Decision**: Use `toLocalDateStr(date)` (local getters) everywhere dates are formatted as "YYYY-MM-DD" strings
- **applied: rule** → See below

### better-sqlite3 native build
- **What**: `bun add better-sqlite3` blocks postinstall by default. Binary wasn't compiled.
- **Decision**: `bun pm trust better-sqlite3` runs `prebuild-install || node-gyp rebuild --release`. Works on Windows with Visual Studio build tools.
- **applied: not-yet** (add to project onboarding instructions if project grows)

### Cooldown not implemented initially
- **What**: `last_notified_at` was written but never read. Cron would spam on every tick once price fell below target.
- **Decision**: Added 24h cooldown check in `checkAlert`
- **applied: rule** → See below

## Immediately Promoted Rules

### Rule: type="email" jsdom
```
In tests (jsdom), use type="text" + inputMode="email" for email inputs with custom regex validation.
Reason: type="email" with invalid values doesn't update React state via fireEvent.change in jsdom.
Where: any form that validates email format in the UI.
```

### Rule: State-mutating endpoints must use POST
```
Any endpoint that changes persistent state (DB write, send email, delete) MUST use POST/PUT/DELETE.
GET endpoints must be safe (read-only, idempotent).
Reason: Email prefetchers, link previews, and browser pre-rendering fire GET requests automatically.
Where: cancel endpoints, payment confirmation, any "action via link" pattern.
```

### Rule: Timezone-safe date string formatting
```
When creating YYYY-MM-DD date keys from Date objects, use local getters:
  function toLocalDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
Do NOT use toISOString().slice(0,10) — this returns UTC date which differs in non-UTC timezones.
Where: anywhere Date objects are formatted as date strings for API responses, DB storage, or calendar keys.
```

### Rule: Idempotency cooldown for notifications
```
Any background job that sends notifications (email, push, SMS) must:
1. Record the last_notified_at timestamp
2. Check it before sending (skip if within cooldown window, e.g. 24h)
Where: cron jobs, webhooks, triggered alerts.
```

## Weak Signals (not-yet applied)

- `@base-ui/react` Combobox may need `ComboboxCollection` removed in future jsdom test contexts. If we ever add more interactive combobox tests, consider a mock for the Collection.
- Unbounded parallel Amadeus API calls (Promise.all over 14+ dates). With real credentials and large date ranges this will hit rate limits. Consider `p-limit(3)` or sequential processing.
- Better-sqlite3 postinstall step should be documented in README/onboarding for new developers.

## Test Coverage Summary

| File | Tests | Status |
|---|---|---|
| services/search.test.ts | 3 | PASS |
| services/hotels.test.ts | 4 | PASS |
| services/alerts.test.ts | 6 | PASS |
| services/email.test.ts | 3 | PASS |
| components/family-fly/SearchForm.test.tsx | 9 | PASS |
| components/family-fly/PriceCalendar.test.tsx | 7 | PASS |
| components/family-fly/ComboList.test.tsx | 8 | PASS |
| components/family-fly/AlertForm.test.tsx | 7 | PASS |
| **Total** | **47** | **ALL PASS** |

## Integration Checkpoints (Deferred — no API keys)

- Amadeus real API: requires `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET`
- Resend email delivery: requires `RESEND_API_KEY`
- End-to-end browser flow: requires dev server + real Amadeus test environment responses
