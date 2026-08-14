# Dev Track — Product Requirements

## 1. Product Summary

Dev Track is an internal software-development tracking application used to register software projects and track requirements through development and testing.

The product is intentionally focused. It is not a Jira, Trello, sprint-management, time-tracking, or full issue-management replacement.

The central question the product must answer is:

> Where are our software projects and their requirements in the development process?

Core model:

`Company → Teams → Projects → Requirements → Development → Testing → Completed`

## 2. Product Goals

1. Maintain a centralized record of software projects.
2. Show the current state of each project.
3. Track individual requirements from definition through completion.
4. Make responsibility clear at team, project, development, and testing levels.
5. Preserve an audit trail when assignments, roles, statuses, or important project data change.
6. Keep the workflow simple enough for fast internal use.

## 3. Scope

### In scope

- User registration and authentication.
- Administrator approval of newly registered users.
- User account administration.
- Team creation and membership management.
- Exactly one leader per team.
- Team roles: DEVELOPER and TESTER.
- Project creation and team assignment.
- Project manager derived from the assigned team's current leader.
- Manual project status management.
- Automatic project progress calculation from requirement completion.
- Requirement creation and editing.
- Requirement workflow.
- Single active requirement assignee.
- Developer and tester self-assignment where allowed.
- Authorized reassignment with audit history.
- Development notes/history.
- Testing notes/history.
- Requirement status history.
- Team/member/leader change history where it affects project responsibility.
- Dashboard and recent activity.

### Out of scope for the first version

- Individual development tasks.
- Sprint management.
- Story points.
- Time tracking.
- Gantt charts.
- Burndown charts.
- Complex issue/bug tracking.
- Chat.
- Client portal.
- Multiple teams per project.
- Manual project progress percentage.
- Custom workflow builders.
- Microservices.

## 4. Roles

Dev Track has two independent role systems.

### 4.1 System roles

- `ADMIN`
- `USER`

`USER` is the default system role.

System roles control platform-wide administration.

### 4.2 Team/project responsibilities

A user's project responsibility comes from team membership.

Team member roles:

- `DEVELOPER`
- `TESTER`

The team leader is not stored as a separate `MANAGER` membership role. The manager of every project assigned to a team is derived from the team's current leader.

A user may be an `ADMIN` at system level without being the manager of any project.

## 5. User Lifecycle

Account statuses:

- `PENDING`
- `ACTIVE`
- `SUSPENDED`

Rules:

1. Registration is available through Credentials and Google.
2. A newly registered user starts as `PENDING`.
3. A pending user cannot access protected business functionality.
4. An administrator may approve, reject, suspend, or reactivate users.
5. Approved users become `ACTIVE`.
6. Suspended users cannot access protected business functionality.

## 6. Teams

A team contains:

- One leader.
- Zero or more developers.
- Zero or more testers.

### Team rules

1. A team must have exactly one active leader before it can be assigned to a project.
2. Projects are assigned to teams, not directly to individual developers or testers.
3. Only members of the assigned team can work on the project.
4. The current team leader is automatically the manager of all projects assigned to that team.
5. A project must not store a separate independent `managerId` when the manager can be derived from `project.team.leaderId`.
6. When a team leader changes, the new leader immediately becomes manager of all existing projects assigned to the team.
7. Historical actions performed by the previous leader remain attributed to that previous user in the audit log.
8. The same historical rule applies when developers, testers, administrators, or other role assignments change. Historical records must describe who performed the action at the time; current roles must not rewrite history.

## 7. Projects

A project contains at least:

- Name.
- Description.
- Client, optional.
- Assigned team.
- Start date.
- Expected completion date.
- Status.
- Created date.
- Updated date.

### 7.1 Project creation

An authorized project manager may create a project and select the responsible team.

Before assignment, the server must verify that the selected team has an active leader.

If the team has no leader, project creation or reassignment to that team must fail with a validation/business-rule error.

### 7.2 Project statuses

Use:

- `PLANNING`
- `IN_DEVELOPMENT`
- `TESTING`
- `COMPLETED`
- `ON_HOLD`
- `CANCELLED`

### 7.3 Manual project status

Project status is manually controlled by an authorized project manager.

It must **not** be automatically derived from requirement statuses or project progress.

Reason: the project manager may mark a project as completed even when one or more requirements are not completed because the client may have discarded those requirements during the project.

Changing project status must be logged.

### 7.4 Project progress

Project progress is calculated automatically:

`completed requirements / total requirements × 100`

Rules:

1. Users cannot manually enter or edit project progress.
2. Only requirements with status `COMPLETED` count as completed.
3. If a project contains no requirements, progress is `0%`.
4. Project progress and project status are separate concepts.
5. `100%` progress does not automatically change the project status.
6. A manually `COMPLETED` project may have progress below `100%`.

## 8. Requirements

A requirement contains:

- Code.
- Title.
- Description.
- Type.
- Priority.
- Status.
- Active assigned user, optional.
- Deadline.
- Created date.
- Updated date.

Types:

- `FUNCTIONAL`
- `NON_FUNCTIONAL`

Priorities:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Statuses:

- `REQUIREMENTS`
- `DEVELOPMENT`
- `TESTING`
- `COMPLETED`

Normal lifecycle:

`REQUIREMENTS → DEVELOPMENT → TESTING → COMPLETED`

Failed testing:

`TESTING → DEVELOPMENT`

## 9. Requirement Ownership and Assignment

A requirement has at most one active assigned user.

There must never be multiple simultaneous active assignees.

### 9.1 Developer self-assignment

A developer may start an available requirement when:

1. The user is authenticated and active.
2. The user belongs to the project's assigned team.
3. The user's team role is `DEVELOPER`.
4. The requirement status is `REQUIREMENTS`.
5. The requirement is available for assignment.

Successful self-assignment:

- sets the active assignee to the developer;
- changes the status to `DEVELOPMENT`;
- creates assignment and status history entries.

### 9.2 Tester self-assignment

A tester may start testing when:

1. The user is authenticated and active.
2. The user belongs to the project's assigned team.
3. The user's team role is `TESTER`.
4. The requirement status is `TESTING`.
5. The requirement is available for assignment.

Successful self-assignment:

- sets the active assignee to the tester;
- records assignment history.

### 9.3 Reassignment

When an authorized action assigns a new user to a requirement that already has an active assignee:

1. The new user replaces the old user.
2. The requirement continues to have exactly one active assignee.
3. The previous assignment is preserved in history.
4. The reassignment action records old assignee, new assignee, actor, timestamp, requirement status, and reason/note when supplied.
5. Reassignment must validate that the new assignee is eligible for the requirement's current stage.
6. Reassignment must be atomic to prevent two active owners.

A normal developer/tester self-assignment must not silently steal a requirement already owned by another user. Replacing an existing assignee must go through the explicit authorized reassignment operation.

## 10. Development

The assigned developer can:

- View the requirement.
- Add development information.
- Add development notes.
- Mark development as ready for testing.

Moving to testing:

`DEVELOPMENT → TESTING`

The action must be authorized on the server and logged.

The implementation must not create a nested task hierarchy.

## 11. Testing

The assigned tester can:

- View the requirement.
- Add testing information.
- Add testing notes.
- Approve the requirement.
- Return the requirement to development.

Successful test:

`TESTING → COMPLETED`

Failed test:

`TESTING → DEVELOPMENT`

When returned to development:

1. The tester must no longer remain the active assignee.
2. The cleared assignment must remain in history.
3. A developer can then claim the requirement through the normal developer assignment flow.

## 12. History and Auditability

Important business actions must be preserved.

At minimum log:

- Requirement creation.
- Requirement edits where materially relevant.
- Requirement assignment.
- Requirement reassignment.
- Requirement unassignment/assignment invalidation.
- Requirement status transitions.
- Development completion/send-to-testing.
- Test approval.
- Test rejection/return-to-development.
- Project creation.
- Project status changes.
- Project team changes.
- Team leader changes.
- Team member role changes that affect responsibility.
- User approval/suspension/reactivation where appropriate.

Historical entries must remain understandable even after a user changes role, leaves a team, or is suspended.

Do not reconstruct historical responsibility only from the user's current team role.

## 13. Dashboard

The dashboard should show:

- Total projects.
- Projects in development.
- Projects in testing.
- Completed projects.
- Project progress.
- Recent requirement/project activity.

Project progress shown on the dashboard is computed from requirements.

Project status shown on the dashboard is the manually maintained project status.

## 14. Main Screens

### Authentication

- Login.
- Registration.
- Pending approval state.

### Dashboard

- Overview.
- Project status summary.
- Project progress.
- Recent activity.

### Projects

- Project list.
- Create project.
- Project details.
- Project edit/status controls for authorized users.

### Requirements

Requirements are normally accessed under:

`Projects → Project → Requirements`

Pages/actions:

- Requirement list.
- Requirement details.
- Create/edit requirement.
- Start development.
- Start testing.
- Reassign, when authorized.
- Approve.
- Return to development.
- History.

### Teams

- Team list.
- Team details.
- Team leader.
- Team members.
- Projects belonging to the team.

### Users

Admin only:

- Active.
- Pending.
- Suspended.
- Approval and account actions.

## 15. Functional Requirements

### Authentication and users

- `FR01` Register using credentials.
- `FR02` Authenticate/register using Google.
- `FR03` Prevent pending users from accessing protected functionality.
- `FR04` Allow administrators to approve or reject registrations.
- `FR05` Allow administrators to suspend/reactivate users.
- `FR06` Use NextAuth/Auth.js for authentication.

### Teams

- `FR07` Allow administrators to create teams.
- `FR08` Allow administrators to add users to teams.
- `FR09` Allow administrators to set/change a team leader.
- `FR10` Allow administrators to assign DEVELOPER or TESTER team roles.
- `FR11` Derive project manager from the team's current leader.
- `FR12` Prevent a team without a leader from being assigned to a project.
- `FR13` Preserve audit history when leader or team roles change.

### Projects

- `FR14` Allow authorized project managers to create projects.
- `FR15` Assign each project to exactly one team.
- `FR16` Restrict project work to members of the assigned team.
- `FR17` Allow authorized users to view project information.
- `FR18` Allow the project manager to edit project information.
- `FR19` Allow the project manager to change project status manually.
- `FR20` Log project status changes.
- `FR21` Calculate project progress automatically from completed requirements.
- `FR22` Return 0% progress for projects without requirements.

### Requirements

- `FR23` Allow authorized project users to create requirements.
- `FR24` Allow authorized users to edit requirements.
- `FR25` Allow developer self-assignment from `REQUIREMENTS`.
- `FR26` Move a successfully claimed requirement to `DEVELOPMENT`.
- `FR27` Allow at most one active requirement assignee.
- `FR28` Allow an authorized reassignment to replace the previous active assignee.
- `FR29` Log every assignment/reassignment.
- `FR30` Allow assigned developers to update development information.
- `FR31` Allow assigned developers to move work to `TESTING`.

### Testing

- `FR32` Allow tester self-assignment only in `TESTING`.
- `FR33` Allow assigned testers to record testing information.
- `FR34` Allow assigned testers to approve a requirement.
- `FR35` Allow assigned testers to return failed work to `DEVELOPMENT`.
- `FR36` Clear/invalidate the tester assignment when returning to `DEVELOPMENT`.

### History

- `FR37` Record relevant requirement status transitions.
- `FR38` Preserve requirement history throughout its lifecycle.
- `FR39` Preserve actor attribution even if the actor later changes role/team.
- `FR40` Record project/team responsibility changes that affect ownership or management.

## 16. Non-Functional Requirements

### Security

- Protected resources require authentication.
- Authorization is enforced on the server.
- Users cannot work on projects outside their assigned team.
- Credentials are handled securely.
- HTTPS is required in production.
- Sensitive server exceptions are not exposed directly to the frontend.

### Architecture

- Monolithic Next.js application.
- Clear separation of concerns.
- Reusable domain services/use cases where useful.
- Business rules cannot rely exclusively on frontend checks.

### Usability

- Simple, clear, status-oriented UI.
- Project status and requirement status must be visually distinguishable.
- Current responsibility and available actions must be obvious.

### Maintainability

- Modular components.
- Typed data.
- Centralized authorization and business rules.
- Avoid premature abstractions and unnecessary libraries.

## 17. Acceptance-Critical Business Rules

The implementation is invalid if any of these rules are broken:

1. Users require approval before protected access.
2. A project belongs to exactly one team.
3. A team must have a leader before it can be assigned to a project.
4. The current team leader is the current manager of every project assigned to that team.
5. Leader replacement automatically changes the current manager without rewriting historical logs.
6. Project status is manually controlled.
7. Project progress is automatically calculated from completed requirements.
8. A project with no requirements has `0%` progress.
9. Project status and project progress are independent.
10. Only project-team members may work on a project.
11. Developer self-assignment is allowed only in `REQUIREMENTS`.
12. Tester self-assignment is allowed only in `TESTING`.
13. A requirement has no more than one active assignee.
14. Explicit reassignment replaces the previous active assignee and is logged.
15. Testing failure returns the requirement to `DEVELOPMENT` and invalidates the testing assignment.
16. Server-side authorization is mandatory.
17. Historical actions remain attributed to the actor who performed them.
18. Dev Track remains a maintainable monolithic Next.js application.
