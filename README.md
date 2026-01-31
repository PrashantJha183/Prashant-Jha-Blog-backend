# Production‑Grade Blog Platform (MERN‑Style Backend)

A **secure, scalable, production‑ready backend** built with **Node.js, Express, Supabase, JWT, Email OTP, RBAC**, and **Swagger API Docs**.

This project supports:

- Email‑based OTP authentication
- JWT access + refresh tokens
- Role‑based access control (Admin / Editor / Writer / User)
- Admin dashboard operations
- Blog CRUD with media support
- Public blog viewing (no auth required)
- Rate limiting, security headers, logging
- Swagger documentation

---

## Architecture Overview

```
Client (Web / Mobile)
        |
        v
Express API (Node.js)
 ├─ Auth (OTP + JWT)
 ├─ RBAC Middleware
 ├─ Admin Routes
 ├─ Blog Routes
 ├─ Public Blog Routes
 ├─ Rate Limiter
 └─ Swagger Docs
        |
        v
Supabase (Postgres + RLS)
```

---

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Backend    | Node.js, Express.js            |
| Auth       | Email OTP, JWT, Refresh Tokens |
| Database   | Supabase (PostgreSQL + RLS)    |
| Security   | Helmet, CORS, Rate Limit       |
| Validation | Zod                            |
| Docs       | Swagger (OpenAPI 3.0)          |
| Logging    | Pino                           |
| Email      | Nodemailer (Gmail SMTP)        |

---

## Authentication Flow

### 1️⃣ Send OTP

```
POST /api/auth/send-otp
```

- Email must already exist in `profiles`
- OTP sent via email
- Rate‑limited + cooldown protected

### 2️⃣ Verify OTP

```
POST /api/auth/verify-otp
```

- Verifies OTP
- Issues:
  - Access Token (JWT)
  - Refresh Token

### 3️⃣ Refresh Token

```
POST /api/auth/refresh-token
```

---

## Role‑Based Access Control (RBAC)

| Role   | Permissions          |
| ------ | -------------------- |
| Admin  | Full system access   |
| Editor | Create & edit blogs  |
| Writer | Create blogs         |
| User   | View blogs only      |

RBAC is enforced using:

- `protect` middleware (JWT)
- `allowRoles` middleware

---

## Blog System

### Blog Features

- Title (required)
- Description (required)
- Content (required)
- Media:
  - Images
  - Audio
  - Video
- Status:
  - draft
  - published

### Media Rules

| Type  | Max Size |
| ----- | -------- |
| Image | 2 MB     |
| Audio | 10 MB    |
| Video | 20 MB    |

---

## Admin Capabilities

Admin can:

- Create / Update / Delete blogs
- Publish blogs instantly
- Manage Editors & Writers
- View all blogs (dashboard)
- Remove any blog

All admin routes are **JWT + RBAC protected**.

---

## Public Blogs

```
GET /api/public-blogs
```

- No authentication required
- Only `published` blogs
- Includes author name & role

---

## API Documentation (Swagger)

```
http://localhost:5000/api/docs
```

Features:

- JWT authorization
- OTP flows
- Admin routes
- Blog CRUD
- Public APIs

---

## Running the Project

### Install Dependencies

```
npm install
```

### Run Dev Server

```
nodemon server
```

---

## Project Structure

```
server/
 ├─ controllers/
 ├─ routes/
 ├─ middlewares/
 ├─ services/
 ├─ swagger/
 ├─ utils/
 ├─ app.js
 └─ server.js
```

---

## Security Highlights

- JWT authentication
- Role‑based authorization
- Supabase Row Level Security (RLS)
- Rate limiting (API + OTP)
- Secure headers (Helmet)
- Input validation (Zod)

---

## Future Enhancements

- Supabase Storage integration
- Comments & reactions
- Search & pagination
- Admin analytics dashboard
- OAuth login

---

## Author

**Prashant Jha**  
Full‑Stack Developer (MERN)

https://prashant-jhadev.netlify.app/

---
