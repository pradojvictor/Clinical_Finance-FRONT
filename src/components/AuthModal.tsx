import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { clientesApi, ApiError } from '../lib/api'
import logo from '../assets/logo.jpeg'
import Icon from './ui/Icon'
import styles from './AuthModal.module.css'

type Aba = 'entrar' | 'criar'

interface AuthModalProps {
  aberto: boolean
  onClose: () => void
}

export default function AuthModal({ aberto, onClose }: AuthModalProps) {
  const [aba, setAba] = useState<Aba>('entrar')

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
        aria-label="Entrar ou criar conta"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.fechar} onClick={onClose} aria-label="Fechar">
          <span aria-hidden="true">×</span>
        </button>

        {/* Coluna do formulário */}
        <div className={styles.formPane}>
          <img src={logo} alt="Clinleste" className={styles.logo} />
          {aba === 'entrar' ? (
            <FormEntrar onClose={onClose} irCriar={() => setAba('criar')} />
          ) : (
            <FormCriar irEntrar={() => setAba('entrar')} />
          )}
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

/* ---- Entrar (funcionário -> /sistema) ----------------------------- */
function FormEntrar({ onClose, irCriar }: { onClose: () => void; irCriar: () => void }) {
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
      await entrar(login.trim(), senha)
      onClose()
      navigate('/sistema')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
      setEnviando(false)
    }
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
        <button type="button" className={styles.trocaLink} onClick={irCriar}>
          Criar conta
        </button>
      </p>
    </div>
  )
}

/* ---- Criar conta (cliente) ---------------------------------------- */
function FormCriar({ irEntrar }: { irEntrar: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (senha.length < 8) {
      setErro('A senha deve ter ao menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    setEnviando(true)
    try {
      await clientesApi.registro(nome.trim(), email.trim(), senha)
      setOk(true)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.')
      setEnviando(false)
    }
  }

  if (ok) {
    return (
      <div className={styles.body}>
        <div className={styles.sucesso}>
          <span className={styles.check}>✓</span>
          <p className={styles.sucessoTitulo}>Conta criada com sucesso!</p>
          <p className={styles.sucessoTexto}>O acesso à sua área de cliente chega em breve.</p>
        </div>
        <p className={styles.troca}>
          <button type="button" className={styles.trocaLink} onClick={irEntrar}>
            Voltar para entrar
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className={styles.body}>
      <h2 className={styles.titulo}>Criar conta</h2>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {erro && <div className={styles.erro} role="alert">{erro}</div>}
        <label className={styles.field}>
          <span className={styles.label}>Nome</span>
          <input
            className={styles.input}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            autoFocus
            required
            placeholder="seu nome"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>E-mail</span>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="voce@email.com"
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
              autoComplete="new-password"
              required
              placeholder="mínimo 8 caracteres"
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
        <label className={styles.field}>
          <span className={styles.label}>Confirmar senha</span>
          <input
            className={styles.input}
            type={ver ? 'text' : 'password'}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="repita a senha"
          />
        </label>
        <div className={styles.acoes}>
          <button type="submit" className={styles.submit} disabled={enviando}>
            {enviando ? 'Criando…' : 'Criar conta'}
          </button>
        </div>
      </form>
      <p className={styles.troca}>
        Já tem conta?{' '}
        <button type="button" className={styles.trocaLink} onClick={irEntrar}>
          Entrar
        </button>
      </p>
    </div>
  )
}
