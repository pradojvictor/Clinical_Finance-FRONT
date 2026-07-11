import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import {
  ApiError,
  bancosApi,
  entradasApi,
  pacientesApi,
  type Banco,
  type Forma,
  type NovaEntrada,
} from '../lib/api'
import i from './ImportarModal.module.css'

const FORMA_LABEL: Record<Forma, string> = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  especie: 'Espécie',
}
const FORMAS: Forma[] = ['pix', 'debito', 'credito', 'especie']

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataBR = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '—')
const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')

interface Linha {
  nome: string
  data: string
  valor_centavos: number
  forma: Forma | ''
  banco_id: string
  status: 'cadastrado' | 'novo'
}

function pick(row: Record<string, unknown>, ...nomes: string[]): unknown {
  const keys = Object.keys(row)
  for (const n of nomes) {
    const k = keys.find((kk) => kk.trim().toLowerCase() === n)
    if (k) return row[k]
  }
  return null
}

function toISO(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10)
  if (typeof v === 'number') {
    const dc = XLSX.SSF.parse_date_code(v)
    if (dc) return `${dc.y}-${String(dc.m).padStart(2, '0')}-${String(dc.d).padStart(2, '0')}`
  }
  if (typeof v === 'string') {
    const m = v.match(/\d{4}-\d{2}-\d{2}/)
    if (m) return m[0]
  }
  return ''
}

export default function ImportarModal({ onClose, onSalvo }: { onClose: () => void; onSalvo: (r: { criadas: number; pacientes_novos: number }) => void }) {
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const [bancos, setBancos] = useState<Banco[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [parseando, setParseando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ criadas: number; pacientes_novos: number } | null>(null)
  const [bulkForma, setBulkForma] = useState<Forma | ''>('')
  const [bulkBanco, setBulkBanco] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bancosApi.listar().then((r) => setBancos(r.bancos.filter((b) => b.ativo))).catch(() => {})
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const escolher = async (file: File) => {
    setErro(null)
    setParseando(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { cellDates: true })
      const nomePlan = wb.SheetNames[0]
      if (!nomePlan) throw new Error('Planilha vazia.')
      const sheet = wb.Sheets[nomePlan]!
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

      const brutas = json
        .map((row) => ({
          nome: String(pick(row, 'pagador', 'nome') ?? '').trim(),
          data: toISO(pick(row, 'data_hora_evento', 'data')),
          valor_centavos: Math.round(Number(pick(row, 'valor', 'valor_pago') ?? 0) * 100),
        }))
        .filter((r) => r.nome && r.valor_centavos > 0)

      if (brutas.length === 0) throw new Error('Nenhuma linha com nome e valor encontrada.')

      // Verifica quais pacientes já existem (por nome exato).
      const comStatus: Linha[] = await Promise.all(
        brutas.map(async (b) => {
          let status: Linha['status'] = 'novo'
          try {
            const r = await pacientesApi.buscar(b.nome)
            if (r.pacientes.some((p) => p.nome.toLowerCase() === b.nome.toLowerCase())) status = 'cadastrado'
          } catch {
            /* ignore */
          }
          return { ...b, forma: '' as const, banco_id: '', status }
        }),
      )
      setLinhas(comStatus)
    } catch (x) {
      setErro(x instanceof Error ? x.message : 'Não foi possível ler a planilha.')
    } finally {
      setParseando(false)
    }
  }

  const setLinha = (idx: number, patch: Partial<Linha>) =>
    setLinhas((ls) => (ls ? ls.map((l, k) => (k === idx ? { ...l, ...patch } : l)) : ls))

  const aplicarTodas = () =>
    setLinhas((ls) =>
      ls ? ls.map((l) => ({ ...l, forma: bulkForma || l.forma, banco_id: bulkBanco || l.banco_id })) : ls,
    )

  const registrar = async () => {
    if (!linhas) return
    setErro(null)
    if (linhas.some((l) => !l.forma)) return setErro('Escolha a forma de pagamento de todas as linhas.')
    const payload: NovaEntrada[] = linhas.map((l) => ({
      forma: l.forma as Forma,
      valor_centavos: l.valor_centavos,
      data: l.data || undefined,
      banco_id: l.banco_id ? Number(l.banco_id) : null,
      paciente: { nome: l.nome },
    }))
    setEnviando(true)
    try {
      const r = await entradasApi.lote(payload)
      setResultado(r)
    } catch (x) {
      setErro(msg(x))
      setEnviando(false)
    }
  }

  return createPortal(
    <div className={i.backdrop} onMouseDown={onClose}>
      <div className={i.modal} role="dialog" aria-modal="true" aria-label="Importar planilha" onMouseDown={(e) => e.stopPropagation()}>
        <div className={i.head}>
          <h2 className={i.titulo}>Importar entradas (planilha)</h2>
          <button type="button" className={i.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className={i.body}>
          {erro && <div className={i.erro}>{erro}</div>}

          {resultado ? (
            <div className={i.sucesso}>
              <span className={i.check}>✓</span>
              <p className={i.sucessoTit}>{resultado.criadas} entradas registradas</p>
              <p className={i.sucessoTxt}>{resultado.pacientes_novos} paciente(s) novo(s) cadastrado(s).</p>
              <button type="button" className={i.btnPrimary} onClick={() => onSalvo(resultado)}>Concluir</button>
            </div>
          ) : !linhas ? (
            <div className={i.upload}>
              <p className={i.uploadTxt}>Selecione o arquivo <strong>.xlsx</strong> exportado do outro sistema.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className={i.file}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void escolher(f)
                }}
              />
              {parseando && <p className={i.uploadTxt}>Lendo planilha…</p>}
              <p className={i.dica}>Colunas usadas: pagador (nome), valor e data_hora_evento.</p>
            </div>
          ) : (
            <>
              <div className={i.bulk}>
                <span className={i.bulkLabel}>Aplicar a todas:</span>
                <select className={i.selectSm} value={bulkForma} onChange={(e) => setBulkForma(e.target.value as Forma | '')}>
                  <option value="">Forma…</option>
                  {FORMAS.map((f) => <option key={f} value={f}>{FORMA_LABEL[f]}</option>)}
                </select>
                <select className={i.selectSm} value={bulkBanco} onChange={(e) => setBulkBanco(e.target.value)}>
                  <option value="">Banco…</option>
                  {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
                <button type="button" className={i.btnGhost} onClick={aplicarTodas}>Aplicar</button>
              </div>

              <div className={i.tableWrap}>
                <table className={i.table}>
                  <thead>
                    <tr>
                      <th>Paciente</th><th>Data</th><th className={i.num}>Valor</th><th>Forma</th><th>Banco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className={i.pacCel}>
                            <input className={i.inputCel} value={l.nome} onChange={(e) => setLinha(idx, { nome: e.target.value })} />
                            <span className={l.status === 'cadastrado' ? i.badgeOk : i.badgeNovo}>{l.status}</span>
                          </div>
                        </td>
                        <td className={i.dataCel}>{dataBR(l.data)}</td>
                        <td className={i.num}>{brl(l.valor_centavos)}</td>
                        <td>
                          <select className={i.selectCel} value={l.forma} onChange={(e) => setLinha(idx, { forma: e.target.value as Forma | '' })}>
                            <option value="">—</option>
                            {FORMAS.map((f) => <option key={f} value={f}>{FORMA_LABEL[f]}</option>)}
                          </select>
                        </td>
                        <td>
                          <select className={i.selectCel} value={l.banco_id} onChange={(e) => setLinha(idx, { banco_id: e.target.value })}>
                            <option value="">—</option>
                            {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={i.rodape}>
                <span className={i.total}>{linhas.length} linha(s)</span>
                <button type="button" className={i.btnPrimary} onClick={registrar} disabled={enviando}>
                  {enviando ? 'Registrando…' : `Registrar ${linhas.length} entradas`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
