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
