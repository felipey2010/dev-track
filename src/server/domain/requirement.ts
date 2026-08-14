export type RequirementStage =
  'REQUIREMENTS' | 'DEVELOPMENT' | 'TESTING' | 'COMPLETED'
export type TeamRole = 'DEVELOPER' | 'TESTER'

const transitions: Record<RequirementStage, RequirementStage[]> = {
  REQUIREMENTS: ['DEVELOPMENT'],
  DEVELOPMENT: ['TESTING'],
  TESTING: ['COMPLETED', 'DEVELOPMENT'],
  COMPLETED: [],
}

export function assertTransition(
  from: RequirementStage,
  to: RequirementStage
): void {
  if (!transitions[from].includes(to))
    throw new Error(`Transição de ${from} para ${to} não permitida.`)
}

export function assertSelfAssignment(input: {
  role: TeamRole
  status: RequirementStage
  assignedUserId: string | null
}): void {
  if (input.assignedUserId)
    throw new Error('Este requisito já está atribuído a outra pessoa.')
  const eligible =
    (input.role === 'DEVELOPER' && input.status === 'REQUIREMENTS') ||
    (input.role === 'TESTER' && input.status === 'TESTING')
  if (!eligible)
    throw new Error(
      'Seu papel e a etapa atual não permitem iniciar este requisito.'
    )
}

export function roleRequiredForStage(
  status: RequirementStage
): TeamRole | null {
  if (status === 'REQUIREMENTS' || status === 'DEVELOPMENT') return 'DEVELOPER'
  if (status === 'TESTING') return 'TESTER'
  return null
}
