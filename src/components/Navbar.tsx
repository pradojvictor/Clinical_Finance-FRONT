import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import Icon from './ui/Icon'
import AuthModal from './AuthModal'
import styles from './Navbar.module.css'

/** Navbar do site público. O botão abre o modal de login/cadastro
    (serve tanto para clientes quanto para funcionários). */
export default function Navbar() {
  const [aberto, setAberto] = useState(false)

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Clinleste — página inicial">
          <img src={logo} alt="Clinleste" className={styles.logo} />
        </Link>

        <button type="button" className={styles.entrar} onClick={() => setAberto(true)}>
          <Icon name="user" size={18} />
          <span>Entrar / Cadastrar</span>
        </button>
      </div>

      <AuthModal aberto={aberto} onClose={() => setAberto(false)} />
    </header>
  )
}
