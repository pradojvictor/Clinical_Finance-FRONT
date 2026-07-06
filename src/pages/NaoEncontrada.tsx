import { Link } from 'react-router-dom'
import s from './page.module.css'

export default function NaoEncontrada() {
  return (
    <div className={s.empty} style={{ paddingTop: '4rem' }}>
      <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--brand-navy)' }}>404</span>
      <span className={s.emptyTitle}>Página não encontrada</span>
      <span className={s.emptyText}>O endereço acessado não existe neste sistema.</span>
      <Link to="/" className={`${s.btn} ${s.btnPrimary}`} style={{ marginTop: '0.5rem' }}>
        Voltar ao início
      </Link>
    </div>
  )
}
