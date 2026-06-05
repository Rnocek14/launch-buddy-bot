# Simplified Dashboard — Full Design

## The decision (confirmed)
Above the fold: **one score + the single biggest problem + one button.**
Below: **one ranked "Needs Attention" list** that merges every data type. The product decides priority; the user never has to choose a category first.

The critical addition your advisor's version missed: **each row is a different action machine.** A broker is opt-out. Most accounts need an **AI contact search first** before a deletion can be sent. A breach is informational. So the list is one visual pattern with a typed action slot per row.

## Everything the scan produces (nothing dropped)
| Source | Data | Per-item action lifecycle |
|---|---|---|
| Data brokers (`broker_scan_results`) | exposed / possible match; address, phone, relatives | Remove → opens opt-out + marks `removal_started` → Confirm removed (`opted_out`) |
| Accounts (`user_services`) | activity (active paid/free, dormant, newsletter), cleanup_priority, `contact_status`, `privacy_action` | If `needs_discovery`: **Find removal contact (AI search)** → then Request deletion. Else: Request deletion / Keep / Don't sell |
| Breaches (snapshot) | total, critical, high | Secure this (guide / change password) — informational |
| Unmatched domains | possible undiscovered accounts | "Is this yours?" Yes (becomes account) / Dismiss |

## Above the fold — the calm answer
```text
┌───────────────────────────────────────────────┐
│        ◔  742  Good        (compact gauge)     │
│   We checked 47 places. 12 need your attention.│
│                                                │
│   Your biggest risk right now:                 │
│   12 data-broker sites are publishing your     │
│   home address and phone number.               │
│                                                │
│        [  Start removing these  → ]            │
└───────────────────────────────────────────────┘
```
- Headline sentence is computed from the #1 item in the ranked list, so it always reflects reality (brokers > breaches > risky accounts > dormant > public mentions).
- The CTA scrolls to / opens the first actionable row. One button only.
- An accounting line ("We checked 47 places…") so completeness is felt, not hidden.

## Below the fold — the one ranked list
A single `RemediationItem` component, one row each, ranked by severity:
1. Broker listings — exposed (highest)
2. Broker — possible matches
3. Breach-exposed accounts (critical/high)
4. Risky / active-paid / old accounts
5. Dormant & unused accounts
6. Public mentions / unmatched domains (lowest)

Each row, regardless of type, shows the same anatomy so it reads identically to a 70-year-old:
```text
┌──────────────────────────────────────────────┐
│ [icon] Whitepages                  ● Exposed  │
│        Showing your address, phone, relatives │
│        [   Remove my info   →   ]   (1 button)│
└──────────────────────────────────────────────┘
```
- **One primary button per row**, label changes by type/state:
  - Broker: "Remove my info" → "Removal requested ✓ · Confirm done"
  - Account needing contact: "Find removal address" → (after AI search) "Request deletion"
  - Account ready: "Request deletion"  (Keep / Don't sell tucked behind a small "Other options")
  - Breach: "How to secure this"
  - Unmatched: "Yes, this is mine" / "Not me"
- Type is shown as a plain word + dot color (Exposed / Possible / Breach / Unused), never as a section the user must navigate.
- Resolved items collapse into a quiet "Done (8)" group at the bottom with a green check, so progress is visible and the active list stays short.

## Progressive disclosure (single page, no navigation)
Order top-to-bottom: hero → Needs Attention list → Done group → one "More" accordion holding: full account grid (current grid, filters), score history, this-month summary, subscription, referral. Everything stays on one scroll; details expand in place. No tabs, no separate screens.

## Mobile vs desktop
- **Layout is the same centered single column (`max-w-2xl`) on both** for one mental model. Desktop simply gets more breathing room and can show row metadata inline; mobile wraps it under the title.
- **Mobile:** full-width rows, min 56px tap targets, one full-width button per row, a sticky bottom bar showing the single next best action ("Remove from Whitepages →") that advances as items are resolved.
- **Desktop:** the compact gauge + accounting line can sit left with the list right on very wide screens, but default is the same stacked column to avoid divergence.

## Accessibility / age-friendly rules
- Base body text bumped to `text-base`/`text-lg`; no `text-xs` for anything meaningful.
- High-contrast tokens (reuse existing 90% neutral palette + `#FF6A00` only for the single primary CTA).
- Plain language everywhere ("Sites publishing your info", not "broker exposure"). Each row has a one-line "why this matters".
- One primary action visible at a time; secondary actions are demoted, never competing.

## Technical approach
- New `src/components/dashboard/NeedsAttentionList.tsx` + `RemediationItem.tsx` (typed union: `broker | account | breach | mention`). Each item carries `severity`, `state`, and a `primaryAction` descriptor so the row renders generically.
- New `src/lib/remediation.ts`: pure functions to (a) normalize brokers (`brokerResultState`), accounts (`activity_status`/`cleanup_priority`/`contact_status`/`privacy_action`), breaches, and unmatched domains into one `RemediationItem[]`; (b) rank them; (c) derive the hero headline + count from the top item. Reuses existing `get_privacy_snapshot`, `broker_scan_results`, `user_services`, and unmatched-domains queries already in `Dashboard.tsx`/`PrivacySnapshot.tsx` — no backend/schema changes.
- Reuse existing dialogs/handlers verbatim: `ContactDiscoveryDialog` (AI contact search), `DeletionRequestDialog`, broker `handleRemoveClick` (opt-out + `opt_out_started_at`), `ServiceActionButtons` (Keep/Don't sell) — wired into each row's action slot.
- New `src/components/dashboard/ScoreHero.tsx` wrapping the existing `PrivacyScoreGauge` in compact mode + computed headline + single CTA.
- `Dashboard.tsx` is refactored to compose: `<ScoreHero/>`, `<NeedsAttentionList/>`, Done group, and a `<Collapsible>` "More" holding the existing grid/history/etc. The current 1,956-line render is reduced to orchestration; heavy sections move into the accordion unchanged to limit risk.
- No business-logic changes to scanning, deletion sending, or broker pipeline — purely presentation/composition over existing data + actions.

## Build phases
1. `remediation.ts` normalizer + ranking + hero-headline derivation (pure, testable).
2. `RemediationItem` (typed action slot) + `NeedsAttentionList` + Done group.
3. `ScoreHero` (compact gauge + computed headline + single CTA) and mobile sticky next-action bar.
4. Refactor `Dashboard.tsx` to the new top-to-bottom composition; move existing sections into the "More" accordion.
5. Verify both viewports in preview; confirm every action path (broker remove, AI contact search → deletion, keep/don't-sell, breach guide, claim unmatched) still fires.
