# Nimora API

Base URL: `http://localhost:4000/api`

Send JSON bodies. Authenticated requests include:

```http
Authorization: Bearer <jwt>
```

Error shape:

```json
{ "error": { "message": "Human-readable message", "details": [{ "path": "email", "message": "..." }] } }
```

`details` is present only for validation errors.

---

## Auth

### `POST /auth/register`

Public. Creates a `MEMBER` account.

```json
{ "name": "Priya Nair", "email": "priya@example.com", "password": "secret1" }
```

**201** `{ token, user }`

### `POST /auth/login`

```json
{ "email": "admin@nimora.app", "password": "Admin@123" }
```

**200** `{ token, user }` · **401** invalid credentials

### `GET /auth/me`

**200** `{ user }`

---

## Users (admin)

### `GET /users`

**200** `{ users: User[] }`

### `POST /users`

```json
{ "name": "Sam Ortiz", "email": "sam@example.com", "password": "secret1", "role": "MEMBER" }
```

`role` is `ADMIN` or `MEMBER`. **201** `{ user }`

---

## Dashboard

### `GET /dashboard`

**200**

```json
{
  "stats": { "projects": 1, "tasks": 3, "done": 1, "inProgress": 1, "overdue": 0, "assignedToMe": 2 },
  "projects": [{ "id": "...", "name": "...", "percent": 33, "total": 3, "done": 1, "memberCount": 3 }],
  "upcoming": [],
  "myTasks": []
}
```

---

## Projects

Members only see projects they belong to. Admins see all.

### `GET /projects`

**200** `{ projects }` each with `progress` and `members`

### `POST /projects` (admin)

```json
{ "name": "Website refresh", "description": "Public site and blog." }
```

The creating admin is added as a member. **201** `{ project }`

### `GET /projects/:id`

Includes `tasks`. **403** if the member is not on the project.

### `PATCH /projects/:id` (admin)

Same body as create, fields optional.

### `DELETE /projects/:id` (admin)

**200** `{ ok: true }`

### `POST /projects/:id/members` (admin)

```json
{ "userId": "uuid" }
```

### `DELETE /projects/:id/members/:userId` (admin)

Unassigns that person’s tasks on the project.

### `POST /projects/:id/tasks` (admin)

```json
{
  "title": "Write API docs",
  "description": "Cover auth and deadline history.",
  "status": "TODO",
  "priority": "HIGH",
  "deadline": "2026-09-01T12:00:00.000Z",
  "assigneeId": "uuid-or-null"
}
```

Assignee must already be a project member.

---

## Tasks

### `GET /tasks`

Query: `status`, `priority`, `projectId`, `q`, `mine=true`

**200** `{ tasks }`

### `GET /tasks/:id`

### `PATCH /tasks/:id`

Admin may send any of: `title`, `description`, `status`, `priority`, `deadline`, `assigneeId`.

Members may send only `{ "status": "IN_PROGRESS" }` on tasks assigned to them.

If `deadline` changes, a `DeadlineHistory` row is created.

### `GET /tasks/:id/comments`

### `POST /tasks/:id/comments`

```json
{ "content": "Deployed staging. Waiting on copy." }
```

### `GET /tasks/:id/deadline-history`

**200**

```json
{
  "history": [
    {
      "id": "...",
      "previousDeadline": "2026-08-22T18:00:00.000Z",
      "newDeadline": "2026-08-28T18:00:00.000Z",
      "changedAt": "2026-08-20T10:00:00.000Z",
      "changedBy": { "id": "...", "name": "Amina Shah", "email": "admin@nimora.app", "role": "ADMIN" }
    }
  ]
}
```

### `GET /tasks/:id/activity`

Actions: `CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `COMMENTED`, `DEADLINE_CHANGED`

---

## Health

### `GET /health`

**200** `{ "ok": true, "service": "nimora-api" }`
