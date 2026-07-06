import type { CSSProperties, ReactNode } from 'react'
import styles from './StatCard.module.css'

interface StatCardProps {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  accent?: string
  icon?: ReactNode
}

/**
 * Cartão de indicador.
 *  - label:  rótulo
 *  - value:  valor principal (string já formatada)
 *  - hint:   texto auxiliar
 *  - accent: cor da faixa lateral (var CSS)
 *  - icon:   nó opcional (ex.: bolinha de cor da forma de pagamento)
 */
export default function StatCard({
  label,
  value,
  hint,
  accent = 'var(--brand-blue)',
  icon,
}: StatCardProps) {
  return (
    <div className={styles.stat} style={{ '--accent': accent } as CSSProperties}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <span className={styles.value}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
