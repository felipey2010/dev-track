# Dev Track — Authentication

## 1. Authentication Technology

Use NextAuth/Auth.js.

Supported providers:

- Credentials.
- Google.

Authentication answers who the user is. Authorization is handled separately.

## 2. Registration

### Credentials registration

Collect only fields required by the product, typically:

- Name.
- Email.
- Password.
- Password confirmation on the client/form layer.

Server responsibilities:

1. Validate payload.
2. Normalize email.
3. Ensure email is not already registered.
4. Hash password securely.
5. Create user with:
   - `systemRole = USER`
   - `status = PENDING`
6. Return a safe API response.
7. Never return password/hash.

### Google registration/sign-in

When a new Google-authenticated user is created:

- default system role is `USER`;
- default account status is `PENDING`.

A first Google sign-in must not bypass administrator approval.

## 3. Approval Gate

Successful identity verification does not automatically grant business access.

Protected application access requires:

```text
authenticated user
AND user.status == ACTIVE
```

A `PENDING` user may only access the minimum experience required to:

- understand that approval is pending;
- sign out;
- possibly view basic account information.

A `SUSPENDED` user must not access protected business functionality.

## 4. Session Contents

Keep session/JWT data minimal.

Useful values may include:

- user ID;
- system role;
- account status;
- name/image if needed by UI.

Do not place dynamic team/project authorization state permanently in the session if it can become stale.

Team membership, leadership, and requirement ownership should be resolved from server data for sensitive actions.

## 5. Credentials Security

- Store password hashes only.
- Never log passwords.
- Never return password hashes.
- Validate credentials server-side.
- Use the password-hashing solution established by the project.
- Use generic login failure messages where detailed disclosure would leak account existence.
- Keep secrets in environment variables.

## 6. Google Provider

Configure Google provider through environment variables.

Do not hardcode:

- client ID;
- client secret;
- callback secrets;
- NextAuth secret.

Production callback URLs must match the deployed environment configuration.

## 7. Protected Routes

Protection must occur on the server, not only through client redirects.

Each protected operation must verify:

1. valid authenticated session;
2. user exists;
3. user status is `ACTIVE`.

Then authorization rules determine whether the user may access the requested resource/action.

## 8. Pending and Suspended UX

### Pending

Show a clear message such as:

> Your account is awaiting administrator approval.

Do not show project/team content.

### Suspended

Show a safe account-access message and provide sign-out.

Do not expose internal suspension notes unless explicitly required.

## 9. Admin Account Actions

Administrators may:

- approve pending user;
- reject registration according to the chosen data-retention flow;
- suspend active user;
- reactivate suspended user;
- assign/remove ADMIN system role.

These actions must be server-authorized and auditable where appropriate.

## 10. API Response Convention

Authentication endpoints owned by the application should return:

```ts
{
  success: boolean
  message: string
  data: T | null
}
```

Example:

```json
{
  "success": false,
  "message": "Your account is awaiting administrator approval.",
  "data": null
}
```

Framework-managed NextAuth endpoints may follow NextAuth's own protocol internally, but application-facing APIs and UI service wrappers should normalize outcomes for the frontend.

## 11. Error Handling

Internal authentication code may throw typed errors.

At the server boundary:

- catch errors;
- map them to safe HTTP responses;
- return the standard application envelope where applicable;
- do not expose stack traces or provider/database internals.

Frontend code must show controlled error messages rather than relying on uncaught server exceptions.

## 12. Authentication Tests

Test at least:

1. Credentials registration creates `PENDING` user.
2. Google-created user starts `PENDING`.
3. Pending user cannot access dashboard.
4. Admin can approve pending user.
5. Approved `ACTIVE` user can access protected area.
6. Suspended user loses protected access.
7. Reactivated user regains access according to authorization rules.
8. Invalid password does not authenticate.
9. Password hash is never exposed by API.
10. Normal `USER` cannot perform admin approval actions.
