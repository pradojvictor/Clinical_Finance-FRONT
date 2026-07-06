/* Título e subtítulo de cada rota — usados pela Topbar. */
export interface PageMeta {
  title: string
  subtitle: string
}

export const PAGE_META: Record<string, PageMeta> = {
  '/':              { title: 'Início',        subtitle: 'Visão geral do balanço da clínica' },
  '/entradas':      { title: 'Entradas',      subtitle: 'Registro dos valores que entram' },
  '/procedimentos': { title: 'Procedimentos', subtitle: 'Catálogo de procedimentos da clínica' },
  '/balanco':       { title: 'Balanço',       subtitle: 'Consolidação por período e forma de pagamento' },
  '/admin':         { title: 'Admin',         subtitle: 'Usuários, permissões e configurações' },
}

export function metaFor(pathname: string): PageMeta {
  return PAGE_META[pathname] ?? { title: 'Clinleste', subtitle: '' }
}
