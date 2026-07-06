import logo from '../assets/logo.jpeg'
import styles from './Splash.module.css'

/** Tela cheia de carregamento (enquanto verifica a sessão). */
export default function Splash({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className={styles.splash}>
      <div className={styles.inner}>
        <img src={logo} alt="Clinleste" className={styles.logo} />
        <span className={styles.spinner} aria-hidden="true" />
        <span className={styles.text}>{texto}</span>
      </div>
    </div>
  )
}
