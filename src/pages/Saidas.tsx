import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Placeholder from '../components/ui/Placeholder'
import Icon from '../components/ui/Icon'
import s from './page.module.css'

const COLUNAS = ['Data', 'Categoria', 'Forma de pagamento', 'Operador', 'Valor']

export default function Saidas() {
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
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled title="Disponível na próxima etapa">
          <Icon name="saida" size={18} /> Nova saída
        </button>
      </div>

      <Card title="Saídas registradas" action={<Badge tone="neutral">0 registros</Badge>}>
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
                    <span className={s.emptyTitle}>Nenhuma saída ainda</span>
                    <span className={s.emptyText}>
                      Este módulo apenas <strong>registra</strong> o que sai —
                      não processa pagamentos. O formulário de registro será
                      habilitado na próxima etapa.
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Placeholder etapa="próxima etapa">
        O registro de saídas é exclusivo do gestor. O balanço passará a
        consolidar <strong>entradas − saídas</strong> por período.
      </Placeholder>
    </div>
  )
}
