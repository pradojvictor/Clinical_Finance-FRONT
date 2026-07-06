import type { ReactNode } from 'react'
import styles from './Placeholder.module.css'

interface PlaceholderProps {
  etapa?: string
  children: ReactNode
}

/** Aviso de conteúdo que chega numa etapa futura. */
export default function Placeholder({ etapa = 'próxima etapa', children }: PlaceholderProps) {
  return (
    <div className={styles.box}>
      <span className={styles.tag}>{etapa}</span>
      <p className={styles.text}>{children}</p>
    </div>
  )
}
