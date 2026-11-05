# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev`.

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

## Auth & sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login uses **username + password** (not email) | `POST /todo/login` | Feature 1 |
| Usernames are stored and matched **lowercase** after trim | Auth controller | Feature 1 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hashes never returned | Register + User `defaultScope` | Feature 1 |
| Sessions are **JWT + Session row**, 24 hours; client sends `Authorization: Bearer <token>` | Auth controller + `authenticate` | Feature 1 |
| Login **reuses** a non-expired, non-revoked session for the same user | `getOrCreateSession` | Feature 1 |
| Logout clears the session token on the server | `POST /todo/logout` | Feature 1 |
| Missing/invalid/expired token → `401` `{ "message": "Unauthorized! ..." }` | `authenticate` | Feature 1 |
| Invalid credentials → `401` `{ "message": "Invalid username or password." }` | Login controller | Feature 1 |
| Duplicate username → `Username is already taken.`; duplicate email → `Email is already registered.` | Register controller | Feature 1 |
| Default role for new users is `worker` | Register | Feature 1 |
| Authenticated requests resolve to `req.user.id` | `authenticate` | Feature 1 |

## Client session & validation

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Session payload stored in `localStorage` key `user` | Login/register views + `Utils.setStore` | Feature 1 |
| Axios attaches Bearer token; `401` clears `user` and routes to login | `services.js` interceptors | Feature 1 |
| Unauthenticated navigation to non-auth routes redirects to login | `router.beforeEach` | Feature 1 |
| Signed-in users visiting login/register are redirected home | `router.beforeEach` | Feature 1 |
| Email rules: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; messages **Email is required.** / **Enter a valid email address.** | `frontend/src/config/validation.js` `emailRules` | Feature 1 |
| Password minimum 8 characters; confirm must match | Register form (+ server min length) | Feature 1 |
| No `MenuBar` in Feature 1; **Sign out** lives on the home placeholder | `Home.vue` | Feature 1 |

## Lists (stub)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| `GET /todo/lists` requires auth and returns `[]` | Stub route (CRUD is Feature 2) | Feature 1 |
