BEGIN;

CREATE TYPE system_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
CREATE TYPE team_member_role AS ENUM ('DEVELOPER', 'TESTER');
CREATE TYPE project_status AS ENUM ('PLANNING', 'IN_DEVELOPMENT', 'TESTING', 'COMPLETED', 'ON_HOLD', 'CANCELLED');
CREATE TYPE requirement_type AS ENUM ('FUNCTIONAL', 'NON_FUNCTIONAL');
CREATE TYPE requirement_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE requirement_status AS ENUM ('REQUIREMENTS', 'DEVELOPMENT', 'TESTING', 'COMPLETED');
CREATE TYPE assignment_action AS ENUM ('ASSIGNED', 'REASSIGNED', 'UNASSIGNED', 'INVALIDATED');
CREATE TYPE audit_entity_type AS ENUM ('USER', 'TEAM', 'TEAM_MEMBER', 'PROJECT', 'REQUIREMENT');
CREATE TYPE testing_result AS ENUM ('APPROVED', 'FAILED');

CREATE TABLE users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified timestamptz,
  image text,
  password_hash text,
  system_role system_role NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE sessions (
  session_token text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires timestamptz NOT NULL
);

CREATE TABLE verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL UNIQUE,
  expires timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE teams (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  leader_id text REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role team_member_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  client text,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  expected_completion_date date,
  status project_status NOT NULL DEFAULT 'PLANNING',
  created_by_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE requirements (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type requirement_type NOT NULL,
  priority requirement_priority NOT NULL DEFAULT 'MEDIUM',
  status requirement_status NOT NULL DEFAULT 'REQUIREMENTS',
  assigned_user_id text REFERENCES users(id) ON DELETE SET NULL,
  deadline date,
  created_by_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, code)
);

CREATE TABLE requirement_assignment_history (
  id text PRIMARY KEY,
  requirement_id text NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
  action assignment_action NOT NULL,
  previous_assignee_id text REFERENCES users(id) ON DELETE SET NULL,
  new_assignee_id text REFERENCES users(id) ON DELETE SET NULL,
  performed_by_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  requirement_status requirement_status NOT NULL,
  reason text,
  performed_by_name_snapshot text NOT NULL,
  performed_by_context_snapshot text,
  previous_assignee_name_snapshot text,
  new_assignee_name_snapshot text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE requirement_history (
  id text PRIMARY KEY,
  requirement_id text NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
  from_status requirement_status,
  to_status requirement_status NOT NULL,
  performed_by_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note text,
  actor_name_snapshot text NOT NULL,
  actor_system_role_snapshot system_role NOT NULL,
  actor_team_role_snapshot team_member_role,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE development_records (
  id text PRIMARY KEY,
  requirement_id text NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
  developer_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE testing_records (
  id text PRIMARY KEY,
  requirement_id text NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
  tester_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  result testing_result,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id text PRIMARY KEY,
  entity_type audit_entity_type NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  actor_name_snapshot text,
  actor_system_role_snapshot system_role,
  actor_team_role_snapshot team_member_role,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_status_idx ON users(status);
CREATE INDEX accounts_user_idx ON accounts(user_id);
CREATE INDEX teams_leader_idx ON teams(leader_id);
CREATE INDEX team_members_user_idx ON team_members(user_id);
CREATE INDEX projects_team_idx ON projects(team_id);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX requirements_project_status_idx ON requirements(project_id, status);
CREATE INDEX requirements_assignee_idx ON requirements(assigned_user_id);
CREATE INDEX assignment_history_requirement_created_idx ON requirement_assignment_history(requirement_id, created_at);
CREATE INDEX requirement_history_requirement_created_idx ON requirement_history(requirement_id, created_at);
CREATE INDEX development_requirement_created_idx ON development_records(requirement_id, created_at);
CREATE INDEX testing_requirement_created_idx ON testing_records(requirement_id, created_at);
CREATE INDEX audit_entity_created_idx ON audit_logs(entity_type, entity_id, created_at);

-- Current project managers and progress are derived; neither is stored on projects.
CREATE VIEW project_overview AS
SELECT p.*,
       t.leader_id AS manager_id,
       CASE WHEN count(r.id) = 0 THEN 0
            ELSE round(100.0 * count(r.id) FILTER (WHERE r.status = 'COMPLETED') / count(r.id), 2)
       END AS progress
FROM projects p
JOIN teams t ON t.id = p.team_id
LEFT JOIN requirements r ON r.project_id = p.id
GROUP BY p.id, t.leader_id;

-- The application still validates that this leader is ACTIVE in the same transaction.
CREATE OR REPLACE FUNCTION reject_project_team_without_leader() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM teams t JOIN users u ON u.id = t.leader_id
    WHERE t.id = NEW.team_id AND u.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'The selected team must have an active leader before project assignment.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_require_active_team_leader
BEFORE INSERT OR UPDATE OF team_id ON projects
FOR EACH ROW EXECUTE FUNCTION reject_project_team_without_leader();

COMMIT;
