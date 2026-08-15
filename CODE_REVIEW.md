# QMaster Weekly Code Review

**Review period:** August 8–15, 2026 (inclusive)
**Reviewed repositories:** [`question_genarator`](.) (Next.js frontend) and [`question_genarated_api`](https://github.com/Subhadip023/question_genarated_api) (FastAPI backend)

## Scope and method

This review inspected commits reachable from each repository’s checked-out `main` branch during the review period, their changed files, and the frontend conventions in [`CONTEXT.md`](./CONTEXT.md). Commit totals include merge commits, so they show review activity rather than code volume or quality. Contributor aliases are grouped only where confirmed in the review instructions.

## Validation summary

| Check | Result | Notes |
|---|---|---|
| Frontend lint | **Not passing** | `npm run lint` reported **33 errors** and **31 warnings**. Several errors are in weekly-touched attempt, preview, and test-series files. |
| Frontend automated tests | Not found | No conventional frontend test suite was found in the repository. |
| Backend automated tests | Not configured | No test suite or test runner dependency is declared in `pyproject.toml`. |
| Server-side question search | **Implemented** | Backend accepts bounded `search` input and applies `ILIKE` before pagination. |
| Frontend service/proxy adoption | **Improved** | The weekly refactor added `ApiClient` and `BackendProxy`, then migrated core services and routes. |

## Developer scoreboard — weekly activity

| Developer | Confirmed accounts / identities | Weekly commits (Frontend / Backend) | Weekly score | Review status |
|---|---|---:|---:|---|
| 👑 **Subhadip** | `debashismidya`, `subhadip`, `subhadipMJ`, `Subhadip023`, `Subhadip Chakraborty` (`subhadip240420@gmail.com`) | 26 (16 / 10) | **8.2 / 10** | Strong architecture and core exam-flow delivery; needs validation and safer backend error handling. |
| 🚀 **Nilrudra ("Nill")** | `Nilrudra Dutta`, `dnilrudra10`, `nilrudra1912` | 25 (23 / 2) | **7.6 / 10** | Strong teacher-preview and UX work; resolve TypeScript/lint findings in the touched preview flow. |
| 🧩 **Aniket Bera** | `Aniket`, `Aniket Bera`, `aniketbera2001@gmail.com`, `matainja0135@gmail.com`, `130917041+Aniket-cyber69@users.noreply.github.com` | 2 (0 / 2) | **7.0 / 10** | Backend test-series/view work is present; limited weekly evidence and no automated coverage. |
| 🔎 **sayan-matainja** | `sayan-matainja` (`matainja0137@gmail.com`) | 1 (1 / 0) | **7.2 / 10** | Focused attempt-history search contribution; add component coverage before expanding the feature. |
| 📝 **Akash Roy** | `Akash Roy` | 0 (0 / 0) | **—** | No activity in this review window; not scored. |

## Weekly contribution deep dives

### 👑 Subhadip — architecture, student flows, and backend APIs

**Evidence reviewed**

- Centralized frontend access through `app/lib/api-client.ts` and `app/lib/backend-proxy.ts`, migrating services and organization/question proxy routes away from repeated token-and-fetch logic.
- Added the backend `search` query parameter to question listing and applies it with `Question.question.ilike(...)` before `count`, `offset`, and `limit`.
- Delivered student test discovery, secure attempt-runner refinements, attempt history work, FastAPI test-series CRUD/reporting, topic work, and student-test lifecycle changes.

**What aligns well with project standards**

- The service and proxy refactor directly follows the `ApiClient` and `BackendProxy` conventions in `CONTEXT.md`.
- Question search is database-side and paginated, matching the stated performance pattern rather than filtering a full list in the browser.
- Attempt lifecycle and scoring changes are substantial end-to-end work across the student frontend and FastAPI controllers.

**Required follow-up**

1. Add tests for search, attempt expiry/auto-submit, authorization, and score calculation before further expansion of proctoring and test-series flows.
2. Remove raw exception details and tracebacks from client responses in `app/routes/test_series_routes.py`; log them server-side and return a generic 500 response.
3. Replace the inline `Loader2` usage introduced in the student-test flow with the shared `<Loader>` component required by `CONTEXT.md`.

### 🚀 Nilrudra ("Nill") — teacher preview and account UX

**Evidence reviewed**

- Added teacher question preview functionality and preview-runner updates.
- Updated diagram/image behavior and test-series calendar/create-redirect flows.
- Added confirm-password and visibility UX fixes.

**Strengths**

- The work improves teacher-side inspection and account ergonomics without bypassing the existing Next.js feature structure.
- Diagram and preview interactions show solid ownership of complex UI flows.

**Required follow-up**

1. Replace `getTestSeriesQuestions<any>(id)` with a concrete response type.
2. Resolve the lint errors in the weekly-touched preview page, especially JSX constructed inside `try/catch`; use an error boundary or separate data loading from rendering.
3. Add tests for keyboard navigation, preview modes, and diagram rendering.

### 🧩 Aniket Bera — backend test-series support

**Evidence reviewed**

- Updated FastAPI test-series controller/routes to support the teacher-facing view flow; the contribution is represented by two backend commits in the review window.

**Required follow-up**

1. Add route-level tests for the new test-series responses and authorization.
2. Use descriptive commit messages instead of `push` so reviews remain traceable.

### 🔎 sayan-matainja — attempt-history search

**Evidence reviewed**

- Added the student attempt-history search interface and integrated it into the history page.

**Required follow-up**

1. Add a component test covering search matching, empty state, and reset.
2. Confirm whether larger histories should move search/filtering to the backend to preserve the project’s server-side filtering rule.

### 📝 Akash Roy

No commits were recorded during this review period. The contributor remains in the inventory because the backend history contains an earlier README update.

## Contributor inventory — all reviewed repository history

| Contributor | Frontend commits | Backend commits | Total | Attribution basis |
|---|---:|---:|---:|---|
| Subhadip | 77 | 83 | 160 | Confirmed grouping supplied for `debashismidya`, `subhadip`, `Subhadip Chakraborty`, and `Akash Roy` identities. |
| Nilrudra ("Nill") | 27 | 4 | 31 | Confirmed grouping supplied for `Nilrudra Dutta` identities. |
| Aniket Bera | 0 | 8 | 8 | Confirmed grouping supplied for `Aniket` and `Aniket Bera` identities. |
| sayan-matainja | 1 | 0 | 1 | Separate contributor identity. |

These counts include merges and are not a performance ranking. `subhadipMJ` is included as a confirmed account alias but has no separate Git author identity in the checked-out histories.

## Comparative summary matrix

| Metric | Subhadip | Nilrudra ("Nill") | Aniket Bera | sayan-matainja |
|---|---:|---:|---:|---:|
| Weekly scope | High | High | Focused | Focused |
| Architecture / backend impact | 5 / 5 | 3 / 5 | 3 / 5 | 2 / 5 |
| UI / interaction impact | 4 / 5 | 5 / 5 | 2 / 5 | 3 / 5 |
| Standards compliance | 4 / 5 | 3 / 5 | 3 / 5 | 3 / 5 |
| Automated validation evidence | 1 / 5 | 1 / 5 | 1 / 5 | 1 / 5 |
| Weekly score | **8.2 / 10** | **7.6 / 10** | **7.0 / 10** | **7.2 / 10** |

## Team priorities for next week

1. Make the frontend lint command pass, starting with weekly-touched attempt, preview, and test-series files.
2. Establish a frontend component/E2E test baseline and backend route tests; protect proctoring, scores, authorization, and pagination first.
3. Stop returning exception messages and tracebacks from FastAPI routes.
4. Complete the shared-loader migration and maintain typed service responses.

---

> 🤖 **Generated by Codex (OpenAI)** from local Git history and changed-file inspection. This report is not an external certification.
