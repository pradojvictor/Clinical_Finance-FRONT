import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { BadgeTone } from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/auth'
import {
  ApiError,
  auditoriaApi,
  bancosApi,
  categoriasSaidaApi,
  taxasApi,
  tiposEntradaApi,
  subtiposEntradaApi,
  usuariosApi,
  type Banco,
  type CategoriaSaida,
  type Forma,
  type NivelCategoriaSaida,
  type NovoUsuario,
  type Perfil,
  type RegistroAuditoria,
  type SubtipoEntrada,
  type Taxa,
  type TipoEntrada,
  type UsuarioAdmin,
} from '../lib/api'
import { SECOES, SECAO_LABEL } from '../config/nav'
import { brl } from '../lib/format'
import s from './page.module.css'
import a from './Admin.module.css'
import e from './Entradas.module.css'

type Aba = 'usuarios' | 'bancos' | 'taxas' | 'categorias' | 'tipos-entrada' | 'registros'
const ABAS: { id: Aba; label: string }[] = [
  { id: 'usuarios', label: 'Usuários' },
  { id: 'bancos', label: 'Bancos' },
  { id: 'taxas', label: 'Taxas' },
  { id: 'categorias', label: 'Categorias de saída' },
  { id: 'tipos-entrada', label: 'Categorias de entrada' },
  { id: 'registros', label: 'Registros' },
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
      {aba === 'tipos-entrada' && <TiposEntradaPanel />}
      {aba === 'registros' && <AuditoriaPanel />}
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

/* ---- Tipos de entrada (com subcategorias) ------------------------- */
function TiposEntradaPanel() {
  const [tipos, setTipos] = useState<TipoEntrada[] | null>(null)
  const [subtipos, setSubtipos] = useState<SubtipoEntrada[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [novo, setNovo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    tiposEntradaApi.listar().then((r) => setTipos(r.tipos)).catch((e) => setErro(msg(e)))
    subtiposEntradaApi.listar().then((r) => setSubtipos(r.subtipos)).catch(() => {})
  }
  useEffect(() => {
    carregar()
    usuariosApi.listar().then((r) => setUsuarios(r.usuarios.filter((u) => u.ativo))).catch(() => {})
  }, [])

  const adicionar = async (e: FormEvent) => {
    e.preventDefault()
    if (!novo.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await tiposEntradaApi.criar(novo.trim())
      setNovo('')
      carregar()
    } catch (e) {
      setErro(msg(e))
    } finally {
      setSalvando(false)
    }
  }

  const toggle = async (t: TipoEntrada) => {
    setErro(null)
    try {
      await tiposEntradaApi.atualizar(t.id, { ativo: !t.ativo })
      carregar()
    } catch (e) {
      setErro(msg(e))
    }
  }

  const excluir = async (t: TipoEntrada) => {
    if (!window.confirm(`Excluir o tipo "${t.nome}" e suas subcategorias?`)) return
    setErro(null)
    try {
      await tiposEntradaApi.excluir(t.id)
      carregar()
    } catch (e) {
      setErro(msg(e))
    }
  }

  return (
    <Card
      title="Categorias de entrada"
      action={<Badge tone="neutral">{tipos?.length ?? 0}</Badge>}
    >
      <form className={a.addRow} onSubmit={adicionar}>
        <input
          className={s.input}
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="ex.: Consulta, Exame, Retorno…"
          maxLength={80}
        />
        <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={salvando}>
          <Icon name="entrada" size={16} /> Adicionar
        </button>
      </form>

      {erro && <div className={a.erro}>{erro}</div>}

      {tipos === null ? (
        <div className={a.carregando}>Carregando…</div>
      ) : tipos.length === 0 ? (
        <p className={a.nota}>Nenhum tipo cadastrado.</p>
      ) : (
        <div className={a.arvore}>
          {tipos.map((t) => (
            <div key={t.id} className={a.central}>
              <div className={a.centralHead}>
                <span className={a.centralNome}>{t.nome}</span>
                <Badge tone={t.ativo ? 'success' : 'neutral'}>{t.ativo ? 'ativo' : 'inativo'}</Badge>
                <span className={a.acoesCat}>
                  <button type="button" className={a.linkBtn} onClick={() => toggle(t)}>
                    {t.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button type="button" className={a.linkDanger} onClick={() => excluir(t)}>
                    Excluir
                  </button>
                </span>
              </div>
              <SubtiposDeTipo
                tipoId={t.id}
                subtipos={subtipos.filter((x) => x.tipo_id === t.id)}
                usuarios={usuarios}
                onErro={setErro}
                onChange={carregar}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* Subcategorias de UM tipo: profissional (usuário) OU nome próprio. */
function SubtiposDeTipo({
  tipoId,
  subtipos,
  usuarios,
  onErro,
  onChange,
}: {
  tipoId: number
  subtipos: SubtipoEntrada[]
  usuarios: UsuarioAdmin[]
  onErro: (m: string | null) => void
  onChange: () => void
}) {
  const [kind, setKind] = useState<'profissional' | 'outro'>('profissional')
  const [usuarioId, setUsuarioId] = useState('')
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  const jaUsados = new Set(subtipos.filter((x) => x.usuario_id).map((x) => x.usuario_id))
  const disponiveis = usuarios.filter((u) => !jaUsados.has(u.id))

  const adicionar = async (e: FormEvent) => {
    e.preventDefault()
    onErro(null)
    setSalvando(true)
    try {
      if (kind === 'profissional') {
        if (!usuarioId) return
        await subtiposEntradaApi.criar({ tipo_id: tipoId, usuario_id: Number(usuarioId) })
        setUsuarioId('')
      } else {
        if (!nome.trim()) return
        await subtiposEntradaApi.criar({ tipo_id: tipoId, nome: nome.trim() })
        setNome('')
      }
      onChange()
    } catch (x) {
      onErro(msg(x))
    } finally {
      setSalvando(false)
    }
  }

  const toggle = async (sub: SubtipoEntrada) => {
    onErro(null)
    try {
      await subtiposEntradaApi.atualizar(sub.id, { ativo: !sub.ativo })
      onChange()
    } catch (x) {
      onErro(msg(x))
    }
  }

  const excluir = async (sub: SubtipoEntrada) => {
    if (!window.confirm(`Excluir a subcategoria "${sub.rotulo}"?`)) return
    onErro(null)
    try {
      await subtiposEntradaApi.excluir(sub.id)
      onChange()
    } catch (x) {
      onErro(msg(x))
    }
  }

  return (
    <div className={a.catBloco}>
      {subtipos.map((sub) => (
        <div key={sub.id} className={a.subItem}>
          <span className={a.subNome}>{sub.rotulo}</span>
          <Badge tone="neutral">{sub.usuario_id ? 'profissional' : 'outro'}</Badge>
          {!sub.ativo && <Badge tone="neutral">inativo</Badge>}
          <span className={a.acoesCat}>
            <button type="button" className={a.linkBtn} onClick={() => toggle(sub)}>
              {sub.ativo ? 'Desativar' : 'Ativar'}
            </button>
            <button type="button" className={a.linkDanger} onClick={() => excluir(sub)}>
              Excluir
            </button>
          </span>
        </div>
      ))}
      <form className={a.addInline} onSubmit={adicionar}>
        <select
          className={a.addInput}
          style={{ maxWidth: '9rem' }}
          value={kind}
          onChange={(e) => setKind(e.target.value as 'profissional' | 'outro')}
        >
          <option value="profissional">Profissional</option>
          <option value="outro">Outro</option>
        </select>
        {kind === 'profissional' ? (
          <select className={a.addInput} value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="">Selecione o profissional…</option>
            {disponiveis.map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        ) : (
          <input
            className={a.addInput}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da subcategoria"
            maxLength={80}
          />
        )}
        <button type="submit" className={a.miniBtn} disabled={salvando}>
          Adicionar
        </button>
      </form>
    </div>
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

/* ---- Registros (auditoria legível) -------------------------------- */
type CategoriaLog = 'dinheiro' | 'clientes' | 'profissionais' | 'outros'

const CAT_LABEL: Record<CategoriaLog, string> = {
  dinheiro: 'Dinheiro',
  clientes: 'Clientes',
  profissionais: 'Profissionais',
  outros: 'Outros',
}
const CAT_TONE: Record<CategoriaLog, BadgeTone> = {
  dinheiro: 'success',
  clientes: 'blue',
  profissionais: 'warning',
  outros: 'neutral',
}
const FILTROS: { id: CategoriaLog | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Tudo' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'profissionais', label: 'Profissionais' },
  { id: 'outros', label: 'Outros' },
]

const TEXTO_ACAO: Record<string, string> = {
  'entrada.criar': 'Registrou uma entrada',
  'entrada.lote': 'Importou entradas por planilha',
  'entrada.editar': 'Editou uma entrada',
  'entrada.excluir': 'Excluiu uma entrada',
  'saida.criar': 'Registrou uma saída',
  'saida.editar': 'Editou uma saída',
  'saida.excluir': 'Excluiu uma saída',
  'transferencia.criar': 'Registrou uma transferência',
  'transferencia.excluir': 'Excluiu uma transferência',
  'saldo_inicial.definir': 'Definiu o saldo inicial de um local',
  'banco.criar': 'Criou um banco',
  'banco.editar': 'Editou um banco',
  'banco.excluir': 'Excluiu um banco',
  'taxa.editar': 'Alterou uma taxa',
  'categoria_saida.criar': 'Criou uma categoria de saída',
  'categoria_saida.editar': 'Editou uma categoria de saída',
  'categoria_saida.excluir': 'Excluiu uma categoria de saída',
  'tipo_entrada.criar': 'Criou um tipo de entrada',
  'tipo_entrada.editar': 'Editou um tipo de entrada',
  'tipo_entrada.excluir': 'Excluiu um tipo de entrada',
  'subtipo_entrada.criar': 'Criou uma subcategoria de entrada',
  'subtipo_entrada.editar': 'Editou uma subcategoria de entrada',
  'subtipo_entrada.excluir': 'Excluiu uma subcategoria de entrada',
  'usuario.criar': 'Criou um profissional',
  'usuario.editar': 'Editou um profissional',
  'usuario.senha': 'Trocou a senha de um profissional',
  'usuario.desativar': 'Desativou um profissional',
  'cliente.criar': 'Cadastrou um cliente',
  'cliente.registro': 'Cliente se cadastrou no site',
  'cliente.login': 'Cliente entrou',
  'cliente.logout': 'Cliente saiu',
  login: 'Entrou no sistema',
  'login.falha': 'Tentativa de login falhou',
  logout: 'Saiu do sistema',
}

function categoriaDe(acao: string): CategoriaLog {
  if (/^(entrada|saida|transferencia|saldo_inicial|banco|taxa|categoria_saida|tipo_entrada|subtipo_entrada)/.test(acao)) return 'dinheiro'
  if (acao.startsWith('cliente')) return 'clientes'
  if (acao.startsWith('usuario') || acao === 'login' || acao === 'logout' || acao === 'login.falha') return 'profissionais'
  return 'outros'
}
function textoDe(acao: string): string {
  return TEXTO_ACAO[acao] ?? acao.replace(/[._]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
function detalheDe(dados: Record<string, unknown> | null): string {
  if (!dados) return ''
  const p: string[] = []
  if (typeof dados.valor_centavos === 'number') p.push(brl(dados.valor_centavos))
  if (typeof dados.criadas === 'number') p.push(`${dados.criadas} entrada(s)`)
  if (typeof dados.pacientes_novos === 'number' && dados.pacientes_novos > 0) p.push(`${dados.pacientes_novos} paciente(s) novo(s)`)
  if (typeof dados.email === 'string') p.push(dados.email)
  if (typeof dados.login === 'string') p.push(`@${dados.login}`)
  if (typeof dados.nome === 'string') p.push(dados.nome)
  if (typeof dados.perfil === 'string') p.push(dados.perfil)
  return p.join(' · ')
}
function quandoHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const PAGINA_LOG = 10

function AuditoriaPanel() {
  const [regs, setRegs] = useState<RegistroAuditoria[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<CategoriaLog | 'todos'>('todos')
  const [busca, setBusca] = useState('')
  const [visiveis, setVisiveis] = useState(PAGINA_LOG)

  useEffect(() => {
    auditoriaApi.listar(300).then((r) => setRegs(r.registros)).catch((x) => setErro(msg(x)))
  }, [])
  // Volta pro topo (10) quando muda o filtro ou a busca.
  useEffect(() => setVisiveis(PAGINA_LOG), [filtro, busca])

  const q = busca.trim().toLowerCase()
  const filtrados = (regs ?? []).filter((r) => {
    if (filtro !== 'todos' && categoriaDe(r.acao) !== filtro) return false
    if (!q) return true
    const texto = `${textoDe(r.acao)} ${detalheDe(r.dados)} ${r.usuario_nome ?? ''}`.toLowerCase()
    return texto.includes(q)
  })
  const mostrados = filtrados.slice(0, visiveis)

  return (
    <Card
      title="Registros de atividade"
      action={<span className={a.hint}>tudo que acontece no sistema</span>}
    >
      {erro && <div className={a.erro}>{erro}</div>}
      <div className={a.chips}>
        {FILTROS.map((f) => (
          <button key={f.id} type="button" className={`${a.chip} ${filtro === f.id ? a.chipOn : ''}`} onClick={() => setFiltro(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <input
        className={s.input}
        type="search"
        placeholder="Buscar nos registros…"
        value={busca}
        onChange={(ev) => setBusca(ev.target.value)}
        style={{ marginBottom: 'var(--sp-3)', width: '100%' }}
      />

      {regs === null ? (
        <div className={a.carregando}>Carregando…</div>
      ) : filtrados.length === 0 ? (
        <p className={a.nota}>Nada por aqui ainda.</p>
      ) : (
        <>
          <ul className={a.logLista}>
            {mostrados.map((r) => {
              const cat = categoriaDe(r.acao)
              const det = detalheDe(r.dados)
              return (
                <li key={r.id} className={a.logItem}>
                  <span className={a.logBadge}><Badge tone={CAT_TONE[cat]}>{CAT_LABEL[cat]}</Badge></span>
                  <div className={a.logCorpo}>
                    <span className={a.logTexto}>
                      {textoDe(r.acao)}
                      {det && <span className={a.logDetalhe}> — {det}</span>}
                    </span>
                    <span className={a.logMeta}>{r.usuario_nome ?? 'Sistema / público'} · {quandoHora(r.criado_em)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className={a.verMaisWrap}>
            <span className={a.nota}>Mostrando {mostrados.length} de {filtrados.length}</span>
            {visiveis < filtrados.length && (
              <button type="button" className={a.linkBtn} onClick={() => setVisiveis((v) => v + PAGINA_LOG)}>
                Ver mais
              </button>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

/* ---- Categorias de saída (árvore, no estilo das de entrada) -------- */
/* Form inline sempre visível para adicionar (igual ao das subcategorias de entrada). */
function AddInlineForm({
  placeholder,
  onSave,
  className,
}: {
  placeholder: string
  onSave: (nome: string) => void
  className?: string
}) {
  const [nome, setNome] = useState('')
  return (
    <form
      className={className ?? a.addInline}
      onSubmit={(ev) => {
        ev.preventDefault()
        if (!nome.trim()) return
        onSave(nome.trim())
        setNome('')
      }}
    >
      <input
        className={a.addInput}
        value={nome}
        onChange={(ev) => setNome(ev.target.value)}
        placeholder={placeholder}
        maxLength={80}
      />
      <button type="submit" className={a.miniBtn}>Adicionar</button>
    </form>
  )
}

/* Subcategoria de saída: funcionário (usuário) OU nome próprio (como os subtipos de entrada). */
function SubcategoriaForm({
  usuarios,
  jaFuncionarios,
  onNome,
  onFuncionario,
}: {
  usuarios: UsuarioAdmin[]
  jaFuncionarios: number[]
  onNome: (nome: string) => void
  onFuncionario: (usuarioId: number) => void
}) {
  const [kind, setKind] = useState<'funcionario' | 'outro'>('outro')
  const [usuarioId, setUsuarioId] = useState('')
  const [nome, setNome] = useState('')

  const usados = new Set(jaFuncionarios)
  const disponiveis = usuarios.filter((u) => !usados.has(u.id))

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (kind === 'funcionario') {
      if (!usuarioId) return
      onFuncionario(Number(usuarioId))
      setUsuarioId('')
    } else {
      if (!nome.trim()) return
      onNome(nome.trim())
      setNome('')
    }
  }

  return (
    <form className={a.addInline} onSubmit={submit}>
      <select
        className={a.addInput}
        style={{ maxWidth: '9rem' }}
        value={kind}
        onChange={(e) => setKind(e.target.value as 'funcionario' | 'outro')}
      >
        <option value="funcionario">Funcionário</option>
        <option value="outro">Outro</option>
      </select>
      {kind === 'funcionario' ? (
        <select className={a.addInput} value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
          <option value="">Selecione o funcionário…</option>
          {disponiveis.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      ) : (
        <input
          className={a.addInput}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nova subcategoria (ex.: Maria)"
          maxLength={80}
        />
      )}
      <button type="submit" className={a.miniBtn}>Adicionar</button>
    </form>
  )
}

function CategoriasSaidaPanel() {
  const [cats, setCats] = useState<CategoriaSaida[] | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [novaCentral, setNovaCentral] = useState('')

  const carregar = () => {
    categoriasSaidaApi.listar().then((r) => setCats(r.categorias)).catch((x) => setErro(msg(x)))
  }
  useEffect(() => {
    carregar()
    usuariosApi.listar().then((r) => setUsuarios(r.usuarios.filter((u) => u.ativo))).catch(() => {})
  }, [])

  const criar = async (
    nivel: NivelCategoriaSaida,
    parent_id: number | null,
    dados: { nome?: string; usuario_id?: number },
  ) => {
    setErro(null)
    try {
      await categoriasSaidaApi.criar({ nivel, parent_id, ...dados })
      carregar()
    } catch (x) {
      setErro(msg(x))
    }
  }
  const renomear = async (c: CategoriaSaida) => {
    const nome = window.prompt('Novo nome:', c.rotulo)
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
    if (!window.confirm(`Excluir “${c.rotulo}”${extra}?`)) return
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
      {c.usuario_id == null && (
        <button type="button" className={a.linkBtn} onClick={() => renomear(c)}>Renomear</button>
      )}
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
          if (!novaCentral.trim()) return
          criar('central', null, { nome: novaCentral.trim() })
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
                <span className={a.centralNome}>{central.rotulo}</span>
                {!central.ativo && <Badge tone="neutral">inativo</Badge>}
                <span className={a.acoesCat}>{acoes(central)}</span>
              </div>

              {categoriasDe(central.id).map((cat) => (
                <div key={cat.id} className={a.catBloco}>
                  <div className={a.catItem}>
                    <span className={a.catNome}>{cat.rotulo}</span>
                    {!cat.ativo && <Badge tone="neutral">inativo</Badge>}
                    <span className={a.acoesCat}>{acoes(cat)}</span>
                  </div>

                  {subsDe(cat.id).map((su) => (
                    <div key={su.id} className={a.subItem}>
                      <span className={a.subNome}>{su.rotulo}</span>
                      <Badge tone="neutral">{su.usuario_id ? 'funcionário' : 'outro'}</Badge>
                      {!su.ativo && <Badge tone="neutral">inativo</Badge>}
                      <span className={a.acoesCat}>{acoes(su)}</span>
                    </div>
                  ))}

                  <SubcategoriaForm
                    usuarios={usuarios}
                    jaFuncionarios={subsDe(cat.id).filter((x) => x.usuario_id).map((x) => x.usuario_id!)}
                    onNome={(nome) => criar('subcategoria', cat.id, { nome })}
                    onFuncionario={(usuario_id) => criar('subcategoria', cat.id, { usuario_id })}
                  />
                </div>
              ))}

              <AddInlineForm
                className={a.addCatForm}
                placeholder="Nova categoria ligada à central (ex.: Aluguel)"
                onSave={(nome) => criar('categoria', central.id, { nome })}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---- Usuários ----------------------------------------------------- */
const COLUNAS = ['Usuário', 'Perfil', 'Situação', 'Último acesso', '']
const PERFIL_LABEL: Record<Perfil, string> = { gestor: 'Gestor', operador: 'Operador', profissional: 'Profissional' }
const PERFIL_TONE: Record<Perfil, BadgeTone> = { gestor: 'blue', operador: 'neutral', profissional: 'success' }
const PERFIS: { nome: string; tone: BadgeTone; desc: string }[] = [
  { nome: 'Gestor', tone: 'blue', desc: 'Acesso total: entradas, saídas, procedimentos, balanço e administração.' },
  { nome: 'Operador', tone: 'neutral', desc: 'Acesso parcial: registro do que entra (entradas e procedimentos).' },
  { nome: 'Profissional', tone: 'success', desc: 'Só leitura, e apenas nas seções que você liberar (definidas no cadastro).' },
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
const PERFIS_OPCOES: Perfil[] = ['gestor', 'operador', 'profissional']

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
  const [permissoes, setPermissoes] = useState<string[]>(usuario?.permissoes ?? [])
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
      const perms = perfil === 'profissional' ? permissoes : []
      if (editando) {
        await usuariosApi.atualizar(usuario!.id, { nome: nome.trim(), perfil, permissoes: perms })
      } else {
        const dados: NovoUsuario = { login: login.trim().toLowerCase(), nome: nome.trim(), perfil, permissoes: perms, senha }
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

          {perfil === 'profissional' && (
            <div className={e.campo}>
              <span className={e.label}>O que ele pode ver (só leitura)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem' }}>
                {SECOES.map((sec) => (
                  <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--fs-md)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={permissoes.includes(sec)}
                      onChange={(ev) =>
                        setPermissoes((cur) =>
                          ev.target.checked ? [...cur, sec] : cur.filter((x) => x !== sec),
                        )
                      }
                    />
                    {SECAO_LABEL[sec]}
                  </label>
                ))}
              </div>
              <span className={a.hint}>Início é sempre visível. Admin, nunca.</span>
            </div>
          )}

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
