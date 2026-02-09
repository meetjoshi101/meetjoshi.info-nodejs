# Data Model: Supabase (PostgreSQL)

**Project:** Portfolio & Journal  
**Version:** 1.0.0

This document outlines the database schema required to power the portfolio application using Supabase. It leverages PostgreSQL's `JSONB` capabilities to store structured rich text content.

## 1. Tables

### 1.1 `projects` (Work)
Stores portfolio case studies and projects.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | Unique identifier |
| `created_at` | `timestamptz` | `DEFAULT now()` | Creation timestamp |
| `title` | `text` | `NOT NULL` | Project title |
| `category` | `text` | `NOT NULL` | e.g., "AI Model", "System Design" |
| `image` | `text` | `NOT NULL` | URL to cover image |
| `description` | `text` | `NOT NULL` | Short summary for the list view |
| `featured` | `boolean` | `DEFAULT false` | If true, shows on Home page |
| `client` | `text` | | Client name |
| `year` | `text` | | Year of completion |
| `challenge` | `text` | | The "Challenge" section text |
| `solution` | `text` | | The "Solution" section text |
| `tech_stack` | `text[]` | | Array of strings (e.g., `['Angular', 'AWS']`) |
| `full_story` | `jsonb` | | Array of `ContentBlock` objects for the full case study |

#### `full_story` JSON Structure
```json
[
  {
    "type": "h2" | "p" | "image" | "quote" | "code",
    "content": "string",
    "caption": "string", // optional
    "language": "string" // optional
  }
]
```

---

### 1.2 `blogs` (Journal)
Stores blog posts and articles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | Unique identifier |
| `created_at` | `timestamptz` | `DEFAULT now()` | Creation timestamp |
| `published_date` | `date` | `DEFAULT CURRENT_DATE` | Date displayed on the article |
| `title` | `text` | `NOT NULL` | Article title |
| `excerpt` | `text` | `NOT NULL` | Short summary for list view |
| `category` | `text` | `NOT NULL` | e.g., "Philosophy", "Engineering" |
| `read_time` | `text` | | Manual string e.g., "5 min read" |
| `image` | `text` | | URL to cover image (optional) |
| `blocks` | `jsonb` | | Array of `ContentBlock` objects (Rich Text) |

---

### 1.3 `inquiries` (Contact Form)
Stores messages submitted via the contact form.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | Unique identifier |
| `created_at` | `timestamptz` | `DEFAULT now()` | Submission time |
| `name` | `text` | `NOT NULL` | Sender's name |
| `email` | `text` | `NOT NULL` | Sender's email |
| `message` | `text` | `NOT NULL` | The message content |
| `is_read` | `boolean` | `DEFAULT false` | Admin read status |

---

## 2. Row Level Security (RLS) Policies

Supabase requires RLS to be enabled to secure data.

### 2.1 Public Access (Read-Only)
*   **Table:** `projects`, `blogs`
*   **Policy:** `Enable read access for all users`
*   **Expression:** `true` (Allows anyone to SELECT)

### 2.2 Admin Access (Full Control)
*   **Table:** `projects`, `blogs`
*   **Policy:** `Enable insert/update/delete for authenticated admin users`
*   **Expression:** `auth.uid() = 'ADMIN_USER_UUID'` OR check a `profiles` table for admin role.

### 2.3 Inquiry Submission (Public Write)
*   **Table:** `inquiries`
*   **Policy:** `Enable insert for all users`
*   **Expression:** `true` (Allows anonymous users to INSERT)
*   **Note:** SELECT/UPDATE/DELETE on `inquiries` should be restricted to Admins only.

## 3. SQL Initialization Script

```sql
-- Create Projects Table
create table projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  category text not null,
  image text not null,
  description text not null,
  featured boolean default false,
  client text,
  year text,
  challenge text,
  solution text,
  tech_stack text[],
  full_story jsonb
);

-- Create Blogs Table
create table blogs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  published_date date default current_date,
  title text not null,
  excerpt text not null,
  category text not null,
  read_time text,
  image text,
  blocks jsonb
);

-- Create Inquiries Table
create table inquiries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean default false
);

-- Enable RLS
alter table projects enable row level security;
alter table blogs enable row level security;
alter table inquiries enable row level security;

-- Policies (Simple Public Read)
create policy "Public projects are viewable by everyone." on projects for select using (true);
create policy "Public blogs are viewable by everyone." on blogs for select using (true);
create policy "Anyone can submit inquiry" on inquiries for insert with check (true);
```
