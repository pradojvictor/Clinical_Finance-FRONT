import { lazy, Suspense, useCallback, useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import SeletorMesAno from '../components/ui/SeletorMesAno'
import { periodoMes , dentroDaJanela } from '../lib/format'
import ExcluirMovimentoModal from '../components/ExcluirMovimentoModal'
import {
  ApiError,
  bancosApi,
  entradasApi,
  pacientesApi,
  taxasApi,
  tiposEntradaApi,
  subtiposEntradaApi,
  type Banco,
  type EditarEntrada,
  type EntradaDetalhe,
  type Forma,
  type NovaEntrada,
  type Paciente,
  type TipoEntrada,
  type SubtipoEntrada,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import s from './page.module.css'
import e from './Entradas.module.css'

const FORMA_LABEL: Record<Forma, string> = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  especie: 'Espécie',
}
const FORMAS: Forma[] = ['pix', 'debito', 'credito', 'especie']

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataBR = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')
const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')

function formatCpf(d: string): string {
  const s2 = d.replace(/\D/g, '').slice(0, 11)
  return s2.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, e2) =>
    [a, b, c].filter(Boolean).join('.') + (e2 ? '-' + e2 : ''),
  )
}
function parseCentavos(str: string): number {
  let v = str.trim().replace(/[^\d.,]/g, '')
  if (v.includes(',') && v.includes('.')) v = v.replace(/\./g, '').replace(',', '.')
  else v = v.replace(',', '.')
  const n = parseFloat(v)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

const COLUNAS = ['Data', 'Paciente', 'Tipo', 'Forma', 'Banco', 'Valor', 'Líquido', '']

const ImportarModal = lazy(() => import('./ImportarModal'))

export default function Entradas() {
  const agora = new Date()
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [ano, setAno] = useState(agora.getFullYear())
  const [entradas, setEntradas] = useState<EntradaDetalhe[] | null>(null)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [importar, setImportar] = useState(false)
  const [editando, setEditando] = useState<EntradaDetalhe | null>(null)
  const [excluindo, setExcluindo] = useState<EntradaDetalhe | null>(null)
  const { user } = useAuth()
  const soLeitura = user?.perfil === 'profissional'

  const carregar = useCallback(() => {
    const { de, ate } = periodoMes(ano, mes)
    setEntradas(null)
    setErro(null)
    entradasApi
      .listar({ de, ate })
      .then((r) => setEntradas(r.entradas))
      .catch((x) => setErro(msg(x)))
  }, [ano, mes])
  useEffect(() => {
    carregar()
  }, [carregar])

  const q = busca.trim().toLowerCase()
  const filtradas = (entradas ?? []).filter((en) => {
    if (!q) return true
    return `${en.paciente_nome ?? ''} ${en.tipo_nome ?? ''} ${en.subtipo_nome ?? ''} ${FORMA_LABEL[en.forma]} ${en.banco_nome ?? ''}`.toLowerCase().includes(q)
  })

  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <SeletorMesAno mes={mes} ano={ano} onMes={setMes} onAno={setAno} />
          <input
            className={s.input}
            type="search"
            placeholder="Buscar paciente, forma, banco…"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
          />
        </div>
        {!soLeitura && (
          <>
            <button type="button" className={s.btn} onClick={() => setImportar(true)}>
              <Icon name="proc" size={18} /> Importar planilha
            </button>
            <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal(true)}>
              <Icon name="entrada" size={18} /> Nova entrada
            </button>
          </>
        )}
      </div>

      <Card
        title="Entradas registradas"
        action={<Badge tone="neutral">{filtradas.length} registros</Badge>}
      >
        {erro && <div className={e.erro}>{erro}</div>}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {COLUNAS.map((c, i) => (
                  <th key={i} className={c === 'Valor' || c === 'Líquido' ? s.num : undefined}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas === null ? (
                <tr><td colSpan={COLUNAS.length}><div className={e.carregando}>Carregando…</div></td></tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>{busca ? 'Nenhuma entrada encontrada' : 'Nenhuma entrada ainda'}</span>
                      <span className={s.emptyText}>{busca ? 'Ajuste a busca.' : 'Clique em “Nova entrada” para registrar.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtradas.map((en) => (
                  <tr key={en.id}>
                    <td>{dataBR(en.data)}</td>
                    <td>{en.paciente_nome ?? <span className={e.vazio}>—</span>}</td>
                    <td>
                      {en.tipo_nome ? (
                        <>
                          {en.tipo_nome}
                          {en.subtipo_nome && <span className={e.dropCpf}> · {en.subtipo_nome}</span>}
                        </>
                      ) : (
                        <span className={e.vazio}>—</span>
                      )}
                    </td>
                    <td>{FORMA_LABEL[en.forma]}</td>
                    <td>{en.banco_nome ?? <span className={e.vazio}>—</span>}</td>
                    <td className={s.num}>{brl(en.valor_centavos)}</td>
                    <td className={s.num}>{brl(en.valor_liquido_centavos)}</td>
                    <td className={s.num}>
                      {!soLeitura && (
                        <div className={e.acoesCel}>
                          <button type="button" className={e.acaoLink} onClick={() => setEditando(en)}>Editar</button>
                          {/* Excluir só nas primeiras 24h do registro. Fora
                              da janela o botão nem aparece — o servidor
                              recusaria de qualquer forma. */}
                          {dentroDaJanela(en.criado_em) && (
                            <button type="button" className={e.acaoPerigo} onClick={() => setExcluindo(en)}>
                              Excluir
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <NovaEntradaModal
          onClose={() => setModal(false)}
          onSalvo={() => {
            setModal(false)
            carregar()
          }}
        />
      )}

      {editando && (
        <EditarEntradaModal
          entrada={editando}
          onClose={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null)
            carregar()
          }}
        />
      )}

      {excluindo && (
        <ExcluirMovimentoModal
          tipo="entrada"
          descricao={[excluindo.tipo_nome, excluindo.subtipo_nome, excluindo.paciente_nome]
            .filter(Boolean)
            .join(' · ')}
          valorCentavos={excluindo.valor_centavos}
          data={excluindo.data}
          criadoEm={excluindo.criado_em}
          onExcluir={(senha) => entradasApi.excluir(excluindo.id, senha)}
          onClose={() => setExcluindo(null)}
          onExcluido={() => {
            setExcluindo(null)
            carregar()
          }}
        />
      )}

      {importar && (
        <Suspense fallback={null}>
          <ImportarModal
            onClose={() => setImportar(false)}
            onSalvo={() => {
              setImportar(false)
              carregar()
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

/* ---- Modal: Nova entrada ------------------------------------------ */
function NovaEntradaModal({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  // paciente
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [pacienteId, setPacienteId] = useState<number | null>(null)
  const [resultados, setResultados] = useState<Paciente[]>([])

  // pagamento
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<Forma | ''>('')
  const [bancoId, setBancoId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [subtipoId, setSubtipoId] = useState('')
  const [observacao, setObservacao] = useState('')

  const [bancos, setBancos] = useState<Banco[]>([])
  const [tipos, setTipos] = useState<TipoEntrada[]>([])
  const [subtipos, setSubtipos] = useState<SubtipoEntrada[]>([])
  const [taxaBp, setTaxaBp] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    bancosApi.listar().then((r) => setBancos(r.bancos.filter((b) => b.ativo))).catch(() => {})
    tiposEntradaApi.listar().then((r) => setTipos(r.tipos.filter((t) => t.ativo))).catch(() => {})
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // busca de pacientes (debounce) — só quando não há um selecionado
  useEffect(() => {
    if (pacienteId !== null) return
    const q = nome.trim()
    if (q.length < 2) {
      setResultados([])
      return
    }
    const t = setTimeout(() => {
      pacientesApi
        .buscar(q)
        .then((r) => setResultados(r.pacientes))
        .catch(() => setResultados([]))
    }, 250)
    return () => clearTimeout(t)
  }, [nome, pacienteId])

  // taxa da combinação forma + banco
  useEffect(() => {
    if (!forma || !bancoId) {
      setTaxaBp(null)
      return
    }
    taxasApi
      .lookup(forma, Number(bancoId))
      .then((r) => setTaxaBp(r.percentual_bp))
      .catch(() => setTaxaBp(null))
  }, [forma, bancoId])

  // subtipos (subcategorias) do tipo escolhido
  useEffect(() => {
    setSubtipoId('')
    if (!tipoId) {
      setSubtipos([])
      return
    }
    subtiposEntradaApi
      .listar(Number(tipoId))
      .then((r) => setSubtipos(r.subtipos.filter((x) => x.ativo)))
      .catch(() => setSubtipos([]))
  }, [tipoId])

  const selecionar = (p: Paciente) => {
    setPacienteId(p.id)
    setNome(p.nome)
    setCpf(p.cpf ? formatCpf(p.cpf) : '')
    setEmail(p.email ?? '')
    setResultados([])
  }

  const centavos = parseCentavos(valor)
  const liquido = taxaBp != null ? centavos - Math.round((centavos * taxaBp) / 10000) : centavos

  // Paciente só é pedido quando o tipo escolhido é "Consulta".
  const tipoSelecionado = tipos.find((t) => String(t.id) === tipoId)
  const ehConsulta = (tipoSelecionado?.nome ?? '').toLowerCase().includes('consulta')

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    if (!tipoId) return setErro('Escolha o tipo de entrada.')
    if (!forma) return setErro('Escolha a forma de pagamento.')
    if (centavos <= 0) return setErro('Informe um valor válido.')

    const dados: NovaEntrada = {
      forma,
      valor_centavos: centavos,
      banco_id: bancoId ? Number(bancoId) : null,
      tipo_id: Number(tipoId),
      subtipo_id: subtipoId ? Number(subtipoId) : null,
      observacao: observacao.trim() || undefined,
    }
    if (ehConsulta) {
      if (pacienteId !== null) dados.paciente_id = pacienteId
      else if (nome.trim())
        dados.paciente = {
          nome: nome.trim(),
          cpf: cpf.replace(/\D/g, '') || undefined,
          email: email.trim() || undefined,
        }
    }

    setEnviando(true)
    try {
      await entradasApi.criar(dados)
      onSalvo()
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label="Nova entrada" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>Nova entrada</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}

          {/* Tipo de entrada (obrigatório) — no topo */}
          <label className={e.campo}>
            <span className={e.label}>Tipo de entrada</span>
            <select className={e.input} value={tipoId} onChange={(ev) => setTipoId(ev.target.value)}>
              <option value="">Selecione…</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </label>

          {/* Subcategoria — só quando o tipo escolhido tiver subcategorias */}
          {subtipos.length > 0 && (
            <label className={e.campo}>
              <span className={e.label}>Profissional</span>
              <select className={e.input} value={subtipoId} onChange={(ev) => setSubtipoId(ev.target.value)}>
                <option value="">Selecione o profissional</option>
                {subtipos.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.rotulo}</option>
                ))}
              </select>
            </label>
          )}

          {/* Paciente — só aparece quando o tipo é "Consulta" */}
          {ehConsulta && (
            <div className={e.grupo}>
              <span className={e.grupoTit}>Paciente</span>
              <div className={e.autoWrap}>
                <input
                  className={e.input}
                  value={nome}
                  onChange={(ev) => {
                    setNome(ev.target.value)
                    if (pacienteId !== null) setPacienteId(null)
                  }}
                  placeholder="Nome do paciente"
                  autoComplete="off"
                />
                {pacienteId !== null && <span className={e.chip}>cadastrado</span>}
                {pacienteId === null && resultados.length > 0 && (
                  <ul className={e.dropdown}>
                    {resultados.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => selecionar(p)}>
                          <strong>{p.nome}</strong>
                          {p.cpf && <span className={e.dropCpf}> · {formatCpf(p.cpf)}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={e.linha2}>
                <input className={e.input} value={cpf} onChange={(ev) => setCpf(ev.target.value)} placeholder="CPF (opcional)" readOnly={pacienteId !== null} inputMode="numeric" />
                <input className={e.input} value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="E-mail (opcional)" readOnly={pacienteId !== null} type="email" />
              </div>
            </div>
          )}

          {/* Valor */}
          <label className={e.campo}>
            <span className={e.label}>Valor</span>
            <div className={e.valorWrap}>
              <span className={e.prefixo}>R$</span>
              <input className={e.input} value={valor} onChange={(ev) => setValor(ev.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
          </label>

          {/* Forma + Banco (espécie → vai para a caixa, banco bloqueado) */}
          <div className={e.linha2}>
            <label className={e.campo}>
              <span className={e.label}>Forma de pagamento</span>
              <select
                className={e.input}
                value={forma}
                onChange={(ev) => {
                  const f = ev.target.value as Forma | ''
                  setForma(f)
                  if (f === 'especie') setBancoId('')
                }}
              >
                <option value="">Selecione…</option>
                {FORMAS.map((f) => (
                  <option key={f} value={f}>{FORMA_LABEL[f]}</option>
                ))}
              </select>
            </label>
            <label className={e.campo}>
              <span className={e.label}>Banco de destino</span>
              <select
                className={e.input}
                value={forma === 'especie' ? '' : bancoId}
                onChange={(ev) => setBancoId(ev.target.value)}
                disabled={forma === 'especie'}
              >
                <option value="">{forma === 'especie' ? 'Caixa (espécie)' : 'Selecione…'}</option>
                {forma !== 'especie' && bancos.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Taxa / líquido */}
          {taxaBp != null && centavos > 0 && (
            <div className={e.taxaBox}>
              <span>Taxa: <strong>{(taxaBp / 100).toLocaleString('pt-BR')}%</strong></span>
              <span>Líquido: <strong>{brl(liquido)}</strong></span>
            </div>
          )}

          <label className={e.campo}>
            <span className={e.label}>Observação (opcional)</span>
            <input className={e.input} value={observacao} onChange={(ev) => setObservacao(ev.target.value)} placeholder="ex.: consulta de retorno" />
          </label>

          <div className={e.rodape}>
            <span className={e.dataNota}>Data: hoje (automática)</span>
            <button type="submit" className={e.submit} disabled={enviando}>
              {enviando ? 'Salvando…' : 'Registrar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ---- Modal: editar entrada (só gestor, exige senha) --------------- */
function EditarEntradaModal({ entrada, onClose, onSalvo }: { entrada: EntradaDetalhe; onClose: () => void; onSalvo: () => void }) {
  const [data, setData] = useState(entrada.data.slice(0, 10))
  const [valor, setValor] = useState((entrada.valor_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
  const [forma, setForma] = useState<Forma>(entrada.forma)
  const [bancoId, setBancoId] = useState(entrada.banco_id ? String(entrada.banco_id) : '')
  const [tipoId, setTipoId] = useState(entrada.tipo_id ? String(entrada.tipo_id) : '')
  const [subtipoId, setSubtipoId] = useState(entrada.subtipo_id ? String(entrada.subtipo_id) : '')
  const [observacao, setObservacao] = useState(entrada.observacao ?? '')
  const [senha, setSenha] = useState('')
  const [bancos, setBancos] = useState<Banco[]>([])
  const [tipos, setTipos] = useState<TipoEntrada[]>([])
  const [subtipos, setSubtipos] = useState<SubtipoEntrada[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // subtipos do tipo escolhido; mantém o selecionado se ainda pertencer ao tipo.
  useEffect(() => {
    if (!tipoId) {
      setSubtipos([])
      setSubtipoId('')
      return
    }
    subtiposEntradaApi
      .listar(Number(tipoId))
      .then((r) => {
        setSubtipos(r.subtipos.filter((x) => x.ativo))
        setSubtipoId((cur) => (cur && r.subtipos.some((x) => String(x.id) === cur) ? cur : ''))
      })
      .catch(() => setSubtipos([]))
  }, [tipoId])

  useEffect(() => {
    bancosApi.listar().then((r) => setBancos(r.bancos.filter((b) => b.ativo))).catch(() => {})
    tiposEntradaApi.listar().then((r) => setTipos(r.tipos.filter((t) => t.ativo))).catch(() => {})
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
    const centavos = parseCentavos(valor)
    if (centavos <= 0) return setErro('Informe um valor válido.')
    if (forma !== 'especie' && !bancoId) return setErro('Escolha o banco.')
    if (!senha) return setErro('Digite sua senha para confirmar.')

    const dados: EditarEntrada = {
      data: data || undefined,
      forma,
      valor_centavos: centavos,
      banco_id: forma === 'especie' ? null : Number(bancoId),
      tipo_id: tipoId ? Number(tipoId) : null,
      subtipo_id: subtipoId ? Number(subtipoId) : null,
      observacao: observacao.trim(),
    }
    setEnviando(true)
    try {
      await entradasApi.editar(entrada.id, dados, senha)
      onSalvo()
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label="Editar entrada" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>Editar entrada</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}
          {entrada.paciente_nome && <p className={e.dataNota}>Paciente: {entrada.paciente_nome}</p>}

          <div className={e.linha2}>
            <label className={e.campo}>
              <span className={e.label}>Data</span>
              <input className={e.input} type="date" value={data} onChange={(ev) => setData(ev.target.value)} />
            </label>
            <label className={e.campo}>
              <span className={e.label}>Valor</span>
              <div className={e.valorWrap}>
                <span className={e.prefixo}>R$</span>
                <input className={e.input} value={valor} onChange={(ev) => setValor(ev.target.value)} placeholder="0,00" inputMode="decimal" />
              </div>
            </label>
          </div>

          <div className={e.linha2}>
            <label className={e.campo}>
              <span className={e.label}>Forma de pagamento</span>
              <select
                className={e.input}
                value={forma}
                onChange={(ev) => {
                  const f = ev.target.value as Forma
                  setForma(f)
                  if (f === 'especie') setBancoId('')
                }}
              >
                {FORMAS.map((f) => <option key={f} value={f}>{FORMA_LABEL[f]}</option>)}
              </select>
            </label>
            <label className={e.campo}>
              <span className={e.label}>Banco de destino</span>
              <select
                className={e.input}
                value={forma === 'especie' ? '' : bancoId}
                onChange={(ev) => setBancoId(ev.target.value)}
                disabled={forma === 'especie'}
              >
                <option value="">{forma === 'especie' ? 'Caixa (espécie)' : 'Selecione…'}</option>
                {forma !== 'especie' && bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </label>
          </div>

          <label className={e.campo}>
            <span className={e.label}>Tipo de entrada</span>
            <select className={e.input} value={tipoId} onChange={(ev) => setTipoId(ev.target.value)}>
              <option value="">Sem tipo</option>
              {/* preserva o tipo atual mesmo que tenha sido desativado */}
              {entrada.tipo_id && !tipos.some((t) => t.id === entrada.tipo_id) && (
                <option value={entrada.tipo_id}>{entrada.tipo_nome ?? 'Tipo atual'}</option>
              )}
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </label>

          {(subtipos.length > 0 || subtipoId) && (
            <label className={e.campo}>
              <span className={e.label}>Profissional</span>
              <select className={e.input} value={subtipoId} onChange={(ev) => setSubtipoId(ev.target.value)}>
                <option value="">Selecione o profissional</option>
                {/* preserva a subcategoria atual mesmo que tenha sido desativada */}
                {entrada.subtipo_id &&
                  String(entrada.tipo_id) === tipoId &&
                  !subtipos.some((x) => x.id === entrada.subtipo_id) && (
                    <option value={entrada.subtipo_id}>{entrada.subtipo_nome ?? 'Subcategoria atual'}</option>
                  )}
                {subtipos.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.rotulo}</option>
                ))}
              </select>
            </label>
          )}

          <label className={e.campo}>
            <span className={e.label}>Observação</span>
            <input className={e.input} value={observacao} onChange={(ev) => setObservacao(ev.target.value)} />
          </label>

          <label className={e.campo}>
            <span className={e.label}>Sua senha (confirmação)</span>
            <input className={e.input} type="password" value={senha} onChange={(ev) => setSenha(ev.target.value)} placeholder="senha do gestor" autoComplete="current-password" />
          </label>

          <div className={e.rodape}>
            <span className={e.dataNota}>A edição fica registrada nos logs</span>
            <button type="submit" className={e.submit} disabled={enviando}>
              {enviando ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
