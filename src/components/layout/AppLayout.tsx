import { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { metaFor } from '../../config/pages'
import { NAV_ITEMS } from '../../config/nav'
import { useAuth } from '../../lib/auth'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const meta = metaFor(pathname)

  // Profissional (só leitura): só entra no Início e nas seções liberadas.
  if (user?.perfil === 'profissional') {
    const item = NAV_ITEMS.find((i) => i.to === pathname)
    const liberado =
      pathname === '/sistema' ||
      (item?.secao != null && (user.permissoes ?? []).includes(item.secao))
    if (!liberado) return <Navigate to="/sistema" replace />
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <Topbar title={meta.title} subtitle={meta.subtitle} />
      <main className={styles.content}>
        {/* Fallback só na área de conteúdo enquanto o chunk da página carrega */}
        <Suspense fallback={<div className={styles.carregando}>Carregando…</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
