// =====================================================================
// Cliente HTTP da API. Em dev, chama /api/* (proxy do Vite -> backend),
// sempre com o cookie de sessão (credentials: include).
// =====================================================================
import type { Role } from '../config/nav'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    })
  } catch {
    throw new ApiError('Falha de conexão com o servidor.', 0)
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* resposta sem corpo */
  }

  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'erro' in data
        ? String((data as { erro: unknown }).erro)
        : 'Erro na requisição.'
    throw new ApiError(msg, res.status)
  }
  return data as T
}

/** Perfil do usuário logado (só equipe: gestor/operador/profissional). */
export type PerfilUsuario = Role

export interface Usuario {
  login: string
  nome: string
  perfil: PerfilUsuario
  email?: string
  /** Seções liberadas (só para 'profissional'). */
  permissoes?: string[]
}

export const authApi = {
  me: () => req<{ usuario: Usuario }>('/auth/me'),
  login: (login: string, senha: string) =>
    req<{ usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, senha }),
    }),
  logout: () => req<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
}

// ---- Admin: bancos e taxas ----------------------------------------
export type Forma = 'pix' | 'debito' | 'credito' | 'especie'

export interface Banco {
  id: number
  nome: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Taxa {
  id: number
  forma: Forma
  banco_id: number
  percentual_bp: number
  banco_nome: string
  atualizado_em: string
}

export const bancosApi = {
  listar: () => req<{ bancos: Banco[] }>('/bancos'),
  criar: (nome: string) =>
    req<{ banco: Banco }>('/bancos', { method: 'POST', body: JSON.stringify({ nome }) }),
  atualizar: (id: number, dados: Partial<{ nome: string; ativo: boolean }>) =>
    req<{ banco: Banco }>(`/bancos/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (id: number) => req<{ ok: boolean }>(`/bancos/${id}`, { method: 'DELETE' }),
}

export const taxasApi = {
  listar: () => req<{ taxas: Taxa[] }>('/taxas'),
  atualizar: (id: number, percentual_bp: number) =>
    req<{ taxa: Taxa }>(`/taxas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ percentual_bp }),
    }),
  lookup: (forma: Forma, banco_id: number) =>
    req<{ percentual_bp: number }>(`/taxas/lookup?forma=${forma}&banco_id=${banco_id}`),
}

// ---- Pacientes e Entradas -----------------------------------------
export interface Paciente {
  id: number
  nome: string
  cpf: string | null
  email: string | null
}

export interface EntradaDetalhe {
  id: number
  data: string
  forma: Forma
  valor_centavos: number
  taxa_bp: number
  valor_liquido_centavos: number
  banco_id: number | null
  tipo_id: number | null
  subtipo_id: number | null
  paciente_nome: string | null
  banco_nome: string | null
  tipo_nome: string | null
  subtipo_nome: string | null
  operador_nome: string
  observacao: string | null
  /** Quando foi REGISTRADO (não a data do movimento) — define a janela
      de 24h em que ainda dá para excluir. */
  criado_em: string
}

export interface NovaEntrada {
  forma: Forma
  valor_centavos: number
  data?: string
  banco_id?: number | null
  tipo_id?: number | null
  subtipo_id?: number | null
  paciente_id?: number | null
  paciente?: { nome: string; cpf?: string; email?: string }
  observacao?: string
}

export const pacientesApi = {
  buscar: (q: string) =>
    req<{ pacientes: Paciente[] }>(`/pacientes?q=${encodeURIComponent(q)}`),
}

export interface LinhaImport {
  nome: string
  data?: string
  valor_centavos: number
}
export interface VerificacaoImport {
  arquivo_conteudo_igual: { arquivo_nome: string; criado_em: string } | null
  arquivo_nome_igual: { criado_em: string } | null
  linhas_duplicadas: { indice: number; entrada_id: number }[]
}
export interface MetaImport {
  arquivo_nome: string
  conteudo_hash: string
}

export const entradasApi = {
  listar: (params?: { de?: string; ate?: string }) => {
    const qs = new URLSearchParams()
    if (params?.de) qs.set('de', params.de)
    if (params?.ate) qs.set('ate', params.ate)
    const s = qs.toString()
    return req<{ entradas: EntradaDetalhe[] }>(`/entradas${s ? `?${s}` : ''}`)
  },
  criar: (dados: NovaEntrada) =>
    req<{ entrada: EntradaDetalhe }>('/entradas', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),
  lote: (entradas: NovaEntrada[], meta?: MetaImport) =>
    req<{ criadas: number; pacientes_novos: number }>('/entradas/lote', {
      method: 'POST',
      body: JSON.stringify({ entradas, ...meta }),
    }),
  verificarImportacao: (arquivo_nome: string, conteudo_hash: string, linhas: LinhaImport[]) =>
    req<VerificacaoImport>('/entradas/verificar-importacao', {
      method: 'POST',
      body: JSON.stringify({ arquivo_nome, conteudo_hash, linhas }),
    }),
  editar: (id: number, dados: EditarEntrada, senha: string) =>
    req<{ entrada: EntradaDetalhe }>(`/entradas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...dados, senha }),
    }),
  // Só nas primeiras 24h do registro — a janela é conferida no servidor.
  excluir: (id: number, senha: string) =>
    req<{ ok: boolean }>(`/entradas/${id}`, { method: 'DELETE', body: JSON.stringify({ senha }) }),
}
export interface EditarEntrada {
  data?: string
  forma?: Forma
  valor_centavos?: number
  banco_id?: number | null
  tipo_id?: number | null
  subtipo_id?: number | null
  observacao?: string
}

// ---- Tipos de entrada (lista plana, gerenciada no Admin) ----------
export interface TipoEntrada {
  id: number
  nome: string
  ativo: boolean
}
export const tiposEntradaApi = {
  listar: () => req<{ tipos: TipoEntrada[] }>('/tipos-entrada'),
  criar: (nome: string) =>
    req<{ tipo: TipoEntrada }>('/tipos-entrada', { method: 'POST', body: JSON.stringify({ nome }) }),
  atualizar: (id: number, dados: Partial<{ nome: string; ativo: boolean }>) =>
    req<{ tipo: TipoEntrada }>(`/tipos-entrada/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (id: number) => req<{ ok: boolean }>(`/tipos-entrada/${id}`, { method: 'DELETE' }),
}

// ---- Subtipos (subcategorias) de um tipo de entrada ---------------
// Cada subtipo é um profissional (usuario_id) OU um nome próprio (nome).
export interface SubtipoEntrada {
  id: number
  tipo_id: number
  profissional_id: number | null
  nome: string | null
  profissional_nome: string | null
  rotulo: string
  ativo: boolean
}
export const subtiposEntradaApi = {
  listar: (tipoId?: number) =>
    req<{ subtipos: SubtipoEntrada[] }>(`/subtipos-entrada${tipoId ? `?tipo_id=${tipoId}` : ''}`),
  criar: (dados: { tipo_id: number; profissional_id?: number; nome?: string }) =>
    req<{ subtipo: SubtipoEntrada }>('/subtipos-entrada', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: Partial<{ nome: string; ativo: boolean }>) =>
    req<{ subtipo: SubtipoEntrada }>(`/subtipos-entrada/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (id: number) => req<{ ok: boolean }>(`/subtipos-entrada/${id}`, { method: 'DELETE' }),
}

// ---- Saídas -------------------------------------------------------
// Saída não aceita crédito.
export type FormaSaida = 'pix' | 'debito' | 'especie'

export interface SaidaDetalhe {
  id: number
  data: string
  forma: FormaSaida
  valor_centavos: number
  banco_id: number | null
  categoria_id: number | null
  subcategoria_id: number | null
  categoria_nome: string | null
  subcategoria_nome: string | null
  banco_nome: string | null
  observacao: string | null
  operador_nome: string
  /** Quando foi REGISTRADO (não a data do movimento) — define a janela
      de 24h em que ainda dá para excluir. */
  criado_em: string
  /** Quantos recibos esta saída tem. */
  qtd_anexos: number
}
export interface NovaSaida {
  forma: FormaSaida
  valor_centavos: number
  data?: string
  banco_id?: number | null
  categoria_id: number
  subcategoria_id?: number | null
  observacao?: string
  /** Pagamento de profissional: recorte usado no cálculo (grava o histórico). */
  periodo_de?: string
  periodo_ate?: string
}
export interface EditarSaida {
  data?: string
  forma?: FormaSaida
  valor_centavos?: number
  banco_id?: number | null
  categoria_id?: number
  subcategoria_id?: number | null
  observacao?: string
}
export const saidasApi = {
  listar: (params?: { de?: string; ate?: string }) => {
    const qs = new URLSearchParams()
    if (params?.de) qs.set('de', params.de)
    if (params?.ate) qs.set('ate', params.ate)
    const q = qs.toString()
    return req<{ saidas: SaidaDetalhe[] }>(`/saidas${q ? `?${q}` : ''}`)
  },
  criar: (dados: NovaSaida) =>
    req<{ saida: SaidaDetalhe }>('/saidas', { method: 'POST', body: JSON.stringify(dados) }),
  editar: (id: number, dados: EditarSaida, senha: string) =>
    req<{ saida: SaidaDetalhe }>(`/saidas/${id}`, { method: 'PATCH', body: JSON.stringify({ ...dados, senha }) }),
  // Só nas primeiras 24h do registro — a janela é conferida no servidor.
  // Se for pagamento de profissional, o registro do pagamento vai junto.
  excluir: (id: number, senha: string) =>
    req<{ ok: boolean }>(`/saidas/${id}`, { method: 'DELETE', body: JSON.stringify({ senha }) }),

  // ---- Anexos (recibo: foto ou PDF) ----
  // O upload NÃO passa pelo req<>: aquele helper força Content-Type JSON,
  // e multipart precisa que o navegador monte o boundary sozinho.
  anexar: async (saidaId: number, arquivos: File[]): Promise<{ anexos: AnexoInfo[] }> => {
    const fd = new FormData()
    for (const f of arquivos) fd.append('arquivos', f)
    const res = await fetch(`/api/saidas/${saidaId}/anexos`, {
      method: 'POST',
      credentials: 'include',
      body: fd, // sem headers: o boundary é do navegador
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new ApiError(
        (data && typeof data === 'object' && 'erro' in data ? String(data.erro) : null) ??
          'Não foi possível enviar o arquivo.',
        res.status,
      )
    }
    return data as { anexos: AnexoInfo[] }
  },
  anexos: (saidaId: number) => req<{ anexos: AnexoInfo[] }>(`/saidas/${saidaId}/anexos`),
  excluirAnexo: (anexoId: number, senha: string) =>
    req<{ ok: boolean }>(`/saidas/anexos/${anexoId}`, {
      method: 'DELETE',
      body: JSON.stringify({ senha }),
    }),
}

/** Anexo de uma saída. Os bytes nunca vêm aqui — saem pela URL abaixo. */
export interface AnexoInfo {
  id: number
  saida_id: number
  nome: string
  mime: 'image/webp' | 'application/pdf'
  tamanho_bytes: number
  criado_em: string
}
/** URL dos bytes. Rota autenticada pelo cookie — não é pasta pública. */
export const urlAnexo = (anexoId: number) => `/api/saidas/anexos/${anexoId}/arquivo`

// ---- Saldos por local (caixa + bancos) ---------------------------
export interface SaldoLocal {
  banco_id: number | null // null = caixa (espécie)
  nome: string
  saldo_centavos: number
  inicial_centavos: number
}
export const saldosApi = {
  obter: () => req<{ saldos: SaldoLocal[]; total_centavos: number }>('/saldos'),
  definirInicial: (banco_id: number | null, valor_centavos: number, senha: string) =>
    req<{ ok: boolean }>('/saldos/inicial', {
      method: 'PUT',
      body: JSON.stringify({ banco_id, valor_centavos, senha }),
    }),
}

// ---- Auditoria (registros / logs legíveis) -----------------------
export interface RegistroAuditoria {
  id: number
  acao: string
  entidade: string | null
  entidade_id: string | null
  dados: Record<string, unknown> | null
  usuario_nome: string | null
  criado_em: string
}
export const auditoriaApi = {
  listar: (limit = 300) => req<{ registros: RegistroAuditoria[] }>(`/auditoria?limit=${limit}`),
}

// ---- Transferências (movimentação entre caixa e bancos) ----------
export interface TransferenciaDetalhe {
  id: number
  data: string
  valor_centavos: number
  origem_banco_id: number | null
  destino_banco_id: number | null
  origem_nome: string | null // null = caixa (espécie)
  destino_nome: string | null
  observacao: string | null
  operador_nome: string
}
export interface NovaTransferencia {
  valor_centavos: number
  data?: string
  origem_banco_id?: number | null // null/ausente = caixa (espécie)
  destino_banco_id?: number | null
  observacao?: string
}
export const transferenciasApi = {
  listar: () => req<{ transferencias: TransferenciaDetalhe[] }>('/transferencias'),
  criar: (dados: NovaTransferencia) =>
    req<{ transferencia: TransferenciaDetalhe }>('/transferencias', { method: 'POST', body: JSON.stringify(dados) }),
  excluir: (id: number) => req<{ ok: boolean }>(`/transferencias/${id}`, { method: 'DELETE' }),
}

// ---- Categorias de saída (árvore central > categoria > subcategoria) ----
export type NivelCategoriaSaida = 'central' | 'categoria' | 'subcategoria'
export interface CategoriaSaida {
  id: number
  nome: string | null
  parent_id: number | null
  nivel: NivelCategoriaSaida
  profissional_id: number | null
  profissional_nome: string | null
  rotulo: string
  ativo: boolean
}
export interface NovaCategoriaSaida {
  nome?: string | null
  nivel: NivelCategoriaSaida
  parent_id?: number | null
  profissional_id?: number | null
}
export const categoriasSaidaApi = {
  listar: () => req<{ categorias: CategoriaSaida[] }>('/categorias-saida'),
  criar: (dados: NovaCategoriaSaida) =>
    req<{ categoria: CategoriaSaida }>('/categorias-saida', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: Partial<{ nome: string; ativo: boolean }>) =>
    req<{ categoria: CategoriaSaida }>(`/categorias-saida/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (id: number) => req<{ ok: boolean }>(`/categorias-saida/${id}`, { method: 'DELETE' }),
}

// ---- Balanço ------------------------------------------------------
export interface ResumoForma {
  forma: Forma
  entradas_bruto_centavos: number
  entradas_liquido_centavos: number
  qtd_entradas: number
  saidas_centavos: number
  qtd_saidas: number
  /** A taxa quando TODAS as entradas do grupo têm a mesma; null quando há
      mais de uma — aí a % seria média e não existe em entrada nenhuma. */
  taxa_bp_unica: number | null
}
export interface BalancoTotal {
  entradas_bruto_centavos: number
  entradas_liquido_centavos: number
  qtd_entradas: number
  saidas_centavos: number
  qtd_saidas: number
}
export interface ResumoTipoEntrada {
  tipo_id: number | null
  tipo_nome: string | null
  bruto_centavos: number
  liquido_centavos: number
  qtd: number
  /** A taxa quando todas as entradas do tipo têm a mesma; senão null. */
  taxa_bp_unica: number | null
}
export interface ResumoCategoriaSaida {
  categoria_id: number | null
  categoria_nome: string | null
  total_centavos: number
  qtd: number
}
export interface MovimentoBalanco {
  kind: 'entrada' | 'saida' | 'transferencia'
  id: number
  data: string
  forma: Forma | null
  valor_centavos: number
  liquido_centavos: number | null
  rotulo: string | null
  detalhe: string | null
  paciente_nome: string | null
  grupo_id: number | null
  origem_id: number | null
  destino_id: number | null
  /** Saída que é pagamento por %: a conta congelada. Null nos demais. */
  pg_percentual_bp: number | null
  pg_bruto_centavos: number | null
  pg_taxa_centavos: number | null
  pg_periodo_de: string | null
  pg_periodo_ate: string | null
}
export interface ResumoTransferencia {
  origem_id: number | null
  origem_nome: string
  destino_id: number | null
  destino_nome: string
  qtd: number
  total_centavos: number
}
export interface Balanco {
  de: string
  ate: string
  por_forma: ResumoForma[]
  por_tipo_entrada: ResumoTipoEntrada[]
  por_categoria_saida: ResumoCategoriaSaida[]
  transferencias: ResumoTransferencia[]
  movimentos: MovimentoBalanco[]
  total: BalancoTotal
}
export const balancoApi = {
  obter: (de: string, ate: string) =>
    req<{ balanco: Balanco }>(`/balanco?de=${de}&ate=${ate}`),
}

// ---- Profissionais (ficha de RH, sem login) -----------------------
/** Vale, auxílio ou benefício — lista única de nome + valor fixo. */
export interface ValeProfissional {
  id: number
  profissional_id: number
  nome: string
  valor_centavos: number
}
export interface Profissional {
  id: number
  nome: string
  cpf: string | null
  /** Texto livre (ex.: psiquiatra). Substituiu a lista de categorias. */
  profissao: string | null
  /** Vazio quando a remuneração é por % das entradas. */
  salario_centavos: number | null
  percentual_bp: number | null
  endereco: string | null
  ativo: boolean
  /** Vales, auxílios e benefícios (lista única). */
  vales: ValeProfissional[]
}
/** Item da lista de vales/auxílios/benefícios: nome + valor fixo.
    Não é obrigatório — a ficha pode ser cadastrada sem nenhum. */
export interface ItemFixo {
  nome: string
  valor_centavos: number
}
export interface NovoProfissional {
  nome: string
  cpf?: string | null
  profissao?: string | null
  salario_centavos?: number | null
  percentual_bp?: number | null
  endereco?: string | null
  /** Criados junto com a ficha. Na edição, substituem a lista atual. */
  vales?: ItemFixo[]
}
/** Um salário recebido — a base fica congelada no momento do pagamento. */
export interface PagamentoProfissional {
  id: number
  profissional_id: number
  saida_id: number | null
  data: string
  valor_centavos: number
  percentual_bp: number | null
  base_bruto_centavos: number | null
  taxa_centavos: number | null
  periodo_de: string | null
  periodo_ate: string | null
}
export const profissionaisApi = {
  listar: () => req<{ profissionais: Profissional[] }>('/profissionais'),
  pagamentos: (id: number) => req<{ pagamentos: PagamentoProfissional[] }>(`/profissionais/${id}/pagamentos`),
  criar: (dados: NovoProfissional) =>
    req<{ profissional: Profissional }>('/profissionais', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: Partial<NovoProfissional & { ativo: boolean }>) =>
    req<{ profissional: Profissional }>(`/profissionais/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (id: number) => req<{ ok: boolean }>(`/profissionais/${id}`, { method: 'DELETE' }),
  criarVale: (dados: { profissional_id: number; nome: string; valor_centavos: number }) =>
    req<{ vale: ValeProfissional }>('/profissionais/vales', { method: 'POST', body: JSON.stringify(dados) }),
  excluirVale: (id: number) => req<{ ok: boolean }>(`/profissionais/vales/${id}`, { method: 'DELETE' }),
  /** Base do pagamento: % da ficha × líquido das entradas dele no período. */
  base: (profissional_id: number, de: string, ate: string) =>
    req<{ base: BaseSalario }>(`/profissionais/base?profissional_id=${profissional_id}&de=${de}&ate=${ate}`),
}

// ---- Base do pagamento (% das entradas do profissional) -----------
// A % mora na ficha (profissionais.percentual_bp).
/** A conta do pagamento por porcentagem. A % incide sobre o BRUTO; o que
    sobra cobre a taxa da máquina e o resto fica com a clínica. */
export interface BaseSalario {
  profissional_id: number
  profissional_nome: string
  de: string
  ate: string
  qtd_entradas: number
  /** Soma cheia das entradas do período — a base do cálculo. */
  entradas_bruto_centavos: number
  /** Taxa das máquinas no período. */
  taxa_centavos: number
  percentual_bp: number
  /** bruto × percentual — o que o profissional leva. */
  valor_centavos: number
  /** bruto − valor − taxa — o que fica na clínica. */
  clinica_centavos: number
}

// ---- Usuários (administração) -------------------------------------
export type Perfil = 'gestor' | 'operador' | 'profissional'

export interface UsuarioAdmin {
  id: number
  login: string
  /** Vem da ficha quando há vínculo; senão, o nome digitado. */
  nome: string
  perfil: Perfil
  permissoes: string[]
  ativo: boolean
  ultimo_acesso: string | null
  criado_em: string
  /** Ficha do Registro de profissional vinculada a este login. */
  profissional_id: number | null
}
export interface NovoUsuario {
  login: string
  nome: string
  perfil: Perfil
  /** Vincula à ficha — o nome passa a sair dela. */
  profissional_id?: number | null
  permissoes?: string[]
  senha: string
}
export const usuariosApi = {
  listar: () => req<{ usuarios: UsuarioAdmin[] }>('/usuarios'),
  criar: (dados: NovoUsuario) =>
    req<{ usuario: UsuarioAdmin }>('/usuarios', { method: 'POST', body: JSON.stringify(dados) }),
  // profissional_id: null desvincula da ficha.
  atualizar: (
    id: number,
    dados: Partial<{ nome: string; perfil: Perfil; profissional_id: number | null; permissoes: string[]; ativo: boolean }>,
  ) =>
    req<{ usuario: UsuarioAdmin }>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  senha: (id: number, senha: string) =>
    req<{ ok: boolean }>(`/usuarios/${id}/senha`, { method: 'PATCH', body: JSON.stringify({ senha }) }),
  desativar: (id: number) => req<{ ok: boolean }>(`/usuarios/${id}`, { method: 'DELETE' }),
}
