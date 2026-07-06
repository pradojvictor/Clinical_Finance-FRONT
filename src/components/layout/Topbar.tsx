import Icon from '../ui/Icon'
import { useAuth } from '../../lib/auth'
import styles from './Topbar.module.css'

interface TopbarProps {
  title: string
  subtitle?: string
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function hojeExtenso(): string {
  const d = new Date()
  const s = `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth()
  const nome = user?.nome ?? ''
  return (
    <header className={styles.topbar}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.actions}>
        <span className={styles.date}>{hojeExtenso()}</span>
        <button type="button" className={styles.iconBtn} aria-label="Notificações">
          <Icon name="bell" size={20} />
        </button>
        <div className={styles.userChip} title={nome}>
          <Icon name="user" size={18} />
          <span>{nome}</span>
        </div>
      </div>
    </header>
  )
}
