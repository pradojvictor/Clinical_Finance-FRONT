// =====================================================================
// Alvo do build — define QUAIS partes do app existem nesta cópia.
//
//  'site'    -> só a landing. É o que vai para o domínio público:
//               HTML estático, sem API, sem login, sem cookie.
//  'sistema' -> login da equipe + /sistema. Roda na máquina da clínica,
//               servido pelo próprio Express, na MESMA origem da API.
//               O gestor chega nele por favorito em /login.
//  'tudo'    -> padrão do `npm run dev` (não atrapalha o desenvolvimento).
//
// Por que existe: a API e o banco só rodam na rede da clínica. Se o build
// público levasse o sistema junto, seria tela morta — a API não é
// alcançável de fora. Então cada build leva só o que funciona onde ele vai.
//
// __ALVO__ é trocado pelo literal em tempo de build (define, no
// vite.config.ts), então estas constantes viram true/false fixos e o Rollup
// poda as rotas do outro alvo — o código nem é emitido no bundle.
// Conferir com `npm run build:site` + olhar dist-site/assets/*.js.
// =====================================================================
export type Alvo = 'site' | 'sistema' | 'tudo'

/** Injetado pelo Vite (define). Não existe em tempo de execução. */
declare const __ALVO__: Alvo

export const ALVO: Alvo = __ALVO__

export const TEM_LANDING = ALVO !== 'sistema'
export const TEM_SISTEMA = ALVO !== 'site'

/** Destino de quem cai numa rota que não existe NESTE build. */
export const RAIZ = TEM_LANDING ? '/' : '/sistema'
