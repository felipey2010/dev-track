# Dev Track — Architecture

## 1. Architectural Style

Dev Track must be implemented as a maintainable **monolithic Next.js application**.

The same application contains:

- Web UI.
- Server-side application logic.
- Authentication.
- Authorization.
- API/route handlers or server actions.
- Domain services.
- Database access through Prisma.

Do not create a separate backend application or unnecessary microservices.

## 2. Required Technology Direction

- Next.js.
- TypeScript.
- NextAuth/Auth.js.
- React Query for client-side server-state queries/mutations where appropriate.
- Prisma ORM.
- PostgreSQL as the default relational database.
- Credentials and Google authentication providers.
- Shadcn ui components
- Tailwind CSS for styling

Use the project's existing package manager and established component/design system once the repository exists.

Do not add a library when the framework or an existing dependency already solves the problem adequately.

## 3. Logical Layers

Although the application is one deployable unit, maintain logical separation.

Recommended layers:

```text
UI / Components
      ↓
Client query/mutation layer
      ↓
Route handlers / Server actions
      ↓
Authentication + Authorization
      ↓
Application / Domain services
      ↓
Repositories / Prisma
      ↓
PostgreSQL
```

### UI layer

Responsible for:

- Rendering.
- Form interaction.
- Loading/empty/error/success states.
- Calling server endpoints/actions.
- Role-aware visibility as a convenience.

Must not be the source of truth for authorization.

### Server entry layer

Route handlers/server actions should:

1. Parse input.
2. Validate input.
3. Resolve authenticated user/session.
4. Call centralized authorization/business logic.
5. Call application/domain service.
6. Return the standard API response shape.

Avoid placing large business workflows directly in route handlers.

### Application/domain layer

Contains business rules such as:

- Team must have a leader before project assignment.
- Project manager is derived from team leader.
- Manual project status.
- Automatic progress calculation.
- Requirement stage transitions.
- Single active assignee.
- Assignment eligibility.
- Reassignment.
- Audit logging.

These rules should be reusable across route handlers/server actions.

### Data-access layer

Prisma-specific persistence code should be isolated enough that business rules are not scattered throughout UI code.

Transactions must be used when multiple writes must succeed or fail together.

## 4. Suggested Source Structure

Adapt to the actual repository, but preserve these boundaries:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── teams/
│   │   └── users/
│   └── api/
├── components/
│   ├── ui/
│   └── domain/
├── features/
│   ├── auth/
│   ├── users/
│   ├── teams/
│   ├── projects/
│   ├── requirements/
│   └── audit/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── api/
│   ├── validation/
│   └── errors/
└── server/
    ├── authorization/
    ├── services/
    └── repositories/
```

The exact folder names are flexible. Separation of concerns is not.

## 5. Domain Boundaries

### Authentication

Answers:

- Who is the user?
- Is the account active?
- How was the user authenticated?

### Authorization

Answers:

- May this user perform this action?
- Is the user an admin?
- Is the user part of the project's team?
- Is the user the team's leader/current project manager?
- Does the user's team role match the operation?
- Is the requirement in a valid stage?
- Is the user the current active assignee where required?

### Teams

Owns:

- Team lifecycle.
- Membership.
- Team member role.
- Current leader.
- Leader changes.
- Team-level audit events.

### Projects

Owns:

- Project metadata.
- Team assignment.
- Manual project status.
- Project dates.
- Computed progress.
- Project status history.

Manager is derived from the team's current leader.

### Requirements

Owns:

- Requirement metadata.
- Workflow status.
- Active assignee.
- Reassignment.
- Development/testing lifecycle.
- Requirement history.

### Audit

Preserves immutable historical facts about important actions.

Current authorization data must never overwrite historical meaning.

## 6. Project Manager Resolution

Never rely on a duplicated project-level manager value.

Resolve current project manager as:

```text
project.team.leader
```

If the leader changes, all projects assigned to that team immediately resolve the new leader as manager.

The old leader remains referenced in historical audit entries created while they performed actions.

## 7. Project Status vs Project Progress

These must remain independent.

### Project status

- Stored value.
- Manually controlled by authorized project manager.
- Logged when changed.

### Project progress

- Computed value.
- Never manually entered.
- Formula:

```text
(completed requirements / total requirements) * 100
```

If total requirements is `0`, progress is `0`.

Do not auto-change project status when progress changes.

## 8. Requirement Workflow Service

Requirement status transitions should pass through one centralized service.

Supported transitions:

```text
REQUIREMENTS -> DEVELOPMENT
DEVELOPMENT  -> TESTING
TESTING      -> COMPLETED
TESTING      -> DEVELOPMENT
```

The service should validate:

- Authentication/account state.
- Project/team access.
- Team role.
- Active assignment.
- Current requirement status.
- Requested transition.

A status write and its audit/history entry should be performed in one transaction.

## 9. Assignment Service

Requirement assignment must be centralized.

### Active ownership

`Requirement.assignedUserId` is the single current owner reference.

### History

Assignment changes are append-only historical records.

### Self-assignment

Self-assignment is allowed only when the stage and role permit it and no conflicting active ownership exists.

### Explicit reassignment

Authorized reassignment:

1. Validate replacement user.
2. Record old assignee.
3. Replace active assignee.
4. Record new assignee.
5. Append audit/history.
6. Commit atomically.

Do not temporarily persist two active assignments.

## 10. Team Leader Change

Leader replacement should be transactional.

At a minimum:

1. Validate new leader is eligible/active.
2. Change `Team.leaderId`.
3. Append audit entry with old leader and new leader.
4. Do not modify project rows merely to copy the new manager.
5. Existing projects automatically resolve the new leader through the team relation.

If historical role snapshots are used, record the actor's role/context at the time of the change.

## 11. API Conventions

All application APIs should expose a consistent envelope:

```ts
type ApiResponse<T> = {
  success: boolean
  message: string
  data: T | null
}
```

### Success example

```json
{
  "success": true,
  "message": "Requirement moved to testing.",
  "data": {
    "id": "..."
  }
}
```

### Error example

```json
{
  "success": false,
  "message": "You are not authorized to update this requirement.",
  "data": null
}
```

HTTP status codes should still communicate the class of result.

Examples:

- `200` successful read/update.
- `201` successful creation.
- `400` malformed or invalid request.
- `401` unauthenticated.
- `403` authenticated but forbidden.
- `404` resource not found or not visible to the caller.
- `409` conflicting state, such as assignment race/conflict.
- `422` business/validation rule failure when used by the project.
- `500` unexpected server error.

### Exception handling

Server code may throw typed/internal errors to simplify control flow.

However:

- Route/server boundaries must catch expected and unexpected errors.
- Do not send raw exceptions, stack traces, database errors, secrets, or internal implementation details to the browser.
- Frontend code must handle unsuccessful responses gracefully.
- Production UI must not depend on uncaught thrown errors for normal user-facing error handling.

## 12. Error Model

Prefer typed application errors, for example:

```text
AuthenticationError
AuthorizationError
ValidationError
NotFoundError
ConflictError
BusinessRuleError
```

Each is mapped at the server boundary to:

- safe message;
- HTTP status;
- `{ success, message, data }`.

Log internal diagnostic details on the server using the project's logging strategy.

## 13. Concurrency and Transactions

Use transactions for:

- Requirement claim/self-assignment.
- Requirement reassignment.
- Requirement status transition + history.
- Test approval/return + assignment clearing + history.
- Team leader replacement + audit event.
- Project team reassignment + audit event.

Operations that claim a requirement must protect against race conditions.

A second user attempting to claim a requirement already claimed by someone else should receive a conflict response rather than overwriting ownership.

## 14. Data Fetching

React Query may be used for:

- Lists.
- Detail queries.
- Mutations.
- Cache invalidation.
- Optimistic UI only where the operation is safe and rollback is clear.

Do not use optimistic updates for authorization-sensitive assignment/status operations unless rollback and server reconciliation are correct.

The server remains authoritative.

## 15. Validation

Validate at the server boundary.

Use a consistent schema-validation approach.

Validate:

- IDs.
- enums.
- required fields.
- dates.
- team/project relationships.
- allowed status transitions.
- assignment eligibility.

Client validation may improve UX but never replaces server validation.

## 16. Observability and Audit

Audit events are business records, not debug logs.

They should be queryable for project/requirement history.

Technical application logs are separate and can include:

- request failures;
- unexpected exceptions;
- database connectivity problems.

Do not place secrets or credential material in either type of log.

## 17. Deployment Constraints

The app should remain suitable for common Next.js hosting environments such as Vercel.

Important behavior:

- Do not expose uncaught internal errors to client UI.
- Do not depend on local persistent filesystem storage for business data.
- Store business state in PostgreSQL.
- Keep secrets in environment variables.
- Use HTTPS in production.

## 18. Architectural Guardrails

Do not:

- Create microservices.
- Create a second backend application.
- Duplicate authorization logic in many routes.
- Duplicate project manager state.
- Allow frontend-only business validation.
- Store manual project progress.
- Create multiple active requirement assignments.
- Rewrite historical actor identity after role changes.
- Add sprint/task/bug-management subsystems to the MVP.
