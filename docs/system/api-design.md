# API Design Document: Portfolio & Journal Backend

**Version:** 1.0.0  
**Target Consumer:** Angular v18+ Frontend  
**Recommended Backend Stack:** Node.js (Express/NestJS) + PostgreSQL/MongoDB

## 1. Overview
This API serves a personal portfolio website containing two main content types: **Projects (Work)** and **Blog Posts (Journal)**. 

The frontend relies on a "Block-based" rich text structure (`ContentBlock`) for rendering articles and case studies. The API must support storing and retrieving these structured JSON arrays.

## 2. Base Configuration
*   **Base URL:** `/api/v1`
*   **Content-Type:** `application/json`
*   **Authentication:** 
    *   Public Endpoints: GET requests for Projects and Blogs.
    *   Protected Endpoints (Admin): POST/PUT/DELETE requests (Require `Authorization: Bearer <token>`).

## 3. Data Schemas

### 3.1 Common Type: `ContentBlock`
Used in both Projects (Full Story) and Blogs to render rich content.

```json
{
  "type": "h2" | "p" | "image" | "quote" | "code",
  "content": "string",
  "caption": "string (optional, for images)",
  "language": "string (optional, for code blocks)"
}
```

### 3.2 Project (Work) Entity
```json
{
  "id": "uuid",
  "title": "string",
  "category": "string",
  "image": "string (URL)",
  "description": "string (Short summary)",
  "featured": "boolean",
  "client": "string (optional)",
  "year": "string (optional)",
  "challenge": "string (text)",
  "solution": "string (text)",
  "techStack": ["string"],
  "fullStory": [ContentBlock] (optional, array of blocks)
}
```

### 3.3 Blog Post (Journal) Entity
```json
{
  "id": "uuid",
  "title": "string",
  "excerpt": "string",
  "date": "string (ISO Date or Formatted String)",
  "category": "string",
  "readTime": "string",
  "image": "string (URL, optional cover)",
  "blocks": [ContentBlock] (array of blocks)
}
```

---

## 4. Endpoints

### 4.1 Portfolio (Projects)

#### **GET /api/v1/projects**
Fetch a list of projects. Supports filtering.
*   **Query Params:** `featured=true` (optional)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "1",
        "title": "Neural Architecture",
        "category": "AI Model",
        "image": "https://...",
        "description": "Short description...",
        "featured": true
      },
      ...
    ]
    ```

#### **GET /api/v1/projects/:id**
Fetch full details of a specific project, including the "Case Study" details and "Full Story".
*   **Response (200 OK):**
    ```json
    {
      "id": "1",
      "title": "Neural Architecture",
      "category": "AI Model",
      "client": "DeepMind",
      "challenge": "...",
      "solution": "...",
      "techStack": ["Python", "Three.js"],
      "fullStory": [
         { "type": "h2", "content": "The Problem" },
         { "type": "p", "content": "Visualizing nodes..." }
      ]
    }
    ```
*   **Error (404):** `{ "message": "Project not found" }`

#### **POST /api/v1/projects** (Protected)
Create a new project.
*   **Body:** (Project Entity without ID)
*   **Response (201 Created):** returns created object with ID.

#### **PUT /api/v1/projects/:id** (Protected)
Update an existing project.

#### **DELETE /api/v1/projects/:id** (Protected)
Remove a project.

---

### 4.2 Journal (Blog)

#### **GET /api/v1/blogs**
Fetch all blog posts (summary view).
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "101",
        "title": "The Ethics of AI",
        "excerpt": "Summary text...",
        "date": "Oct 24, 2024",
        "category": "Philosophy",
        "readTime": "5 min"
      }
    ]
    ```

#### **GET /api/v1/blogs/:id**
Fetch a single blog post with full rich text content.
*   **Response (200 OK):**
    ```json
    {
      "id": "101",
      "title": "The Ethics of AI",
      "date": "Oct 24, 2024",
      "blocks": [
        { "type": "p", "content": "Intro paragraph..." },
        { "type": "quote", "content": "AI is a tool." }
      ]
    }
    ```

#### **POST /api/v1/blogs** (Protected)
Create a new article.

#### **DELETE /api/v1/blogs/:id** (Protected)
Delete an article.

---

### 4.3 General / Contact

#### **POST /api/v1/contact**
Submit a contact form inquiry.
*   **Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello..."
    }
    ```
*   **Response (200 OK):** `{ "message": "Inquiry sent successfully" }`

---

## 5. Implementation Notes for Node.js Developer

1.  **Image Handling:** 
    *   The frontend expects `image` fields to be full URLs. 
    *   Either implement a file upload route (`POST /api/v1/upload`) that returns a URL, or accept external URLs (S3/Cloudinary) in the JSON body.
2.  **Date Formatting:**
    *   The frontend currently displays dates as strings (e.g., "Oct 24, 2024"). The API can store them as ISO timestamps in the DB but should ensure they are returned in a consistent format, or the frontend will need to use a DatePipe.
3.  **CORS:**
    *   Enable CORS for the Angular client domain.
