import { brl, dataBR } from '../lib/format'
import s from './CalculoSalario.module.css'

/**
 * Demonstrativo do pagamento por porcentagem, aberto por inteiro.
 *
 * A regra: a % do profissional incide sobre o BRUTO da entrada. O que
 * sobra cobre a taxa da máquina, e o resto fica na clínica.
 *
 *   entrada 1000, taxa 10%, profissional 70%
 *     profissional = 70% × 1000 = 700
 *     máquina      = 10% × 1000 = 100
 *     clínica      = 1000 − 700 − 100 = 200
 *
 * Mora aqui, e não em cada tela, porque aparece em dois lugares (Saídas,
 * antes de registrar; Balanço, depois) e os números têm que bater — duas
 * cópias divergiriam na primeira mudança de regra.
 */
export default function CalculoSalario({
  bruto,
  taxa,
  percentualBp,
  valor,
  qtdEntradas,
  de,
  ate,
  titulo = 'Como este valor foi calculado',
}: {
  bruto: number
  taxa: number
  percentualBp: number
  valor: number
  qtdEntradas?: number
  de?: string | null
  ate?: string | null
  titulo?: string
}) {
  const clinica = bruto - valor - taxa
  const pct = String(percentualBp / 100).replace('.', ',')
  // A taxa varia por entrada (banco × forma), então o % dela só faz
  // sentido como média do período — daí o "≈".
  const taxaPct = bruto > 0 ? ((taxa / bruto) * 100).toFixed(2).replace('.', ',') : '0'

  return (
    <div className={s.box}>
      <div className={s.titulo}>{titulo}</div>

      <div className={s.linha}>
        <span>
          Bruto das entradas
          {qtdEntradas != null ? ` (${qtdEntradas})` : ''}
          {de && ate ? ` · ${dataBR(de)}–${dataBR(ate)}` : ''}
        </span>
        <span className={s.valor}>{brl(bruto)}</span>
      </div>

      <div className={s.linha}>
        <span>Profissional ({pct}% do bruto)</span>
        <span className={`${s.valor} ${s.sai}`}>− {brl(valor)}</span>
      </div>

      <div className={s.linha}>
        <span>Máquina · taxa (≈ {taxaPct}%)</span>
        <span className={`${s.valor} ${s.sai}`}>− {brl(taxa)}</span>
      </div>

      <div className={s.total}>
        <span>Fica na clínica</span>
        <span className={s.valor}>{brl(clinica)}</span>
      </div>

      {clinica < 0 && (
        <div className={s.alerta}>
          A porcentagem do profissional mais a taxa passam do bruto — a clínica fica no
          negativo neste período. Confira a % da ficha.
        </div>
      )}
    </div>
  )
}
