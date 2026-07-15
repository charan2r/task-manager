# Task Manager

A full-stack task and project management app with role-based access for administrators, project managers, and team members.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL(NeonDB), Prisma
- API docs: Swagger UI
- CI: GitHub Actions

## Project Structure

```text
backend/    Express API, Prisma schema, routers, controllers
frontend/   Next.js app
.github/    CI workflow
```

## Environment Variables

Create env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend env:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
DB_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB_NAME?sslmode=require&schema=public"
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d
```

Frontend env:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Local Setup

Install dependencies:

```bash
cd backend
npm install

cd frontend
npm install
```

Generate Prisma client and run migrations:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Optionally seed the admin account:

```bash
npm run seed
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1`
- Swagger docs: `http://localhost:5000/api/docs`

## API Overview

Base URL:

```text
http://localhost:5000/api/v1
```

Protected endpoints require:

```http
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a new `TEAM_MEMBER` account. |
| `POST` | `/auth/login` | Public | Login and receive a JWT token. |
| `GET` | `/auth/me` | Authenticated | Get the currently logged-in user. |

### Users

All user-management endpoints require `ADMIN`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/users` | `ADMIN` | Get all users. |
| `POST` | `/users` | `ADMIN` | Create a `PROJECT_MANAGER` or `TEAM_MEMBER` account. |
| `PATCH` | `/users/:id/role` | `ADMIN` | Update a non-admin user's role. |

### Projects

Project read access is filtered by role:

- `ADMIN`: can view all projects.
- `PROJECT_MANAGER`: can view projects they created.
- `TEAM_MEMBER`: can view projects where they are a member.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/projects` | Authenticated | Get projects visible to the current user. |
| `POST` | `/projects` | `ADMIN`, `PROJECT_MANAGER` | Create a project. |
| `GET` | `/projects/:id` | Authenticated with project access | Get one project by ID. |
| `PATCH` | `/projects/:id` | `ADMIN`, owning `PROJECT_MANAGER` | Update a project. |
| `DELETE` | `/projects/:id` | `ADMIN`, owning `PROJECT_MANAGER` | Delete a project. |
| `GET` | `/projects/:id/members` | Authenticated with project access | Get project members. |
| `GET` | `/projects/:id/available-members` | `ADMIN`, owning `PROJECT_MANAGER` | Get active team members not assigned to any project. |
| `POST` | `/projects/:id/members` | `ADMIN`, owning `PROJECT_MANAGER` | Assign a user to the project. |
| `DELETE` | `/projects/:id/members/:userId` | `ADMIN`, owning `PROJECT_MANAGER` | Remove a user from the project. |

### Tasks

Task read access is filtered by role:

- `ADMIN`: can view all tasks.
- `PROJECT_MANAGER`: can view tasks for projects they created.
- `TEAM_MEMBER`: can view tasks assigned to them.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/tasks` | Authenticated | Get tasks visible to the current user. Supports `projectId` and `status` query filters. |
| `POST` | `/tasks` | `ADMIN`, `PROJECT_MANAGER` | Create a task for a project the user can manage. |
| `GET` | `/tasks/:id` | Authenticated with task access | Get one task by ID. |
| `PATCH` | `/tasks/:id` | `ADMIN`, owning `PROJECT_MANAGER` | Update task fields. |
| `PATCH` | `/tasks/:id/status` | `TEAM_MEMBER` | Update status for a task assigned to the current user. |
| `DELETE` | `/tasks/:id` | `ADMIN`, owning `PROJECT_MANAGER` | Delete a task. |

Role behavior:

- `ADMIN`: user management, all projects, project/task management
- `PROJECT_MANAGER`: manages their own projects and tasks
- `TEAM_MEMBER`: views assigned projects/tasks and updates assigned task status

## GitHub Actions

The CI workflow runs frontend validation and backend validation.

Before CI can validate Prisma against NeonDB, add this repository secret in GitHub:

```text
DB_URL
```

Set it to your full Neon PostgreSQL connection string.

The workflow uses:

```yaml
DB_URL: ${{ secrets.DB_URL }}
```
