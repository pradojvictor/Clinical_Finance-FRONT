// =====================================================================
// Profissionais da clínica — conteúdo da seção "apresentação dos
// profissionais" da Home (carrossel guiado pelo scroll).
//
// Os três profissionais já têm conteúdo REAL (Dr. Neuton, Lígia e
// Edileusa). Para editar textos, é só mexer aqui.
//
// Para trocar a FOTO de um profissional:
//   1. Salve a foto em src/assets/profissionais/ (retrato, ~3:4).
//   2. Importe no topo: import fotoX from '../assets/profissionais/arquivo.jpg'
//   3. Aponte no registro: foto: fotoX
//
// `formacao` é a lista do card da FORMAÇÃO (abre à direita da foto).
// `atuacao` são os blocos do card da ATUAÇÃO (abre à esquerda): cada
// bloco tem título (o serviço) e texto (a descrição).
// =====================================================================
import foto1 from '../assets/profissionais/profissional-1.jpg'
import foto2 from '../assets/profissionais/profissional-2.jpg'
import foto3 from '../assets/profissionais/profissional-3.jpg'

export interface BlocoAtuacao {
  titulo: string
  /** Descrição do serviço — opcional (há profissionais que listam só o nome). */
  texto?: string
}

export interface Profissional {
  id: string
  nome: string
  /** Profissão + registro (ex.: "Psiquiatra · CRM-PI 0000"). */
  profissao: string
  /** Linhas da formação (residência, pós, títulos…). */
  formacao: string[]
  /** Parágrafo de abertura do card de atuação (opcional). */
  atuacaoIntro?: string
  /** Blocos de atuação na clínica (título do serviço + descrição). */
  atuacao: BlocoAtuacao[]
  /** Fundo do card enquanto a foto real não chega. */
  gradiente: string
  /** Foto real (import). Opcional até o material chegar. */
  foto?: string
}

export const PROFISSIONAIS: Profissional[] = [
  {
    id: 'neuton-ribeiro',
    nome: 'Dr. Neuton Ribeiro',
    profissao: 'Psiquiatra · CRM-PI 5638 | RQE 3831',
    formacao: [
      'Residência Médica em Psiquiatria',
      'Curso de aperfeiçoamento em Psicogeriatria',
      'Pós-graduação em Medicina Intervencionista pela USP',
      'Formação em Neuromodulação, com foco em Estimulação Magnética Transcraniana (EMT)',
    ],
    atuacao: [
      {
        titulo: 'Estimulação Magnética Transcraniana (EMT)',
        texto:
          'Tratamento de neuromodulação não invasivo, realizado por meio de pulsos magnéticos, indicado para casos selecionados, como depressão, ansiedade, dor crônica e outras condições.',
      },
      {
        titulo: 'Consulta Psiquiátrica',
        texto:
          'Avaliação completa para compreender seu histórico, definir o diagnóstico quando necessário e construir um tratamento individualizado, que pode envolver medicação, psicoterapia e outras abordagens.',
      },
    ],
    gradiente: 'linear-gradient(160deg, #1a1f42 0%, #2b3a72 100%)',
    foto: foto1,
  },
  {
    id: 'ligia-carvalho',
    nome: 'Lígia Carvalho',
    profissao: 'Fisioterapeuta · CREFITO 14: 034155-F',
    formacao: [
      '25 anos de experiência em Fisioterapia',
      'Graduação em Fisioterapia pela Universidade Estadual da Paraíba (UEPB)',
      'Especialização em Fisioterapia Musculoesquelética e Práticas Integrativas',
      'Formação em Neuromodulação',
      'Formações na área de Terapia Manual e Terapias Integrativas',
    ],
    atuacaoIntro:
      'Minha prática combina a precisão da neuromodulação — TMS, tDCS, TAVNS, PMS e TsDCS — à profundidade das terapias integrativas, oferecendo caminhos reais de alívio para quadros de dor crônica, fibromialgia, enxaqueca, neuralgias, ansiedade, depressão e insônia.',
    atuacao: [
      {
        titulo: 'Fisioterapia musculoesquelética',
        texto: 'Especialização clínica em dor, função e reabilitação.',
      },
      {
        titulo: 'Neuromodulação aplicada',
        texto: 'TMS · tDCS · TAVNS · PMS · TsDCS.',
      },
      {
        titulo: 'Terapias integrativas',
        texto: 'Hipnose, Constelação, Reiki, Florais, Auriculoterapia.',
      },
      {
        titulo: 'Atendimento humanizado',
        texto: 'Plano individual, escuta e presença em cada etapa.',
      },
    ],
    gradiente: 'linear-gradient(160deg, #12283a 0%, #1e5566 100%)',
    foto: foto2,
  },
  {
    id: 'edileusa-martins',
    nome: 'Edileusa Martins',
    profissao: 'Fonoaudióloga · CRFa8 12022',
    formacao: [
      'Graduação em Fonoaudiologia',
      'Especialização em Motricidade Orofacial com ênfase em Fonoaudiologia Hospitalar e Disfagia',
      'Formação Fonoaudiológica no Paciente Traqueostomizado',
      'Formação em Apraxia Oral e Apraxia da Fala',
    ],
    atuacao: [
      { titulo: 'Reabilitação da deglutição (disfagia)' },
      { titulo: 'Atendimento a pacientes traqueostomizados' },
      { titulo: 'Reabilitação pós-AVC' },
      { titulo: 'Traumas de face' },
    ],
    gradiente: 'linear-gradient(160deg, #201a42 0%, #3d3170 100%)',
    foto: foto3,
  },
]
