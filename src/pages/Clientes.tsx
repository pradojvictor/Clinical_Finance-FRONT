import { useEffect, useState, type FormEvent } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import { ApiError, clientesApi, type ClienteLista } from '../lib/api'
import s from './page.module.css'
import c from './Clientes.module.css'

function formatCpf(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, e, f) =>
    [a, b, e].filter(Boolean).join('.') + (f ? `-${f}` : ''),
  )
}
const cpfBR = (cpf: string | null) => (cpf ? formatCpf(cpf) : '—')
const dataBR = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—')
const hojeISO = () => new Date().toISOString().slice(0, 10)
const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')

type Aba = 'novo' | 'lista'

export default function Clientes() {
  const [aba, setAba] = useState<Aba>('novo')
  return (
    <div className={s.stack}>
      <div className={c.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={aba === 'novo'}
          className={`${c.tab} ${aba === 'novo' ? c.tabAtiva : ''}`}
          onClick={() => setAba('novo')}
        >
          Cadastrar
        </button>
        <button
          role="tab"
          aria-selected={aba === 'lista'}
          className={`${c.tab} ${aba === 'lista' ? c.tabAtiva : ''}`}
          onClick={() => setAba('lista')}
        >
          Cadastrados
        </button>
      </div>

      {aba === 'novo' ? <FormCadastro /> : <ListaClientes />}
    </div>
  )
}

/* ---- Aba: cadastrar ---------------------------------------------- */
const vazio = { nome: '', cpf: '', email: '', nascimento: '', senha: '', confirmar: '' }

function FormCadastro() {
  const [f, setF] = useState({ ...vazio })
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const set = (patch: Partial<typeof vazio>) => setF((cur) => ({ ...cur, ...patch }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setOk(null)

    const cpfDigitos = f.cpf.replace(/\D/g, '')
    if (f.nome.trim().length < 2) return setErro('Informe o nome completo.')
    if (cpfDigitos && cpfDigitos.length !== 11) return setErro('O CPF deve ter 11 dígitos.')
    if (!f.nascimento) return setErro('Informe a data de nascimento.')
    if (f.senha.length < 8) return setErro('A senha deve ter ao menos 8 caracteres.')
    if (f.senha !== f.confirmar) return setErro('As senhas não coincidem.')

    setEnviando(true)
    try {
      const r = await clientesApi.criar({
        nome: f.nome.trim(),
        email: f.email.trim(),
        data_nascimento: f.nascimento,
        senha: f.senha,
        ...(cpfDigitos ? { cpf: cpfDigitos } : {}),
      })
      setOk(`Cliente “${r.cliente.nome}” cadastrado com sucesso.`)
      setF({ ...vazio })
    } catch (x) {
      setErro(msg(x))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card
      title="Cadastrar cliente"
      action={<span className={c.hint}>Cadastro presencial pelo operador</span>}
    >
      <form className={c.form} onSubmit={onSubmit} noValidate>
        {erro && <div className={c.erro} role="alert">{erro}</div>}
        {ok && <div className={c.ok} role="status">{ok}</div>}

        <label className={c.field}>
          <span className={c.label}>Nome completo</span>
          <input
            className={c.input}
            value={f.nome}
            onChange={(e) => set({ nome: e.target.value })}
            autoComplete="off"
            placeholder="nome do cliente"
            autoFocus
          />
        </label>

        <div className={c.row2}>
          <label className={c.field}>
            <span className={c.label}>CPF <span className={c.opcional}>(opcional)</span></span>
            <input
              className={c.input}
              value={f.cpf}
              onChange={(e) => set({ cpf: formatCpf(e.target.value) })}
              inputMode="numeric"
              placeholder="000.000.000-00"
            />
          </label>
          <label className={c.field}>
            <span className={c.label}>Data de nascimento</span>
            <input
              className={c.input}
              type="date"
              value={f.nascimento}
              onChange={(e) => set({ nascimento: e.target.value })}
              max={hojeISO()}
              min="1900-01-01"
            />
          </label>
        </div>

        <label className={c.field}>
          <span className={c.label}>E-mail</span>
          <input
            className={c.input}
            type="email"
            value={f.email}
            onChange={(e) => set({ email: e.target.value })}
            autoComplete="off"
            placeholder="cliente@email.com"
          />
        </label>

        <div className={c.row2}>
          <label className={c.field}>
            <span className={c.label}>Senha inicial</span>
            <div className={c.senhaWrap}>
              <input
                className={c.input}
                type={ver ? 'text' : 'password'}
                value={f.senha}
                onChange={(e) => set({ senha: e.target.value })}
                autoComplete="new-password"
                placeholder="mínimo 8 caracteres"
              />
              <button
                type="button"
                className={c.olho}
                onClick={() => setVer((v) => !v)}
                aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Icon name={ver ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </label>
          <label className={c.field}>
            <span className={c.label}>Confirmar senha</span>
            <input
              className={c.input}
              type={ver ? 'text' : 'password'}
              value={f.confirmar}
              onChange={(e) => set({ confirmar: e.target.value })}
              autoComplete="new-password"
              placeholder="repita a senha"
            />
          </label>
        </div>

        <div className={c.acoes}>
          <span className={c.nota}>O cliente pode trocar a senha depois.</span>
          <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={enviando}>
            <Icon name="user" size={18} /> {enviando ? 'Cadastrando…' : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </Card>
  )
}

/* ---- Aba: cadastrados (lista) ------------------------------------ */
const COLUNAS = ['Nome', 'CPF', 'E-mail', 'Nascimento', 'Cadastrado em']

function ListaClientes() {
  const [clientes, setClientes] = useState<ClienteLista[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    let vivo = true
    const t = setTimeout(() => {
      clientesApi
        .listar(busca.trim() || undefined)
        .then((r) => vivo && setClientes(r.clientes))
        .catch((x) => vivo && setErro(msg(x)))
    }, 250)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [busca])

  return (
    <>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <input
            className={s.input}
            type="search"
            placeholder="Buscar por nome, e-mail ou CPF…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <Card
        title="Clientes cadastrados"
        action={<Badge tone="neutral">{clientes?.length ?? 0} {clientes?.length === 1 ? 'cliente' : 'clientes'}</Badge>}
      >
        {erro && <div className={c.erro}>{erro}</div>}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>{COLUNAS.map((col) => <th key={col}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {clientes === null ? (
                <tr><td colSpan={COLUNAS.length}><div className={c.carregando}>Carregando…</div></td></tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</span>
                      <span className={s.emptyText}>{busca ? 'Ajuste a busca.' : 'Cadastre na aba “Cadastrar”.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                clientes.map((cl) => (
                  <tr key={cl.id}>
                    <td>{cl.nome}</td>
                    <td>{cpfBR(cl.cpf)}</td>
                    <td>{cl.email}</td>
                    <td>{dataBR(cl.data_nascimento)}</td>
                    <td>{dataBR(cl.criado_em)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
