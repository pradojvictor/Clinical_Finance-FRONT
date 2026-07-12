import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Splash from '../components/Splash'
import { useAuth } from '../lib/auth'
import { ApiError, clientesApi, type AtendimentoCliente, type ClienteDados } from '../lib/api'
import { FORMA_LABEL, brl } from '../lib/format'
import s from './AreaCliente.module.css'

const formatCpf = (cpf: string | null) =>
  cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'
const dataBR = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '—')
const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Não foi possível carregar seus dados.')

export default function AreaCliente() {
  const { user, carregando } = useAuth()
  const [dados, setDados] = useState<ClienteDados | null>(null)
  const [atend, setAtend] = useState<{ lista: AtendimentoCliente[]; total: number; temCpf: boolean } | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (user?.perfil !== 'cliente') return
    clientesApi.eu().then((r) => setDados(r.cliente)).catch((x) => setErro(msg(x)))
    clientesApi
      .atendimentos()
      .then((r) => setAtend({ lista: r.atendimentos, total: r.total_centavos, temCpf: r.tem_cpf }))
      .catch(() => setAtend({ lista: [], total: 0, temCpf: false }))
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
        <div className={s.wrap}>
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
          </div>

          {/* Meus atendimentos */}
          <div className={s.card}>
            <div className={s.secHead}>
              <h2 className={s.secTitle}>Meus atendimentos</h2>
              {atend && atend.lista.length > 0 && (
                <span className={s.totalTag}>Total: <strong>{brl(atend.total)}</strong></span>
              )}
            </div>

            {atend === null ? (
              <p className={s.nota}>Carregando…</p>
            ) : !atend.temCpf ? (
              <p className={s.nota}>Para acompanhar seus atendimentos, informe seu CPF no cadastro (fale com a recepção da clínica).</p>
            ) : atend.lista.length === 0 ? (
              <p className={s.nota}>Ainda não há atendimentos registrados no seu nome.</p>
            ) : (
              <table className={s.tabela}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Forma</th>
                    <th className={s.num}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {atend.lista.map((a) => (
                    <tr key={a.id}>
                      <td>{dataBR(a.data)}</td>
                      <td>{FORMA_LABEL[a.forma]}</td>
                      <td className={s.num}>{brl(a.valor_centavos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
