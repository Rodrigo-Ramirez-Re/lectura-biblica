---
status: accepted
date: 2026-11-24
---

# 0002 — Static PWA on GitHub Pages

## Context

The app is free, has no server and must work offline. It is published at `https://<user>.github.io/lectura-biblica/`, a sub-path, from a public repo.

## Decision

- **Client-side rendered** Angular SPA. Nothing to prerender: every screen depends on data in the device.
- Built with `--base-href /lectura-biblica/`; every URL in the app, manifest and service worker is relative.
- **Angular service worker** (`@angular/service-worker`, `ngsw-config.json`): hashed, versioned caching of the whole app; `SwUpdate.versionUpdates` drives the "Hay una versión nueva" notice. Never `activateUpdate` without the person's click.
- **Deep links:** the build copies `index.html` to `404.html`, so a first visit to `/lectura-biblica/plan` boots the app. After install, the service worker answers navigations itself.
- Deployed by a GitHub Actions workflow on every push to `main` with the official Pages actions.

## Consequences

- e2e runs against the build served under `/lectura-biblica/`, never from the server root, to catch absolute paths.
- A repo rename changes the base href and the public URL. IndexedDB data survives it: every project site of the account shares the origin `<user>.github.io`, so the database name is namespaced (`lectura-biblica`) and never derived from the path.
- Sharing an origin with the owner's other Pages sites also means they could read this app's storage. Acceptable: no secrets are stored, and the owner controls every site on that origin.

## Rejected

- **Hash routing** (`/#/plan`): avoids `404.html` but makes URLs worse for no other gain.
- **Workbox / hand-written service worker** — the Angular one already gives versioned caches and an update API.
