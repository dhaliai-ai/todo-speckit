# API Reference

**Status:** Feature 1 — User Authentication & Session Management.

API mount path is `/todo` (`backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

Responses are flat JSON (no `{ success, data }` envelope). Errors: `{ "message": "..." }`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Starter health check |
| `POST` | `/todo/register` | No | Create a user account and session |
| `POST` | `/todo/login` | No | Authenticate and return or reuse a session |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Feature 1 stub — returns `[]` until Feature 2 list CRUD |

### Register / login success payload

HTTP `201` (register) or `200` (login):

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

### Auth errors

| Situation | Status | Body |
|-----------|--------|------|
| Duplicate username | `400` | `{ "message": "Username is already taken." }` |
| Duplicate email | `400` | `{ "message": "Email is already registered." }` |
| Missing/invalid register or login fields | `400` | `{ "message": "<field message>" }` |
| Invalid username or password | `401` | `{ "message": "Invalid username or password." }` |
| Missing, invalid, or expired token | `401` | `{ "message": "Unauthorized! ..." }` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

## Feature provenance

| Area | Introduced |
|------|------------|
| Health | Starter |
| Register, login, logout | Feature 1 |
| `GET /todo/lists` empty stub | Feature 1 (list CRUD is Feature 2) |
