const projectLabels: Record<string, string> = {
  PLANNING: 'PLANEJAMENTO',
  IN_DEVELOPMENT: 'EM DESENVOLVIMENTO',
  TESTING: 'EM TESTES',
  COMPLETED: 'CONCLUÍDO',
  ON_HOLD: 'EM ESPERA',
  CANCELLED: 'CANCELADO',
}
const requirementLabels: Record<string, string> = {
  REQUIREMENTS: 'REQUISITOS',
  DEVELOPMENT: 'EM DESENVOLVIMENTO',
  TESTING: 'EM TESTES',
  COMPLETED: 'CONCLUÍDO',
}
export const projectStatusLabel = (value: string) =>
  projectLabels[value] ?? value
export const requirementStatusLabel = (value: string) =>
  requirementLabels[value] ?? value
export const dateLabel = (value: string | Date | null) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
        new Date(value)
      )
    : '—'
export const dateTimeLabel = (value: string | Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
