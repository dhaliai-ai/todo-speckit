# Data Model Reference

**Status:** Feature 3 — Todo List Item Management (includes Features 1–2).

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

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade delete with parent list |
| `title` | STRING(255) | Required; max 255 characters; trimmed before save |
| `completed` | BOOLEAN | Required; default `false` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- User has many Sessions (`foreignKey: userId`)
- Session belongs to User (`foreignKey: userId`)
- User has many Lists (`foreignKey: userId`)
- List belongs to User (`foreignKey: userId`)
- User has many Todos (`foreignKey: userId`)
- Todo belongs to User (`foreignKey: userId`)
- List has many Todos (`foreignKey: listId`, `onDelete: CASCADE`)
- Todo belongs to List (`foreignKey: listId`)

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` | Feature 2 |
| `todos` | Feature 3 |
