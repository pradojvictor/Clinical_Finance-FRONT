import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo.jpeg'
import Icon from '../ui/Icon'
import { NAV_ITEMS } from '../../config/nav'
import { currentUser, ROLE_LABEL, iniciais } from '../../lib/session'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const handleSair = () => {
    // Etapa 2: encerra a sessão no backend e redireciona para /login.
    console.info('[sessão] Sair — será ligado à autenticação na Etapa 2.')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Marca */}
      <div className={styles.brand}>
        <img src={logo} alt="Clinleste" className={styles.logo} />
      </div>

      {/* Navegação */}
      <nav className={styles.nav} aria-label="Menu principal">
        <span className={styles.navLabel}>Menu</span>
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.linkActive : ''}`
                }
              >
                <span className={styles.linkIcon}>
                  <Icon name={item.icon} size={19} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Usuário — informações + sair */}
      <div className={styles.user}>
        <div className={styles.userInfo}>
          <span className={styles.avatar}>{iniciais(currentUser.nome)}</span>
          <span className={styles.userMeta}>
            <span className={styles.userName}>{currentUser.nome}</span>
            <span className={styles.userRole}>{ROLE_LABEL[currentUser.role]}</span>
          </span>
        </div>
        <button type="button" className={styles.logout} onClick={handleSair}>
          <Icon name="logout" size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
