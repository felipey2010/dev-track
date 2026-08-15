# Next.js Application Development Rules

Keep the application structured, secure, and consistent. These rules should be treated as mandatory unless a specific technical reason requires an exception.

## 1. Database Access

- Database access must occur **only on the backend/API side**.
- Never import Prisma, database clients, repositories, or database credentials into Client Components.
- Database operations should be executed through API/backend logic or server-side services.

## 2. Server Requests

All functions responsible for accessing the application's API/backend must be server-only.

Place them in:

```text
lib/
└── services/
```

Every server service file must include:

```ts
import 'server-only'
```

Example:

```text
lib/services/projects.ts
lib/services/requirements.ts
lib/services/teams.ts
lib/services/users.ts
```

Server Components, Route Handlers, and other server-side code may call these service functions directly.

## 3. Client Requests

Client Components must **not call server services directly**.

Use this flow:

```text
Client Component
      ↓
React Query
      ↓
Server request/service
      ↓
API / Backend
      ↓
Database
```

React Query should manage:

- Queries.
- Mutations.
- Loading states.
- Error states.
- Cache invalidation/refetching.

Do not duplicate request logic directly inside UI components.

## 4. Server and Client Components

Prefer **Server Components by default**.

Use `"use client"` only when the component requires client-side behavior such as:

- State.
- Effects.
- Browser APIs.
- Event-driven interactivity.
- React Query hooks.

Do not mark an entire page or component tree as client-side when only a small nested component requires it.

## 5. API and Business Logic

API routes/server actions should remain small.

They should normally:

```text
Validate request
→ Authenticate user
→ Authorize action
→ Execute service/business logic
→ Return response
```

Do not place complex business rules directly inside UI components or route handlers.

Server-side authorization is mandatory.

## 6. API Response Format

Use a consistent response structure:

```ts
{
  success: boolean
  message: string
  data: T | null
}
```

Errors may be thrown internally, but API boundaries must catch them and return safe responses.

Never expose:

- Stack traces.
- Database errors.
- Secrets.
- Internal implementation details.

## 7. Folder Organization

Keep the project organized by responsibility.

Recommended structure:

```text
src/
├── app/
│   ├── api/
│   ├── (auth)/
│   └── (protected)/
├── components/
│   ├── ui/
│   └── domain/
├── lib/
│   ├── services/
│   ├── auth/
│   ├── db/
│   ├── validation/
│   └── utils/
├── hooks/
├── types/
└── constants/
```

Avoid:

- Large unrelated files.
- Duplicated logic.
- Mixing database code with UI code.
- Mixing reusable components with page-specific implementation.
- Unclear folders such as generic `helpers/` containing unrelated logic.

## 8. General Rule

Maintain this dependency direction:

```text
UI
↓
React Query when client-side
↓
Server Services
↓
API / Business Logic
↓
Database
```

The frontend must never bypass the server layer to access the database.

Keep responsibilities separated, reuse existing code, and prefer simple, maintainable structures over unnecessary abstractions.