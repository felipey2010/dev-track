# Dev Track — Authorization

## 1. Principle

Authorization must be enforced on the server.

Hiding a button, route, menu item, or form field is not authorization.

Every sensitive operation must verify permissions at execution time.

## 2. Authorization Inputs

Depending on the action, evaluate:

1. Authentication.
2. Account status.
3. System role.
4. Team membership.
5. Team role.
6. Team leadership.
7. Project's assigned team.
8. Requirement status.
9. Current requirement assignee.
10. Eligibility of a replacement assignee.

## 3. System Roles

### ADMIN

May:

- view/manage users;
- approve/reject registrations;
- suspend/reactivate users;
- assign/remove ADMIN system role;
- create/manage teams;
- assign/change team leaders;
- add/remove team members;
- assign/change DEVELOPER/TESTER roles;
- view all projects.

Being ADMIN does not automatically make the user a project manager.

### USER

Has no system administration privileges.

Project responsibilities come from team context.

## 4. Project Manager

The current project manager is:

```text
project.team.leader
```

Do not determine it from a stored project-level manager field.

Manager capabilities:

- create projects where product flow allows;
- view managed/team projects;
- edit project information;
- manually change project status;
- manage requirements;
- monitor progress;
- view project history;
- perform authorized requirement reassignment;
- manage project documentation if implemented.

When the team leader changes, the authorization result changes immediately for the team's projects.

Previous leader actions remain in historical logs.

## 5. Developer

A developer may:

- view projects belonging to their team;
- view requirements for those projects;
- self-assign an available requirement in `REQUIREMENTS`;
- update development information for requirements they currently own;
- move their owned requirement from `DEVELOPMENT` to `TESTING`.

A developer may not:

- claim a requirement from another team;
- claim a requirement already owned by someone else through ordinary self-assignment;
- self-assign directly in `TESTING`;
- approve testing unless they independently hold an allowed tester role and meet the testing rules;
- change system-wide administration data.

## 6. Tester

A tester may:

- view projects belonging to their team;
- view requirements;
- self-assign an available requirement in `TESTING`;
- add testing information for requirements they currently own;
- approve their owned testing requirement;
- return their owned testing requirement to `DEVELOPMENT`.

A tester may not self-assign from `REQUIREMENTS` or `DEVELOPMENT`.

## 7. Team Leader Requirement

Before assigning a team to a project:

```text
team.leaderId must exist
AND leader must be eligible/active
```

If not, reject the operation.

## 8. Project Access

For regular project work:

```text
user must belong to project.team
```

Admins may have global read/administration visibility according to product rules, but admin status alone does not grant operational ownership of a requirement.

Avoid conflating "can view as admin" with "can perform developer/tester workflow action."

## 9. Requirement Assignment

### Developer self-assignment

Allow only when:

```text
user.status == ACTIVE
AND user belongs to project.team
AND team membership role == DEVELOPER
AND requirement.status == REQUIREMENTS
AND requirement.assignedUserId == null
```

On success:

```text
assignedUserId = user.id
status = DEVELOPMENT
```

Log both assignment and status transition.

### Tester self-assignment

Allow only when:

```text
user.status == ACTIVE
AND user belongs to project.team
AND team membership role == TESTER
AND requirement.status == TESTING
AND requirement.assignedUserId == null
```

Set active assignee and log it.

## 10. Explicit Reassignment

A requirement may have only one active assigned user.

If an authorized user assigns a new eligible person:

- old assignee is replaced;
- old assignment is not deleted from history;
- new assignee becomes the only active assignee;
- action is logged.

Recommended authorization:

- current project manager can reassign within the project's team;
- system administrators may perform corrective reassignment only if the product intentionally grants that operational ability;
- ordinary developers/testers cannot steal another user's requirement.

Eligibility still depends on the current requirement stage:

- `REQUIREMENTS` / `DEVELOPMENT`: replacement must be an eligible developer.
- `TESTING`: replacement must be an eligible tester.
- `COMPLETED`: active reassignment should normally be rejected.

If the requirement is still `REQUIREMENTS` and a manager directly assigns a developer, use one consistent product rule: the recommended behavior is to treat that as starting development and move it to `DEVELOPMENT`, matching developer self-assignment semantics.

## 11. Requirement Transition Rules

### REQUIREMENTS -> DEVELOPMENT

Actor:

- eligible self-assigning developer; or
- authorized manager assigning an eligible developer.

### DEVELOPMENT -> TESTING

Actor:

- current assigned developer;
- optionally project manager only for an explicit administrative correction path, if implemented and audited.

### TESTING -> COMPLETED

Actor:

- current assigned tester.

### TESTING -> DEVELOPMENT

Actor:

- current assigned tester.

On `TESTING -> DEVELOPMENT`:

- invalidate/clear tester assignment;
- log assignment invalidation;
- preserve testing history.

## 12. Leader Change Edge Case

When Team A leader changes from User A to User B:

- User B immediately becomes current project manager for all Team A projects.
- User A immediately loses manager-derived permission unless another rule independently grants access.
- Historical actions by User A remain attributed to User A.
- Do not rewrite old log entries to User B.

## 13. Team Role Change Edge Case

If a developer/tester leaves the team or changes to an incompatible role while currently assigned to a requirement:

1. Detect that the active assignment is no longer valid.
2. Clear/invalidate the current assignment through an explicit server operation.
3. Add history explaining why.
4. Do not delete earlier development/testing records.
5. Requirement status should remain logically valid unless a separate transition is necessary.

For example, a testing requirement may remain `TESTING` but become unassigned and available to another tester.

## 14. Project Status Authorization

Project status is manual.

Allow change only to the current project manager, plus any explicitly defined administrative override.

Do not require all requirements to be completed before setting project status to `COMPLETED`.

This supports discarded client requirements.

Every project status change must be logged.

## 15. Progress Authorization

There is no "edit progress" permission because progress is computed.

Any API attempting to accept a project progress percentage should reject or ignore that input according to the endpoint contract.

## 16. Centralized Policy Functions

Prefer reusable functions/services such as:

```ts
requireActiveUser(session)
requireAdmin(user)
requireProjectAccess(userId, projectId)
requireProjectManager(userId, projectId)
requireTeamRole(userId, teamId, role)
canSelfAssignRequirement(userId, requirementId)
canReassignRequirement(actorId, requirementId, newAssigneeId)
canTransitionRequirement(actorId, requirementId, targetStatus)
```

Do not duplicate the same permission logic across multiple components/routes.

## 17. Authorization Failures

Use safe responses:

```json
{
  "success": false,
  "message": "You are not authorized to perform this action.",
  "data": null
}
```

Use `401` when unauthenticated and `403` when authenticated but forbidden.

For resources the caller must not know exist, `404` may be safer if that convention is adopted consistently.

## 18. Authorization Test Matrix

Test at least:

- Pending user denied.
- Suspended user denied.
- USER cannot approve accounts.
- ADMIN can approve accounts.
- ADMIN without project responsibility cannot automatically act as developer/tester.
- Non-team user cannot work on project.
- Current team leader can manage project.
- Old leader loses current manager authority after replacement.
- New leader gains current manager authority automatically.
- Developer can claim eligible requirement.
- Developer cannot steal occupied requirement.
- Tester can claim only testing requirement.
- Tester cannot test another tester's owned requirement.
- Manager reassignment replaces the old owner.
- Ineligible replacement user is rejected.
- Project can be manually completed with incomplete/discarded requirements.
- Project progress remains derived and cannot be manually changed.
