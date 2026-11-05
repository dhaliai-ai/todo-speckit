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
| `MenuBar` is hidden on login/register | `App.vue` | Feature 2 |
| `MenuBar` uses a profile icon + dropdown; **Log out** lives only in the dropdown | `MenuBar.vue` | Feature 4 |
| After profile save, `localStorage` `user` is merged (token/`userId` kept) and `user-logged-in` is dispatched | `MenuBar.vue` | Feature 4 |

## Lists

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Every list belongs to one user for its lifetime; ownership never changes | List create/update | Feature 2 |
| Reads, updates, and deletes filter `userId: req.user.id` | `getAccessibleListOrNull` | Feature 2 |
| Create sets `userId` from `req.user.id`; body `userId` is ignored | List controller | Feature 2 |
| Cross-user list access → **404** `{ "message": "List with id=<id> not found." }`, never 403 | List controller | Feature 2 |
| Names are trimmed; empty/whitespace → `List name is required.` | Client + API | Feature 2 |
| Names longer than 100 characters → `List name must be 100 characters or fewer.` | API | Feature 2 |
| `listId` must be an entire positive integer; `12abc` → `400` | `parsePositiveIntId` | Feature 2 |
| Lists returned alphabetically by name | `findAll` `order` | Feature 2 |
| Dashboard is a **single view** (no sidebar); add/edit/delete use dialogs | `Dashboard.vue` | Feature 2 |
| Empty state copy: **No lists yet. Create your first list.** | `Dashboard.vue` | Feature 2 |
| Row icon actions: **Items**, **Edit list**, **Delete list** (`size="small"`) | `Dashboard.vue` | Feature 2–3 |

## Todos

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| A todo belongs to one list and one user for its lifetime | Todo create | Feature 3 |
| Nested GET/POST require an owned parent list; otherwise `404` `List with id=<id> not found.` | `getAccessibleListOrNull` | Feature 3 |
| PUT/DELETE require owned todo **and** owned parent list; otherwise `404` `Todo with id=<id> not found.` | `getAccessibleTodoOrNull` | Feature 3 |
| Create sets `userId`/`listId` from server context; body ownership fields ignored | Todo controller | Feature 3 |
| New todos default to `completed: false` | Todo create | Feature 3 |
| `completed` must be a boolean when provided | Todo update | Feature 3 |
| Titles are trimmed; empty/whitespace → `Todo title is required.` | Client + API | Feature 3 |
| Titles longer than 255 characters → `Todo title must be 255 characters or fewer.` | API | Feature 3 |
| Todos ordered incomplete first, then `createdAt` ascending | `findAllByList` | Feature 3 |
| Deleting a list deletes its todos | Sequelize `onDelete: CASCADE` | Feature 3 |
| Items dialog empty copy: **No todos in this list yet.** | `ListItemsDialog.vue` | Feature 3 |
| Completed todos use struck-through / muted title styling | `ListItemsDialog.vue` | Feature 3 |
| **+ Add Item** lives only inside the items dialog | `ListItemsDialog.vue` | Feature 3 |
| `dueDate` optional on create/update; `null` means no due date | Todo API + add/edit dialogs | Feature 5 |
| `dueDate` is calendar-only `YYYY-MM-DD`; invalid/impossible dates → `400` `Due date must be a valid date in YYYY-MM-DD format.` | Todo controller | Feature 5 |
| PUT with `dueDate: null` or `""` clears; omitting `dueDate` leaves the existing value | Update controller | Feature 5 |
| Overdue styling only when incomplete and `dueDate` is **before today** (browser local calendar) | `isTodoOverdue` + `ListItemsDialog.vue` | Feature 5 |
| Due date field label is **Due date**; formatted date shown on the todo row when set | `ListItemsDialog.vue` | Feature 5 |

## Profile

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| A user may GET/PUT only their own profile (`:id` must equal `req.user.id`) | `getAccessibleUserOrNull` | Feature 4 |
| Cross-user profile access → **404** `User with id=<id> not found.`, never 403 | User controller | Feature 4 |
| Profile fields trimmed; empty required strings rejected; no save on validation failure | User controller | Feature 4 |
| Username stored lowercase | User update | Feature 4 |
| Password optional on PUT; nonblank passwords hashed with bcrypt `SALT_ROUNDS = 10` | User update | Feature 4 |
| Password hashes never returned | `defaultScope` + `profilePayload` | Feature 4 |
| `role` is read-only | User update ignores `role` | Feature 4 |
| Edit Profile uses shared `emailRules` | `MenuBar.vue` | Feature 4 |
| Menu bar has no standalone **Sign out** button | `MenuBar.vue` | Feature 4 |
