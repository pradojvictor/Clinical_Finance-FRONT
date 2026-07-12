import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ApiError, balancoApi, type Balanco as BalancoT, type Forma, type ResumoForma } from '../lib/api'
import { FORMA_LABEL, brl, periodoAno, periodoMes } from '../lib/format'
import SeletorMesAno from '../components/ui/SeletorMesAno'
import s from './page.module.css'
import b from './Balanco.module.css'

const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')

const COR: Record<Forma, string> = {
  pix: 'var(--pay-pix)',
  debito: 'var(--pay-debito)',
  credito: 'var(--pay-credito)',
  especie: 'var(--pay-especie)',
}

type Periodo = 'mes' | 'ano'

export default function Balanco() {
  const agora = new Date()
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [ano, setAno] = useState(agora.getFullYear())
  const [comTaxa, setComTaxa] = useState(true)
  const [dados, setDados] = useState<BalancoT | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const { de, ate } = useMemo(
    () => (periodo === 'mes' ? periodoMes(ano, mes) : periodoAno(ano)),
    [periodo, mes, ano],
  )

  useEffect(() => {
    let vivo = true
    setCarregando(true)
    setErro(null)
    balancoApi
      .obter(de, ate)
      .then((r) => vivo && setDados(r.balanco))
      .catch((x) => vivo && setErro(msg(x)))
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [de, ate])

  const entradaDe = (r: ResumoForma) => (comTaxa ? r.entradas_liquido_centavos : r.entradas_bruto_centavos)
  const totalEntradas = dados
    ? comTaxa
      ? dados.total.entradas_liquido_centavos
      : dados.total.entradas_bruto_centavos
    : 0
  const totalSaidas = dados?.total.saidas_centavos ?? 0
  const saldoGeral = totalEntradas - totalSaidas

  return (
    <div className={s.stack}>
      {/* Filtros */}
      <div className={b.toolbar}>
        <div className={b.grupo}>
          <div className={b.seg}>
            <button className={periodo === 'mes' ? b.segOn : ''} onClick={() => setPeriodo('mes')}>Mês</button>
            <button className={periodo === 'ano' ? b.segOn : ''} onClick={() => setPeriodo('ano')}>Ano completo</button>
          </div>
          <SeletorMesAno mes={mes} ano={ano} onMes={setMes} onAno={setAno} mostrarMes={periodo === 'mes'} />
        </div>
        <div className={b.grupo}>
          <div className={b.seg}>
            <button className={comTaxa ? b.segOn : ''} onClick={() => setComTaxa(true)}>Com taxa</button>
            <button className={!comTaxa ? b.segOn : ''} onClick={() => setComTaxa(false)}>Sem taxa</button>
          </div>
          <span className={b.hint}>{comTaxa ? 'valores líquidos (após taxa)' : 'valores brutos (sem taxa)'}</span>
        </div>
      </div>

      {erro && <div className={b.erro}>{erro}</div>}

      {/* Geral */}
      <div className={b.geral}>
        <div className={b.geralItem}>
          <span className={b.geralLabel}>Entradas</span>
          <strong className={b.geralValor}>{brl(totalEntradas)}</strong>
        </div>
        <div className={b.divisor} />
        <div className={b.geralItem}>
          <span className={b.geralLabel}>Saídas</span>
          <strong className={b.geralValor}>{brl(totalSaidas)}</strong>
        </div>
        <div className={b.divisor} />
        <div className={b.geralItem}>
          <span className={b.geralLabel}>Saldo</span>
          <strong className={`${b.geralValor} ${saldoGeral >= 0 ? b.pos : b.neg}`}>{brl(saldoGeral)}</strong>
        </div>
      </div>

      {/* Por forma */}
      <div className={b.grid}>
        {(dados?.por_forma ?? []).map((r) => {
          const ent = entradaDe(r)
          const saldo = ent - r.saidas_centavos
          return (
            <div key={r.forma} className={b.card} style={{ '--cor': COR[r.forma] } as CSSProperties}>
              <div className={b.cardHead}>
                <span className={b.dot} />
                {FORMA_LABEL[r.forma]}
                <span className={b.cardQtd}>{r.qtd_entradas} ent.</span>
              </div>
              <div className={b.linha}><span>Entradas</span><span>{brl(ent)}</span></div>
              <div className={b.linha}><span>Saídas</span><span>{brl(r.saidas_centavos)}</span></div>
              <div className={b.linhaSaldo}>
                <span>Saldo</span>
                <span className={saldo >= 0 ? b.pos : b.neg}>{brl(saldo)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {carregando && <div className={b.carregando}>Atualizando…</div>}
    </div>
  )
}
