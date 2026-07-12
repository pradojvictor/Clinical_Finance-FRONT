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

/** Perfil do principal logado: staff (gestor/operador) ou cliente do site. */
export type PerfilUsuario = Role | 'cliente'

export interface Usuario {
  login: string
  nome: string
  perfil: PerfilUsuario
  email?: string
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

// Site público — registro de cliente (login do cliente vem depois).
export interface NovoCliente {
  nome: string
  email: string
  senha: string
  data_nascimento: string
  cpf?: string
}
export interface ClienteDados {
  nome: string
  cpf: string | null
  email: string
  data_nascimento: string | null
}
export interface ClienteLista {
  id: number
  nome: string
  cpf: string | null
  email: string
  data_nascimento: string | null
  criado_em: string
}
export const clientesApi = {
  registro: (dados: NovoCliente) =>
    req<{ ok: boolean }>('/clientes/registro', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),
  // Cadastro do cliente pelo operador (dentro do sistema).
  criar: (dados: NovoCliente) =>
    req<{ cliente: { id: number; nome: string; email: string } }>('/clientes', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),
  // Lista de clientes cadastrados (staff), com busca opcional.
  listar: (q?: string) =>
    req<{ clientes: ClienteLista[] }>(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  eu: () => req<{ cliente: ClienteDados }>('/clientes/eu'),
  atendimentos: () =>
    req<{ atendimentos: AtendimentoCliente[]; total_centavos: number; tem_cpf: boolean }>('/clientes/atendimentos'),
}
export interface AtendimentoCliente {
  id: number
  data: string
  forma: Forma
  valor_centavos: number
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
  paciente_nome: string | null
  banco_nome: string | null
  operador_nome: string
  observacao: string | null
}

export interface NovaEntrada {
  forma: Forma
  valor_centavos: number
  data?: string
  banco_id?: number | null
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
}
export interface EditarEntrada {
  data?: string
  forma?: Forma
  valor_centavos?: number
  banco_id?: number | null
  observacao?: string
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
}
export interface NovaSaida {
  forma: FormaSaida
  valor_centavos: number
  data?: string
  banco_id?: number | null
  categoria_id: number
  subcategoria_id?: number | null
  observacao?: string
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
}

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
  nome: string
  parent_id: number | null
  nivel: NivelCategoriaSaida
  ativo: boolean
}
export interface NovaCategoriaSaida {
  nome: string
  nivel: NivelCategoriaSaida
  parent_id?: number | null
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
}
export interface BalancoTotal {
  entradas_bruto_centavos: number
  entradas_liquido_centavos: number
  qtd_entradas: number
  saidas_centavos: number
  qtd_saidas: number
}
export interface Balanco {
  de: string
  ate: string
  por_forma: ResumoForma[]
  total: BalancoTotal
}
export const balancoApi = {
  obter: (de: string, ate: string) =>
    req<{ balanco: Balanco }>(`/balanco?de=${de}&ate=${ate}`),
}

// ---- Usuários (administração) -------------------------------------
export type Perfil = 'gestor' | 'operador'

export interface UsuarioAdmin {
  id: number
  login: string
  nome: string
  perfil: Perfil
  ativo: boolean
  ultimo_acesso: string | null
  criado_em: string
}
export interface NovoUsuario {
  login: string
  nome: string
  perfil: Perfil
  senha: string
}
export const usuariosApi = {
  listar: () => req<{ usuarios: UsuarioAdmin[] }>('/usuarios'),
  criar: (dados: NovoUsuario) =>
    req<{ usuario: UsuarioAdmin }>('/usuarios', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: Partial<{ nome: string; perfil: Perfil; ativo: boolean }>) =>
    req<{ usuario: UsuarioAdmin }>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  senha: (id: number, senha: string) =>
    req<{ ok: boolean }>(`/usuarios/${id}/senha`, { method: 'PATCH', body: JSON.stringify({ senha }) }),
  desativar: (id: number) => req<{ ok: boolean }>(`/usuarios/${id}`, { method: 'DELETE' }),
}
