# Data Model Reference

**Status:** Feature 2 — Todo List Management (includes Feature 1 auth).

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

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; max 100 characters; trimmed before save |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create; never updated |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- User has many Sessions (`foreignKey: userId`)
- Session belongs to User (`foreignKey: userId`)
- User has many Lists (`foreignKey: userId`)
- List belongs to User (`foreignKey: userId`)

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` | Feature 2 |
