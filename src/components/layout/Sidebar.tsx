import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo.jpeg'
import Icon from '../ui/Icon'
import { NAV_ITEMS } from '../../config/nav'
import { useAuth } from '../../lib/auth'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const { user, sair } = useAuth()
  const [aberto, setAberto] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)

  // Só mostra as páginas permitidas ao perfil do usuário.
  // Profissional: só leitura; Início sempre + as seções liberadas pelo gestor.
  const itens = NAV_ITEMS.filter((item) => {
    if (user === null) return false
    if (user.perfil === 'profissional') {
      return item.to === '/sistema' || (item.secao != null && (user.permissoes ?? []).includes(item.secao))
    }
    return item.roles.includes(user.perfil)
  })

  // Clicar fora do trilho recolhe o menu.
  useEffect(() => {
    if (!aberto) return
    const onDown = (e: MouseEvent) => {
      if (railRef.current && !railRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [aberto])

  const handleSair = () => {
    // Encerra a sessão no backend; a ProtectedRoute redireciona p/ /login.
    void sair()
  }

  return (
    <aside className={styles.sidebar}>
      <div ref={railRef} className={`${styles.rail} ${aberto ? styles.railOpen : ''}`}>
        {/* Marca */}
        <div className={styles.brand}>
          <span className={styles.logoTile}>
            <img src={logo} alt="Clinleste" className={styles.logo} />
          </span>
          <span className={styles.brandName}>Clinleste</span>
        </div>

        {/* Navegação */}
        <nav className={styles.nav} aria-label="Menu principal">
          <ul>
            {itens.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/sistema'}
                  title={aberto ? undefined : item.label}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.linkActive : ''}`
                  }
                >
                  <span className={styles.linkIcon}>
                    <Icon name={item.icon} size={21} />
                  </span>
                  <span className={styles.linkLabel}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sair */}
        <button
          type="button"
          className={styles.logout}
          onClick={handleSair}
          title={aberto ? undefined : 'Sair'}
          aria-label="Sair"
        >
          <span className={styles.linkIcon}>
            <Icon name="logout" size={20} />
          </span>
          <span className={styles.linkLabel}>Sair</span>
        </button>

        {/* Alcinha — expande/recolhe o menu */}
        <button
          type="button"
          className={styles.handle}
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? 'Recolher menu' : 'Expandir menu'}
          aria-expanded={aberto}
        >
          <Icon name="chevron" size={16} />
        </button>
      </div>
    </aside>
  )
}
