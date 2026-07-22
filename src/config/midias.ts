// =====================================================================
// Mídias e informativos — o "mini blog" da clínica (artigos e vídeos
// dos profissionais). A seção da Home mostra os 3 MAIS RECENTES; a
// página /midias lista todos.
//
// TODO CONTEÚDO ABAIXO É PLACEHOLDER — os resumos dizem isso. A ideia é
// alimentar esta lista sempre que houver novidade (como no Instagram):
// basta acrescentar um item no TOPO da lista.
//
// Capa: imagem ou GIF (a Home NÃO toca vídeo — só a capa estática).
//   1. Salve em src/assets/midias/ (ex.: emt-capa.jpg)
//   2. Importe aqui:  import capaEmt from '../assets/midias/emt-capa.jpg'
//   3. Aponte no item: capa: capaEmt
// Sem `capa`, o card mostra o gradiente + ícone do tipo.
//
// Vídeo: quando o conteúdo for vídeo, `video` guarda o link (YouTube
// etc.) — a página abre em nova aba por enquanto.
// =====================================================================
export interface Midia {
  id: string
  tipo: 'artigo' | 'video'
  titulo: string
  /** Resumo curto mostrado no card. */
  resumo: string
  /** Data ISO (aaaa-mm-dd) — a mais nova fica no topo. */
  data: string
  /** Nome do profissional autor. */
  autor: string
  /** Capa (import de imagem/GIF). Opcional até o material chegar. */
  capa?: string
  /** Link do vídeo (YouTube/Instagram) quando tipo === 'video'. */
  video?: string
  /** Fundo do card enquanto a capa real não chega. */
  gradiente: string
}

export const MIDIAS: Midia[] = [
  {
    id: 'o-que-e-emt',
    tipo: 'artigo',
    titulo: 'O que é a Estimulação Magnética Transcraniana?',
    resumo: 'Resumo de exemplo — troque pelo texto real do artigo.',
    data: '2026-07-18',
    autor: 'Dr. Neuton Ribeiro',
    gradiente: 'linear-gradient(150deg, #1a1f42 0%, #2b3a72 100%)',
  },
  {
    id: 'sessao-de-emt-video',
    tipo: 'video',
    titulo: 'Como funciona uma sessão de EMT',
    resumo: 'Resumo de exemplo — troque pela descrição real do vídeo.',
    data: '2026-07-15',
    autor: 'Dr. Neuton Ribeiro',
    gradiente: 'linear-gradient(150deg, #12283a 0%, #1e5566 100%)',
  },
  {
    id: 'fisioterapia-dor-cronica',
    tipo: 'artigo',
    titulo: 'Fisioterapia e dor crônica: por onde começar',
    resumo: 'Resumo de exemplo — troque pelo texto real do artigo.',
    data: '2026-07-12',
    autor: 'Lígia Carvalho',
    gradiente: 'linear-gradient(150deg, #0f2a2c 0%, #1d4f4a 100%)',
  },
  {
    id: 'exercicios-degluticao',
    tipo: 'video',
    titulo: 'Exercícios de deglutição explicados',
    resumo: 'Resumo de exemplo — troque pela descrição real do vídeo.',
    data: '2026-07-08',
    autor: 'Edileusa Martins',
    gradiente: 'linear-gradient(150deg, #201a42 0%, #3d3170 100%)',
  },
  {
    id: 'sono-e-saude-mental',
    tipo: 'artigo',
    titulo: 'Sono e saúde mental: a relação que ninguém vê',
    resumo: 'Resumo de exemplo — troque pelo texto real do artigo.',
    data: '2026-07-04',
    autor: 'Dr. Neuton Ribeiro',
    gradiente: 'linear-gradient(150deg, #1b2450 0%, #35508a 100%)',
  },
  {
    id: 'terapias-integrativas',
    tipo: 'video',
    titulo: 'Terapias integrativas na prática',
    resumo: 'Resumo de exemplo — troque pela descrição real do vídeo.',
    data: '2026-07-01',
    autor: 'Lígia Carvalho',
    gradiente: 'linear-gradient(150deg, #241b3c 0%, #4a3a6e 100%)',
  },
]

/** Data ISO → "18 de julho de 2026". */
export const formatarData = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
