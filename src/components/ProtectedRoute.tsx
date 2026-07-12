import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Splash from './Splash'

/** Só deixa passar STAFF com sessão; sem sessão → /login; cliente → sua área. */
export default function ProtectedRoute() {
  const { user, carregando } = useAuth()
  if (carregando) return <Splash texto="Verificando sessão…" />
  if (!user) return <Navigate to="/login" replace />
  if (user.perfil === 'cliente') return <Navigate to="/minha-conta" replace />
  return <Outlet />
}
