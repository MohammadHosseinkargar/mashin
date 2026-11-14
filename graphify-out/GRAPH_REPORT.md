# Graph Report - aLI  (2026-11-10)

## Corpus Check
- 141 files · ~169,888 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 46 file(s) not represented in the graph (top: .csv 35, .zip 3, .xml 2)

## Summary
- 1011 nodes · 2366 edges · 69 communities (36 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core UI and Dependencies
- Admin API Security
- Admin and Site Pages
- Design Search Utilities
- Data Reasoning Utilities
- Dubicars Import
- Background Jobs
- Design System Tools
- PostgreSQL Storage
- Vehicle Health Worker
- Health Worker Script
- Collector Scripts
- JSON File Storage
- Shared Data Store
- Package Configuration
- UI UX Guidelines
- Vehicle Source Checker
- TypeScript Configuration
- Design System Generator
- Design Output Formatting
- Responsive QA Scripts
- Vehicle Data Models
- Project Scripts
- Web App Manifest
- Design Palette Logic
- Listing Sync Worker
- Runtime Dependencies
- Fee Data Models
- Design Search Reasoning
- Upload Handling
- Vehicle Health Concepts
- Application Layout
- Project Documentation
- Health Worker Runner
- Icon Generation
- Exchange Rate Worker
- Color Mode Logic
- Lint Configuration
- Database Browser Tests
- Service Worker TypeScript
- Service Worker JavaScript
- Admin Layout
- Robots and Sitemap
- Listing Source Metadata
- Health Worker Bundle
- PostCSS Configuration
- Design Skill License
- Black Vehicle Body
- Blue Vehicle Body
- Black Complete Vehicle
- Blue Complete Vehicle
- Front Wheel Asset
- Rear Wheel Asset
- Blue Front Wheel
- Blue Rear Wheel
- Small App Icon
- Large App Icon
- Desktop Catalog Screenshot
- Mobile Catalog Screenshot
- Tablet Catalog Screenshot
- Desktop Home Screenshot
- Mobile Home Screenshot
- Tablet Home Screenshot
- Project Overview
- Storage Architecture Notes
- Offline Caching Notes
- Application Icon
- Pinned Tab Icon

## God Nodes (most connected - your core abstractions)
1. `ok()` - 36 edges
2. `api()` - 34 edges
3. `lucide-react` - 32 edges
4. `next` - 31 edges
5. `react` - 30 edges
6. `cn()` - 30 edges
7. `Store` - 26 edges
8. `fail()` - 25 edges
9. `toFa()` - 25 edges
10. `db` - 23 edges

## Surprising Connections (you probably didn't know these)
- `num()` --calls--> `toEnDigits()`  [EXTRACTED]
  src/lib/validators.ts → src/lib/format.ts
- `decideLifecycle()` --calls--> `hasExternalRef()`  [EXTRACTED]
  src/lib/vehicle-lifecycle.ts → src/lib/vehicle-checker.ts
- `XML sitemap discovery` --references--> `Vehicle catalog`  [EXTRACTED]
  public/robots.txt → README.md
- `_generate_intelligent_overrides()` --calls--> `search()`  [EXTRACTED]
  skills/ui-ux-pro-max/scripts/design_system.py → skills/ui-ux-pro-max/scripts/core.py
- `AboutPage()` --calls--> `LinkButton()`  [EXTRACTED]
  src/app/(site)/about/page.tsx → src/components/ui.tsx

## Import Cycles
- None detected.

## Communities (69 total, 33 thin omitted)

### Community 0 - "Core UI and Dependencies"
Cohesion: 0.05
Nodes (98): nextConfig, lucide-react, motion, next, react, sonner, LoginForm(), submit() (+90 more)

### Community 1 - "Admin API Security"
Cohesion: 0.05
Nodes (71): zod@^3.24.0, server-only, zod, GET, POST, POST, POST, POST (+63 more)

### Community 2 - "Admin and Site Pages"
Cohesion: 0.07
Nodes (62): fetchLatestRate(), metadata, PanelLayout(), AdminDashboard(), AboutPage(), FAQ, metadata, VALUES (+54 more)

### Community 3 - "Design Search Utilities"
Cohesion: 0.05
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 4 - "Data Reasoning Utilities"
Cohesion: 0.08
Nodes (41): _object_without_duplicates(), parse_decision_rules(), _validate_action(), _catalog_date(), _check_app_interface_contract(), _check_catalog_contract(), _check_catalog_summary(), _check_chart_contract() (+33 more)

### Community 5 - "Dubicars Import"
Cohesion: 0.08
Nodes (47): absoluteUrl(), attrJson(), attrValue(), countCards(), decodeEntities(), DEFAULT_SEARCH_URL, DUBICARS_USER_AGENT, DubicarsBlockedError (+39 more)

### Community 6 - "Background Jobs"
Cohesion: 0.13
Nodes (26): register(), g, loop(), msg(), num(), startBackgroundJobs(), startRateLoop(), startSyncLoop() (+18 more)

### Community 7 - "Design System Tools"
Cohesion: 0.12
Nodes (7): _detect_page_type(), format_page_override_md(), _generate_intelligent_overrides(), persist_design_system(), safe_slug(), _write_persisted_file(), format_output()

### Community 8 - "PostgreSQL Storage"
Cohesion: 0.14
Nodes (18): FEE_COLUMNS, g, init(), insertVehicle(), iso(), pgStore, pool(), q() (+10 more)

### Community 9 - "Vehicle Health Worker"
Cohesion: 0.16
Nodes (19): CHECK_TIMEOUT_MS, checkVehicle(), CONFIRMATION_RUNS, ensureKvTable(), fetchPage(), hasExternalRef(), isRecent(), LIMIT_PER_TICK (+11 more)

### Community 10 - "Health Worker Script"
Cohesion: 0.15
Nodes (16): APP_DIR, assessLocalHealth(), assessLocalHealthLocal(), externalExists(), fs, LIMIT, loadVehicles(), now() (+8 more)

### Community 11 - "Collector Scripts"
Cohesion: 0.18
Nodes (19): Blocked, die(), FAST_PAGES, Fatal, getStatus(), log(), main(), makeFetcher() (+11 more)

### Community 12 - "JSON File Storage"
Cohesion: 0.18
Nodes (18): FILE, g, jsonStore, locked(), mutate(), now(), read(), readRaw() (+10 more)

### Community 13 - "Shared Data Store"
Cohesion: 0.14
Nodes (6): DbFile, Store, ConsultationRequest, ExchangeRate, ImportSettings, SiteSettings

### Community 14 - "Package Configuration"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^20, @types/pg@^8.11.0, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 16 - "Vehicle Source Checker"
Cohesion: 0.19
Nodes (12): ExternalExistsResult, hasExternalRef(), SourceMeta, sourceMeta(), ConfirmedSourceChecker, DEFAULT_RETRY_DELAYS_MS, defaultRequestFn(), HttpSourceChecker (+4 more)

### Community 17 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 19 - "Design Output Formatting"
Cohesion: 0.14
Nodes (9): ansi_ljust(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), generate_design_system(), hex_to_ansi(), _mode_support_labels() (+1 more)

### Community 20 - "Responsive QA Scripts"
Cohesion: 0.13
Nodes (12): ADMIN_ROUTES, ADMIN_WIDTHS, CANDIDATES, consoleErrs, http5xx, interactFail, navfail, overflow (+4 more)

### Community 21 - "Vehicle Data Models"
Cohesion: 0.16
Nodes (7): Vehicle, VehicleInput, Sources, decideLifecycle(), LifecycleAction, LifecycleContext, SourceCheckResult

### Community 22 - "Project Scripts"
Cohesion: 0.14
Nodes (14): scripts, build, collector, collector:once, dev, exchange-rate:update, exchange-rate:worker, lint (+6 more)

### Community 23 - "Web App Manifest"
Cohesion: 0.14
Nodes (13): background_color, categories, description, dir, display, icons, lang, name (+5 more)

### Community 24 - "Design Palette Logic"
Cohesion: 0.15
Nodes (7): _button_outline_text_color(), _contrast_ratio(), _derive_dark_palette(), format_master_md(), _palette_is_dark(), _relative_luminance(), _select_palette_for_mode()

### Community 25 - "Listing Sync Worker"
Cohesion: 0.26
Nodes (12): BASE, BUDGET_MS, fmt(), INTERVAL_MINUTES, login(), main(), MAX_ONCE_BATCHES, ONCE (+4 more)

### Community 26 - "Runtime Dependencies"
Cohesion: 0.18
Nodes (11): dependencies, clsx@^2.1.1, lucide-react@^0.468.0, motion@^12.0.0, next@16.4.3, react@19.3.0, react-dom@19.3.0, server-only@^0.0.1 (+3 more)

### Community 27 - "Fee Data Models"
Cohesion: 0.22
Nodes (7): FeeCurrency, FeeType, ImportFee, ImportFeeInput, PriceBreakdown, PriceLine, VehicleStatus

### Community 29 - "Upload Handling"
Cohesion: 0.39
Nodes (3): TYPES, MIME, UPLOAD_DIR

### Community 30 - "Vehicle Health Concepts"
Cohesion: 0.25
Nodes (6): Dubicars Probe Target, Fake HTTP Layer Testing, Consecutive Health Confirmation Runs, Health Worker Environment Variables, Persistent Worker Scheduling, Vehicle Status Visibility Model

### Community 31 - "Application Layout"
Cohesion: 0.29
Nodes (4): @fontsource-variable/vazirmatn@^5.2.5, @fontsource-variable/vazirmatn, metadata, viewport

### Community 32 - "Project Documentation"
Cohesion: 0.29
Nodes (7): XML sitemap discovery, Admin panel, Listing ingestion API, Playwright listing collector, Live exchange rate and vehicle pricing, Vehicle catalog, Dubicars vehicle importer

### Community 33 - "Health Worker Runner"
Cohesion: 0.33
Nodes (4): child, path, { spawn }, workerFile

### Community 34 - "Icon Generation"
Cohesion: 0.47
Nodes (4): run(), sharp, svg(), { writeFileSync }

### Community 35 - "Exchange Rate Worker"
Cohesion: 0.33
Nodes (4): BASE, ONCE, sec, SECRET

### Community 36 - "Color Mode Logic"
Cohesion: 0.33
Nodes (3): _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary()

### Community 37 - "Lint Configuration"
Cohesion: 0.40
Nodes (4): eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 44 - "Health Worker Bundle"
Cohesion: 0.67
Nodes (3): Vehicle Health Worker Bundle, worker.js.read, worker.js.source

## Knowledge Gaps
- **35 isolated node(s):** `Next.js application`, `PostgreSQL and JSON storage`, `Live exchange rate and vehicle pricing`, `Admin panel`, `Playwright listing collector` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 373 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Core UI and Dependencies` to `Admin API Security`, `Admin and Site Pages`, `Robots and Sitemap`, `Package Configuration`, `Runtime Dependencies`, `Upload Handling`, `Application Layout`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **What connects `Next.js application`, `PostgreSQL and JSON storage`, `Live exchange rate and vehicle pricing` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core UI and Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.050699300699300696 - nodes in this community are weakly interconnected._
- **Why does `pg` connect `Database Browser Tests` to `PostgreSQL Storage`, `Vehicle Health Worker`, `Health Worker Script`, `Package Configuration`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Admin API Security` be split into smaller, more focused modules?**
  _Cohesion score 0.05280875236692615 - nodes in this community are weakly interconnected._
- **Why does `Vehicle` connect `Vehicle Data Models` to `Core UI and Dependencies`, `Admin and Site Pages`, `Dubicars Import`, `PostgreSQL Storage`, `JSON File Storage`, `Shared Data Store`, `Vehicle Source Checker`, `Fee Data Models`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Admin and Site Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.07135135135135136 - nodes in this community are weakly interconnected._