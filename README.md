# meetjoshi.info — Backend API

Node.js Express API for the meetjoshi.info portfolio and journal website. Connects to Supabase for database and authentication.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your Supabase keys in .env
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | No | Admin login, returns JWT |
| GET | `/api/v1/projects` | No | List projects (supports `?featured=true`) |
| GET | `/api/v1/projects/:id` | No | Get project details |
| POST | `/api/v1/projects` | Yes | Create project |
| PUT | `/api/v1/projects/:id` | Yes | Update project |
| DELETE | `/api/v1/projects/:id` | Yes | Delete project |
| GET | `/api/v1/blogs` | No | List blog posts |
| GET | `/api/v1/blogs/:id` | No | Get blog post |
| POST | `/api/v1/blogs` | Yes | Create blog post |
| DELETE | `/api/v1/blogs/:id` | Yes | Delete blog post |
| POST | `/api/v1/contact` | No | Submit contact form (rate limited) |

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
