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

export interface Usuario {
  login: string
  nome: string
  perfil: Role
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
export const clientesApi = {
  registro: (nome: string, email: string, senha: string) =>
    req<{ ok: boolean }>('/clientes/registro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    }),
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

export const entradasApi = {
  listar: () => req<{ entradas: EntradaDetalhe[] }>('/entradas'),
  criar: (dados: NovaEntrada) =>
    req<{ entrada: EntradaDetalhe }>('/entradas', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),
  lote: (entradas: NovaEntrada[]) =>
    req<{ criadas: number; pacientes_novos: number }>('/entradas/lote', {
      method: 'POST',
      body: JSON.stringify({ entradas }),
    }),
}
