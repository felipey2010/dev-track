export const PROJECT_STATUS = {
  IN_DEVELOPMENT: 'IN_DEVELOPMENT',
  TESTING: 'TESTING',
  COMPLETED: 'COMPLETED',
} as const

export const PROJECT_DEVELOPMENT_STATUS = [
  {
    label: 'Em teste',
    value: 'TESTING',
  },
  {
    label: 'Concluído',
    value: 'COMPLETED',
  },
  {
    label: 'Em espera',
    value: 'ON_HOLD',
  },
  {
    label: 'Cancelado',
    value: 'CANCELLED',
  },
]
