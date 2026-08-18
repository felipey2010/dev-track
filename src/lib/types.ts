export type Leader = { id: string; name: string } | null
export type Project = {
  id: string
  name: string
  description: string
  client: string | null
  status: string
  start_date: string
  expected_completion_date: string | null
  tech_stack: string[]
  updated_at: string
  team: { id: string; name: string; leader: Leader }
  progress: number
  requirementCount: number
  completedRequirementCount: number
}
export type Requirement = {
  id: string
  code: string
  title: string
  description: string
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'REQUIREMENTS' | 'DEVELOPMENT' | 'TESTING' | 'COMPLETED'
  deadline: string | null
  users_requirements_assigned_user_idTousers: Leader
}
export type ProjectDetail = Omit<
  Project,
  'requirementCount' | 'completedRequirementCount'
> & {
  requirements: Requirement[]
  canManage: boolean
  canEditProject: boolean
}
export type Team = {
  id: string
  name: string
  description: string | null
  users: { id: string; name: string; status: string } | null
  canManage: boolean
  developerCount: number
  testerCount: number
  _count: { projects: number }
}
export type TeamDetail = {
  id: string
  name: string
  description: string | null
  leader_id: string | null
  users: { id: string; name: string; email: string; status: string } | null
  _count: { projects: number }
  projects: {
    id: string
    name: string
    description: string
    client: string | null
    status: string
    start_date: string
    expected_completion_date: string | null
    updated_at: string
  }[]
  team_members: {
    id: string
    role: 'DEVELOPER' | 'TESTER'
    users: {
      id: string
      name: string
      email: string
      image: string | null
      status: string
    }
  }[]
}
export type TeamUserOption = { id: string; name: string; email: string }
export type User = {
  id: string
  name: string
  email: string
  image: string | null
  status: string
  system_role: string
  created_at: string
}
export type Activity = {
  id: string
  action: string
  actor_name_snapshot: string | null
  entity_type: string
  created_at: string
}
