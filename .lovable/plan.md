# Automated broker removals

Goal: customers on Complete can say truthfully "we handle your removals". Four pieces, built in order. Your existing permission form (the authorized-agent signature) is reused, not rebuilt.

## 1. Email deletion requests to brokers (fully automatic)
- Add each broker's privacy/deletion email address and removal method (email, web form, or both) to the broker list. Fill it in only for brokers whose own privacy page lists an address; each one is checked by hand, not guessed.
- When a Complete customer has signed the permission form and a listing is found, send a privacy-law deletion request from your own sending address (the one deletion requests already use), naming the customer and the listing link.
- One request per broker per customer, sent one at a time. Automatic follow-up after 30 days if nothing changes. Brokers that reply asking for verification get flagged for you to review.

## 2. Removal queue (you or a helper)
- A new admin page listing every found listing that needs a web form: customer, broker, listing link, opt-out link and step-by-step instructions.
- Buttons: Mark submitted, Needs customer action (e.g. confirm an email), Removed, Couldn't remove (with reason).
- The customer sees the same status on their dashboard: Found, Request sent, Waiting on broker, Removed.

## 3. Automatic form filling (limited)
- For a small allow-list of brokers whose opt-out form is a simple form (no picture test, no ID, no phone call), a background job fills and submits it, then records the result.
- Any failure or picture test falls back to the removal queue. Starts with 0 brokers enabled; each one is switched on only after a test submission works.

## 4. Re-check and proof
- The monthly re-check marks a listing Removed only when the listing link no longer shows the person. Otherwise the request is resent and the status stays Waiting on broker.
- The existing progress email gains the counts: requests sent, removed this month, still waiting.

## Not included
- Reselling another company's removal service: no provider has been checked yet. I'll research options and prices separately.
- No new prices or plan changes; Complete stays $129/year.
- Homepage and pricing copy changes to "we handle it" only after pieces 1–2 are live, so the promise stays true.

## Technical details
- data_brokers: add privacy_email, removal_method, form_automation_enabled (default false), verified_at.
- New broker_removal_requests table (user_id, broker_id, scan_result_id, method, status, sent_at, follow_up_at, last_error, notes), with grants and row-level access per user plus admin via has_role.
- New edge functions: send-broker-removals (scheduled, sequential with 1500ms delay, requires an active, non-revoked user_authorizations row and Complete tier) and submit-broker-form (allow-listed brokers only, falls back to queue).
- scheduled-rescan updates request status from the latest broker_scan_results.
- Admin page at /admin/removals; dashboard status reads the new table.
- Tests: authorization required, Complete tier required, one request per broker per user, failures never marked Removed.
