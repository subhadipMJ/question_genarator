# Safalya — Frontend

**Safalya** is a quiz and exam management platform for schools and organizations.  
Teachers create questions and test series. Students take tests and track their results.  
Super admins manage organizations and users across the platform.

> 📖 **For developers:** Read [`CONTEXT.md`](./CONTEXT.md) before writing any code.  
> It documents the architecture, conventions, service layer, and common patterns.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | lucide-react |
| Toast | sonner |
| Theme | next-themes (dark / light) |
| Rich Text | react-quill-new |
| Backend | FastAPI (see `question_genarated_api/`) |

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- The backend API running (see `question_genarated_api/README.md`)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
# URL of the FastAPI backend
API_URL=http://127.0.0.1:8000/
```

> For production, set `API_URL` to your deployed backend URL.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## User Roles

| Role | Value | Access |
|---|---|---|
| Super Admin | `0` | Full access, manages all organizations |
| Admin | `1` | Manages their own organization |
| Teacher | `2` | Creates questions and test series |
| Student | `3` | Takes tests, views history |

---

## Project Structure

```
app/
├── api/                  # Next.js API routes (authenticated proxy to backend)
│   ├── auth/             # login, logout, register
│   ├── organizations/    # org CRUD proxy
│   └── questions/        # question CRUD proxy
├── lib/
│   ├── api-url.ts        # Builds backend URL from API_URL env var
│   ├── api-client.ts     # Server-side fetch client (used in services)
│   └── backend-proxy.ts  # Client-facing proxy utility (used in API routes)
├── services/             # Typed data-fetching functions
│   ├── questions.ts
│   ├── topics.ts
│   ├── organizations.ts
│   ├── test-series.ts
│   ├── users.ts
│   └── student.ts
├── [feature]/
│   ├── page.tsx          # Server Component — fetches data, auth guards
│   ├── loading.tsx       # Shown while page.tsx loads (optional per-route)
│   └── *.tsx             # Client Components — interactive UI
└── loading.tsx           # Root loader — shown for ALL routes automatically

components/
├── loader.tsx            # Reusable spinner (fullPage, inline, overlay)
├── app-sidebar.tsx
└── ui/                   # shadcn/ui components
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Key Conventions

- **Fetch data** using `app/services/*.ts` — never call `getApiUrl()` directly in pages
- **API routes** use `createBackendProxy()` — never write manual token+fetch
- **Loading states** use `<Loader />` from `components/loader.tsx`
- **Pagination** is handled by the backend — don't load all records at once

See [`CONTEXT.md`](./CONTEXT.md) for the complete guide.

---

## Related

- Backend: `../question_genarated_api/` — FastAPI REST API
- Backend docs: run the backend and visit `/docs` (Swagger UI)