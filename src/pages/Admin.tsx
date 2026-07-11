import { useEffect, useState, type FormEvent } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { BadgeTone } from '../components/ui/Badge'
import Placeholder from '../components/ui/Placeholder'
import Icon from '../components/ui/Icon'
import {
  ApiError,
  bancosApi,
  taxasApi,
  type Banco,
  type Forma,
  type Taxa,
} from '../lib/api'
import s from './page.module.css'
import a from './Admin.module.css'

type Aba = 'usuarios' | 'bancos' | 'taxas'

const FORMAS: { forma: Forma; label: string }[] = [
  { forma: 'pix', label: 'Pix' },
  { forma: 'debito', label: 'Débito' },
  { forma: 'credito', label: 'Crédito' },
  { forma: 'especie', label: 'Espécie' },
]

function msg(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Ocorreu um erro.'
}
const fmtPct = (bp: number) => String(bp / 100).replace('.', ',')

export default function Admin() {
  const [aba, setAba] = useState<Aba>('bancos')
  return (
    <div className={s.stack}>
      <div className={a.tabs} role="tablist">
        {(['usuarios', 'bancos', 'taxas'] as Aba[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={aba === t}
            className={`${a.tab} ${aba === t ? a.tabAtiva : ''}`}
            onClick={() => setAba(t)}
          >
            {t === 'usuarios' ? 'Usuários' : t === 'bancos' ? 'Bancos' : 'Taxas'}
          </button>
        ))}
      </div>

      {aba === 'usuarios' && <UsuariosPanel />}
      {aba === 'bancos' && <BancosPanel />}
      {aba === 'taxas' && <TaxasPanel />}
    </div>
  )
}

/* ---- Bancos ------------------------------------------------------- */
function BancosPanel() {
  const [bancos, setBancos] = useState<Banco[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [novo, setNovo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    bancosApi
      .listar()
      .then((r) => setBancos(r.bancos))
      .catch((e) => setErro(msg(e)))
  }
  useEffect(carregar, [])

  const adicionar = async (e: FormEvent) => {
    e.preventDefault()
    if (!novo.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await bancosApi.criar(novo.trim())
      setNovo('')
      carregar()
    } catch (e) {
      setErro(msg(e))
    } finally {
      setSalvando(false)
    }
  }

  const toggle = async (b: Banco) => {
    setErro(null)
    try {
      await bancosApi.atualizar(b.id, { ativo: !b.ativo })
      carregar()
    } catch (e) {
      setErro(msg(e))
    }
  }

  const excluir = async (b: Banco) => {
    if (!window.confirm(`Excluir "${b.nome}"? As taxas desse banco também serão removidas.`)) return
    setErro(null)
    try {
      await bancosApi.excluir(b.id)
      carregar()
    } catch (e) {
      setErro(msg(e))
    }
  }

  return (
    <Card
      title="Bancos de destino"
      action={<Badge tone="neutral">{bancos?.length ?? 0}</Badge>}
    >
      <form className={a.addRow} onSubmit={adicionar}>
        <input
          className={s.input}
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Nome do banco"
          maxLength={80}
        />
        <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={salvando}>
          <Icon name="entrada" size={16} /> Adicionar
        </button>
      </form>

      {erro && <div className={a.erro}>{erro}</div>}

      {bancos === null ? (
        <div className={a.carregando}>Carregando…</div>
      ) : bancos.length === 0 ? (
        <p className={a.nota}>Nenhum banco cadastrado.</p>
      ) : (
        <ul className={a.lista}>
          {bancos.map((b) => (
            <li key={b.id} className={a.item}>
              <span className={a.itemNome}>{b.nome}</span>
              <Badge tone={b.ativo ? 'success' : 'neutral'}>{b.ativo ? 'ativo' : 'inativo'}</Badge>
              <button type="button" className={a.linkBtn} onClick={() => toggle(b)}>
                {b.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button type="button" className={a.linkDanger} onClick={() => excluir(b)}>
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ---- Taxas (matriz forma x banco) --------------------------------- */
function TaxasPanel() {
  const [taxas, setTaxas] = useState<Taxa[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [edit, setEdit] = useState<Record<number, string>>({})
  const [salvo, setSalvo] = useState<number | null>(null)

  useEffect(() => {
    taxasApi
      .listar()
      .then((r) => {
        setTaxas(r.taxas)
        setEdit(Object.fromEntries(r.taxas.map((t) => [t.id, fmtPct(t.percentual_bp)])))
      })
      .catch((e) => setErro(msg(e)))
  }, [])

  if (!taxas) {
    return <Card title="Taxas por forma e banco">{erro ? <div className={a.erro}>{erro}</div> : <div className={a.carregando}>Carregando…</div>}</Card>
  }

  const bancos = [...new Map(taxas.map((t) => [t.banco_id, t.banco_nome])).entries()]
    .map(([id, nome]) => ({ id, nome }))
    .sort((x, y) => x.nome.localeCompare(y.nome))

  const find = (forma: Forma, bancoId: number) =>
    taxas.find((t) => t.forma === forma && t.banco_id === bancoId)

  const salvar = async (t: Taxa, valorStr: string) => {
    const pct = parseFloat(valorStr.replace(',', '.'))
    const bp = Number.isFinite(pct) ? Math.min(10000, Math.max(0, Math.round(pct * 100))) : 0
    setEdit((m) => ({ ...m, [t.id]: fmtPct(bp) }))
    if (bp === t.percentual_bp) return
    setErro(null)
    try {
      const r = await taxasApi.atualizar(t.id, bp)
      setTaxas((ts) => (ts ? ts.map((x) => (x.id === t.id ? r.taxa : x)) : ts))
      setSalvo(t.id)
      setTimeout(() => setSalvo((cur) => (cur === t.id ? null : cur)), 1200)
    } catch (e) {
      setErro(msg(e))
    }
  }

  return (
    <Card title="Taxas por forma e banco" action={<span className={a.hint}>% cobrada na transação</span>}>
      {erro && <div className={a.erro}>{erro}</div>}
      <div className={s.tableWrap}>
        <table className={a.matriz}>
          <thead>
            <tr>
              <th>Forma</th>
              {bancos.map((b) => (
                <th key={b.id}>{b.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FORMAS.map((f) => (
              <tr key={f.forma}>
                <td className={a.formaCel}>{f.label}</td>
                {bancos.map((b) => {
                  const t = find(f.forma, b.id)
                  if (!t) return <td key={b.id}>—</td>
                  return (
                    <td key={b.id} className={salvo === t.id ? a.celSalvo : ''}>
                      <div className={a.pctWrap}>
                        <input
                          className={a.pctInput}
                          inputMode="decimal"
                          value={edit[t.id] ?? ''}
                          onChange={(e) => setEdit((m) => ({ ...m, [t.id]: e.target.value }))}
                          onBlur={(e) => salvar(t, e.target.value)}
                        />
                        <span className={a.pctSign}>%</span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={a.nota}>Salva ao sair do campo. Use ponto ou vírgula (ex.: 3,5). Espécie normalmente é 0%.</p>
    </Card>
  )
}

/* ---- Usuários (placeholder — CRUD real numa próxima etapa) -------- */
const COLUNAS = ['Usuário', 'Perfil', 'Situação', 'Último acesso']
const PERFIS: { nome: string; tone: BadgeTone; desc: string }[] = [
  { nome: 'Gestor', tone: 'blue', desc: 'Acesso total: entradas, saídas, procedimentos, balanço e administração.' },
  { nome: 'Operador', tone: 'neutral', desc: 'Acesso parcial: registro do que entra (entradas e procedimentos).' },
]

function UsuariosPanel() {
  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <input className={s.input} type="search" placeholder="Buscar usuário…" disabled />
        </div>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled title="Disponível na próxima etapa">
          <Icon name="user" size={18} /> Novo usuário
        </button>
      </div>

      <div className={s.grid2}>
        <Card title="Usuários" action={<Badge tone="neutral">0 usuários</Badge>}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>{COLUNAS.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>Sem usuários cadastrados</span>
                      <span className={s.emptyText}>O cadastro de usuários entra na próxima etapa.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Perfis de acesso">
          <div className={s.roleList}>
            {PERFIS.map((p) => (
              <div className={s.roleItem} key={p.nome}>
                <div>
                  <Badge tone={p.tone}>{p.nome}</Badge>
                  <p className={s.roleDesc} style={{ marginTop: '0.375rem' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Placeholder etapa="próxima etapa">
        Cadastro de usuários (criar operador/gestor, trocar senha) com as rotas
        <code> /api/usuarios</code> que já existem.
      </Placeholder>
    </div>
  )
}
