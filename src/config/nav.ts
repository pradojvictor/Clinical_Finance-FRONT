/* =====================================================================
   Configuração da navegação principal.
   `roles` já deixa o menu pronto para o controle de acesso da Etapa 2
   (gestor = acesso total, operador = acesso parcial).
   Enquanto não há login, o layout ignora `roles` e mostra tudo.
   ===================================================================== */
import type { IconName } from '../components/ui/Icon'

export const ROLES = {
  GESTOR: 'gestor',     // acesso total
  OPERADOR: 'operador', // acesso parcial — registros de entrada
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export interface NavItem {
  to: string
  label: string
  icon: IconName
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/sistema',              label: 'Início',        icon: 'home',    roles: [ROLES.GESTOR, ROLES.OPERADOR] },
  { to: '/sistema/entradas',     label: 'Entradas',      icon: 'entrada', roles: [ROLES.GESTOR, ROLES.OPERADOR] },
  { to: '/sistema/saidas',       label: 'Saídas',        icon: 'saida',   roles: [ROLES.GESTOR] },
  { to: '/sistema/clientes',     label: 'Clientes',      icon: 'user',    roles: [ROLES.GESTOR, ROLES.OPERADOR] },
  { to: '/sistema/procedimentos', label: 'Procedimentos', icon: 'proc',   roles: [ROLES.GESTOR, ROLES.OPERADOR] },
  { to: '/sistema/balanco',      label: 'Balanço',       icon: 'balanco', roles: [ROLES.GESTOR] },
  { to: '/sistema/admin',        label: 'Admin',         icon: 'admin',   roles: [ROLES.GESTOR] },
]
