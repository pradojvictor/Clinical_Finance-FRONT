/* =====================================================================
   Configuração da navegação principal.
   `roles` já deixa o menu pronto para o controle de acesso da Etapa 2
   (gestor = acesso total, operador = acesso parcial).
   Enquanto não há login, o layout ignora `roles` e mostra tudo.
   ===================================================================== */
import type { IconName } from '../components/ui/Icon'

export const ROLES = {
  GESTOR: 'gestor',           // acesso total
  OPERADOR: 'operador',       // acesso parcial — registros de entrada
  PROFISSIONAL: 'profissional', // só leitura; seções liberadas pelo gestor
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** Seções que o gestor pode liberar para um profissional (ver `secao`). */
export type Secao =
  | 'entradas'
  | 'saidas'
  | 'transferencias'
  | 'procedimentos'
  | 'balanco'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  /** Perfis (gestor/operador) que veem o item. Profissional usa `secao`. */
  roles: Role[]
  /** Chave da seção — usada para liberar o item ao perfil 'profissional'. */
  secao?: Secao
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/sistema',              label: 'Início',        icon: 'home',    roles: [ROLES.GESTOR, ROLES.OPERADOR] },
  { to: '/sistema/entradas',     label: 'Entradas',      icon: 'entrada', roles: [ROLES.GESTOR, ROLES.OPERADOR], secao: 'entradas' },
  { to: '/sistema/saidas',       label: 'Saídas',        icon: 'saida',   roles: [ROLES.GESTOR], secao: 'saidas' },
  { to: '/sistema/transferencias', label: 'Transferências', icon: 'transfer', roles: [ROLES.GESTOR], secao: 'transferencias' },
  { to: '/sistema/procedimentos', label: 'Procedimentos', icon: 'proc',   roles: [ROLES.GESTOR, ROLES.OPERADOR], secao: 'procedimentos' },
  { to: '/sistema/balanco',      label: 'Balanço',       icon: 'balanco', roles: [ROLES.GESTOR], secao: 'balanco' },
  { to: '/sistema/admin',        label: 'Admin',         icon: 'admin',   roles: [ROLES.GESTOR] },
]

/** Rótulos das seções para a tela de cadastro do profissional. */
export const SECAO_LABEL: Record<Secao, string> = {
  entradas: 'Entradas',
  saidas: 'Saídas',
  transferencias: 'Transferências',
  procedimentos: 'Procedimentos',
  balanco: 'Balanço',
}
export const SECOES: Secao[] = ['entradas', 'saidas', 'transferencias', 'procedimentos', 'balanco']

/**
 * O usuário pode ver esta seção?
 *
 * Regra única do front (o servidor confere de novo — aqui é só para não
 * mostrar botão que vai dar 403):
 *  - gestor: tudo;
 *  - operador: o que o perfil dele alcança no NAV_ITEMS;
 *  - profissional: só as seções que o gestor liberou, e só leitura.
 *
 * Existe para o Início não virar uma terceira cópia desta lógica — hoje
 * ela já vive no Sidebar e espalhada nas páginas.
 */
export function podeVerSecao(
  user: { perfil: Role | string; permissoes?: string[] } | null,
  secao: Secao,
): boolean {
  if (!user) return false
  if (user.perfil === 'profissional') return (user.permissoes ?? []).includes(secao)
  const item = NAV_ITEMS.find((i) => i.secao === secao)
  return item ? item.roles.includes(user.perfil as Role) : false
}
