# QMaster Weekly Code Review

**Review period:** August 27 – September 2, 2026 (inclusive)  
**Reviewed repositories:** [`question_genarator`](.) (Next.js frontend) and [`question_genarated_api`](https://github.com/Subhadip023/question_genarated_api) (FastAPI backend)

## Scope and method

This review inspected all commits reachable from each repository’s checked-out `main` and active feature branches during the 7-day review period, as well as the active codebase against project standards in [`CONTEXT.md`](./CONTEXT.md). Commit totals include merge commits to accurately reflect integration activity alongside code delivery. Contributor accounts have been mapped according to confirmed developer identities.

## Validation summary

| Check | Result | Notes |
|---|---|---|
| Frontend build (`npm run build`) | **Passing** | Next.js 16 (Turbopack) build completed with exit code 0; all 27 static and dynamic routes compiled cleanly. |
| Frontend lint (`npm run lint`) | **Not passing** | `eslint` reported 47 errors and 37 warnings across 84 problems. Needs cleanup in hook effects and attempt pages. |
| Frontend automated tests | Not found | No automated test framework (Jest/Vitest/Playwright) is configured. |
| Backend automated tests | Not configured | No pytest suite or runner is configured in `pyproject.toml`. |
| Server-side pagination & search | **Implemented** | Question listing uses backend ILIKE search with bounded offset/limit before rendering. |
| Service & BackendProxy adoption | **Passing** | Auth, test-series, and organization routes use centralized `BackendProxy` and `ApiClient` utilities. |
| Result & Score Visibility Controls | **Implemented** | End-to-end support for `is_result_show` and `is_score_show` flags, with staff role overrides (0, 1, 2) and student masking (role 3). |
| Organization Onboarding & Activation | **Implemented** | Public organization registration creates deactivated accounts (`is_active = False`) requiring Super Admin approval; Super Admin creation defaults to active. |

## Developer scoreboard — weekly activity

| Developer | Confirmed accounts / identities | Weekly commits (Frontend / Backend) | Weekly score | Review status |
|---|---|---:|---:|---|
| 👑 **Subhadip** | `debashismidya`, `subhadip`, `subhadipMJ`, `Subhadip023`, `Subhadip Chakraborty` (`subhadip240420@gmail.com`), `Akash Roy` (`debashis.matainja@gmail.com`) | 7 (5 / 2) | **8.8 / 10** | Excellent full-stack delivery of result visibility controls, account activation workflows, middleware security, and public onboarding ergonomics. |
| 🚀 **Nilrudra ("Nill")** | `Nilrudra Dutta`, `dnilrudra10`, `nilrudra1912` | 22 (15 / 7) | **8.1 / 10** | Strong UI/UX contribution for student history badges, score masking, test-series editor updates, and student analysis viewer. |
| 🧩 **Aniket Bera** | `Aniket`, `Aniket Bera`, `aniketbera2001@gmail.com`, `matainja0135@gmail.com`, `130917041+Aniket-cyber69@users.noreply.github.com` | 6 (0 / 6) | **7.5 / 10** | Database schema additions (`is_result_show`, `is_score_show` in `test_series`), bulk question backend updates, and pull request merges. |
| 🔎 **sayan-matainja** | `sayan-matainja` (`matainja0137@gmail.com`) | 0 (0 / 0) | **7.2 / 10** | No commits in the past 7 days; retained from repository history for student attempt-history search feature. |
| 📝 **Akash Roy** | `Akash Roy` | 0 (0 / 0) | **—** | Identity mapped under Subhadip (`debashis.matainja@gmail.com`); no standalone activity in this review window. |

## Weekly contribution deep dives

### 👑 Subhadip — full-stack architecture, result visibility & organization activation

**Evidence reviewed**

- **Result & Score Visibility Controls**:
  - Updated backend `StudentTestController._serialize_attempt` to enforce `is_result_show` and `is_score_show` rules. Granted staff roles (0, 1, 2) full access to detailed scores and answer keys while strictly masking correct answers and scores for student sessions (role 3).
  - Integrated the global "Publish Results" action in `test-series/[id]/results/results-viewer.tsx` with a live visual toggle state and backend persistence.
- **Organization Onboarding & Activation Workflow**:
  - Implemented deactivated-by-default behavior (`is_active = False`) for user-registered organizations in `OrganizationCreate` schema and `OrganizationController.create_organization`.
  - Added role-aware activation logic so organizations created by Super Admin (role 0) default to `is_active = True`, while user/public registrations remain inactive until Super Admin approval.
  - Implemented `AccountDeactivatedError` handling in `auth_controller.py` and `auth_routes.py` returning HTTP 403 Forbidden with custom error messaging: `"Account is not active, Contact to super admin"`.
  - Updated Next.js middleware `proxy.ts` to register `/organizations/create` as a public route and added password confirmation validation in `organization-form.tsx`.

**What aligns well with project standards**

- Directly follows the `BackendProxy` and `ApiClient` patterns in `CONTEXT.md`.
- Enforces strict server-side authorization and data sanitization based on user roles (staff vs student).
- Delivers polished end-to-end functionality from database schema updates to frontend UI feedback without breaking production build compatibility.

**Required follow-up**

1. Write automated backend unit tests for role-based result visibility masking and account activation endpoints.
2. Address the ESLint warnings and errors in touched frontend forms and pages.

---

### 🚀 Nilrudra ("Nill") — student history UX, test-series editor & analysis viewer

**Evidence reviewed**

- **Student History & Attempt Badges**:
  - Updated `app/student/history/history-search.tsx` to render "Result Out" (green badge) / "Result Not Out" (amber badge) status indicators based on `is_result_show`.
  - Added masked score messaging (`"Score Hidden (Result Not Out)"`) when score visibility is disabled.
- **Test-Series & Student Analysis**:
  - Refactored `test-series-editor.tsx` to expose visibility toggle controls and status banners.
  - Implemented the student performance analysis viewer (`app/users/[studentId]/analysis/analysis-viewer.tsx`).
  - Updated `questions-table.tsx` for bulk selection and question list management.

**Strengths**

- High visual fidelity and intuitive UI indicators matching shadcn component standards.
- Strong responsiveness and UX consistency across student-facing and teacher-facing management interfaces.

**Required follow-up**

1. Replace remaining `any` type assertions in `test-series.ts` with explicit TypeScript interfaces.
2. Clean up inline `setState` calls inside `useEffect` in touched components to satisfy ESLint rule `react-hooks/set-state-in-effect`.

---

### 🧩 Aniket Bera — database schema & backend test-series migration

**Evidence reviewed**

- Modified `test_series` database model and FastAPI schemas (`app/models/test_series.py` & `app/schemas/test_series.py`) to introduce `is_result_show` and `is_score_show` columns (tinyint(1) default 0).
- Handled backend bulk question modifications and pull request integration merges.

**Strengths**

- Solid backend model definitions and seamless schema alignment with controller serialization requirements.

**Required follow-up**

1. Ensure all commit messages provide clear descriptive context rather than generic titles like `push`.
2. Add migration scripts or documentation for updating production database schemas.

---

### 🔎 sayan-matainja — attempt-history search

**Evidence reviewed**

- Retained in inventory from prior attempt-history search contribution (`app/student/history`). No commits recorded in the past 7 days.

**Required follow-up**

1. Add component tests covering student history search filters when work resumes.

---

### 📝 Akash Roy

- Identity mapped under Subhadip (`debashis.matainja@gmail.com`). No standalone activity recorded in this review window.

## Contributor inventory — all reviewed repository history

Every author returned by `git shortlog -sne --all` for both repositories is cataloged below:

| Contributor | Frontend commits (`question_genarator`) | Backend commits (`question_genarated_api`) | Total commits | Author identities included |
|---|---:|---:|---:|---|
| **Subhadip** | 122 | 86 | 208 | `debashismidya <debashis.matainja@gmail.com>` (73 FE / 59 BE)<br>`Subhadip Chakraborty <subhadip240420@gmail.com>` (28 FE / 23 BE)<br>`subhadip <matainja0131@gmail.com>` (11 FE)<br>`debashismidya <98264381+Subhadip023@users.noreply.github.com>` (8 FE / 3 BE)<br>`debashismidya <subhadip240420@gmail.com>` (2 FE)<br>`Akash Roy <debashis.matainja@gmail.com>` (1 BE) |
| **Nilrudra ("Nill")** | 50 | 13 | 63 | `Nilrudra Dutta <dnilrudra10@gmail.com>` (50 FE / 12 BE)<br>`Nilrudra Dutta <nilrudra1912@gmail.com>` (1 BE) |
| **Aniket Bera** | 0 | 16 | 16 | `Aniket <aniketbera2001@gmail.com>` (8 BE)<br>`Aniket Bera <130917041+Aniket-cyber69@users.noreply.github.com>` (7 BE)<br>`Aniket <matainja0135@gmail.com>` (1 BE) |
| **sayan-matainja** | 2 | 0 | 2 | `sayan-matainja <matainja0137@gmail.com>` (2 FE) |

## Comparative summary matrix

| Metric | Subhadip | Nilrudra ("Nill") | Aniket Bera | sayan-matainja |
|---|---:|---:|---:|---:|
| Weekly scope | High | High | Focused | Inactive |
| Architecture / backend impact | 5 / 5 | 4 / 5 | 4 / 5 | 2 / 5 |
| UI / interaction impact | 5 / 5 | 5 / 5 | 3 / 5 | 3 / 5 |
| Standards compliance | 5 / 5 | 4 / 5 | 4 / 5 | 3 / 5 |
| Automated validation evidence | 2 / 5 | 2 / 5 | 1 / 5 | 1 / 5 |
| **Weekly score** | **8.8 / 10** | **8.1 / 10** | **7.5 / 10** | **7.2 / 10** |

## Team priorities for next week

1. **Automated Test Suite**: Introduce Vitest/React Testing Library for frontend component testing and pytest for backend FastAPI route validation.
2. **ESLint Remediation**: Resolve remaining 47 lint errors (primarily `react-hooks/set-state-in-effect`) to achieve clean `npm run lint` execution.
3. **Database Migrations**: Standardize Alembic/SQL migration scripts for `test_series` visibility columns (`is_result_show`, `is_score_show`).
4. **Error Response Standardization**: Ensure all backend error handlers return structured JSON messages without exposing internal stack traces.

---

> 🤖 **Generated by Antigravity (Google DeepMind)** from local Git history and changed-file inspection. This report is not an external certification.
