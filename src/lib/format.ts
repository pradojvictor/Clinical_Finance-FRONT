import type { Forma, FormaSaida } from './api'

export const FORMA_LABEL: Record<Forma, string> = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  especie: 'Espécie',
}
export const FORMAS: Forma[] = ['pix', 'debito', 'credito', 'especie']
// Saída não aceita crédito.
export const FORMAS_SAIDA: FormaSaida[] = ['pix', 'debito', 'especie']

/** centavos → "R$ 1.234,56" */
export const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** "2026-07-11T..." → "11/07/2026" */
export const dataBR = (iso: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—')

/** "1.234,56" | "1234.56" | "150" → centavos (inteiro) */
export function parseCentavos(str: string): number {
  let v = str.trim().replace(/[^\d.,]/g, '')
  if (v.includes(',') && v.includes('.')) v = v.replace(/\./g, '').replace(',', '.')
  else v = v.replace(',', '.')
  const n = parseFloat(v)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** hoje em YYYY-MM-DD (fuso local) */
export const hojeISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** primeiro e último dia (YYYY-MM-DD) de um mês/ano. */
export function periodoMes(ano: number, mes: number): { de: string; ate: string } {
  const mm = String(mes).padStart(2, '0')
  const ultimo = new Date(ano, mes, 0).getDate()
  return { de: `${ano}-${mm}-01`, ate: `${ano}-${mm}-${String(ultimo).padStart(2, '0')}` }
}

/** primeiro e último dia do ano; se for o ano corrente, vai só até hoje. */
export function periodoAno(ano: number): { de: string; ate: string } {
  const atual = new Date().getFullYear()
  return { de: `${ano}-01-01`, ate: ano === atual ? hojeISO() : `${ano}-12-31` }
}
