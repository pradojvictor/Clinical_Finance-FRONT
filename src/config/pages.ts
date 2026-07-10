/* Título e subtítulo de cada rota — usados pela Topbar. */
export interface PageMeta {
  title: string
  subtitle: string
}

export const PAGE_META: Record<string, PageMeta> = {
  '/sistema':              { title: 'Início',        subtitle: 'Visão geral do balanço da clínica' },
  '/sistema/entradas':     { title: 'Entradas',      subtitle: 'Registro dos valores que entram' },
  '/sistema/saidas':       { title: 'Saídas',        subtitle: 'Registro dos valores que saem' },
  '/sistema/procedimentos': { title: 'Procedimentos', subtitle: 'Catálogo de procedimentos da clínica' },
  '/sistema/balanco':      { title: 'Balanço',       subtitle: 'Consolidação por período e forma de pagamento' },
  '/sistema/admin':        { title: 'Admin',         subtitle: 'Usuários, permissões e configurações' },
}

export function metaFor(pathname: string): PageMeta {
  return PAGE_META[pathname] ?? { title: 'Clinleste', subtitle: '' }
}
