# API Reference

**Status:** Feature 2 — Todo List Management (includes Feature 1 auth).

API mount path is `/todo` (`backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

Responses are flat JSON (no `{ success, data }` envelope). Errors: `{ "message": "..." }`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Starter health check |
| `POST` | `/todo/register` | No | Create a user account and session |
| `POST` | `/todo/login` | No | Authenticate and return or reuse a session |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Fetch lists owned by the authenticated user (A–Z by name) |
| `POST` | `/todo/lists` | Yes | Create a list owned by the authenticated user |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |

`:listId` must be a whole positive integer (`^[1-9]\d*$`). Values such as `12abc` return `400`.

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

### Create list request

```json
{ "name": "Groceries" }
```

`userId` in the body is ignored. Ownership is always `req.user.id`.

### List success payload (`200` / `201`)

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of these objects.

### Auth errors

| Situation | Status | Body |
|-----------|--------|------|
| Duplicate username | `400` | `{ "message": "Username is already taken." }` |
| Duplicate email | `400` | `{ "message": "Email is already registered." }` |
| Missing/invalid register or login fields | `400` | `{ "message": "<field message>" }` |
| Invalid username or password | `401` | `{ "message": "Invalid username or password." }` |
| Missing, invalid, or expired token | `401` | `{ "message": "Unauthorized! ..." }` |

### List errors

| Situation | Status | Body |
|-----------|--------|------|
| Empty or whitespace name | `400` | `{ "message": "List name is required." }` |
| Name longer than 100 characters | `400` | `{ "message": "List name must be 100 characters or fewer." }` |
| Malformed `listId` | `400` | `{ "message": "List id must be a positive integer." }` |
| Missing or unowned list | `404` | `{ "message": "List with id=<id> not found." }` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
- Cross-user list access returns **404**, never 403.

## Feature provenance

| Area | Introduced |
|------|------------|
| Health | Starter |
| Register, login, logout | Feature 1 |
| List CRUD | Feature 2 |
