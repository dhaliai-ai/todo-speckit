# Data Model Reference

**Status:** Feature 1 — User Authentication & Session Management.

Update this file when a feature that defines schema merges to `dev`.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default scope |
| `role` | STRING(20) | Required; default `worker` |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING(512) | Required; emptied on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required, references `users.id` |

## Associations

- User has many Sessions (`foreignKey: userId`)
- Session belongs to User (`foreignKey: userId`)

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
