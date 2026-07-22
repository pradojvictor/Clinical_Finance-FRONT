import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import { INSTAGRAM_URL, WHATSAPP_URL } from '../config/contato'
import styles from './Navbar.module.css'

interface NavbarProps {
  /** Modo landing: header fixo e transparente, cor adaptável (branco/marinho). */
  landing?: boolean
  /** No modo landing: 'light' = conteúdo branco (sobre fundo escuro); 'dark' = marinho. */
  tone?: 'light' | 'dark'
}

/** Navbar do site da clínica: marca à esquerda; à direita o link "Sobre"
    e os ícones de WhatsApp e Instagram (URLs em config/contato.ts).
    Não tem login: o sistema é interno, fica na rede da clínica, e a equipe
    chega nele por favorito (/login). Um botão aqui daria "não foi possível
    acessar" para o visitante — que leria isso como site quebrado. */
export default function Navbar({ landing = false, tone = 'dark' }: NavbarProps) {
  return (
    <header
      className={`${styles.nav} ${landing ? styles.navLanding : ''}`}
      data-tone={landing ? tone : undefined}
    >
      <div className={styles.inner}>
        {/* Já na Home, a marca PULA direto pro topo — sem animação de
            subida. Em outra página, navega normalmente para a Home. */}
        <Link
          to="/"
          className={styles.brand}
          aria-label="Clinleste — página inicial"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'instant' })
            }
          }}
        >
          {landing ? (
            <span className={styles.wordmark}>Clinleste</span>
          ) : (
            <img src={logo} alt="Clinleste" className={styles.logo} />
          )}
        </Link>

        <nav className={styles.acoes} aria-label="Sobre e redes da clínica">
          {/* "Sobre" é uma SEÇÃO da Home (#sobre), não uma página: aqui na
              Home PULA direto até ela (sem rolagem animada); em outra
              página, navega para /#sobre (a Home lê o hash ao montar e já
              abre na seção). */}
          <a
            href="/#sobre"
            className={styles.sobreLink}
            onClick={(e) => {
              const alvo = document.getElementById('sobre')
              if (alvo) {
                e.preventDefault()
                alvo.scrollIntoView({ behavior: 'instant' })
              }
            }}
          >
            Sobre
          </a>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconeRede}
            aria-label="WhatsApp da Clinleste"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path
                fill="currentColor"
                d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.25 8.24-8.25m-3.34 4.16c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.39 1 2.56.13.17 1.76 2.67 4.25 3.73 2.06.87 2.48.7 2.93.66.45-.05 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.47-.28-.25-.13-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.17-.28.19-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.55-1.34-.76-1.84-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.47-.01"
              />
            </svg>
          </a>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconeRede}
            aria-label="Instagram da Clinleste"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path
                fill="currentColor"
                d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
              />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  )
}
