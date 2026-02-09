# Implementation Plan: meetjoshi.info Node.js Express API

## Context

This is a greenfield portfolio/journal backend for meetjoshi.info. The Supabase project is already running with 3 tables (projects, blogs, inquiries) created via the UI, but no Node.js code exists yet. We need to build an Express API that acts as a proxy between the Angular v18+ frontend and Supabase, handling auth, case transformation, and input validation.

**Current state:** No package.json, no source files. Supabase tables exist with RLS enabled but admin write policies are missing. No migrations tracked.

---

## Phase 0: Supabase Migrations (via MCP)

Track existing schema and add missing admin RLS policies using `mcp__supabase__apply_migration`.

**Migration 1 — `baseline_schema`:**
- `CREATE TABLE IF NOT EXISTS` for all 3 tables (idempotent, documents existing schema)
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all 3

**Migration 2 — `add_admin_rls_policies`:**
- Admin UUID: `7c838b11-81a0-430a-8716-7e191b63f22b`
- INSERT/UPDATE/DELETE policies on `projects` and `blogs` for authenticated admin
- SELECT/UPDATE/DELETE policies on `inquiries` for authenticated admin

---

## Phase 1: Project Scaffolding

- `npm init -y`
- **Dependencies:** `express`, `@supabase/supabase-js`, `cors`, `dotenv`, `helmet`, `express-rate-limit`
- **Dev dependencies:** `nodemon`
- **Scripts:** `"start": "node src/server.js"`, `"dev": "nodemon src/server.js"`
- Create `.gitignore` (node_modules/, .env)
- Create `.env.example` (committed template) and `.env` (not committed, needs real keys)

```env
PORT=3000
SUPABASE_URL=https://xzsnhghlivkvwgowhmpf.supabase.co
SUPABASE_ANON_KEY=<from dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from dashboard - KEEP SECRET>
CORS_ORIGIN=http://localhost:4200
```

---

## Phase 2: Project Structure

```
src/
  server.js                 # Entry point: loads .env, starts listening
  app.js                    # Express app: middleware + routes + error handler
  config/
    supabase.js             # Two clients: supabasePublic (anon) + supabaseAdmin (service role)
  middleware/
    auth.js                 # JWT verification via supabaseAdmin.auth.getUser(token)
    errorHandler.js         # Central error handler (consistent JSON responses)
    caseTransform.js        # Overrides res.json() to auto-convert snake_case -> camelCase
  routes/
    index.js                # Mounts all resource routers under /api/v1
    projectRoutes.js
    blogRoutes.js
    contactRoutes.js
    authRoutes.js
  controllers/
    projectController.js
    blogController.js
    contactController.js
    authController.js
  utils/
    apiError.js             # Custom error class with statusCode
    caseUtils.js            # snakeToCamel() and camelToSnake() recursive helpers
    validate.js             # validateRequired(), validateEmail()
```

---

## Phase 3: Core Infrastructure

### `src/config/supabase.js`
- **supabasePublic** (anon key) — for public GET endpoints, respects RLS
- **supabaseAdmin** (service role key) — for admin writes + JWT verification, bypasses RLS

### `src/utils/apiError.js`
- `class ApiError extends Error` with `statusCode` property

### `src/utils/caseUtils.js`
- `snakeToCamel(obj)` — recursive key transformation for responses
- `camelToSnake(obj)` — recursive key transformation for incoming request bodies
- ContentBlock keys (type, content, caption, language) have no underscores, pass through unchanged

### `src/utils/validate.js`
- `validateRequired(body, fields)` — throws 400 if missing
- `validateEmail(email)` — throws 400 if invalid format

### `src/middleware/auth.js`
- Extracts `Bearer <token>` from Authorization header
- Verifies via `supabaseAdmin.auth.getUser(token)`
- Attaches `req.user` on success, returns 401 on failure

### `src/middleware/errorHandler.js`
- 4-arg Express error middleware
- Returns `{ message }` with appropriate status code
- Logs 500-level errors to console

### `src/middleware/caseTransform.js`
- Overrides `res.json()` globally to apply `snakeToCamel()` automatically

---

## Phase 4: Routes & Controllers

### Auth — `POST /api/v1/auth/login`
- Accepts `{ email, password }`
- Calls `supabaseAdmin.auth.signInWithPassword()`
- Returns `{ token, user: { id, email } }`
- No signup endpoint (single admin user already exists)

### Projects — `/api/v1/projects`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | No | List view (id, title, category, image, description, featured). Supports `?featured=true` |
| GET | `/:id` | No | Full detail with all columns |
| POST | `/` | Yes | Required: title, category, image, description |
| PUT | `/:id` | Yes | Partial update |
| DELETE | `/:id` | Yes | Returns success message |

### Blogs — `/api/v1/blogs`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | No | Summary (excludes blocks). Ordered by published_date DESC |
| GET | `/:id` | No | Full with blocks |
| POST | `/` | Yes | Required: title, excerpt, category |
| DELETE | `/:id` | Yes | Returns success message |

### Contact — `/api/v1/contact`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | No | Required: name, email, message. Rate limited (5/min/IP). Uses supabasePublic (anon key + public INSERT policy) |

---

## Phase 5: App Wiring (`src/app.js`)

Middleware order:
1. `helmet()` — security headers
2. `cors({ origin: CORS_ORIGIN })` — CORS for Angular
3. `express.json()` — body parsing
4. `camelCaseResponse` — auto snake->camel on responses
5. Routes at `/api/v1`
6. 404 handler
7. `errorHandler` — must be last

---

## Implementation Order (commit-by-commit)

0. **Implementation docs** — Save this plan as `docs/implementation/plan.md` for project documentation
1. **Project scaffolding** — npm init, deps, .gitignore, .env.example, directory structure
2. **Supabase migrations** — baseline schema + admin RLS policies via MCP
3. **Core infrastructure** — supabase config, utils, middleware
4. **App setup + Auth** — server.js, app.js, routes/index.js, auth endpoint
5. **Projects endpoints** — routes + controller (5 CRUD methods)
6. **Blogs endpoints** — routes + controller (4 methods)
7. **Contact endpoint** — routes + controller with rate limiting
8. **Documentation** — update CLAUDE.md and README.md

---

## Verification

After each phase, test by running `npm run dev` and using curl:
- `POST /api/v1/auth/login` with admin credentials
- `GET /api/v1/projects` (empty array expected)
- `POST /api/v1/projects` with Bearer token (create test project)
- `GET /api/v1/projects` (should return created project in camelCase)
- `GET /api/v1/blogs`, `POST /api/v1/blogs`, etc.
- `POST /api/v1/contact` (test rate limiting with repeated calls)

---

## Key Design Decisions

- **Two Supabase clients** (anon + service role) for defense-in-depth
- **Service role for admin writes** — simpler than per-request JWT-scoped clients, still secure because auth middleware already verified identity
- **Global camelCase response transform** — avoids repetition across controllers
- **No ORM** — Supabase JS client provides sufficient query building
- **Rate limiting only on contact** — other endpoints are either auth-protected or read-only
