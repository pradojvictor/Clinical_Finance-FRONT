import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { metaFor } from '../../config/pages'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const { pathname } = useLocation()
  const meta = metaFor(pathname)

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
