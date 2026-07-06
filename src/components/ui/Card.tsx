import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
}

export default function Card({ title, action, children, className = '', ...rest }: CardProps) {
  return (
    <section className={`${styles.card} ${className}`} {...rest}>
      {(title || action) && (
        <header className={styles.head}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
