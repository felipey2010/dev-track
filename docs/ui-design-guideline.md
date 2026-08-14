# Dev Track — UI Design Guideline

## 1. Purpose

Dev Track is a professional internal engineering application.

The interface must prioritize:

1. Information.
2. Clarity.
3. Workflow.
4. Action.
5. Visual polish.

It should not look like a marketing site or a generic AI-generated dashboard.

## 2. Design Character

Use a visual language that is:

- Clean.
- Neutral.
- Technical.
- Professional.
- Calm.
- Consistent.
- Data-dense but readable.

Avoid:

- Excessive gradients.
- Excessive cards.
- Excessive rounded containers.
- Decorative illustrations.
- Large decorative headings.
- Excessive shadows.
- Excessive animations.
- Too many colors.
- Unnecessary visual novelty.

Every visual element should have a functional reason.

## 3. Application Shell

Desktop-first structure:

```text
┌─────────────────────────────────────────────────────┐
│ Header                                               │
├──────────────┬──────────────────────────────────────┤
│ Sidebar      │ Main Content                         │
│              │                                      │
│ Navigation   │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

Primary navigation:

- Dashboard.
- Projects.
- Teams.
- Users — ADMIN only.

Requirements should normally be reached through:

`Projects → Project → Requirements`

Do not add a global Requirements navigation item unless a concrete use case requires it.

## 4. Role-Aware Navigation

UI may hide actions the user cannot perform, but this is only a usability feature.

Server authorization remains mandatory.

Clearly distinguish:

- System role: ADMIN / USER.
- Team responsibility: leader/manager, developer, tester.

Do not visually merge system administration and project responsibility.

## 5. Dashboard

The dashboard should answer:

> What is happening with the company's software projects?

Recommended content:

- Total projects.
- Projects by manually controlled project status.
- Project progress.
- Recent activity.

Example:

```text
Overview
┌────────────┬─────────────┬────────────┬────────────┐
│ Projects   │ Development │ Testing    │ Completed  │
└────────────┴─────────────┴────────────┴────────────┘

Projects
Project             Team        Status          Progress
ISP Management      Alpha       In Development   68%
CRM                 Beta        Testing          91%
Inventory           Alpha       Completed        75%

Recent Activity
...
```

Important: project status and progress are independent. A completed project can legitimately show less than 100% progress if requirements were discarded by the client.

## 6. Project List

Prefer a table for scanning.

Columns:

- Project.
- Team.
- Status.
- Progress.
- Start date.
- Expected completion.
- Last update.

Useful MVP filters:

- Status.
- Team.
- Client.

Avoid excessive filters.

## 7. Project Details

Make these visible without unnecessary navigation:

- Project name.
- Description.
- Client.
- Team.
- Current manager, derived from team leader.
- Manual project status.
- Computed progress.
- Requirements grouped/countable by status.
- Requirement list.
- Relevant history/activity.

Example:

```text
ISP Management System

Team: Alpha
Manager: João
Project status: Completed
Progress: 75%

Requirements
Requirements     2
Development      1
Testing          0
Completed        9
```

If no requirements exist, show progress as `0%`.

## 8. Project Status UI

Project status must be editable only for authorized project managers.

Do not imply that status is automatically synchronized with requirement progress.

When changing status:

- use a clear select/menu/dialog;
- show current status;
- use confirmation only for consequential states such as `CANCELLED` when appropriate;
- show success/error feedback;
- record the server-side history.

## 9. Requirement Presentation

A requirement should clearly show:

- Code.
- Title.
- Description.
- Type.
- Priority.
- Status.
- Current assignee.
- Deadline/relevant dates.

Current requirement status should be prominent.

Use a compact lifecycle indicator:

`Requirements → Development → Testing → Completed`

Do not make it look like a complex Kanban tool.

## 10. Requirement Ownership UI

Only one active assignee may be shown.

### Available requirement

For an eligible developer in `REQUIREMENTS`:

**Start Development**

For an eligible tester in `TESTING`:

**Start Testing**

### Occupied requirement

Clearly show:

```text
Assigned to: Pedro
```

Do not show a normal self-assignment action to other developers/testers.

### Reassignment

For authorized managers:

- expose an explicit `Reassign` action;
- select one eligible replacement user;
- explain that the current assignee will be replaced;
- show confirmation when appropriate;
- refresh ownership and history after success.

Do not present multi-user assignment controls.

## 11. Developer Experience

A developer should quickly see:

- requirements available to start;
- requirements currently assigned to them;
- development notes/details;
- action to send completed work to testing.

Primary action wording:

**Start Development**

Completion action:

**Send to Testing**

## 12. Tester Experience

A tester should quickly see testing work.

Primary action:

**Start Testing**

Testing actions:

- **Approve**
- **Return to Development**

Do not introduce a separate bug-tracking interface.

## 13. Team Interface

Show:

```text
Team Alpha

Leader / Project Manager
João

Developers
Pedro
Carlos
Ana

Testers
Maria
Lucas

Projects
ISP Management
CRM
```

The leader must be visually distinguished because leadership determines the manager of every team project.

If a team has no leader, show a visible warning and prevent project assignment actions.

Example:

> This team needs a leader before it can be assigned to a project.

## 14. Leader Change UX

Changing the leader is consequential.

The UI should communicate:

> The new leader will automatically become manager of all projects assigned to this team. Existing history will remain unchanged.

After success:

- refresh team leader;
- refresh displayed managers on related project views;
- preserve old activity history.

## 15. User Management

ADMIN interface sections:

- Active.
- Pending.
- Suspended.

Pending users need clear:

- Approve.
- Reject.

Avoid a large, complex admin panel.

## 16. Status Design

Use consistent semantic treatment.

Requirement:

- Requirements → neutral.
- Development → active/in progress.
- Testing → attention/review.
- Completed → success.

Project:

- Planning → neutral.
- In Development → active.
- Testing → review.
- Completed → success.
- On Hold → warning.
- Cancelled → inactive/destructive.

Do not rely on color alone. Combine with text and, where useful, iconography.

## 17. Priority Design

Priorities:

- Low.
- Medium.
- High.
- Critical.

Keep styling subtle.

Reserve strongest emphasis for Critical.

## 18. Tables vs Cards

Use tables when users compare records.

Use cards for:

- individual entity summaries;
- small grouped information;
- dashboard summary metrics where justified.

Do not convert every list into decorative cards.

## 19. Forms

Keep forms simple and single-purpose.

### Project form

```text
Project Information
-------------------
Name
Description
Client
Team
Start Date
Expected Completion
Status

[Create Project]
```

Team selection must only allow project assignment when the chosen team has a valid leader. If a leader becomes invalid between rendering and submission, the server error must be handled.

### Requirement form

```text
Requirement
-----------
Code
Title
Description
Type
Priority
Deadline

[Create Requirement]
```

Requirement status should normally begin at `REQUIREMENTS`; do not expose unnecessary arbitrary status selection during creation.

Place validation messages next to fields.

## 20. Loading, Empty, Success, Error States

Every data view must handle:

- Loading.
- Empty.
- Success.
- Error.

Prefer skeletons and inline loading indicators.

Avoid full-screen spinners for small operations.

Example empty state:

```text
No projects yet.

Create a project to begin tracking development.

[Create Project]
```

Example success feedback:

> Requirement moved to testing.

Example safe error:

> This requirement is already assigned to another user.

Frontend errors should use the API's `message` field and must not display raw server exceptions.

## 21. Confirmation Dialogs

Use for destructive or consequential operations:

- Reject user.
- Suspend user.
- Remove team member.
- Change team leader.
- Cancel project.
- Reassign an occupied requirement when the replacement is consequential.
- Delete requirement, if deletion is supported.

Do not require confirmation for ordinary navigation.

## 22. Responsive Design

Desktop is primary, but common workflows must remain usable on smaller screens.

On mobile:

- Collapse sidebar.
- Use horizontal scrolling or compact list alternatives for tables.
- Use single-column forms.
- Keep primary actions reachable.
- Do not simply shrink the desktop UI.

## 23. Accessibility

Require:

- Sufficient contrast.
- Keyboard access.
- Visible focus.
- Semantic HTML.
- Accessible labels.
- Meaningful button text.
- ARIA where necessary.
- No information communicated by color alone.

Icon-only controls require accessible labels/tooltips.

## 24. Reusable Components

Prefer shared components such as:

- Button.
- Input.
- Select.
- Dialog.
- Dropdown.
- Badge.
- StatusBadge.
- ProgressBar.
- DataTable.
- EmptyState.
- LoadingState.
- PageHeader.
- FormSection.
- UserAvatar.

Domain components may include:

- ProjectStatus.
- ProjectProgress.
- RequirementStatus.
- RequirementCard/Row.
- RequirementLifecycle.
- RequirementAssignee.
- TeamMembers.
- TeamLeader.
- ActivityTimeline.

Reuse existing components before creating new ones.

## 25. Design System

Define centrally:

- Typography.
- Spacing.
- Radius.
- Shadows.
- Colors.
- Component variants.
- Breakpoints.

Do not invent page-specific colors or spacing when tokens/components already exist. You can use shadcn ui components and tailwind css.

## 26. Animations

Acceptable:

- Dialog transitions.
- Sidebar transitions.
- Toast appearance.
- Small status transitions.
- Loading indicators.

Avoid:

- Large entrance animation.
- Constant movement.
- Decorative motion.
- Excessive page transitions.

Dev Track is a productivity tool.

## 27. Screen Validation Checklist

Before considering a screen complete, verify:

- Current page is obvious.
- Relevant project/team is obvious.
- Project status is clearly distinguished from project progress.
- Requirement status is obvious.
- Current assignee is obvious.
- Available user action is obvious.
- Unauthorized actions are not offered.
- Server still enforces authorization.
- Loading/empty/error states exist.
- Error messages are safe.
- Interface does not rely only on color.
- Existing components/design tokens are reused.
- Smaller screens remain usable.
- Unnecessary visual complexity was avoided.

## Application Language

We should keep the application default language as Portuguese (Brazil).
