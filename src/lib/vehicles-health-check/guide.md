# Vehicle health checker

This module periodically confirms that imported vehicles from external listing sources
are still available. It marks a vehicle `unavailable` only when an external source
reliably reports that the listing is gone. Everything else leaves the vehicle unchanged.

## What it does

- Runs every `HEALTH_INTERVAL_SECONDS` (default 60) against PostgreSQL.
- Fetches the canonical listing URL for each imported vehicle that has an
  `specifications.externalSource` and `specifications.externalSourceId`.
- Classifies each check result as one of:
  - `true` — vehicle still appears available
  - `false` — vehicle no longer available
  - `null` — inconclusive (timeout, blocked, rate limited, unexpected response, network error)

## Safety rules

- Inconclusive results never mark a vehicle unavailable.
- A single absence result is not enough. The default requires
  `HEALTH_CONFIRMATION_RUNS` consecutive absence results before marking a vehicle unavailable.
- Local vehicles without an external source are never removed by this worker.
- A vehicle manually marked unavailable in the admin panel is never re-enabled by an
  external check. The SQL used by the worker skips vehicles where `status <> 'unavailable'`.

## Current source support

- `dubicars` — built only as a probe target at the moment. The site is frequently
  blocking automated checks, so this worker cannot be relied on as a primary signal yet.
  When dubaicar returns 403/429/timeout or any inconclusive result, the vehicle is left
  untouched. Treat that as a known limitation rather than confirmed removal.

## Status model

`vehicles.status` is used as the source of truth for public visibility.

- `available`, `order` — visible in the published catalog when `isPublished` is true.
- `unavailable` — excluded from public catalog queries, but the record is kept.

This worker never deletes rows. It only transitions a vehicle to `unavailable`.

## Deployment scheduling

The worker is a normal Node script. How you run it on a 60-second schedule depends on the
environment:

- **VPS / personal server with systemd**: the most reliable option if you have a machine that
  can stay up. Example unit:

  ```
  [Unit]
  Description=Vehicle health checker
  After=network.target

  [Service]
  ExecStart=/usr/bin/env node /path/to/project/src/lib/vehicles-health-check/runner.js
  Restart=on-failure
  Environment=DATABASE_URL=postgresql://...
  Environment=HEALTH_INTERVAL_SECONDS=60
  Environment=HEALTH_CONFIRMATION_RUNS=2

  [Install]
  WantedBy=multi-user.target
  ```

  Then `systemctl enable --now vehicle-health.service`.

- **Managed hosting without a long-running process**: you currently cannot assume a 60-second
  scheduler here. If dubaicar blocking is your main concern, the safer path is to wait until a
  VPS or other persistent worker runner is available, or to add a real scheduled-job backend
  before enabling frequent checks.

- **Manual**: `npm run vehicles:health:once`.

## Environment variables

- `DATABASE_URL` — required.
- `HEALTH_INTERVAL_SECONDS` — default `60`.
- `HEALTH_CONFIRMATION_RUNS` — default `2`.
- `HEALTH_CHECK_TIMEOUT_MS` — default `15000`.
- `HEALTH_LIMIT_PER_TICK` — default `1000`.

## Testing the logic

The worker itself is one Node file, so the simplest tests are integration-oriented:

1. Confirmed existence: mock `fetchPage` to return a 200 listing page without removal text.
2. Confirmed removal: mock `fetchPage` to return 404 or body text that says the listing is gone.
3. Manual unavailability: insert a vehicle with `status = 'unavailable'` and ensure the tick
   does not re-enable it.
4. Timeouts and blocked sources: mock `fetchPage` to return `null`, 429, or 403, and verify
   the vehicle is untouched.
5. Database failure: simulate a query failure and verify the worker logs instead of crashing the
   process.
6. Unknown results: verify that `null` outcomes never transition a vehicle to `unavailable`,
   including repeated inconclusive runs.

Because dubaicar is the only configured source and it is often blocked, the realistic automated
test right now should use a fake HTTP layer rather than depending on the live site.

## Limits right now

- The only external source in the code is `dubicars`.
- `dubicars` pages are frequently not reachable from automated requests, so external removal
  detection is intentionally conservative.
- The project currently has no reliable long-running scheduler in the deployed environment, so
  the 60-second cadence is ready in code but still needs an appropriate runner to be useful.

## Next steps

- Confirm how this app is actually deployed and use the matching scheduler.
- If dubaicar stays unreliable, add a second listing source or an image/URL availability check
  that does not depend on the blocked site.
- If you want images served without downloading them to your server, keep remote image URLs and
  render them directly when the host permits embedding; the existing catalog code already renders
  image URLs as-is.
