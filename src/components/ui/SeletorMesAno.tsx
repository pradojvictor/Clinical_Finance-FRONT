// =====================================================================
// Seletor de período por MÊS e ANO (sem dia), com selects numéricos.
// Mês = 1..12 (exibido "01".."12"), Ano = números. Controlado.
// Use `mostrarMes={false}` para o modo só-ano (ex.: "ano completo").
// =====================================================================
import s from './SeletorMesAno.module.css'

const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

interface Props {
  mes: number
  ano: number
  onMes: (mes: number) => void
  onAno: (ano: number) => void
  anoMin?: number
  anoMax?: number
  mostrarMes?: boolean
}

export default function SeletorMesAno({
  mes,
  ano,
  onMes,
  onAno,
  anoMin = 2020,
  anoMax = new Date().getFullYear(),
  mostrarMes = true,
}: Props) {
  const anos: number[] = []
  for (let a = anoMax; a >= anoMin; a--) anos.push(a)

  return (
    <div className={s.wrap}>
      {mostrarMes && (
        <label className={s.grupo}>
          <span className={s.rotulo}>Mês</span>
          <select className={s.select} value={mes} onChange={(e) => onMes(Number(e.target.value))} aria-label="Mês">
            {MESES.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className={s.grupo}>
        <span className={s.rotulo}>Ano</span>
        <select className={s.select} value={ano} onChange={(e) => onAno(Number(e.target.value))} aria-label="Ano">
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
