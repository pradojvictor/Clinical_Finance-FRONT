import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'
import logo from '../assets/logo.jpeg'
import Icon from './ui/Icon'
import styles from './AuthModal.module.css'

interface AuthModalProps {
  aberto: boolean
  onClose: () => void
}

export default function AuthModal({ aberto, onClose }: AuthModalProps) {
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [aberto, onClose])

  if (!aberto) return null

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Entrar"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.fechar} onClick={onClose} aria-label="Fechar">
          <span aria-hidden="true">×</span>
        </button>

        {/* Coluna do formulário */}
        <div className={styles.formPane}>
          <img src={logo} alt="Clinleste" className={styles.logo} />
          <FormEntrar onClose={onClose} />
        </div>

        {/* Coluna da imagem (placeholder — o usuário troca depois) */}
        <div className={styles.imgPane}>
          <div className={styles.imgPlaceholder}>
            <Icon name="image" size={30} />
            <span>sua imagem aqui</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ---- Entrar (funcionário -> /sistema; cliente futuramente) --------- */
function FormEntrar({ onClose }: { onClose: () => void }) {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [recuperar, setRecuperar] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const u = await entrar(login.trim(), senha)
      onClose()
      navigate(u.perfil === 'cliente' ? '/minha-conta' : '/sistema')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
      setEnviando(false)
    }
  }

  const irCadastro = () => {
    onClose()
    navigate('/cadastro')
  }

  return (
    <div className={styles.body}>
      <h2 className={styles.titulo}>Entrar</h2>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {erro && <div className={styles.erro} role="alert">{erro}</div>}
        <label className={styles.field}>
          <span className={styles.label}>Usuário ou e-mail</span>
          <input
            className={styles.input}
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            placeholder="seu acesso"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Senha</span>
          <div className={styles.senhaWrap}>
            <input
              className={styles.input}
              type={ver ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="sua senha"
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setVer((v) => !v)}
              aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Icon name={ver ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
        </label>
        <div className={styles.acoes}>
          <button type="submit" className={styles.submit} disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
          <button type="button" className={styles.link} onClick={() => setRecuperar(true)}>
            Esqueci a senha?
          </button>
        </div>
        {recuperar && <p className={styles.nota}>Recuperação de senha em breve.</p>}
      </form>
      <p className={styles.troca}>
        Não tem conta?{' '}
        <button type="button" className={styles.trocaLink} onClick={irCadastro}>
          Criar conta
        </button>
      </p>
    </div>
  )
}
