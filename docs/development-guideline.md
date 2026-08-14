# Dev Track — Development Guideline

## 1. Objective

Implement Dev Track as a simple, maintainable, secure monolithic Next.js application.

Optimize for correctness of business rules before visual polish.

## 2. General Coding Rules

Prefer:

- TypeScript.
- Small focused functions.
- Explicit domain names.
- Reusable services.
- Centralized business rules.
- Centralized authorization.
- Server-side validation.
- Typed API responses.
- Database transactions for multi-write workflows.
- Existing project components and patterns.

Avoid:

- Giant page components.
- Business rules embedded in JSX.
- Duplicated permission checks.
- Duplicated workflow logic.
- Premature abstractions.
- Unnecessary new dependencies.
- Microservices.
- Separate backend application.
- Hidden frontend actions as the only security control.

## 3. API Response Standard

Application APIs must return:

```ts
type ApiResponse<T> = {
  success: boolean
  message: string
  data: T | null
}
```

Example success:

```json
{
  "success": true,
  "message": "Project updated successfully.",
  "data": {
    "id": "project-id"
  }
}
```

Example error:

```json
{
  "success": false,
  "message": "The selected team must have a leader before it can be assigned to a project.",
  "data": null
}
```

Use appropriate HTTP status codes in addition to the body.

## 4. Error Handling

Server/domain code may throw typed errors.

The outer server boundary must:

1. Catch expected errors.
2. Map them to safe HTTP status codes.
3. Return `{ success, message, data }`.
4. Catch unknown errors.
5. Log internal details server-side.
6. Return a generic safe message for unexpected production errors.

Never send:

- stack traces;
- raw Prisma errors;
- SQL details;
- auth secrets;
- environment values;
- internal filesystem paths.

Frontend code must handle failed responses explicitly and show safe feedback.

Do not depend on an uncaught server exception as the normal UI error flow.

## 5. Server-Side Validation

Validate all write inputs on the server.

Validation includes:

- schema/type validation;
- enum values;
- date relationships;
- resource existence;
- account status;
- authorization;
- team membership;
- team leader existence before project assignment;
- requirement workflow transition;
- assignment eligibility;
- active assignment conflicts.

Client validation is additive only.

## 6. Authentication

Use NextAuth/Auth.js.

Providers:

- Credentials.
- Google.

New users are `PENDING`.

Only `ACTIVE` users access protected application functionality.

Do not trust client-provided role/account values.

## 7. Authorization

Create centralized authorization helpers/services.

Do not copy authorization logic into each UI component.

Always distinguish:

- system role;
- team membership role;
- team leader/current project manager;
- current requirement assignee.

## 8. Database Transactions

Use transactions whenever a business action updates multiple related records.

Required examples:

- requirement claim;
- requirement reassignment;
- requirement status change + history;
- testing failure + assignment invalidation + history;
- test approval + history;
- team leader change + audit;
- project team reassignment + audit.

If one write fails, the full business action should roll back.

## 9. Requirement Ownership

The requirement table has one current assignee reference.

Do not model active ownership as multiple assignments.

### Ordinary self-assignment

Must fail if another active assignee already exists.

### Reassignment

Must:

- validate actor;
- validate replacement user;
- replace old owner;
- write history;
- preserve old assignment record;
- execute atomically.

Return conflict/business-rule errors when state has changed since the UI loaded.

## 10. Requirement Workflow

Allowed lifecycle:

```text
REQUIREMENTS -> DEVELOPMENT
DEVELOPMENT  -> TESTING
TESTING      -> COMPLETED
TESTING      -> DEVELOPMENT
```

Do not introduce additional statuses without a real requirement.

Centralize transition rules.

## 11. Project Status

Project status is manually controlled by an authorized project manager.

Do not derive it from requirement status.

Do not automatically set:

```text
all requirements complete -> project COMPLETED
```

The leader may set a project to `COMPLETED` while some requirements remain incomplete because a client may discard them.

Every project status change should be logged.

## 12. Project Progress

Progress is automatic and read-only.

Formula:

```text
completed / total * 100
```

If total is zero:

```text
progress = 0
```

Do not persist a manually editable percentage.

Do not use progress as a side effect that changes project status.

## 13. Team Leader

A team must have a valid active leader before being assigned to a project.

The current team leader is the current manager of all team projects.

Do not duplicate a manager ID on the project.

When leader changes:

- project manager resolves automatically to the new leader;
- old leader history remains unchanged;
- action is audited.

## 14. Historical Integrity

Never rewrite history based on current roles.

An action performed by User A as team leader must continue to show User A even if User B becomes the leader later.

Where necessary, store snapshots such as:

- actor display name;
- actor system role;
- actor team role/context.

Do not erase prior requirement assignment history during reassignment.

## 15. React Query

Use React Query for server-state interactions where appropriate.

After mutation:

- invalidate/refetch precise related queries;
- avoid broad invalidation when unnecessary;
- handle loading state;
- handle standard response envelope;
- surface server `message`.

Be conservative with optimistic updates for assignment/status changes because those operations are concurrency- and authorization-sensitive.

## 16. UI Implementation

Before creating a new component:

1. Search existing components.
2. Reuse equivalent component.
3. Extend variants if appropriate.
4. Create a new component only when there is no suitable reusable pattern.

Each feature should include relevant:

- loading state;
- empty state;
- error state;
- success feedback;
- responsive behavior;
- accessibility.

Do not redesign unrelated screens while implementing a feature.

## 17. Naming

Use terminology consistently.

Preferred domain terms:

- Project.
- Team.
- Team leader.
- Project manager — derived role.
- Requirement.
- Developer.
- Tester.
- Active assignee.
- Reassignment.
- Project status.
- Project progress.
- Requirement status.
- Audit/history.

Avoid using "project status" and "project progress" interchangeably.

## 18. Dates

Store database timestamps consistently.

For business dates such as start/deadline where time is irrelevant, choose one explicit representation and apply it consistently across Prisma, API, and UI.

Do not accidentally shift date-only values through timezone conversion.

## 19. Security

- Never trust client input.
- Protect all server mutations.
- Do not expose secrets.
- Validate identifiers and ownership.
- Use HTTPS in production.
- Avoid leaking resource existence across team boundaries where inappropriate.
- Do not render raw HTML from untrusted content without sanitization.
- Keep dependencies current through normal project maintenance.

## 20. Testing Strategy

At minimum cover business-critical services with automated tests.

### Authentication

- pending approval;
- active access;
- suspension.

### Team/project

- team without leader cannot receive project;
- leader replacement changes current manager;
- old actions remain historically attributed.

### Project

- status manually changes when authorized;
- status not auto-derived from progress;
- no-requirement progress is 0;
- incomplete requirements do not prevent authorized manual completion.

### Requirement

- developer claim;
- occupied requirement conflict;
- explicit reassignment;
- one active owner;
- tester claim;
- send to testing;
- approval;
- return to development;
- tester assignment cleared on failure;
- history preserved.

### Authorization

Test permitted and denied cases, not only happy paths.

## 21. Implementation Order

Recommended sequence:

1. Project foundation.
2. Database and Prisma.
3. Authentication.
4. Approval/account state.
5. Users/admin.
6. Teams.
7. Team leadership and membership roles.
8. Projects.
9. Manual project status.
10. Requirements.
11. Developer assignment/development flow.
12. Tester assignment/testing flow.
13. Reassignment.
14. Progress.
15. History/audit.
16. Dashboard.
17. UI refinement/accessibility.
18. End-to-end critical workflow tests.

## 22. Definition of Done

A feature is not complete until:

- server validation exists;
- server authorization exists;
- business rules are centralized/reused;
- expected API envelope is returned;
- errors are handled safely;
- database writes preserve invariants;
- audit/history is written where required;
- UI has loading/error/success/empty states where applicable;
- responsive/accessibility basics are addressed;
- relevant tests exist;
- unrelated code has not been unnecessarily redesigned.

## 23. Git Boundary

Do not create commits.

Do not push branches.

Do not modify remote Git state.

The project owner will handle commits and pushing.
