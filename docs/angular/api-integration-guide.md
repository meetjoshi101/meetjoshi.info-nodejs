# Angular API Integration Guide

**Backend:** Node.js Express API
**API Base URL:** `http://localhost:3000/api/v1` (development)
**Content-Type:** `application/json`
**Response Format:** All responses use **camelCase** keys (auto-transformed from DB snake_case)

---

## 1. TypeScript Interfaces

### 1.1 ContentBlock

Shared rich text block used in both Projects (`fullStory`) and Blogs (`blocks`).

```typescript
interface ContentBlock {
  type: 'h2' | 'p' | 'image' | 'quote' | 'code';
  content: string;
  caption?: string;   // for type: 'image'
  language?: string;   // for type: 'code'
}
```

### 1.2 Project

```typescript
// Returned by GET /api/v1/projects (list view)
interface ProjectSummary {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  featured: boolean;
}

// Returned by GET /api/v1/projects/:id (detail view)
interface Project {
  id: string;
  createdAt: string;          // ISO 8601 timestamptz
  title: string;
  category: string;
  image: string;              // full URL
  description: string;
  featured: boolean;
  client: string | null;
  year: string | null;
  challenge: string | null;
  solution: string | null;
  techStack: string[] | null;
  fullStory: ContentBlock[] | null;
}

// Used in POST /api/v1/projects and PUT /api/v1/projects/:id
interface ProjectPayload {
  title: string;              // required
  category: string;           // required
  image: string;              // required
  description: string;        // required
  featured?: boolean;
  client?: string;
  year?: string;
  challenge?: string;
  solution?: string;
  techStack?: string[];
  fullStory?: ContentBlock[];
}
```

### 1.3 Blog

```typescript
// Returned by GET /api/v1/blogs (list view)
interface BlogSummary {
  id: string;
  title: string;
  excerpt: string;
  publishedDate: string;      // ISO date string "YYYY-MM-DD"
  category: string;
  readTime: string | null;
  image: string | null;
}

// Returned by GET /api/v1/blogs/:id (detail view)
interface Blog {
  id: string;
  createdAt: string;          // ISO 8601 timestamptz
  publishedDate: string;      // ISO date string "YYYY-MM-DD"
  title: string;
  excerpt: string;
  category: string;
  readTime: string | null;
  image: string | null;
  blocks: ContentBlock[] | null;
}

// Used in POST /api/v1/blogs
interface BlogPayload {
  title: string;              // required
  excerpt: string;            // required
  category: string;           // required
  publishedDate?: string;     // defaults to today if omitted
  readTime?: string;
  image?: string;
  blocks?: ContentBlock[];
}
```

### 1.4 Contact

```typescript
// Used in POST /api/v1/contact
interface ContactPayload {
  name: string;               // required
  email: string;              // required, validated server-side
  message: string;            // required
}
```

### 1.5 Auth

```typescript
// Used in POST /api/v1/auth/login
interface LoginPayload {
  email: string;              // required
  password: string;           // required
}

// Returned by POST /api/v1/auth/login
interface LoginResponse {
  token: string;              // JWT access token
  user: {
    id: string;
    email: string;
  };
}
```

### 1.6 Error & Message Responses

```typescript
// All errors follow this shape
interface ApiError {
  message: string;
}

// Success messages (delete, contact)
interface ApiMessage {
  message: string;
}
```

---

## 2. Environment Setup

### 2.1 Angular environment.ts

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

### 2.2 CORS

The backend allows requests from `http://localhost:4200` by default. If your Angular dev server runs on a different port, the backend `CORS_ORIGIN` env variable must be updated.

---

## 3. Angular Service Examples

### 3.1 API Service (Base HTTP Service)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`);
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}
```

### 3.2 Auth Service

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';

  constructor(private api: ApiService) {}

  login(email: string, password: string) {
    return this.api.post<LoginResponse>('/auth/login', { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
```

### 3.3 Auth Interceptor

Attach the JWT token to all outgoing requests when logged in.

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
```

Register in `app.config.ts`:

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    // ...other providers
  ]
};
```

### 3.4 Project Service

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ProjectSummary[]> {
    return this.api.get('/projects');
  }

  getFeatured(): Observable<ProjectSummary[]> {
    return this.api.get('/projects?featured=true');
  }

  getById(id: string): Observable<Project> {
    return this.api.get(`/projects/${id}`);
  }

  create(project: ProjectPayload): Observable<Project> {
    return this.api.post('/projects', project);
  }

  update(id: string, project: Partial<ProjectPayload>): Observable<Project> {
    return this.api.put(`/projects/${id}`, project);
  }

  delete(id: string): Observable<ApiMessage> {
    return this.api.delete(`/projects/${id}`);
  }
}
```

### 3.5 Blog Service

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private api: ApiService) {}

  getAll(): Observable<BlogSummary[]> {
    return this.api.get('/blogs');
  }

  getById(id: string): Observable<Blog> {
    return this.api.get(`/blogs/${id}`);
  }

  create(blog: BlogPayload): Observable<Blog> {
    return this.api.post('/blogs', blog);
  }

  delete(id: string): Observable<ApiMessage> {
    return this.api.delete(`/blogs/${id}`);
  }
}
```

### 3.6 Contact Service

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private api: ApiService) {}

  submit(inquiry: ContactPayload): Observable<ApiMessage> {
    return this.api.post('/contact', inquiry);
  }
}
```

---

## 4. Endpoint Reference

### 4.1 Authentication

#### POST `/api/v1/auth/login`

| | |
|---|---|
| **Auth** | None |
| **Request Body** | `{ "email": string, "password": string }` |
| **Success (200)** | `{ "token": "jwt...", "user": { "id": "uuid", "email": "..." } }` |
| **Error (400)** | `{ "message": "Missing required fields: email, password" }` |
| **Error (401)** | `{ "message": "Invalid credentials" }` |

---

### 4.2 Projects

#### GET `/api/v1/projects`

| | |
|---|---|
| **Auth** | None |
| **Query Params** | `featured=true` (optional) |
| **Success (200)** | `ProjectSummary[]` |

Response example:
```json
[
  {
    "id": "a1b2c3d4-...",
    "title": "Neural Architecture",
    "category": "AI Model",
    "image": "https://example.com/img.jpg",
    "description": "Short description...",
    "featured": true
  }
]
```

#### GET `/api/v1/projects/:id`

| | |
|---|---|
| **Auth** | None |
| **Success (200)** | `Project` (full detail) |
| **Error (404)** | `{ "message": "Project not found" }` |

Response example:
```json
{
  "id": "a1b2c3d4-...",
  "createdAt": "2026-02-09T10:30:00.000Z",
  "title": "Neural Architecture",
  "category": "AI Model",
  "image": "https://example.com/img.jpg",
  "description": "Short description...",
  "featured": true,
  "client": "DeepMind",
  "year": "2025",
  "challenge": "The challenge was...",
  "solution": "We solved it by...",
  "techStack": ["Python", "Three.js", "TensorFlow"],
  "fullStory": [
    { "type": "h2", "content": "The Problem" },
    { "type": "p", "content": "Visualizing neural network nodes..." },
    { "type": "image", "content": "https://example.com/diagram.png", "caption": "Architecture diagram" },
    { "type": "code", "content": "const model = tf.sequential();", "language": "javascript" }
  ]
}
```

#### POST `/api/v1/projects` (Protected)

| | |
|---|---|
| **Auth** | `Authorization: Bearer <token>` |
| **Request Body** | `ProjectPayload` |
| **Required Fields** | `title`, `category`, `image`, `description` |
| **Success (201)** | Created `Project` object with generated `id` and `createdAt` |
| **Error (400)** | `{ "message": "Missing required fields: title, category" }` |
| **Error (401)** | `{ "message": "Missing or invalid authorization header" }` |

#### PUT `/api/v1/projects/:id` (Protected)

| | |
|---|---|
| **Auth** | `Authorization: Bearer <token>` |
| **Request Body** | Partial `ProjectPayload` (only fields to update) |
| **Success (200)** | Updated `Project` object |
| **Error (401)** | `{ "message": "Missing or invalid authorization header" }` |
| **Error (404)** | `{ "message": "Project not found" }` |

#### DELETE `/api/v1/projects/:id` (Protected)

| | |
|---|---|
| **Auth** | `Authorization: Bearer <token>` |
| **Success (200)** | `{ "message": "Project deleted successfully" }` |
| **Error (401)** | `{ "message": "Missing or invalid authorization header" }` |
| **Error (404)** | `{ "message": "Project not found" }` |

---

### 4.3 Blogs

#### GET `/api/v1/blogs`

| | |
|---|---|
| **Auth** | None |
| **Success (200)** | `BlogSummary[]` (ordered by `publishedDate` descending) |

Response example:
```json
[
  {
    "id": "b1c2d3e4-...",
    "title": "The Ethics of AI",
    "excerpt": "A deep dive into the moral implications...",
    "publishedDate": "2026-02-01",
    "category": "Philosophy",
    "readTime": "5 min read",
    "image": "https://example.com/blog-cover.jpg"
  }
]
```

#### GET `/api/v1/blogs/:id`

| | |
|---|---|
| **Auth** | None |
| **Success (200)** | `Blog` (full detail with `blocks`) |
| **Error (404)** | `{ "message": "Blog post not found" }` |

Response example:
```json
{
  "id": "b1c2d3e4-...",
  "createdAt": "2026-02-01T08:00:00.000Z",
  "publishedDate": "2026-02-01",
  "title": "The Ethics of AI",
  "excerpt": "A deep dive into the moral implications...",
  "category": "Philosophy",
  "readTime": "5 min read",
  "image": "https://example.com/blog-cover.jpg",
  "blocks": [
    { "type": "p", "content": "Artificial intelligence has transformed..." },
    { "type": "h2", "content": "The Core Dilemma" },
    { "type": "quote", "content": "With great power comes great responsibility." },
    { "type": "p", "content": "When we consider the implications..." }
  ]
}
```

#### POST `/api/v1/blogs` (Protected)

| | |
|---|---|
| **Auth** | `Authorization: Bearer <token>` |
| **Request Body** | `BlogPayload` |
| **Required Fields** | `title`, `excerpt`, `category` |
| **Success (201)** | Created `Blog` object |
| **Error (400)** | `{ "message": "Missing required fields: title, excerpt" }` |
| **Error (401)** | `{ "message": "Missing or invalid authorization header" }` |

#### DELETE `/api/v1/blogs/:id` (Protected)

| | |
|---|---|
| **Auth** | `Authorization: Bearer <token>` |
| **Success (200)** | `{ "message": "Blog post deleted successfully" }` |
| **Error (401)** | `{ "message": "Missing or invalid authorization header" }` |
| **Error (404)** | `{ "message": "Blog post not found" }` |

---

### 4.4 Contact

#### POST `/api/v1/contact`

| | |
|---|---|
| **Auth** | None |
| **Rate Limit** | 5 requests per minute per IP |
| **Request Body** | `ContactPayload` |
| **Required Fields** | `name`, `email`, `message` |
| **Success (200)** | `{ "message": "Inquiry sent successfully" }` |
| **Error (400)** | `{ "message": "Missing required fields: name, email, message" }` |
| **Error (400)** | `{ "message": "Invalid email format" }` |
| **Error (429)** | `{ "message": "Too many requests, please try again later" }` |

---

## 5. Error Handling

All API errors return a consistent JSON shape:

```json
{
  "message": "Human-readable error description"
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, DELETE, or contact submission |
| 201 | Created | Successful POST (project or blog created) |
| 400 | Bad Request | Missing required fields or invalid email format |
| 401 | Unauthorized | Missing/invalid/expired JWT token |
| 404 | Not Found | Resource ID doesn't exist, or unknown route |
| 429 | Too Many Requests | Contact form rate limit exceeded |
| 500 | Internal Server Error | Unexpected server-side failure |

### Angular Error Interceptor Example

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = error.error?.message || 'An unexpected error occurred';

      switch (error.status) {
        case 401:
          // Token expired or invalid — redirect to login
          localStorage.removeItem('auth_token');
          // router.navigate(['/login']);
          break;
        case 429:
          // Rate limited — show "try again later" message
          break;
      }

      return throwError(() => ({ status: error.status, message }));
    })
  );
};
```

---

## 6. Authentication Flow

```
1. User navigates to admin login page
2. Angular sends:   POST /api/v1/auth/login { email, password }
3. Server returns:  { token: "eyJhbG...", user: { id, email } }
4. Angular stores token in localStorage
5. Auth interceptor attaches "Authorization: Bearer <token>" to all requests
6. Protected endpoints (POST/PUT/DELETE) validate the token server-side
7. On 401 response, clear token and redirect to login
```

**Token notes:**
- Tokens are Supabase JWTs with a default expiry of **1 hour**
- No refresh endpoint is currently available — on expiry, the user must log in again
- Only one admin user exists; there is no signup endpoint

---

## 7. ContentBlock Rendering

The `fullStory` (projects) and `blocks` (blogs) fields contain arrays of `ContentBlock` objects. The Angular app should render these based on the `type` field.

### Suggested Component Mapping

| Block Type | Angular Rendering |
|------------|-------------------|
| `h2` | `<h2>{{ block.content }}</h2>` |
| `p` | `<p>{{ block.content }}</p>` |
| `image` | `<figure><img [src]="block.content" [alt]="block.caption"><figcaption>{{ block.caption }}</figcaption></figure>` |
| `quote` | `<blockquote>{{ block.content }}</blockquote>` |
| `code` | `<pre><code [class]="'language-' + block.language">{{ block.content }}</code></pre>` |

### Renderer Component Example

```typescript
@Component({
  selector: 'app-content-renderer',
  template: `
    @for (block of blocks; track $index) {
      @switch (block.type) {
        @case ('h2') { <h2>{{ block.content }}</h2> }
        @case ('p') { <p>{{ block.content }}</p> }
        @case ('image') {
          <figure>
            <img [src]="block.content" [alt]="block.caption || ''">
            @if (block.caption) { <figcaption>{{ block.caption }}</figcaption> }
          </figure>
        }
        @case ('quote') { <blockquote>{{ block.content }}</blockquote> }
        @case ('code') {
          <pre><code [class]="'language-' + (block.language || '')">{{ block.content }}</code></pre>
        }
      }
    }
  `
})
export class ContentRendererComponent {
  @Input() blocks: ContentBlock[] = [];
}
```

---

## 8. Date Handling

| Field | DB Type | API Response Format | Angular Handling |
|-------|---------|-------------------|------------------|
| `createdAt` | `timestamptz` | `"2026-02-09T10:30:00.000Z"` | `{{ createdAt \| date:'mediumDate' }}` |
| `publishedDate` | `date` | `"2026-02-01"` | `{{ publishedDate \| date:'mediumDate' }}` |

Both are returned as ISO strings. Use Angular's `DatePipe` to format for display.

---

## 9. Quick Reference

| Action | Method | Endpoint | Auth | Request Body |
|--------|--------|----------|------|-------------|
| Login | POST | `/api/v1/auth/login` | No | `{ email, password }` |
| List projects | GET | `/api/v1/projects` | No | - |
| Featured projects | GET | `/api/v1/projects?featured=true` | No | - |
| Project detail | GET | `/api/v1/projects/:id` | No | - |
| Create project | POST | `/api/v1/projects` | Yes | `ProjectPayload` |
| Update project | PUT | `/api/v1/projects/:id` | Yes | Partial `ProjectPayload` |
| Delete project | DELETE | `/api/v1/projects/:id` | Yes | - |
| List blogs | GET | `/api/v1/blogs` | No | - |
| Blog detail | GET | `/api/v1/blogs/:id` | No | - |
| Create blog | POST | `/api/v1/blogs` | Yes | `BlogPayload` |
| Delete blog | DELETE | `/api/v1/blogs/:id` | Yes | - |
| Submit contact | POST | `/api/v1/contact` | No | `{ name, email, message }` |
