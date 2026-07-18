// =====================================================================
// Procedimentos da clínica — conteúdo das páginas públicas.
//
// A seção de procedimentos usa o efeito de cards empilhados (referência:
// instituteofhealth.com/courses): cada procedimento é um card que gruda
// no topo enquanto o próximo sobe e o cobre.
//
// Layout de cada card: rótulo "Procedimento" · nome · botão "Saiba mais" ·
// abas "Visão geral" (descrição) e "Recomendados" (por que indicar).
//
// Para adicionar/editar um procedimento, basta mexer aqui — a seção e as
// páginas se montam sozinhas.
//
// `recomendados` é OPCIONAL de propósito: só preenchemos onde há conteúdo
// clínico revisado. Sem ele, o card mostra apenas a Visão geral — não
// inventamos "por que é recomendado" para um procedimento.
// =====================================================================
export interface Procedimento {
  /** Usado na URL: /procedimentos/<slug>. Só minúsculas e hífen. */
  slug: string
  /** Nome exibido no título do card. */
  nome: string
  /** Frase curta — o "overview" de uma linha. */
  resumo: string
  /** Texto mais longo, abaixo do resumo, na aba Visão geral. */
  descricao?: string
  /** Por que este procedimento é recomendado (aba "Recomendados"). */
  recomendados?: string[]
}

export const PROCEDIMENTOS: Procedimento[] = [
  {
    slug: 'neuromodulacao',
    nome: 'Neuromodulação',
    resumo:
      'Estimulação cerebral avançada e não invasiva para tratar sintomas onde o remédio, sozinho, não basta.',
    descricao:
      'A neuromodulação atua diretamente sobre os circuitos cerebrais ligados ao humor, ao sono e à cognição, sem cirurgia e sem internação. As sessões são rápidas e ambulatoriais: o paciente chega, faz o procedimento e retoma o dia. É uma abordagem complementar ao tratamento medicamentoso e à psicoterapia, usada quando os sintomas resistem às demais opções ou quando se busca reduzir a dose de medicação.',
    recomendados: [
      'Depressão que não respondeu bem à medicação',
      'Ansiedade persistente e transtornos do humor',
      'Redução de efeitos colaterais ao ajustar a medicação',
      'Apoio à reabilitação cognitiva e ao sono',
      'Casos que buscam uma alternativa não invasiva',
    ],
  },
  {
    slug: 'psiquiatria',
    nome: 'Psiquiatria',
    resumo:
      'Diagnóstico e tratamento de transtornos mentais, com acompanhamento médico contínuo e humano.',
  },
  {
    slug: 'psicologia',
    nome: 'Psicologia',
    resumo:
      'Terapia e escuta cuidadosa para promover equilíbrio emocional e qualidade de vida.',
  },
  {
    slug: 'ortopedia',
    nome: 'Ortopedia',
    resumo: 'Cuidado com ossos, articulações e músculos para devolver o seu movimento.',
  },
  {
    slug: 'fonoaudiologia',
    nome: 'Fonoaudiologia',
    resumo: 'Avaliação e reabilitação da fala, linguagem, audição e deglutição.',
  },
  {
    slug: 'fisioterapia',
    nome: 'Fisioterapia',
    resumo: 'Reabilitação física para recuperar força, função e autonomia no dia a dia.',
  },
]

export const acharProcedimento = (slug: string): Procedimento | undefined =>
  PROCEDIMENTOS.find((p) => p.slug === slug)
