# Dev Track — AI Agent Instructions

## 1. Mission

Implement Dev Track according to the documentation in this `docs/` directory.

Read all documentation before changing code:

1. `product-requirements.md`
2. `architecture.md`
3. `database.md`
4. `authentication.md`
5. `authorization.md`
6. `ui-design-guideline.md`
7. `development-guideline.md`
8. `agent.md`

When documentation and existing code disagree, determine whether the code is incomplete/legacy or whether the documentation needs adaptation. Preserve explicitly stated business rules.

Do not silently invent new product scope.

## 2. Product Principle

Dev Track exists to answer:

> Where are our software projects and their requirements in the development process?

Keep implementation focused on:

`Teams → Projects → Requirements → Development → Testing → Completed`

Do not turn it into Jira/Trello.

## 3. Non-Negotiable Business Rules

1. A new user is `PENDING` until admin approval.
2. A project belongs to exactly one team.
3. A team must have an active leader before it can be assigned to a project.
4. The team's current leader is the current manager of all projects assigned to the team.
5. Do not duplicate project manager state.
6. When team leader changes, existing projects automatically resolve the new leader as manager.
7. Historical actions by the old leader remain attributed to the old leader.
8. The same historical-integrity principle applies to other role/member changes.
9. Project status is manually controlled by an authorized manager.
10. Project status is not automatically derived from requirement statuses.
11. Project progress is automatic and cannot be manually edited.
12. Project progress is `(completed requirements / total requirements) * 100`.
13. A project with zero requirements has `0%` progress.
14. Project status and project progress are independent.
15. A requirement has at most one active assignee.
16. A new explicit assignment replaces the old active assignee and is logged.
17. Ordinary self-assignment must not silently take work from another user.
18. Developer self-assignment is valid only in `REQUIREMENTS`.
19. Successful developer self-assignment moves the requirement to `DEVELOPMENT`.
20. Tester self-assignment is valid only in `TESTING`.
21. Testing failure moves `TESTING -> DEVELOPMENT` and invalidates/clears tester ownership.
22. Server-side authorization is mandatory.
23. Important status/assignment/leader changes must be auditable.
24. The application remains a monolithic Next.js application.
25. Do not create commits or push to Git. The project owner handles Git history.

## 4. API Contract

For application APIs, use:

```ts
{
  success: boolean
  message: string
  data: T | null
}
```

Use correct HTTP status codes as well.

Server code may throw typed/internal errors.

At the route/server boundary:

- catch errors;
- convert them to safe responses;
- do not expose stack traces, Prisma internals, secrets, or raw exception details.

Frontend:

- handle unsuccessful responses;
- show the safe `message`;
- do not depend on uncaught server errors as normal UI behavior.

## 5. Before Implementing a Feature

Inspect the repository first.

Determine:

- existing folder structure;
- package manager;
- Next.js routing style;
- existing Prisma schema;
- existing Auth.js setup;
- existing UI/design system;
- existing utilities;
- existing API conventions;
- existing tests;
- existing reusable components.

Reuse existing patterns when they are compatible with these docs.

Do not replace working architecture merely to match a preferred personal pattern.

## 6. Implementation Method

For each feature:

1. Identify the affected business rules.
2. Identify authorization requirements.
3. Identify database invariants.
4. Identify required history/audit records.
5. Implement/adjust schema if needed.
6. Implement server service/use case.
7. Implement server authorization.
8. Implement endpoint/server action.
9. Implement client query/mutation.
10. Implement UI.
11. Add loading/error/empty/success states.
12. Add/update tests.
13. Run relevant checks.
14. Report what changed and any remaining risk.

Do not commit or push.

## 7. Database Rules

Use Prisma.

Preserve relational integrity.

Do not add:

- project `managerId` if manager is derived;
- project manual `progress`;
- multiple active requirement-assignment rows;
- task/sprint/story-point entities for MVP.

Use a single current requirement assignee plus append-only history.

Use transactions for multi-write business operations.

## 8. Assignment Concurrency

Requirement claiming/reassignment is concurrency-sensitive.

A stale UI must not allow two users to become active owners.

If a claim conflicts with current server state:

- reject safely;
- return an appropriate conflict/business error;
- refresh the UI state.

Do not solve concurrency with frontend disabling alone.

## 9. Leader Change Behavior

When changing a team leader:

- validate new leader;
- update the team's leader source of truth;
- audit old/new leader;
- do not update each project with duplicated manager data;
- ensure project views now show new manager;
- do not alter historical actor records.

## 10. Requirement Role Change Edge Case

If an assigned developer/tester leaves the team or becomes ineligible:

- current assignment cannot remain silently valid;
- invalidate/clear it through explicit server logic;
- log the event;
- preserve prior development/testing history;
- keep requirement status logically consistent.

## 11. UI Rules

The UI must feel like a professional internal engineering tool.

Priority:

`Information → Clarity → Workflow → Action → Visual polish`

Avoid:

- excessive cards;
- gradients;
- decorative illustrations;
- large headings;
- unnecessary animation;
- unrelated redesigns.

Use tables when comparison matters.

Keep project status and project progress visibly distinct.

Show only one current requirement assignee.

Use explicit actions:

- `Start Development`
- `Send to Testing`
- `Start Testing`
- `Approve`
- `Return to Development`
- `Reassign`

Do not create multi-assignee UI.

## 12. Authorization Rules

Never infer permission only from hidden/visible buttons.

Server checks must cover:

- authenticated user;
- active account;
- system role;
- team membership;
- team leader;
- team role;
- project team;
- requirement status;
- active assignee;
- replacement assignee eligibility.

Admin does not automatically equal project manager/developer/tester.

## 13. Do Not Expand Scope

Do not add unless explicitly requested:

- sprints;
- tasks under requirements;
- story points;
- time tracking;
- Gantt;
- burndown;
- chat;
- client portal;
- multiple teams per project;
- manual project percentage;
- workflow builders;
- microservices.

If a new feature appears useful but is outside scope, mention it rather than implementing it.

## 14. Testing Expectations

Test the critical flows.

### Scenario A — Team must have leader

1. Create team without leader.
2. Attempt project assignment.
3. Expect failure.
4. Assign active leader.
5. Retry.
6. Expect success.

### Scenario B — Leader replacement

1. Team A leader is User A.
2. Project X belongs to Team A.
3. Verify Project X manager resolves to User A.
4. Replace leader with User B.
5. Verify Project X manager now resolves to User B.
6. Verify previous actions by User A still show User A in history.

### Scenario C — Empty project progress

1. Create project.
2. Add no requirements.
3. Read project progress.
4. Expect `0%`.

### Scenario D — Manual completed project

1. Create project with incomplete requirements.
2. Authorized manager changes project status to `COMPLETED`.
3. Expect success.
4. Progress remains computed from requirement completion and may be below `100%`.

### Scenario E — Single owner

1. Developer A claims available requirement.
2. Developer B attempts ordinary self-claim.
3. Expect conflict/denial.
4. Authorized manager explicitly reassigns to Developer B.
5. Expect Developer B as only current assignee.
6. Verify history contains Developer A -> Developer B change.

### Scenario F — Testing failure

1. Developer sends owned requirement to testing.
2. Tester claims it.
3. Tester returns it to development.
4. Expect status `DEVELOPMENT`.
5. Expect tester no longer active assignee.
6. Verify testing and assignment history remain.

### Scenario G — Role/member removal

1. Developer A owns a development requirement.
2. Remove Developer A from team or change to incompatible role.
3. Expect assignment to be explicitly invalidated/cleared.
4. Verify history explains the change.
5. Verify prior development records remain.

## 15. Completion Report

After implementation work, report:

- files changed;
- schema/migration changes;
- business rules implemented;
- tests/checks run;
- any unresolved issue;
- any manual step required from the project owner.

Do not claim a test passed unless it was actually run.

Do not claim a file exists without verifying it.

Do not create Git commits or push changes.
