import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import logo from '../assets/logo.jpeg'
import Icon from './ui/Icon'
import AuthModal from './AuthModal'
import styles from './Navbar.module.css'

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome

interface NavbarProps {
  /** Modo landing: header fixo e transparente, cor adaptável (branco/marinho). */
  landing?: boolean
  /** No modo landing: 'light' = conteúdo branco (sobre fundo escuro); 'dark' = marinho. */
  tone?: 'light' | 'dark'
}

/** Navbar do site público. Deslogado: botão Entrar/Cadastrar (abre o modal).
    Logado (cliente ou staff): botão de usuário com menu (Meus dados / Sair). */
export default function Navbar({ landing = false, tone = 'dark' }: NavbarProps) {
  const { user, sair } = useAuth()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false) // modal de login
  const [menu, setMenu] = useState(false) // dropdown do usuário
  const menuRef = useRef<HTMLDivElement>(null)

  // Clicar fora fecha o menu do usuário.
  useEffect(() => {
    if (!menu) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menu])

  const irDados = () => {
    setMenu(false)
    navigate(user?.perfil === 'cliente' ? '/minha-conta' : '/sistema')
  }
  const onSair = async () => {
    setMenu(false)
    await sair()
    navigate('/')
  }

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

        {user ? (
          <div className={styles.userWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.userBtn}
              onClick={() => setMenu((m) => !m)}
              aria-haspopup="menu"
              aria-expanded={menu}
            >
              <span className={styles.avatar}>
                <Icon name="user" size={18} />
              </span>
              <span className={styles.userNome}>{primeiroNome(user.nome)}</span>
              <Icon name="chevron" size={16} className={menu ? styles.chevAberto : styles.chev} />
            </button>

            {menu && (
              <div className={styles.menu} role="menu">
                <button type="button" className={styles.menuItem} onClick={irDados} role="menuitem">
                  <Icon name="user" size={16} /> Meus dados
                </button>
                <button type="button" className={styles.menuItem} onClick={onSair} role="menuitem">
                  <Icon name="logout" size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className={styles.entrar} onClick={() => setAberto(true)}>
            <Icon name="user" size={18} />
            <span>Entrar / Cadastrar</span>
          </button>
        )}
      </div>

      <AuthModal aberto={aberto} onClose={() => setAberto(false)} />
    </header>
  )
}
