export function calculateProjectProgress(
  total: number,
  completed: number
): number {
  if (
    !Number.isInteger(total) ||
    !Number.isInteger(completed) ||
    total < 0 ||
    completed < 0 ||
    completed > total
  )
    throw new Error('Contagens de requisitos inválidas.')
  return total === 0 ? 0 : Math.round((completed / total) * 100)
}

export function assertTeamCanOwnProject(team: {
  leaderId: string | null
  leaderStatus: string | null
}): void {
  if (!team.leaderId || team.leaderStatus !== 'ACTIVE')
    throw new Error(
      'A equipe selecionada precisa ter uma liderança ativa antes de receber um projeto.'
    )
}
