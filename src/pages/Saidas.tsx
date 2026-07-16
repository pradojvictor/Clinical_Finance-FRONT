import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import SeletorMesAno from '../components/ui/SeletorMesAno'
import {
  ApiError,
  bancosApi,
  categoriasSaidaApi,
  saidasApi,
  profissionaisApi,
  type BaseSalario,
  type Banco,
  type CategoriaSaida,
  type EditarSaida,
  type FormaSaida,
  type NovaSaida,
  type SaidaDetalhe,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import { FORMA_LABEL, FORMAS_SAIDA, brl, dataBR, hojeISO, parseCentavos, periodoMes } from '../lib/format'
import s from './page.module.css'
import e from './Entradas.module.css'

const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')
const COLUNAS = ['Data', 'Categoria', 'Forma', 'Banco', 'Valor', '']
const PAGINA = 20

export default function Saidas() {
  const agora = new Date()
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [ano, setAno] = useState(agora.getFullYear())
  const [saidas, setSaidas] = useState<SaidaDetalhe[] | null>(null)
  const [busca, setBusca] = useState('')
  const [visiveis, setVisiveis] = useState(PAGINA)
  const [erro, setErro] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<SaidaDetalhe | null>(null)
  const { user } = useAuth()
  const soLeitura = user?.perfil === 'profissional'

  const carregar = useCallback(() => {
    const { de, ate } = periodoMes(ano, mes)
    setSaidas(null)
    setErro(null)
    saidasApi
      .listar({ de, ate })
      .then((r) => setSaidas(r.saidas))
      .catch((x) => setErro(msg(x)))
  }, [ano, mes])
  useEffect(() => {
    carregar()
  }, [carregar])
  useEffect(() => setVisiveis(PAGINA), [busca, mes, ano])

  const q = busca.trim().toLowerCase()
  const filtradas = (saidas ?? []).filter((sd) => {
    if (!q) return true
    return `${sd.categoria_nome ?? ''} ${sd.subcategoria_nome ?? ''} ${FORMA_LABEL[sd.forma]} ${sd.banco_nome ?? ''}`.toLowerCase().includes(q)
  })
  const total = filtradas.reduce((acc, sd) => acc + sd.valor_centavos, 0)
  const mostradas = filtradas.slice(0, visiveis)

  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <SeletorMesAno mes={mes} ano={ano} onMes={setMes} onAno={setAno} />
          <input
            className={s.input}
            type="search"
            placeholder="Buscar categoria, forma, banco…"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
          />
        </div>
        {!soLeitura && (
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal(true)}>
            <Icon name="saida" size={18} /> Nova saída
          </button>
        )}
      </div>

      <Card
        title="Saídas registradas"
        action={<Badge tone="neutral">{filtradas.length} registros · Total {brl(total)}</Badge>}
      >
        {erro && <div className={e.erro}>{erro}</div>}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>{COLUNAS.map((c, i) => <th key={i} className={c === 'Valor' ? s.num : undefined}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {saidas === null ? (
                <tr><td colSpan={COLUNAS.length}><div className={e.carregando}>Carregando…</div></td></tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>{busca ? 'Nenhuma saída encontrada' : 'Nenhuma saída ainda'}</span>
                      <span className={s.emptyText}>{busca ? 'Ajuste a busca.' : 'Clique em “Nova saída” para registrar.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                mostradas.map((sd) => (
                  <tr key={sd.id}>
                    <td>{dataBR(sd.data)}</td>
                    <td>
                      {sd.categoria_nome ?? <span className={e.vazio}>—</span>}
                      {sd.subcategoria_nome && <span className={e.dropCpf}> › {sd.subcategoria_nome}</span>}
                    </td>
                    <td>{FORMA_LABEL[sd.forma]}</td>
                    <td>{sd.banco_nome ?? <span className={e.vazio}>—</span>}</td>
                    <td className={s.num}>{brl(sd.valor_centavos)}</td>
                    <td className={s.num}>
                      {!soLeitura && (
                        <button type="button" className={e.acaoLink} onClick={() => setEditando(sd)}>Editar</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtradas.length > 0 && (
          <div className={s.verMais}>
            <span className={s.emptyText}>Mostrando {mostradas.length} de {filtradas.length}</span>
            {visiveis < filtradas.length && (
              <button type="button" className={e.acaoLink} onClick={() => setVisiveis((v) => v + PAGINA)}>Ver mais</button>
            )}
          </div>
        )}
      </Card>

      {modal && (
        <NovaSaidaModal
          onClose={() => setModal(false)}
          onSalvo={() => {
            setModal(false)
            carregar()
          }}
        />
      )}

      {editando && (
        <EditarSaidaModal
          saida={editando}
          onClose={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null)
            carregar()
          }}
        />
      )}
    </div>
  )
}

function NovaSaidaModal({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  const [data, setData] = useState(hojeISO())
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<FormaSaida | ''>('')
  const [bancoId, setBancoId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [subcategoriaId, setSubcategoriaId] = useState('')
  const [observacao, setObservacao] = useState('')

  const [bancos, setBancos] = useState<Banco[]>([])
  const [cats, setCats] = useState<CategoriaSaida[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Pagamento por porcentagem: o período do cálculo é escolhido na hora.
  const mesAtual = useMemo(() => {
    const d = new Date()
    return periodoMes(d.getFullYear(), d.getMonth() + 1)
  }, [])
  const [calcDe, setCalcDe] = useState(mesAtual.de)
  const [calcAte, setCalcAte] = useState(mesAtual.ate)
  const [base, setBase] = useState<BaseSalario | null>(null)

  // Profissional escolhido (quando a subcategoria é um funcionário).
  const profId = useMemo(() => {
    const sub = cats.find((c) => String(c.id) === subcategoriaId && c.nivel === 'subcategoria')
    return sub?.profissional_id ?? null
  }, [cats, subcategoriaId])

  // Ao puxar o profissional, calcula pela % dele no período e preenche o valor.
  useEffect(() => {
    if (profId == null) {
      setBase(null)
      return
    }
    let vivo = true
    profissionaisApi
      .base(profId, calcDe, calcAte)
      .then((r) => {
        if (!vivo) return
        setBase(r.base)
        if (r.base.percentual_bp > 0) setValor((r.base.valor_centavos / 100).toFixed(2).replace('.', ','))
      })
      .catch(() => {
        if (vivo) setBase(null)
      })
    return () => {
      vivo = false
    }
  }, [profId, calcDe, calcAte])

  useEffect(() => {
    bancosApi.listar().then((r) => setBancos(r.bancos.filter((b) => b.ativo))).catch(() => {})
    categoriasSaidaApi.listar().then((r) => setCats(r.categorias.filter((c) => c.ativo))).catch(() => {})
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Árvore (só ativos): centrais → categorias; subcategorias por categoria.
  const centrais = useMemo(() => cats.filter((c) => c.nivel === 'central'), [cats])
  const categoriasDe = (centralId: number) =>
    cats.filter((c) => c.nivel === 'categoria' && c.parent_id === centralId)
  const subs = useMemo(
    () => (categoriaId ? cats.filter((c) => c.nivel === 'subcategoria' && c.parent_id === Number(categoriaId)) : []),
    [cats, categoriaId],
  )
  // Se as subcategorias da categoria escolhida são funcionários, o rótulo vira "Profissional".
  const subEhProfissional = subs.some((su) => su.profissional_id != null)
  const temCategorias = cats.some((c) => c.nivel === 'categoria')

  const precisaBanco = forma !== '' && forma !== 'especie'

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    const centavos = parseCentavos(valor)
    if (!forma) return setErro('Escolha a forma de pagamento.')
    if (centavos <= 0) return setErro('Informe um valor válido.')
    if (precisaBanco && !bancoId) return setErro('Escolha o banco de onde o dinheiro sai.')
    if (!categoriaId) return setErro('Escolha a categoria.')
    if (subs.length > 0 && !subcategoriaId) return setErro('Escolha a subcategoria.')

    const dados: NovaSaida = {
      forma,
      valor_centavos: centavos,
      data: data || undefined,
      categoria_id: Number(categoriaId),
      banco_id: precisaBanco ? Number(bancoId) : null,
      subcategoria_id: subs.length > 0 ? Number(subcategoriaId) : null,
      observacao: observacao.trim() || undefined,
      // Pagamento de profissional: manda o recorte pro histórico congelar a base.
      ...(profId != null ? { periodo_de: calcDe, periodo_ate: calcAte } : {}),
    }
    setEnviando(true)
    try {
      await saidasApi.criar(dados)
      onSalvo()
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label="Nova saída" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>Nova saída</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}

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

          {/* Forma + Banco (banco some na espécie) */}
          <div className={e.linha2}>
            <label className={e.campo}>
              <span className={e.label}>Forma de pagamento</span>
              <select
                className={e.input}
                value={forma}
                onChange={(ev) => {
                  const f = ev.target.value as FormaSaida | ''
                  setForma(f)
                  if (f === 'especie') setBancoId('')
                }}
              >
                <option value="">{subEhProfissional ? 'Selecione o profissional' : 'Selecione…'}</option>
                {FORMAS_SAIDA.map((f) => <option key={f} value={f}>{FORMA_LABEL[f]}</option>)}
              </select>
            </label>
            {precisaBanco && (
              <label className={e.campo}>
                <span className={e.label}>Banco de saída</span>
                <select className={e.input} value={bancoId} onChange={(ev) => setBancoId(ev.target.value)}>
                  <option value="">{subEhProfissional ? 'Selecione o profissional' : 'Selecione…'}</option>
                  {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </label>
            )}
          </div>

          {/* Categoria + Subcategoria (2º select só quando houver) */}
          <label className={e.campo}>
            <span className={e.label}>Categoria</span>
            <select
              className={e.input}
              value={categoriaId}
              onChange={(ev) => {
                setCategoriaId(ev.target.value)
                setSubcategoriaId('')
              }}
              disabled={!temCategorias}
            >
              <option value="">{temCategorias ? 'Selecione…' : 'Cadastre categorias no Admin'}</option>
              {centrais.map((central) => {
                const filhas = categoriasDe(central.id)
                if (filhas.length === 0) return null
                return (
                  <optgroup key={central.id} label={central.rotulo}>
                    {filhas.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
                  </optgroup>
                )
              })}
            </select>
          </label>

          {subs.length > 0 && (
            <label className={e.campo}>
              <span className={e.label}>{subEhProfissional ? 'Profissional' : 'Subcategoria'}</span>
              <select className={e.input} value={subcategoriaId} onChange={(ev) => setSubcategoriaId(ev.target.value)}>
                <option value="">{subEhProfissional ? 'Selecione o profissional' : 'Selecione…'}</option>
                {subs.map((su) => <option key={su.id} value={su.id}>{su.rotulo}</option>)}
              </select>
            </label>
          )}

          {/* Pagamento por porcentagem: período do cálculo + base (preenche o valor) */}
          {profId != null && (
            <>
              <div className={e.linha2}>
                <label className={e.campo}>
                  <span className={e.label}>Calcular de</span>
                  <input className={e.input} type="date" value={calcDe} onChange={(ev) => setCalcDe(ev.target.value)} />
                </label>
                <label className={e.campo}>
                  <span className={e.label}>até</span>
                  <input className={e.input} type="date" value={calcAte} onChange={(ev) => setCalcAte(ev.target.value)} />
                </label>
              </div>
              {base && (
                <div className={e.taxaBox}>
                  {base.percentual_bp > 0 ? (
                    <span>
                      {base.qtd_entradas} entrada(s) · líquido {brl(base.entradas_liquido_centavos)} ×{' '}
                      {String(base.percentual_bp / 100).replace('.', ',')}% ={' '}
                      <strong>{brl(base.valor_centavos)}</strong>
                    </span>
                  ) : (
                    <span>Sem porcentagem para {base.profissional_nome} — defina em Admin → Salários.</span>
                  )}
                </div>
              )}
            </>
          )}

          <label className={e.campo}>
            <span className={e.label}>Observação (opcional)</span>
            <input className={e.input} value={observacao} onChange={(ev) => setObservacao(ev.target.value)} />
          </label>

          <div className={e.rodape}>
            <span className={e.dataNota}>Registro exclusivo do gestor</span>
            <button type="submit" className={e.submit} disabled={enviando}>
              {enviando ? 'Salvando…' : 'Registrar saída'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ---- Modal: editar saída (só gestor, exige senha) ----------------- */
function EditarSaidaModal({ saida, onClose, onSalvo }: { saida: SaidaDetalhe; onClose: () => void; onSalvo: () => void }) {
  const [data, setData] = useState(saida.data.slice(0, 10))
  const [valor, setValor] = useState((saida.valor_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
  const [forma, setForma] = useState<FormaSaida>(saida.forma)
  const [bancoId, setBancoId] = useState(saida.banco_id ? String(saida.banco_id) : '')
  const [categoriaId, setCategoriaId] = useState(saida.categoria_id ? String(saida.categoria_id) : '')
  const [subcategoriaId, setSubcategoriaId] = useState(saida.subcategoria_id ? String(saida.subcategoria_id) : '')
  const [observacao, setObservacao] = useState(saida.observacao ?? '')
  const [senha, setSenha] = useState('')

  const [bancos, setBancos] = useState<Banco[]>([])
  const [cats, setCats] = useState<CategoriaSaida[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    bancosApi.listar().then((r) => setBancos(r.bancos.filter((b) => b.ativo))).catch(() => {})
    categoriasSaidaApi.listar().then((r) => setCats(r.categorias.filter((c) => c.ativo))).catch(() => {})
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const centrais = useMemo(() => cats.filter((c) => c.nivel === 'central'), [cats])
  const categoriasDe = (centralId: number) => cats.filter((c) => c.nivel === 'categoria' && c.parent_id === centralId)
  const subs = useMemo(
    () => (categoriaId ? cats.filter((c) => c.nivel === 'subcategoria' && c.parent_id === Number(categoriaId)) : []),
    [cats, categoriaId],
  )
  // Se as subcategorias da categoria escolhida são funcionários, o rótulo vira "Profissional".
  const subEhProfissional = subs.some((su) => su.profissional_id != null)
  const temCategorias = cats.some((c) => c.nivel === 'categoria')
  const precisaBanco = forma !== 'especie'

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    const centavos = parseCentavos(valor)
    if (centavos <= 0) return setErro('Informe um valor válido.')
    if (precisaBanco && !bancoId) return setErro('Escolha o banco de onde o dinheiro sai.')
    if (!categoriaId) return setErro('Escolha a categoria.')
    if (subs.length > 0 && !subcategoriaId) return setErro('Escolha a subcategoria.')
    if (!senha) return setErro('Digite sua senha para confirmar.')

    const dados: EditarSaida = {
      forma,
      valor_centavos: centavos,
      data: data || undefined,
      categoria_id: Number(categoriaId),
      banco_id: precisaBanco ? Number(bancoId) : null,
      subcategoria_id: subs.length > 0 ? Number(subcategoriaId) : null,
      observacao: observacao.trim(),
    }
    setEnviando(true)
    try {
      await saidasApi.editar(saida.id, dados, senha)
      onSalvo()
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label="Editar saída" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>Editar saída</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}

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
                  const f = ev.target.value as FormaSaida
                  setForma(f)
                  if (f === 'especie') setBancoId('')
                }}
              >
                {FORMAS_SAIDA.map((f) => <option key={f} value={f}>{FORMA_LABEL[f]}</option>)}
              </select>
            </label>
            {precisaBanco && (
              <label className={e.campo}>
                <span className={e.label}>Banco de saída</span>
                <select className={e.input} value={bancoId} onChange={(ev) => setBancoId(ev.target.value)}>
                  <option value="">{subEhProfissional ? 'Selecione o profissional' : 'Selecione…'}</option>
                  {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </label>
            )}
          </div>

          <label className={e.campo}>
            <span className={e.label}>Categoria</span>
            <select
              className={e.input}
              value={categoriaId}
              onChange={(ev) => {
                setCategoriaId(ev.target.value)
                setSubcategoriaId('')
              }}
              disabled={!temCategorias}
            >
              <option value="">{temCategorias ? 'Selecione…' : 'Cadastre categorias no Admin'}</option>
              {centrais.map((central) => {
                const filhas = categoriasDe(central.id)
                if (filhas.length === 0) return null
                return (
                  <optgroup key={central.id} label={central.rotulo}>
                    {filhas.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
                  </optgroup>
                )
              })}
            </select>
          </label>

          {subs.length > 0 && (
            <label className={e.campo}>
              <span className={e.label}>{subEhProfissional ? 'Profissional' : 'Subcategoria'}</span>
              <select className={e.input} value={subcategoriaId} onChange={(ev) => setSubcategoriaId(ev.target.value)}>
                <option value="">{subEhProfissional ? 'Selecione o profissional' : 'Selecione…'}</option>
                {subs.map((su) => <option key={su.id} value={su.id}>{su.rotulo}</option>)}
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
