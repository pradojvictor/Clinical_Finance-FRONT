import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Icon from '../components/ui/Icon'
import { ApiError, clientesApi } from '../lib/api'
import s from './Cadastro.module.css'

/** Dígitos do CPF formatados: 000.000.000-00 (mostra parcial enquanto digita). */
function formatCpf(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, e) =>
    [a, b, c].filter(Boolean).join('.') + (e ? `-${e}` : ''),
  )
}

const hojeISO = () => new Date().toISOString().slice(0, 10)

export default function Cadastro() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)

    const cpfDigitos = cpf.replace(/\D/g, '')
    if (cpfDigitos && cpfDigitos.length !== 11) return setErro('O CPF deve ter 11 dígitos.')
    if (!nascimento) return setErro('Informe a data de nascimento.')
    if (senha.length < 8) return setErro('A senha deve ter ao menos 8 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não coincidem.')

    setEnviando(true)
    try {
      await clientesApi.registro({
        nome: nome.trim(),
        email: email.trim(),
        data_nascimento: nascimento,
        senha,
        ...(cpfDigitos ? { cpf: cpfDigitos } : {}),
      })
      setOk(true)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.')
      setEnviando(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className={s.main}>
        {ok ? (
          <div className={s.card}>
            <div className={s.sucesso}>
              <span className={s.check}>✓</span>
              <h1 className={s.title}>Conta criada!</h1>
              <p className={s.sucessoTxt}>
                O acesso à sua área de cliente chega em breve. Guarde seu e-mail e senha.
              </p>
              <button type="button" className={s.submit} onClick={() => navigate('/')}>
                Voltar ao início
              </button>
            </div>
          </div>
        ) : (
          <form className={s.card} onSubmit={onSubmit} noValidate>
            <h1 className={s.title}>Criar conta</h1>
            <p className={s.subtitle}>Preencha seus dados para se cadastrar.</p>

            {erro && (
              <div className={s.erro} role="alert">
                {erro}
              </div>
            )}

            <label className={s.field}>
              <span className={s.labelTxt}>Nome completo</span>
              <input
                className={s.input}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
                autoFocus
                required
                placeholder="seu nome"
              />
            </label>

            <label className={s.field}>
              <span className={s.labelTxt}>
                CPF <span className={s.opcional}>(opcional)</span>
              </span>
              <input
                className={s.input}
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                inputMode="numeric"
                placeholder="000.000.000-00"
              />
            </label>

            <label className={s.field}>
              <span className={s.labelTxt}>E-mail</span>
              <input
                className={s.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="voce@email.com"
              />
            </label>

            <label className={s.field}>
              <span className={s.labelTxt}>Data de nascimento</span>
              <input
                className={s.input}
                type="date"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
                max={hojeISO()}
                min="1900-01-01"
                required
              />
            </label>

            <label className={s.field}>
              <span className={s.labelTxt}>Senha</span>
              <div className={s.senhaWrap}>
                <input
                  className={s.input}
                  type={ver ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="mínimo 8 caracteres"
                />
                <button
                  type="button"
                  className={s.toggle}
                  onClick={() => setVer((v) => !v)}
                  aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Icon name={ver ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </label>

            <label className={s.field}>
              <span className={s.labelTxt}>Confirmar senha</span>
              <input
                className={s.input}
                type={ver ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="repita a senha"
              />
            </label>

            <button type="submit" className={s.submit} disabled={enviando}>
              {enviando ? 'Criando…' : 'Criar conta'}
            </button>

            <p className={s.footer}>
              Já tem conta?{' '}
              <Link to="/" className={s.link}>
                Voltar ao início
              </Link>
            </p>
          </form>
        )}
      </main>
    </>
  )
}
