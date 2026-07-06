import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Splash from './Splash'

/** Só deixa passar quem tem sessão; senão manda para /login. */
export default function ProtectedRoute() {
  const { user, carregando } = useAuth()
  if (carregando) return <Splash texto="Verificando sessão…" />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
