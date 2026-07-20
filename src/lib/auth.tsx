// =====================================================================
// Contexto de autenticação. Fonte da verdade do usuário logado no front
// (o controle de acesso REAL continua no servidor). Ao montar, verifica
// a sessão via /api/auth/me (cookie httpOnly).
// =====================================================================
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, ApiError, type Usuario } from './api'
import { TEM_SISTEMA } from '../config/alvo'

interface AuthContextValue {
  user: Usuario | null
  carregando: boolean
  entrar: (login: string, senha: string) => Promise<Usuario>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** A sessão só interessa às rotas do SISTEMA. Nas páginas públicas do site
 *  a API nem é chamada — o site precisa funcionar com a API desligada; quem
 *  depende dela é o sistema. O gestor chega em /login ou /sistema por
 *  carregamento completo (favorito/URL), então olhar o pathname no mount
 *  cobre todos os caminhos reais. */
const rotaPrecisaDeSessao = () => {
  const p = window.location.pathname
  return p === '/login' || p === '/sistema' || p.startsWith('/sistema/')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Build só-landing não tem API para perguntar; página pública não
    // pergunta sessão (senão o site quebraria com a API desligada).
    if (!TEM_SISTEMA || !rotaPrecisaDeSessao()) {
      setCarregando(false)
      return
    }
    let vivo = true
    authApi
      .me()
      .then((r) => {
        if (vivo) setUser(r.usuario)
      })
      .catch((e) => {
        // 401 = simplesmente não logado; qualquer outro erro é registrado.
        if (vivo && !(e instanceof ApiError && e.status === 401)) console.error(e)
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const entrar = async (login: string, senha: string): Promise<Usuario> => {
    const r = await authApi.login(login, senha)
    setUser(r.usuario)
    return r.usuario
  }

  const sair = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
