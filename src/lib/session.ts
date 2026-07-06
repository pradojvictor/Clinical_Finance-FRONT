/* =====================================================================
   Sessão — PLACEHOLDER da Etapa 1 (sem login).
   Na Etapa 2 isto vira um contexto React alimentado pelo backend
   (cookie httpOnly + verificação de sessão). Nada aqui é fonte de
   verdade de permissão: o controle de acesso real acontece no servidor.
   ===================================================================== */
import { ROLES } from '../config/nav'
import type { Role } from '../config/nav'

export interface CurrentUser {
  nome: string
  role: Role
  autenticado: boolean
}

// Usuário fictício só para compor a interface enquanto não há login.
export const currentUser: CurrentUser = {
  nome: 'Visitante',
  role: ROLES.GESTOR, // demonstração — mostra todas as páginas
  autenticado: false,
}

export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.GESTOR]: 'Gestor',
  [ROLES.OPERADOR]: 'Operador',
}

export function iniciais(nome = ''): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
