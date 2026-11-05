# API Reference

**Status:** Feature 5 — Todo Due Date (includes Features 1–4).

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
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch todos in an owned list (incomplete first, then `createdAt` ASC) |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update an owned todo (`title`, `completed`, and/or `dueDate`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's own profile |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's own profile |

`:listId` and todo `:id` must be whole positive integers (`^[1-9]\d*$`). Values such as `12abc`, `0`, `-1`, and decimals return `400`.

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

### Create todo request

```json
{
  "title": "Buy milk",
  "dueDate": "2026-07-15"
}
```

`dueDate` is optional (`YYYY-MM-DD`). Omit it, send `null`, or send an empty string for no due date. `userId`, `listId`, and `completed` in the body are ignored. Ownership is `req.user.id`; `listId` comes from the owned route param; `completed` defaults to `false`.

**Update body** (any combination; omit a field to leave it unchanged except `dueDate: null` or `""` clears the date):

```json
{
  "title": "Buy oat milk",
  "completed": false,
  "dueDate": "2026-07-20"
}
```

Clear due date:

```json
{ "dueDate": null }
```

### Todo success payload (`200` / `201`)

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`GET /todo/lists/:listId/todos` returns an array of these objects.

### Update profile request

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` is optional. Omit it or send a blank value to leave the current password unchanged. `role` in the body is ignored.

### Profile success payload (`200`)

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

Password hashes are never returned.

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

### Todo errors

| Situation | Status | Body |
|-----------|--------|------|
| Empty or whitespace title | `400` | `{ "message": "Todo title is required." }` |
| Title longer than 255 characters | `400` | `{ "message": "Todo title must be 255 characters or fewer." }` |
| `completed` provided but not a boolean | `400` | `{ "message": "Completed must be a boolean." }` |
| Invalid or impossible `dueDate` | `400` | `{ "message": "Due date must be a valid date in YYYY-MM-DD format." }` |
| Malformed `listId` or todo `id` | `400` | `{ "message": "<List id|Todo id> must be a positive integer." }` |
| Missing or unowned parent list | `404` | `{ "message": "List with id=<id> not found." }` |
| Missing or unowned todo | `404` | `{ "message": "Todo with id=<id> not found." }` |

### Profile errors

| Situation | Status | Body |
|-----------|--------|------|
| Missing required field | `400` | `{ "message": "First name is required." }` (same pattern as register) |
| Invalid email | `400` | `{ "message": "Enter a valid email address." }` |
| Password present and shorter than 8 characters | `400` | `{ "message": "Password must be at least 8 characters." }` |
| Duplicate username | `400` | `{ "message": "Username is already taken." }` |
| Duplicate email | `400` | `{ "message": "Email is already registered." }` |
| Malformed user `id` | `400` | `{ "message": "User id must be a positive integer." }` |
| Other user's profile | `404` | `{ "message": "User with id=<id> not found." }` |

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
| Todo item CRUD | Feature 3 |
| Profile GET/PUT | Feature 4 |
| Todo `dueDate` on create/update | Feature 5 |
