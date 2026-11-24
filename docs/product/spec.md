# Product spec

The product brief. Stories in `docs/stories/` are derived from it; when a story or ADR records a decision that refines this spec, the story wins.

## 1. Goal and scope

A free PWA to plan, log and analyse Bible reading, where each person decides how to read and can see how they have progressed.

- **v1:** the reading tracker only — flexible, editable plan; reading log; progress insights; installable and offline. Published on GitHub Pages (no custom domain), free, with an optional donation link.
- **Later:** study material about each book (written by the owner in their own words) and reading practices, as a module added without rewriting the tracker.
- **Out of scope for now:** flashcard review (exists elsewhere), user accounts, cloud sync.
- **Users:** the app is public. The owner's personal plan ("Un libro al mes") is the **default template**, not something hard-coded.

## 2. Starting point: the "Un libro al mes" rule

1. Read 3 chapters a day.
2. Spend a month on a single book and read it as many times as fit in that month, to learn its key points. When the month ends, move on.
3. Order the books from shortest to longest. The person may pick another book in any month.
4. Go through the 66 books in a cycle of about 5½ years (67 months) and repeat the cycle as often as wanted.
5. Keep a history and charts of what was read each month and how many times.

The size criterion and the exact order are a personal preference: **the app must let each person build their own way of reading**. The default template orders by number of chapters.

**Domain key idea:** progress is measured in **chapters read**. Passes over a book are derived: chapters read ÷ chapters in the book.

## 3. Functional requirements

The person controls how they read and can change it at any time without losing their history: **the plan and the reading log are separate data** — editing the plan never deletes what was read.

### Configure how to read

- Chapters per day (default 3), rest days, and optionally a different pace per weekday.
- Duration of each book: a month by default, or a number of weeks or days, or until a number of passes is reached.
- Goal per book: target passes or a target date.
- Book order: templates (shortest to longest, canonical, others) and a custom order by reordering by hand. Include or exclude books.
- Cycles: how many times to repeat the whole journey; restart a cycle without losing history.
- Freely choose the book of each month, change it mid-month, pause or skip.
- Save, export and import plans as reusable templates.

### Log reading

- Mark the day with one tap: how many chapters and which (range).
- Log past days, edit or delete any log.
- A note per book or per reading about what was understood and the key points.
- See completed passes per book and the progress of the current book.

### Experience

- Spanish, mobile first, light and dark mode, accessible (contrast, keyboard, screen readers).
- Home screen with what is due today and logging in a single gesture.
- Works offline. Push reminders need a server, so v1 promises no notifications: what is due is shown when the app opens.

## 4. Insights

Seven questions, all computed from the reading log and the current plan, never from stored totals, so correcting a past day updates everything.

| Question                         | Metric                                                                | Suggested visual                  |
| -------------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| Am I on pace?                    | Chapters read vs expected this month; difference in chapters and days | Cumulative line, actual vs plan   |
| How consistent am I?             | Current and best streak; days read out of days in the month           | Calendar heatmap                  |
| How many times have I read each? | Full passes and fraction of the current one, per book                 | Horizontal bars per book          |
| How far into the cycle am I?     | Books finished out of 66 and months left                              | Cycle progress bar                |
| How do I read?                   | Chapters per weekday, 7-day average, zero days                        | Weekday bars and average line     |
| What happened each month?        | Book, passes, chapters, goal met or not, notes                        | History table, one row per month  |
| When will I finish?              | Estimated end of cycle at the last 30 days' pace                      | Text with the date and assumption |

Chart rules: hand-drawn SVG/HTML, no heavy libraries, tooltip on hover and tap; never rely on colour alone (label or icon per series); test light and dark; always offer the equivalent data table; with little data show a clear message instead of empty charts; export history to CSV.

## 5. Decisions already taken

Static PWA on GitHub Pages, free, no custom domain, data on each person's device.

- **Hosting:** `https://<user>.github.io/<repo>/` with HTTPS. Free accounts need a public repo. Under a sub-path every route is relative and the service worker scope matches the sub-path.
- **No server, no accounts, no own database.**
- **Local first:** progress lives in IndexedDB. The app requests persistent storage (`navigator.storage.persist()`), offers JSON backup export/import and reminds the person to back up now and then. Safari may evict data of sites not used for a while; installing the PWA reduces that risk. A short notice explains it.
- **No sync in v1:** if needed later, an external free-tier service is added without changing the data model.
- **Privacy:** no personal data collected, no third-party trackers by default.

GitHub Pages limits (official docs, checked 2026-11-23): published site ≤ 1 GB; soft 100 GB/month bandwidth; soft 10 builds/hour (does not apply to a custom Actions workflow); deployments over 10 minutes fail; not for online business, e-commerce or commercial SaaS, nor sensitive transactions. A free app with voluntary donations fits while access never depends on paying.

## 6. Donations (phase 4)

Free app; support is voluntary and no feature depends on it.

- Never publish account numbers, CLABE or card numbers in code, repo or page.
- An external payment link (service not chosen yet; check country support and fees first).
- Configured in one place: a `donation` section in the config (`enabled`, `label`, `url`). With `enabled: false` or no URL, nothing is shown.
- Shown in "Acerca de" or the footer, with a clear statement that the app is free and support is voluntary. No pop-ups or nagging.
- Tax note: donations may count as income — the owner should check with an accountant.

## 7. Data model

See [[architecture/data-model|Data model]]. Plan (editable), reading log (history that is never lost) and notes are separate; metrics are computed. Every export carries `schemaVersion`; imports migrate old versions and reject invalid files with a clear message without overwriting current data. Dates are stored as local days `YYYY-MM-DD`. The book catalog is fixed: 66 books with id, Spanish name, chapter count, testament and canonical order.

## 8. PWA and deployment

- **Manifest:** name, short_name, `lang: es`, relative `start_url` and `scope` (`./`), `display: standalone`, theme and background colours, 192 and 512 px icons and a maskable one.
- **Service worker:** caches the whole app under a versioned cache, drops old caches on activation, registered with a relative path.
- **Updates:** when a new version exists, show "Hay una versión nueva" with a reload button. Never update silently or lose data doing so.
- **iOS:** apple-touch-icon and home-screen meta tags. Brief install help for Android, iPhone and desktop.
- **Offline:** every feature, including insights, works without network. No fonts, scripts or charts from a CDN.
- **Deploy:** a GitHub Actions workflow on every push to `main` builds, uploads the site as an artifact and deploys with the official Pages actions (`configure-pages`, `upload-pages-artifact`, `deploy-pages`), permissions `pages: write` and `id-token: write`.

Before calling something done: open it from the real sub-path; install on Android and iPhone and use it offline; publish a second version and check the update notice appears and data survives; export, wipe and re-import a backup; pass Lighthouse (PWA, accessibility, performance), check contrast and keyboard use.

## 9. Roadmap

1. **MVP.** Catalog of 66 books, data model, default plan (3 chapters a day, shortest to longest, a month per book), daily log, local storage, export/import, installable and offline PWA, Pages deploy. Done when the owner can log a full month from their phone.
2. **Flexibility.** Full plan editor: order, duration, goals, cycles, rest days, templates, editing past logs, notes.
3. **Insights.** The seven metrics of section 4, charts with equivalent tables, CSV export.
4. **Support and polish.** Configurable donation section, install help, accessibility, Lighthouse.
5. **Study material.** Notes and practices per book, one content file per book (`content/<bookId>.md` or JSON), shown on the book page, especially during the month it is read.
6. **Optional sync** between devices with an external service, only if needed.

From phase 1, each book's page accepts extra sections without being rewritten, so phase 5 only adds content and a section.

## 10. Rights

- v1 only uses book names and chapter numbers, no Bible text. If text is shown later, use a public-domain version (e.g. Reina-Valera 1909) or references only. Versions such as Reina-Valera 1960 are copyrighted (book _names_ are not).
- Study material must be written in the owner's own words (summaries, questions, practices), citing title and author. Never copy passages from the source works or derived guides.
- Never commit tokens, keys or bank details.
