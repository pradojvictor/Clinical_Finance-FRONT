import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Placeholder from '../components/ui/Placeholder'
import Icon from '../components/ui/Icon'
import s from './page.module.css'

const COLUNAS = ['Código', 'Procedimento', 'Valor de referência', 'Situação']

export default function Procedimentos() {
  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <input className={s.input} type="search" placeholder="Buscar procedimento…" disabled />
        </div>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled title="Disponível na Etapa 2">
          <Icon name="proc" size={18} /> Novo procedimento
        </button>
      </div>

      <Card title="Catálogo de procedimentos" action={<Badge tone="neutral">0 itens</Badge>}>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {COLUNAS.map((c) => (
                  <th key={c} className={c === 'Valor de referência' ? s.num : undefined}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={COLUNAS.length}>
                  <div className={s.empty}>
                    <span className={s.emptyTitle}>Catálogo vazio</span>
                    <span className={s.emptyText}>
                      Os procedimentos cadastrados servem de referência para as
                      entradas. O cadastro será liberado na próxima etapa.
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Placeholder etapa="etapa 2 — backend">
        Cada procedimento terá código, descrição e valor de referência,
        vinculado às entradas para compor o balanço.
      </Placeholder>
    </div>
  )
}
