import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import {
  ApiError,
  bancosApi,
  categoriasSaidaApi,
  saidasApi,
  type Banco,
  type CategoriaSaida,
  type FormaSaida,
  type NovaSaida,
  type SaidaDetalhe,
} from '../lib/api'
import { FORMA_LABEL, FORMAS_SAIDA, brl, dataBR, hojeISO, parseCentavos } from '../lib/format'
import s from './page.module.css'
import e from './Entradas.module.css'

const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')
const COLUNAS = ['Data', 'Categoria', 'Forma', 'Banco', 'Valor']

export default function Saidas() {
  const [saidas, setSaidas] = useState<SaidaDetalhe[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [modal, setModal] = useState(false)

  const carregar = () => {
    saidasApi
      .listar()
      .then((r) => setSaidas(r.saidas))
      .catch((x) => setErro(msg(x)))
  }
  useEffect(carregar, [])

  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters} />
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal(true)}>
          <Icon name="saida" size={18} /> Nova saída
        </button>
      </div>

      <Card title="Saídas registradas" action={<Badge tone="neutral">{saidas?.length ?? 0} registros</Badge>}>
        {erro && <div className={e.erro}>{erro}</div>}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>{COLUNAS.map((c) => <th key={c} className={c === 'Valor' ? s.num : undefined}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {saidas === null ? (
                <tr><td colSpan={COLUNAS.length}><div className={e.carregando}>Carregando…</div></td></tr>
              ) : saidas.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>Nenhuma saída ainda</span>
                      <span className={s.emptyText}>Clique em “Nova saída” para registrar.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                saidas.map((sd) => (
                  <tr key={sd.id}>
                    <td>{dataBR(sd.data)}</td>
                    <td>
                      {sd.categoria_nome ?? <span className={e.vazio}>—</span>}
                      {sd.subcategoria_nome && <span className={e.dropCpf}> › {sd.subcategoria_nome}</span>}
                    </td>
                    <td>{FORMA_LABEL[sd.forma]}</td>
                    <td>{sd.banco_nome ?? <span className={e.vazio}>—</span>}</td>
                    <td className={s.num}>{brl(sd.valor_centavos)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                <option value="">Selecione…</option>
                {FORMAS_SAIDA.map((f) => <option key={f} value={f}>{FORMA_LABEL[f]}</option>)}
              </select>
            </label>
            {precisaBanco && (
              <label className={e.campo}>
                <span className={e.label}>Banco de saída</span>
                <select className={e.input} value={bancoId} onChange={(ev) => setBancoId(ev.target.value)}>
                  <option value="">Selecione…</option>
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
                  <optgroup key={central.id} label={central.nome}>
                    {filhas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </optgroup>
                )
              })}
            </select>
          </label>

          {subs.length > 0 && (
            <label className={e.campo}>
              <span className={e.label}>Subcategoria</span>
              <select className={e.input} value={subcategoriaId} onChange={(ev) => setSubcategoriaId(ev.target.value)}>
                <option value="">Selecione…</option>
                {subs.map((su) => <option key={su.id} value={su.id}>{su.nome}</option>)}
              </select>
            </label>
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
