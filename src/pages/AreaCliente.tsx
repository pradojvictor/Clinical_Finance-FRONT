import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Splash from '../components/Splash'
import { useAuth } from '../lib/auth'
import { ApiError, clientesApi, type ClienteDados } from '../lib/api'
import s from './AreaCliente.module.css'

const formatCpf = (cpf: string | null) =>
  cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'
const dataBR = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '—')
const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Não foi possível carregar seus dados.')

export default function AreaCliente() {
  const { user, carregando } = useAuth()
  const [dados, setDados] = useState<ClienteDados | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (user?.perfil !== 'cliente') return
    clientesApi
      .eu()
      .then((r) => setDados(r.cliente))
      .catch((x) => setErro(msg(x)))
  }, [user])

  if (carregando) return <Splash texto="Verificando sessão…" />
  if (!user) return <Navigate to="/" replace />
  if (user.perfil !== 'cliente') return <Navigate to="/sistema" replace />

  const campos = [
    { rotulo: 'Nome', valor: dados?.nome ?? user.nome },
    { rotulo: 'CPF', valor: dados ? formatCpf(dados.cpf) : '…' },
    { rotulo: 'E-mail', valor: dados?.email ?? user.email ?? '…' },
    { rotulo: 'Data de nascimento', valor: dados ? dataBR(dados.data_nascimento) : '…' },
  ]

  return (
    <>
      <Navbar />
      <main className={s.main}>
        <div className={s.card}>
          <div className={s.head}>
            <span className={s.avatar}>{(dados?.nome ?? user.nome).charAt(0).toUpperCase()}</span>
            <div>
              <h1 className={s.title}>Minha conta</h1>
              <p className={s.subtitle}>Olá, {(dados?.nome ?? user.nome).split(/\s+/)[0]}!</p>
            </div>
          </div>

          {erro && <div className={s.erro}>{erro}</div>}

          <h2 className={s.secTitle}>Meus dados</h2>
          <dl className={s.dl}>
            {campos.map((c) => (
              <div className={s.linha} key={c.rotulo}>
                <dt className={s.dt}>{c.rotulo}</dt>
                <dd className={s.dd}>{c.valor}</dd>
              </div>
            ))}
          </dl>

          <p className={s.nota}>Em breve você poderá acompanhar seus atendimentos e agenda por aqui.</p>
        </div>
      </main>
    </>
  )
}
