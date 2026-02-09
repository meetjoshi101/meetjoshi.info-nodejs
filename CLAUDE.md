# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Node.js Express API backend for meetjoshi.info — a portfolio and journal website. Acts as a proxy between an Angular v18+ frontend and Supabase (PostgreSQL).

## Commands

- `npm run dev` — Start dev server with nodemon (auto-reload)
- `npm start` — Start production server
- `npm install` — Install dependencies

## Architecture

- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth (JWT-based, single admin user)
- **API Base:** `/api/v1`

### Project Structure

```
src/
  server.js              # Entry point
  app.js                 # Express app setup (middleware, routes, error handler)
  config/supabase.js     # Two Supabase clients: public (anon) + admin (service role)
  middleware/
    auth.js              # JWT verification via supabaseAdmin.auth.getUser()
    errorHandler.js      # Central error handler
    caseTransform.js     # Auto snake_case -> camelCase on responses
  routes/                # Express routers (projectRoutes, blogRoutes, contactRoutes, authRoutes)
  controllers/           # Request handlers per resource
  utils/
    apiError.js          # Custom error class with statusCode
    caseUtils.js         # snakeToCamel / camelToSnake helpers
    validate.js          # Input validation helpers
```

### Key Patterns

- **Two Supabase clients:** `supabasePublic` (anon key, respects RLS) for public reads; `supabaseAdmin` (service role key, bypasses RLS) for admin writes and auth verification
- **Case transformation:** DB uses snake_case, API responses are camelCase (auto-transformed via middleware)
- **Error handling:** Throw `ApiError(statusCode, message)` in controllers — caught by central error handler
- **Auth:** Protected routes use `requireAuth` middleware that verifies Bearer tokens

### Database Tables

- `projects` — Portfolio case studies (JSONB `full_story` for rich content blocks)
- `blogs` — Journal posts (JSONB `blocks` for rich content)
- `inquiries` — Contact form submissions

## Environment Variables

Required in `.env` (see `.env.example`):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (default: 3000)
- `CORS_ORIGIN` (default: http://localhost:4200)
