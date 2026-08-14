# Dev Track — Database Design

## 1. Database Direction

Use PostgreSQL with Prisma ORM.

The schema must prioritize:

- Relational integrity.
- Single sources of truth.
- One active requirement assignee.
- Derived project manager.
- Immutable/auditable history.
- Simple queries for dashboard and project details.

## 2. Core Enums

Suggested enums:

```prisma
enum SystemRole {
  ADMIN
  USER
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

enum TeamMemberRole {
  DEVELOPER
  TESTER
}

enum ProjectStatus {
  PLANNING
  IN_DEVELOPMENT
  TESTING
  COMPLETED
  ON_HOLD
  CANCELLED
}

enum RequirementType {
  FUNCTIONAL
  NON_FUNCTIONAL
}

enum RequirementPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum RequirementStatus {
  REQUIREMENTS
  DEVELOPMENT
  TESTING
  COMPLETED
}

enum AssignmentAction {
  ASSIGNED
  REASSIGNED
  UNASSIGNED
  INVALIDATED
}

enum AuditEntityType {
  USER
  TEAM
  TEAM_MEMBER
  PROJECT
  REQUIREMENT
}
```

Exact enum names may follow repository conventions.

## 3. Core Entities

Recommended entities:

- `User`
- NextAuth/Auth.js adapter entities as required (`Account`, `Session`, `VerificationToken`, etc.)
- `Team`
- `TeamMember`
- `Project`
- `Requirement`
- `RequirementAssignmentHistory`
- `RequirementHistory`
- `DevelopmentRecord`
- `TestingRecord`
- `AuditLog`

A project manager table/column is intentionally omitted because current manager is derived from the team's current leader.

## 4. User

Conceptual fields:

```text
id
name
email
emailVerified
image
passwordHash         // credentials users only
systemRole
status
createdAt
updatedAt
```

Rules:

- Email unique.
- Default `systemRole = USER`.
- Default account `status = PENDING`.
- Password hash is never returned to client code.

## 5. Team

Conceptual fields:

```text
id
name
description?
leaderId
createdAt
updatedAt
```

Relationships:

- `leaderId -> User.id`
- one team has many `TeamMember`
- one team has many `Project`

### Leader invariant

A team may be created before a leader is selected if that supports the admin flow, but it cannot be assigned to a project until `leaderId` references an eligible active user.

If product implementation chooses to require a leader at team creation, that stricter rule is also valid.

Do not store the leader as `MANAGER` in `TeamMemberRole` merely to mirror the project manager concept.

## 6. TeamMember

Conceptual fields:

```text
id
teamId
userId
role                // DEVELOPER | TESTER
createdAt
updatedAt
```

Constraints:

- Unique `(teamId, userId)` unless the product later requires multiple simultaneous roles per user in the same team.
- The MVP should use one active team member role per user/team membership.

If the leader must also perform developer/tester work, their membership can still carry DEVELOPER or TESTER independently while `Team.leaderId` defines leadership.

## 7. Project

Conceptual fields:

```text
id
name
description
client?
teamId
startDate
expectedCompletionDate
status
createdById
createdAt
updatedAt
```

### Do not add

```text
managerId
developerIds
testerIds
progress
```

Reason:

- manager comes from team leader;
- developer/tester eligibility comes from team membership;
- progress is computed.

### Project status

`status` is stored and manually controlled.

### Project progress

Compute on read/query:

```text
completed_count / total_count * 100
```

If `total_count == 0`, return `0`.

Do not persist manual percentage.

## 8. Requirement

Conceptual fields:

```text
id
projectId
code
title
description
type
priority
status
assignedUserId?
deadline?
createdById
createdAt
updatedAt
```

Constraints:

- Requirement belongs to one project.
- `assignedUserId` is nullable.
- `assignedUserId` represents the one current active assignee.
- Code should be unique within a project, e.g. unique `(projectId, code)`.

Do not create a many-to-many current assignment table.

## 9. Requirement Assignment History

Use an append-only history table so active ownership can change without losing prior ownership.

Conceptual fields:

```text
id
requirementId
action                  // ASSIGNED | REASSIGNED | UNASSIGNED | INVALIDATED
previousAssigneeId?
newAssigneeId?
performedById
requirementStatus
reason?
createdAt

performedByNameSnapshot?
performedByContextSnapshot?
previousAssigneeNameSnapshot?
newAssigneeNameSnapshot?
```

Snapshot fields are recommended when the product must remain human-readable even if users are later renamed/deactivated/deleted.

If user deletion is not supported, foreign keys plus role/context snapshots may be sufficient.

### Reassignment rule

On reassignment:

- `Requirement.assignedUserId = newAssigneeId`
- append one reassignment history row;
- never leave both old and new assignments active.

## 10. Requirement History

Use for lifecycle/state changes.

Conceptual fields:

```text
id
requirementId
fromStatus?
toStatus
performedById
note?
actorSystemRoleSnapshot?
actorTeamRoleSnapshot?
createdAt
```

This table must not infer the actor's historical role by reading current team membership.

Example:

```text
12 Aug - Created
12 Aug - Assigned to Pedro
12 Aug - REQUIREMENTS -> DEVELOPMENT
14 Aug - DEVELOPMENT -> TESTING
15 Aug - TESTING -> DEVELOPMENT
16 Aug - Assigned to Pedro
17 Aug - DEVELOPMENT -> TESTING
18 Aug - TESTING -> COMPLETED
```

## 11. DevelopmentRecord

Development is intentionally simple.

Conceptual fields:

```text
id
requirementId
developerId
startedAt?
completedAt?
notes?
createdAt
updatedAt
```

Depending on implementation, multiple development records may exist across repeated development cycles.

For example, when testing fails and the requirement returns to development, a new development cycle may be recorded instead of overwriting the previous one.

## 12. TestingRecord

Conceptual fields:

```text
id
requirementId
testerId
startedAt?
completedAt?
result              // project-defined enum or nullable while active
notes?
createdAt
updatedAt
```

Multiple testing cycles are expected when a requirement fails and returns to development.

Do not overwrite earlier test results.

## 13. AuditLog

Use for important cross-domain changes beyond requirement status history.

Conceptual fields:

```text
id
entityType
entityId
action
actorUserId?
actorNameSnapshot?
actorSystemRoleSnapshot?
actorTeamRoleSnapshot?
metadataJson?
createdAt
```

Examples:

- Team leader changed from João to Pedro.
- User team role changed from DEVELOPER to TESTER.
- Project status changed from TESTING to COMPLETED.
- Project moved from Team A to Team B.
- User approved.
- User suspended.

`metadataJson` may include old/new values but must not contain secrets.

## 14. Leader Replacement

When team leader changes:

```text
Team.leaderId = newLeaderId
```

Do not update each project with a manager ID.

All existing projects now resolve manager through the updated team leader.

Add an audit record containing:

- team ID;
- old leader ID/name snapshot;
- new leader ID/name snapshot;
- actor who performed the change;
- timestamp.

Old project actions remain linked to the old leader through their historical records.

## 15. Role Replacement / Membership Changes

When a user's team role changes or a member leaves:

1. Update current membership state.
2. Append an audit entry.
3. Do not modify historical requirement or audit records.
4. Revalidate any current active requirement assignment that becomes invalid.

If an active assignee is no longer eligible because the user left the team or changed to an incompatible role, the application must explicitly invalidate/clear the active assignment and log the action rather than silently keeping invalid ownership.

## 16. Project Assignment Preconditions

Before creating a project for a team or moving a project to another team:

- target team exists;
- target team has a leader;
- leader is an active user;
- caller has authorization.

If the target team has no leader, reject the operation.

## 17. Referential Actions

Choose Prisma referential actions deliberately.

Recommended principles:

- Avoid cascading deletion of business history.
- Prefer soft deletion or deactivation for users if deletion would destroy auditability.
- Prevent deletion of a team that still owns projects unless the product defines a safe transfer/archive flow.
- Prevent accidental deletion of a project with requirements unless an explicit destructive workflow exists.
- Preserve history rows.

## 18. Indexing

Add indexes for common access paths:

```text
User(email)
User(status)
Team(leaderId)
TeamMember(teamId, userId)
TeamMember(userId)
Project(teamId)
Project(status)
Requirement(projectId)
Requirement(projectId, status)
Requirement(assignedUserId)
RequirementAssignmentHistory(requirementId, createdAt)
RequirementHistory(requirementId, createdAt)
AuditLog(entityType, entityId, createdAt)
```

Use database constraints where possible, not only application checks.

## 19. Progress Query

Conceptual calculation:

```ts
if (totalRequirements === 0) return 0

return (completedRequirements / totalRequirements) * 100
```

Presentation may round according to UI needs.

Do not change project status as a side effect.

## 20. Transaction Boundaries

Use a transaction for:

### Developer claim

- verify current requirement state;
- set assignee;
- set status to DEVELOPMENT;
- add assignment history;
- add requirement status history.

### Reassignment

- verify current owner and new owner's eligibility;
- replace `assignedUserId`;
- add assignment history;
- add audit entry if applicable.

### Move to testing

- change requirement status;
- add status history;
- preserve development record.

Define whether the developer remains assigned while waiting for tester claim. The recommended MVP behavior is to clear the active developer assignment when entering `TESTING`, because active ownership now belongs to the testing stage. Log the clearing.

### Return to development

- change `TESTING -> DEVELOPMENT`;
- clear tester assignment;
- close/update testing record;
- add history entries.

### Test approval

- change `TESTING -> COMPLETED`;
- close testing record;
- add status history;
- clear active assignment unless the UI requires the final tester display from history.

## 21. Data Integrity Tests

At minimum verify:

1. Project cannot be assigned to team without leader.
2. Current project manager changes when team leader changes.
3. Historical actor remains old leader in previous log entries.
4. Requirement never has more than one current assignee.
5. Reassignment replaces old assignee.
6. Reassignment creates history.
7. Ineligible user cannot be assigned.
8. Testing failure clears tester ownership.
9. No-requirement project returns 0% progress.
10. Manual project status does not change when requirement progress changes.
