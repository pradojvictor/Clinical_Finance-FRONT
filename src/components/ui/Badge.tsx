import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeTone = 'neutral' | 'blue' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  dot?: string
}

export default function Badge({ children, tone = 'neutral', dot }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone] ?? ''}`}>
      {dot && <span className={styles.dot} style={{ background: dot }} />}
      {children}
    </span>
  )
}
