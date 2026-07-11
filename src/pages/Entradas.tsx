import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import {
  ApiError,
  bancosApi,
  entradasApi,
  pacientesApi,
  taxasApi,
  type Banco,
  type EntradaDetalhe,
  type Forma,
  type NovaEntrada,
  type Paciente,
} from '../lib/api'
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

const COLUNAS = ['Data', 'Paciente', 'Forma', 'Banco', 'Valor', 'Líquido']

const ImportarModal = lazy(() => import('./ImportarModal'))

export default function Entradas() {
  const [entradas, setEntradas] = useState<EntradaDetalhe[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [importar, setImportar] = useState(false)

  const carregar = () => {
    entradasApi
      .listar()
      .then((r) => setEntradas(r.entradas))
      .catch((x) => setErro(msg(x)))
  }
  useEffect(carregar, [])

  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters} />
        <button type="button" className={s.btn} onClick={() => setImportar(true)}>
          <Icon name="proc" size={18} /> Importar planilha
        </button>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal(true)}>
          <Icon name="entrada" size={18} /> Nova entrada
        </button>
      </div>

      <Card
        title="Entradas registradas"
        action={<Badge tone="neutral">{entradas?.length ?? 0} registros</Badge>}
      >
        {erro && <div className={e.erro}>{erro}</div>}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {COLUNAS.map((c) => (
                  <th key={c} className={c === 'Valor' || c === 'Líquido' ? s.num : undefined}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas === null ? (
                <tr><td colSpan={COLUNAS.length}><div className={e.carregando}>Carregando…</div></td></tr>
              ) : entradas.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>Nenhuma entrada ainda</span>
                      <span className={s.emptyText}>Clique em “Nova entrada” para registrar.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                entradas.map((en) => (
                  <tr key={en.id}>
                    <td>{dataBR(en.data)}</td>
                    <td>{en.paciente_nome ?? <span className={e.vazio}>—</span>}</td>
                    <td>{FORMA_LABEL[en.forma]}</td>
                    <td>{en.banco_nome ?? <span className={e.vazio}>—</span>}</td>
                    <td className={s.num}>{brl(en.valor_centavos)}</td>
                    <td className={s.num}>{brl(en.valor_liquido_centavos)}</td>
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
  const [observacao, setObservacao] = useState('')

  const [bancos, setBancos] = useState<Banco[]>([])
  const [taxaBp, setTaxaBp] = useState<number | null>(null)
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

  const selecionar = (p: Paciente) => {
    setPacienteId(p.id)
    setNome(p.nome)
    setCpf(p.cpf ? formatCpf(p.cpf) : '')
    setEmail(p.email ?? '')
    setResultados([])
  }

  const centavos = parseCentavos(valor)
  const liquido = taxaBp != null ? centavos - Math.round((centavos * taxaBp) / 10000) : centavos

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    if (!forma) return setErro('Escolha a forma de pagamento.')
    if (centavos <= 0) return setErro('Informe um valor válido.')

    const dados: NovaEntrada = {
      forma,
      valor_centavos: centavos,
      banco_id: bancoId ? Number(bancoId) : null,
      observacao: observacao.trim() || undefined,
    }
    if (pacienteId !== null) dados.paciente_id = pacienteId
    else if (nome.trim())
      dados.paciente = {
        nome: nome.trim(),
        cpf: cpf.replace(/\D/g, '') || undefined,
        email: email.trim() || undefined,
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

          {/* Paciente */}
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

          {/* Valor */}
          <label className={e.campo}>
            <span className={e.label}>Valor</span>
            <div className={e.valorWrap}>
              <span className={e.prefixo}>R$</span>
              <input className={e.input} value={valor} onChange={(ev) => setValor(ev.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
          </label>

          {/* Forma + Banco */}
          <div className={e.linha2}>
            <label className={e.campo}>
              <span className={e.label}>Forma de pagamento</span>
              <select className={e.input} value={forma} onChange={(ev) => setForma(ev.target.value as Forma | '')}>
                <option value="">Selecione…</option>
                {FORMAS.map((f) => (
                  <option key={f} value={f}>{FORMA_LABEL[f]}</option>
                ))}
              </select>
            </label>
            <label className={e.campo}>
              <span className={e.label}>Banco de destino</span>
              <select className={e.input} value={bancoId} onChange={(ev) => setBancoId(ev.target.value)}>
                <option value="">Selecione…</option>
                {bancos.map((b) => (
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
