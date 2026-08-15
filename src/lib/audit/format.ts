import { AUDIT_ACTIONS } from './constants'

const ACTION_LABELS: Record<string, string> = {
  [AUDIT_ACTIONS.userRegistered]: 'cadastrou uma conta',
  [AUDIT_ACTIONS.userEmailVerified]: 'confirmou o e-mail da conta',
  [AUDIT_ACTIONS.userPasswordReset]: 'redefiniu a senha da conta',
  [AUDIT_ACTIONS.projectCreated]: 'criou um projeto',
  [AUDIT_ACTIONS.userStatusChanged.PENDING]: 'alterou uma conta para pendente',
  [AUDIT_ACTIONS.userStatusChanged.ACTIVE]: 'ativou uma conta',
  [AUDIT_ACTIONS.userStatusChanged.SUSPENDED]: 'suspendeu uma conta',
  [AUDIT_ACTIONS.userStatusChanged.REJECTED]: 'rejeitou uma conta',
}

const ENTITY_LABELS: Record<string, string> = {
  USER: 'Usuário',
  TEAM: 'Equipe',
  TEAM_MEMBER: 'Membro da equipe',
  PROJECT: 'Projeto',
  REQUIREMENT: 'Requisito',
}

export function auditActionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.toLowerCase().replaceAll('_', ' ')
}

export function auditEntityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] ?? entityType
}
