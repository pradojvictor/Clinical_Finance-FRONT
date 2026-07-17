import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'
import simbolo from '../assets/logoloading.svg'
import Icon from '../components/ui/Icon'
import Splash from '../components/Splash'
import s from './Login.module.css'

export default function Login() {
  const { user, carregando, entrar } = useAuth()
  const navigate = useNavigate()

  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Enquanto verifica a sessão, evita piscar o formulário.
  if (carregando) return <Splash texto="Verificando sessão…" />
  // Já autenticado? vai direto pro sistema.
  if (user) return <Navigate to="/sistema" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await entrar(login.trim(), senha)
      navigate('/sistema', { replace: true })
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.')
      setEnviando(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        {/* ---- Lado da marca ------------------------------------------
            A animação é só CSS, nas cores da marca — nada para carregar.
            É também o lugar reservado para a arte que você ainda vai
            decidir: entra dentro de .marca, por cima da aurora. */}
        <div className={s.marca}>
          <div className={s.aurora} aria-hidden>
            <span className={s.brilho1} />
            <span className={s.brilho2} />
            <span className={s.brilho3} />
            <span className={s.brilho4} />
            <span className={s.brilho5} />
          </div>

          {/* Símbolo em SVG, não o logo.jpeg: JPEG não tem transparência e
              trazia um retângulo branco para cima do marinho. O selo claro
              existe porque o símbolo tem uma parte em marinho (#191D37),
              que sumiria contra este fundo. O nome vem em texto ao lado —
              mesma saída que a landing usa sobre fundo escuro. */}
          <div className={s.marcaTopo}>
            <span className={s.marcaSelo}>
              <img src={simbolo} alt="" aria-hidden />
            </span>
            <span className={s.marcaNome}>Clinleste</span>
          </div>

          <p className={s.marcaFrase}>
            Cuidado que acolhe,
            <br />
            saúde que transforma.
          </p>
        </div>

        {/* ---- Lado do login ---------------------------------------- */}
        <form className={s.lado} onSubmit={onSubmit} noValidate>
          <div className={s.cabecalho}>
            <h1 className={s.title}>Acesse o balanço</h1>
            <p className={s.subtitle}>Entre com seu usuário e senha.</p>
          </div>

          {erro && (
            <div className={s.erro} role="alert">
              {erro}
            </div>
          )}

          <label className={s.field}>
            <span className={s.labelTxt}>Usuário</span>
            <input
              className={s.input}
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              placeholder="seu usuário"
            />
          </label>

          <label className={s.field}>
            <span className={s.labelTxt}>Senha</span>
            <div className={s.senhaWrap}>
              <input
                className={s.input}
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="sua senha"
              />
              <button
                type="button"
                className={s.toggle}
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Icon name={mostrarSenha ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </label>

          <button type="submit" className={s.submit} disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className={s.footer}>Sistema de balanço financeiro · Clinleste</p>
        </form>
      </div>
    </div>
  )
}
