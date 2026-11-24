---
status: accepted
date: 2026-11-24
---

# 0003 — Local-first data in IndexedDB

## Context

No accounts and no server in v1. Data must survive reloads, updates and offline use, and later may sync between devices without changing the model.

## Decision

- Data lives in **IndexedDB**, one object store per collection of the [[architecture/data-model|data model]], through the `idb` wrapper (~1 KB). Only `type:infrastructure` libs touch it, behind repository ports.
- The app calls `navigator.storage.persist()` and tells the person, in a short notice, that data lives only on this device, that Safari may evict it if the site is not used for a while, and that installing the app and exporting backups protects it.
- **Backups:** JSON export/import of the whole dataset, with `schemaVersion`, validated and migrated on import. The app reminds the person to export when the last backup is old.
- **Sync** (phase 6, only if needed): a new adapter for an external free-tier service behind the same ports.

## Consequences

- Unit tests use in-memory fakes; adapters are tested against `fake-indexeddb`.
- Losing the device without a backup loses the data. The notice and reminders are the mitigation.

## Rejected

- **localStorage** — synchronous, ~5 MB, string-only, and evicted under the same rules.
- **Dexie** — more features than needed for a handful of small stores.
- **Supabase/Firebase now** — accounts and a backend for a single-device v1.
