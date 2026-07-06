import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Placeholder from '../components/ui/Placeholder'
import Icon from '../components/ui/Icon'
import s from './page.module.css'

const COLUNAS = ['Data', 'Procedimento', 'Forma de pagamento', 'Operador', 'Valor']

export default function Entradas() {
  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <label className={s.field}>
            <select className={s.select} disabled defaultValue="">
              <option value="">Todas as formas</option>
              <option>Pix</option>
              <option>Espécie</option>
              <option>Cartão de débito</option>
            </select>
          </label>
          <input className={s.input} type="date" disabled />
        </div>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled title="Disponível na Etapa 2">
          <Icon name="entrada" size={18} /> Nova entrada
        </button>
      </div>

      <Card title="Entradas registradas" action={<Badge tone="neutral">0 registros</Badge>}>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {COLUNAS.map((c) => (
                  <th key={c} className={c === 'Valor' ? s.num : undefined}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={COLUNAS.length}>
                  <div className={s.empty}>
                    <span className={s.emptyTitle}>Nenhuma entrada ainda</span>
                    <span className={s.emptyText}>
                      Este módulo apenas <strong>registra</strong> o que entra —
                      não processa pagamentos. O formulário de registro será
                      habilitado quando o backend estiver no ar.
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Placeholder etapa="etapa 2 — backend">
        O registro de entradas (com validação e gravação no PostgreSQL) é
        responsabilidade do operador e do gestor.
      </Placeholder>
    </div>
  )
}
