import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { BadgeTone } from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/auth'
import {
  ApiError,
  bancosApi,
  categoriasSaidaApi,
  taxasApi,
  usuariosApi,
  type Banco,
  type CategoriaSaida,
  type Forma,
  type NivelCategoriaSaida,
  type NovoUsuario,
  type Perfil,
  type Taxa,
  type UsuarioAdmin,
} from '../lib/api'
import s from './page.module.css'
import a from './Admin.module.css'
import e from './Entradas.module.css'

type Aba = 'usuarios' | 'bancos' | 'taxas' | 'categorias'
const ABAS: { id: Aba; label: string }[] = [
  { id: 'usuarios', label: 'Usuários' },
  { id: 'bancos', label: 'Bancos' },
  { id: 'taxas', label: 'Taxas' },
  { id: 'categorias', label: 'Categorias de saída' },
]

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
        {ABAS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={aba === t.id}
            className={`${a.tab} ${aba === t.id ? a.tabAtiva : ''}`}
            onClick={() => setAba(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'usuarios' && <UsuariosPanel />}
      {aba === 'bancos' && <BancosPanel />}
      {aba === 'taxas' && <TaxasPanel />}
      {aba === 'categorias' && <CategoriasSaidaPanel />}
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

/* ---- Categorias de saída (árvore) --------------------------------- */
function AddInline({
  placeholder,
  onSave,
  onCancel,
}: {
  placeholder: string
  onSave: (nome: string) => void
  onCancel: () => void
}) {
  const [nome, setNome] = useState('')
  return (
    <form
      className={a.addInline}
      onSubmit={(ev) => {
        ev.preventDefault()
        if (nome.trim()) onSave(nome.trim())
      }}
    >
      <input
        className={a.addInput}
        value={nome}
        onChange={(ev) => setNome(ev.target.value)}
        placeholder={placeholder}
        maxLength={80}
        autoFocus
      />
      <button type="submit" className={a.miniBtn}>Salvar</button>
      <button type="button" className={a.miniGhost} onClick={onCancel}>Cancelar</button>
    </form>
  )
}

function CategoriasSaidaPanel() {
  const [cats, setCats] = useState<CategoriaSaida[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [novaCentral, setNovaCentral] = useState('')
  const [addTo, setAddTo] = useState<{ nivel: 'categoria' | 'subcategoria'; parentId: number } | null>(null)

  const carregar = () => {
    categoriasSaidaApi.listar().then((r) => setCats(r.categorias)).catch((x) => setErro(msg(x)))
  }
  useEffect(carregar, [])

  const criar = async (nome: string, nivel: NivelCategoriaSaida, parent_id: number | null) => {
    if (!nome.trim()) return
    setErro(null)
    try {
      await categoriasSaidaApi.criar({ nome: nome.trim(), nivel, parent_id })
      carregar()
    } catch (x) {
      setErro(msg(x))
    }
  }
  const renomear = async (c: CategoriaSaida) => {
    const nome = window.prompt('Novo nome:', c.nome)
    if (nome == null || !nome.trim()) return
    setErro(null)
    try {
      await categoriasSaidaApi.atualizar(c.id, { nome: nome.trim() })
      carregar()
    } catch (x) {
      setErro(msg(x))
    }
  }
  const toggle = async (c: CategoriaSaida) => {
    setErro(null)
    try {
      await categoriasSaidaApi.atualizar(c.id, { ativo: !c.ativo })
      carregar()
    } catch (x) {
      setErro(msg(x))
    }
  }
  const excluir = async (c: CategoriaSaida) => {
    const extra = c.nivel === 'subcategoria' ? '' : ' e tudo que está dentro'
    if (!window.confirm(`Excluir “${c.nome}”${extra}?`)) return
    setErro(null)
    try {
      await categoriasSaidaApi.excluir(c.id)
      carregar()
    } catch (x) {
      setErro(msg(x))
    }
  }

  const centrais = (cats ?? []).filter((c) => c.nivel === 'central')
  const categoriasDe = (id: number) => (cats ?? []).filter((c) => c.nivel === 'categoria' && c.parent_id === id)
  const subsDe = (id: number) => (cats ?? []).filter((c) => c.nivel === 'subcategoria' && c.parent_id === id)

  const acoes = (c: CategoriaSaida) => (
    <>
      <button type="button" className={a.linkBtn} onClick={() => renomear(c)}>Renomear</button>
      <button type="button" className={a.linkBtn} onClick={() => toggle(c)}>{c.ativo ? 'Desativar' : 'Ativar'}</button>
      <button type="button" className={a.linkDanger} onClick={() => excluir(c)}>Excluir</button>
    </>
  )

  return (
    <Card
      title="Categorias de saída"
      action={<span className={a.hint}>a central agrupa; categoria e subcategoria vão nos selects da saída</span>}
    >
      {erro && <div className={a.erro}>{erro}</div>}

      <form
        className={a.addRow}
        onSubmit={(ev) => {
          ev.preventDefault()
          criar(novaCentral, 'central', null)
          setNovaCentral('')
        }}
      >
        <input
          className={s.input}
          value={novaCentral}
          onChange={(ev) => setNovaCentral(ev.target.value)}
          placeholder="Nova central (ex.: Despesas fixas)"
          maxLength={80}
        />
        <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
          <Icon name="entrada" size={16} /> Central
        </button>
      </form>

      {cats === null ? (
        <div className={a.carregando}>Carregando…</div>
      ) : centrais.length === 0 ? (
        <p className={a.nota}>Nenhuma categoria ainda. Crie uma central para começar.</p>
      ) : (
        <div className={a.arvore}>
          {centrais.map((central) => (
            <div key={central.id} className={a.central}>
              <div className={a.centralHead}>
                <span className={a.centralTag}>central</span>
                <span className={a.centralNome}>{central.nome}</span>
                {!central.ativo && <Badge tone="neutral">inativo</Badge>}
                <span className={a.acoesCat}>{acoes(central)}</span>
              </div>

              {categoriasDe(central.id).map((cat) => (
                <div key={cat.id} className={a.catBloco}>
                  <div className={a.catItem}>
                    <span className={a.catNome}>{cat.nome}</span>
                    {!cat.ativo && <Badge tone="neutral">inativo</Badge>}
                    <span className={a.acoesCat}>
                      <button type="button" className={a.linkBtn} onClick={() => setAddTo({ nivel: 'subcategoria', parentId: cat.id })}>+ subcategoria</button>
                      {acoes(cat)}
                    </span>
                  </div>

                  {subsDe(cat.id).map((su) => (
                    <div key={su.id} className={a.subItem}>
                      <span className={a.subNome}>{su.nome}</span>
                      {!su.ativo && <Badge tone="neutral">inativo</Badge>}
                      <span className={a.acoesCat}>{acoes(su)}</span>
                    </div>
                  ))}

                  {addTo?.nivel === 'subcategoria' && addTo.parentId === cat.id && (
                    <AddInline
                      placeholder="Nome da subcategoria (ex.: Maria)"
                      onCancel={() => setAddTo(null)}
                      onSave={(nome) => {
                        setAddTo(null)
                        criar(nome, 'subcategoria', cat.id)
                      }}
                    />
                  )}
                </div>
              ))}

              {addTo?.nivel === 'categoria' && addTo.parentId === central.id ? (
                <AddInline
                  placeholder="Nome da categoria (ex.: Aluguel)"
                  onCancel={() => setAddTo(null)}
                  onSave={(nome) => {
                    setAddTo(null)
                    criar(nome, 'categoria', central.id)
                  }}
                />
              ) : (
                <button type="button" className={a.addCat} onClick={() => setAddTo({ nivel: 'categoria', parentId: central.id })}>
                  + nova categoria
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---- Usuários ----------------------------------------------------- */
const COLUNAS = ['Usuário', 'Perfil', 'Situação', 'Último acesso', '']
const PERFIL_LABEL: Record<Perfil, string> = { gestor: 'Gestor', operador: 'Operador' }
const PERFIL_TONE: Record<Perfil, BadgeTone> = { gestor: 'blue', operador: 'neutral' }
const PERFIS: { nome: string; tone: BadgeTone; desc: string }[] = [
  { nome: 'Gestor', tone: 'blue', desc: 'Acesso total: entradas, saídas, procedimentos, balanço e administração.' },
  { nome: 'Operador', tone: 'neutral', desc: 'Acesso parcial: registro do que entra (entradas e procedimentos).' },
]

function fmtAcesso(iso: string | null): string {
  if (!iso) return 'nunca'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type ModalUsuario =
  | { tipo: 'novo' }
  | { tipo: 'editar'; usuario: UsuarioAdmin }
  | { tipo: 'senha'; usuario: UsuarioAdmin }

function UsuariosPanel() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<ModalUsuario | null>(null)

  const carregar = () => {
    usuariosApi
      .listar()
      .then((r) => setUsuarios(r.usuarios))
      .catch((x) => setErro(msg(x)))
  }
  useEffect(carregar, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!usuarios) return []
    if (!q) return usuarios
    return usuarios.filter((u) => u.nome.toLowerCase().includes(q) || u.login.includes(q))
  }, [usuarios, busca])

  const ehVoce = (u: UsuarioAdmin) => user?.login === u.login

  const toggleAtivo = async (u: UsuarioAdmin) => {
    setErro(null)
    try {
      await usuariosApi.atualizar(u.id, { ativo: !u.ativo })
      carregar()
    } catch (x) {
      setErro(msg(x))
    }
  }

  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <input
            className={s.input}
            type="search"
            placeholder="Buscar por nome ou login…"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
          />
        </div>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal({ tipo: 'novo' })}>
          <Icon name="user" size={18} /> Novo usuário
        </button>
      </div>

      <div className={s.grid2}>
        <Card
          title="Usuários"
          action={<Badge tone="neutral">{usuarios?.length ?? 0} {usuarios?.length === 1 ? 'usuário' : 'usuários'}</Badge>}
        >
          {erro && <div className={a.erro}>{erro}</div>}
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>{COLUNAS.map((c, i) => <th key={i}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {usuarios === null ? (
                  <tr><td colSpan={COLUNAS.length}><div className={a.carregando}>Carregando…</div></td></tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={COLUNAS.length}>
                      <div className={s.empty}>
                        <span className={s.emptyTitle}>{busca ? 'Nenhum usuário encontrado' : 'Sem usuários cadastrados'}</span>
                        <span className={s.emptyText}>{busca ? 'Ajuste a busca.' : 'Clique em “Novo usuário” para cadastrar.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className={a.userCel}>
                          <span className={a.userNome}>
                            {u.nome}
                            {ehVoce(u) && <span className={a.voce}>você</span>}
                          </span>
                          <span className={a.userLogin}>@{u.login}</span>
                        </div>
                      </td>
                      <td><Badge tone={PERFIL_TONE[u.perfil]}>{PERFIL_LABEL[u.perfil]}</Badge></td>
                      <td><Badge tone={u.ativo ? 'success' : 'neutral'}>{u.ativo ? 'ativo' : 'inativo'}</Badge></td>
                      <td className={a.acessoCel}>{fmtAcesso(u.ultimo_acesso)}</td>
                      <td>
                        <div className={a.acoes}>
                          <button type="button" className={a.linkBtn} onClick={() => setModal({ tipo: 'editar', usuario: u })}>Editar</button>
                          <button type="button" className={a.linkBtn} onClick={() => setModal({ tipo: 'senha', usuario: u })}>Senha</button>
                          {!ehVoce(u) && (
                            <button type="button" className={u.ativo ? a.linkDanger : a.linkBtn} onClick={() => toggleAtivo(u)}>
                              {u.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

      {modal?.tipo === 'novo' && (
        <UsuarioModal onClose={() => setModal(null)} onSalvo={() => { setModal(null); carregar() }} />
      )}
      {modal?.tipo === 'editar' && (
        <UsuarioModal usuario={modal.usuario} ehVoce={ehVoce(modal.usuario)} onClose={() => setModal(null)} onSalvo={() => { setModal(null); carregar() }} />
      )}
      {modal?.tipo === 'senha' && (
        <SenhaModal usuario={modal.usuario} onClose={() => setModal(null)} onSalvo={() => setModal(null)} />
      )}
    </div>
  )
}

/* ---- Modal: novo / editar usuário --------------------------------- */
const PERFIS_OPCOES: Perfil[] = ['gestor', 'operador']

function UsuarioModal({
  usuario,
  ehVoce = false,
  onClose,
  onSalvo,
}: {
  usuario?: UsuarioAdmin
  ehVoce?: boolean
  onClose: () => void
  onSalvo: () => void
}) {
  const editando = !!usuario
  const [login, setLogin] = useState(usuario?.login ?? '')
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [perfil, setPerfil] = useState<Perfil>(usuario?.perfil ?? 'operador')
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    if (!editando) {
      if (login.trim().length < 3) return setErro('O login precisa de ao menos 3 caracteres.')
      if (senha.length < 8) return setErro('A senha precisa de ao menos 8 caracteres.')
    }
    if (nome.trim().length < 2) return setErro('Informe o nome completo.')

    setEnviando(true)
    try {
      if (editando) {
        await usuariosApi.atualizar(usuario!.id, { nome: nome.trim(), perfil })
      } else {
        const dados: NovoUsuario = { login: login.trim().toLowerCase(), nome: nome.trim(), perfil, senha }
        await usuariosApi.criar(dados)
      }
      onSalvo()
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label={editando ? 'Editar usuário' : 'Novo usuário'} onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>{editando ? 'Editar usuário' : 'Novo usuário'}</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}

          <label className={e.campo}>
            <span className={e.label}>Nome completo</span>
            <input className={e.input} value={nome} onChange={(ev) => setNome(ev.target.value)} placeholder="ex.: maria oliveira" autoFocus />
          </label>

          <label className={e.campo}>
            <span className={e.label}>Login {editando && <span className={a.hint}>(não editável)</span>}</span>
            <input
              className={e.input}
              value={login}
              onChange={(ev) => setLogin(ev.target.value)}
              placeholder="ex.: maria"
              autoComplete="off"
              readOnly={editando}
              inputMode="text"
            />
          </label>

          <label className={e.campo}>
            <span className={e.label}>Perfil de acesso</span>
            <select className={e.input} value={perfil} onChange={(ev) => setPerfil(ev.target.value as Perfil)} disabled={ehVoce}>
              {PERFIS_OPCOES.map((p) => (
                <option key={p} value={p}>{PERFIL_LABEL[p]}</option>
              ))}
            </select>
            {ehVoce && <span className={a.hint}>Você não pode alterar o próprio perfil.</span>}
          </label>

          {!editando && (
            <label className={e.campo}>
              <span className={e.label}>Senha inicial</span>
              <div className={a.senhaWrap}>
                <input
                  className={e.input}
                  type={mostrar ? 'text' : 'password'}
                  value={senha}
                  onChange={(ev) => setSenha(ev.target.value)}
                  placeholder="ao menos 8 caracteres"
                  autoComplete="new-password"
                />
                <button type="button" className={a.olho} onClick={() => setMostrar((m) => !m)} aria-label={mostrar ? 'Ocultar' : 'Mostrar'}>
                  <Icon name={mostrar ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </label>
          )}

          <div className={e.rodape}>
            <span className={e.dataNota}>{editando ? 'Login e senha não mudam aqui.' : 'O usuário troca a senha depois.'}</span>
            <button type="submit" className={e.submit} disabled={enviando}>
              {enviando ? 'Salvando…' : editando ? 'Salvar' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ---- Modal: trocar senha ------------------------------------------ */
function SenhaModal({ usuario, onClose, onSalvo }: { usuario: UsuarioAdmin; onClose: () => void; onSalvo: () => void }) {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    if (senha.length < 8) return setErro('A senha precisa de ao menos 8 caracteres.')
    if (senha !== confirma) return setErro('As senhas não coincidem.')
    setEnviando(true)
    try {
      await usuariosApi.senha(usuario.id, senha)
      setOk(true)
      setTimeout(onSalvo, 900)
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label="Trocar senha" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>Trocar senha</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}
          {ok && <div className={a.sucesso}>Senha alterada.</div>}
          <p className={a.senhaAlvo}>Definindo nova senha para <strong>{usuario.nome}</strong> <span className={a.userLogin}>@{usuario.login}</span></p>

          <label className={e.campo}>
            <span className={e.label}>Nova senha</span>
            <div className={a.senhaWrap}>
              <input
                className={e.input}
                type={mostrar ? 'text' : 'password'}
                value={senha}
                onChange={(ev) => setSenha(ev.target.value)}
                placeholder="ao menos 8 caracteres"
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" className={a.olho} onClick={() => setMostrar((m) => !m)} aria-label={mostrar ? 'Ocultar' : 'Mostrar'}>
                <Icon name={mostrar ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </label>

          <label className={e.campo}>
            <span className={e.label}>Confirmar senha</span>
            <input
              className={e.input}
              type={mostrar ? 'text' : 'password'}
              value={confirma}
              onChange={(ev) => setConfirma(ev.target.value)}
              placeholder="repita a senha"
              autoComplete="new-password"
            />
          </label>

          <div className={e.rodape}>
            <span className={e.dataNota}>Ela vale no próximo login.</span>
            <button type="submit" className={e.submit} disabled={enviando || ok}>
              {ok ? 'Pronto' : enviando ? 'Salvando…' : 'Trocar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
