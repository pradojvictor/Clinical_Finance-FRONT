import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import styles from './Navbar.module.css'

interface NavbarProps {
  /** Modo landing: header fixo e transparente, cor adaptável (branco/marinho). */
  landing?: boolean
  /** No modo landing: 'light' = conteúdo branco (sobre fundo escuro); 'dark' = marinho. */
  tone?: 'light' | 'dark'
}

/** Navbar do site da clínica. Não tem login: o sistema é interno, fica na
    rede da clínica, e a equipe chega nele por favorito (/login). Um botão
    aqui daria "não foi possível acessar" para o visitante — que leria isso
    como site quebrado. */
export default function Navbar({ landing = false, tone = 'dark' }: NavbarProps) {
  return (
    <header
      className={`${styles.nav} ${landing ? styles.navLanding : ''}`}
      data-tone={landing ? tone : undefined}
    >
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Clinleste — página inicial">
          {landing ? (
            <span className={styles.wordmark}>Clinleste</span>
          ) : (
            <img src={logo} alt="Clinleste" className={styles.logo} />
          )}
        </Link>
      </div>
    </header>
  )
}
