import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import {
  ApiError,
  bancosApi,
  saldosApi,
  transferenciasApi,
  type Banco,
  type NovaTransferencia,
  type SaldoLocal,
  type TransferenciaDetalhe,
} from '../lib/api'
import { brl, dataBR, hojeISO, parseCentavos } from '../lib/format'
import s from './page.module.css'
import e from './Entradas.module.css'
import t from './Transferencias.module.css'

const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')
const CAIXA = 'caixa'
const nomeLocal = (n: string | null) => n ?? 'Caixa (espécie)'
const chaveLocal = (bancoId: number | null) => (bancoId == null ? CAIXA : String(bancoId))
const COLUNAS = ['Data', 'De', 'Para', 'Valor', '']

export default function Transferencias() {
  const [saldos, setSaldos] = useState<SaldoLocal[] | null>(null)
  const [total, setTotal] = useState(0)
  const [itens, setItens] = useState<TransferenciaDetalhe[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [saldoModal, setSaldoModal] = useState(false)

  const carregar = () => {
    saldosApi.obter().then((r) => { setSaldos(r.saldos); setTotal(r.total_centavos) }).catch((x) => setErro(msg(x)))
    transferenciasApi.listar().then((r) => setItens(r.transferencias)).catch((x) => setErro(msg(x)))
  }
  useEffect(carregar, [])

  const excluir = async (tr: TransferenciaDetalhe) => {
    if (!window.confirm(`Excluir a transferência de ${nomeLocal(tr.origem_nome)} para ${nomeLocal(tr.destino_nome)}?`)) return
    setErro(null)
    try {
      await transferenciasApi.excluir(tr.id)
      carregar()
    } catch (x) {
      setErro(msg(x))
    }
  }

  return (
    <div className={s.stack}>
      {erro && <div className={e.erro}>{erro}</div>}

      {/* Card de saldos por local */}
      <Card
        title="Saldos por local"
        action={<Badge tone="neutral">{(saldos?.length ?? 0)} locais</Badge>}
      >
        <p className={t.aviso}>Quanto tem em cada banco e na caixa (espécie), somando entradas, saídas e transferências.</p>
        {saldos === null ? (
          <div className={e.carregando}>Carregando…</div>
        ) : (
          <>
            <div className={t.saldos}>
              {saldos.map((x) => (
                <div key={chaveLocal(x.banco_id)} className={t.saldoRow}>
                  <span className={t.saldoNome}>
                    <span className={`${t.dot} ${x.banco_id == null ? t.dotCaixa : ''}`} />
                    {x.nome}
                  </span>
                  <span className={x.saldo_centavos < 0 ? t.saldoNeg : t.saldoValor}>{brl(x.saldo_centavos)}</span>
                </div>
              ))}
              <div className={t.totalRow}>
                <span className={t.totalLabel}>Total geral</span>
                <span className={t.totalValor}>{brl(total)}</span>
              </div>
            </div>
            <div className={t.acoes}>
              <button type="button" className={s.btn} onClick={() => setSaldoModal(true)}>
                <Icon name="entrada" size={18} /> Definir saldo inicial
              </button>
              <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal(true)}>
                <Icon name="transfer" size={18} /> Nova transferência
              </button>
            </div>
          </>
        )}
      </Card>

      {/* Lista de transferências */}
      <Card
        title="Transferências registradas"
        action={<Badge tone="neutral">{itens?.length ?? 0} registros</Badge>}
      >
        <p className={t.aviso}>Só registra a movimentação (para onde o dinheiro foi) — não afeta o balanço.</p>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>{COLUNAS.map((c, i) => <th key={i} className={c === 'Valor' ? s.num : undefined}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {itens === null ? (
                <tr><td colSpan={COLUNAS.length}><div className={e.carregando}>Carregando…</div></td></tr>
              ) : itens.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>Nenhuma transferência ainda</span>
                      <span className={s.emptyText}>Clique em “Nova transferência” para registrar.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                itens.map((tr) => (
                  <tr key={tr.id}>
                    <td>{dataBR(tr.data)}</td>
                    <td>{nomeLocal(tr.origem_nome)}</td>
                    <td>{nomeLocal(tr.destino_nome)}</td>
                    <td className={s.num}>{brl(tr.valor_centavos)}</td>
                    <td>
                      <button type="button" className={e.vazio} style={{ color: 'var(--danger)', fontWeight: 600 }} onClick={() => excluir(tr)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <NovaTransferenciaModal onClose={() => setModal(false)} onSalvo={() => { setModal(false); carregar() }} />
      )}
      {saldoModal && saldos && (
        <SaldoInicialModal saldos={saldos} onClose={() => setSaldoModal(false)} onSalvo={() => { setSaldoModal(false); carregar() }} />
      )}
    </div>
  )
}

/* ---- Modal: definir saldo inicial --------------------------------- */
function SaldoInicialModal({ saldos, onClose, onSalvo }: { saldos: SaldoLocal[]; onClose: () => void; onSalvo: () => void }) {
  const [local, setLocal] = useState<string>(saldos[0] ? chaveLocal(saldos[0].banco_id) : CAIXA)
  const [valor, setValor] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const a = saldos.find((x) => chaveLocal(x.banco_id) === local)
    setValor(a ? (a.inicial_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '')
  }, [local, saldos])

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
    if (!senha) return setErro('Digite sua senha para confirmar.')
    const bancoId = local === CAIXA ? null : Number(local)
    setEnviando(true)
    try {
      await saldosApi.definirInicial(bancoId, parseCentavos(valor), senha)
      onSalvo()
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label="Definir saldo inicial" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>Definir saldo inicial</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}
          <p className={t.aviso}>Quanto já existe neste local hoje (antes de entradas/saídas do sistema).</p>

          <label className={e.campo}>
            <span className={e.label}>Local</span>
            <select className={e.input} value={local} onChange={(ev) => setLocal(ev.target.value)}>
              {saldos.map((x) => <option key={chaveLocal(x.banco_id)} value={chaveLocal(x.banco_id)}>{x.nome}</option>)}
            </select>
          </label>

          <label className={e.campo}>
            <span className={e.label}>Valor inicial</span>
            <div className={e.valorWrap}>
              <span className={e.prefixo}>R$</span>
              <input className={e.input} value={valor} onChange={(ev) => setValor(ev.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
          </label>

          <label className={e.campo}>
            <span className={e.label}>Sua senha (confirmação)</span>
            <input className={e.input} type="password" value={senha} onChange={(ev) => setSenha(ev.target.value)} placeholder="senha do gestor" autoComplete="current-password" />
          </label>

          <div className={e.rodape}>
            <span className={e.dataNota}>Substitui o saldo inicial anterior deste local</span>
            <button type="submit" className={e.submit} disabled={enviando}>
              {enviando ? 'Salvando…' : 'Salvar saldo inicial'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ---- Modal: nova transferência ------------------------------------ */
function NovaTransferenciaModal({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  const [data, setData] = useState(hojeISO())
  const [valor, setValor] = useState('')
  const [origem, setOrigem] = useState<string>(CAIXA)
  const [destino, setDestino] = useState<string>('')
  const [observacao, setObservacao] = useState('')
  const [bancos, setBancos] = useState<Banco[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    bancosApi.listar().then((r) => setBancos(r.bancos.filter((b) => b.ativo))).catch(() => {})
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const toBanco = (v: string): number | null => (v === CAIXA ? null : Number(v))

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    const centavos = parseCentavos(valor)
    if (centavos <= 0) return setErro('Informe um valor válido.')
    if (!origem || !destino) return setErro('Escolha a origem e o destino.')
    if (origem === destino) return setErro('Origem e destino não podem ser o mesmo local.')

    const dados: NovaTransferencia = {
      valor_centavos: centavos,
      data: data || undefined,
      origem_banco_id: toBanco(origem),
      destino_banco_id: toBanco(destino),
      observacao: observacao.trim() || undefined,
    }
    setEnviando(true)
    try {
      await transferenciasApi.criar(dados)
      onSalvo()
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  const opcoes = (
    <>
      <option value={CAIXA}>Caixa (espécie)</option>
      {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
    </>
  )

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div className={e.modal} role="dialog" aria-modal="true" aria-label="Nova transferência" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className={e.head}>
          <h2 className={e.titulo}>Nova transferência</h2>
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
              <span className={e.label}>De (origem)</span>
              <select className={e.input} value={origem} onChange={(ev) => setOrigem(ev.target.value)}>
                {opcoes}
              </select>
            </label>
            <label className={e.campo}>
              <span className={e.label}>Para (destino)</span>
              <select className={e.input} value={destino} onChange={(ev) => setDestino(ev.target.value)}>
                <option value="">Selecione…</option>
                {opcoes}
              </select>
            </label>
          </div>

          <label className={e.campo}>
            <span className={e.label}>Observação (opcional)</span>
            <input className={e.input} value={observacao} onChange={(ev) => setObservacao(ev.target.value)} placeholder="ex.: depósito do caixa" />
          </label>

          <div className={e.rodape}>
            <span className={e.dataNota}>Só registra o movimento (não afeta o balanço)</span>
            <button type="submit" className={e.submit} disabled={enviando}>
              {enviando ? 'Salvando…' : 'Registrar transferência'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
