import type { ReactNode } from 'react'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Placeholder from '../components/ui/Placeholder'
import Icon from '../components/ui/Icon'
import s from './page.module.css'

const BRL = 'R$ 0,00'

const FORMAS = [
  { nome: 'Pix',              cor: 'var(--pay-pix)' },
  { nome: 'Espécie',          cor: 'var(--pay-especie)' },
  { nome: 'Cartão de débito', cor: 'var(--pay-debito)' },
]

const dot = (cor: string): ReactNode => (
  <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '62.5rem', background: cor, display: 'inline-block' }} />
)

export default function Balanco() {
  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <label className={s.field}>
            <select className={s.select} disabled defaultValue="mes">
              <option value="dia">Hoje</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mês</option>
            </select>
          </label>
          <input className={s.input} type="month" disabled />
        </div>
        <button type="button" className={s.btn} disabled title="Disponível na Etapa 2">
          <Icon name="balanco" size={18} /> Exportar
        </button>
      </div>

      <div className={s.grid4}>
        <StatCard label="Total no período" value={BRL} accent="var(--brand-navy)" />
        <StatCard label="Pix" value={BRL} accent="var(--pay-pix)" icon={dot('var(--pay-pix)')} />
        <StatCard label="Espécie" value={BRL} accent="var(--pay-especie)" icon={dot('var(--pay-especie)')} />
        <StatCard label="Cartão de débito" value={BRL} accent="var(--pay-debito)" icon={dot('var(--pay-debito)')} />
      </div>

      <Card title="Distribuição por forma de pagamento">
        <div className={s.bars}>
          {FORMAS.map((f) => (
            <div className={s.barRow} key={f.nome}>
              <span className={s.barLabel}>{dot(f.cor)} {f.nome}</span>
              <span className={s.barTrack}>
                <span className={s.barFill} style={{ width: '0%', background: f.cor }} />
              </span>
              <span className={s.barValue}>0%</span>
            </div>
          ))}
        </div>
      </Card>

      <Placeholder etapa="etapa 2 — backend">
        O balanço consolida as entradas por período e forma de pagamento.
        A visualização completa (com exportação) é de acesso exclusivo do gestor.
      </Placeholder>
    </div>
  )
}
