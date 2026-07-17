import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ApiError, balancoApi, saldosApi, type Balanco as BalancoT, type Forma, type ResumoForma, type SaldoLocal } from '../lib/api'
import { FORMA_LABEL, brl, dataBR, periodoAno, periodoMes } from '../lib/format'
import CalculoSalario from '../components/CalculoSalario'
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
  const [saldos, setSaldos] = useState<SaldoLocal[] | null>(null)
  const [totalSaldos, setTotalSaldos] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [gaveta, setGaveta] = useState<{
    kind: 'entrada' | 'saida' | 'transferencia' | 'todos'
    grupoId: number | null
    origemId?: number | null
    destinoId?: number | null
    titulo: string
    todoKind?: boolean
  } | null>(null)

  const abrirGaveta = (kind: 'entrada' | 'saida' | 'todos', grupoId: number | null, titulo: string) =>
    setGaveta({ kind, grupoId, titulo })

  const movsFiltrados = useMemo(() => {
    const movs = dados?.movimentos ?? []
    if (!gaveta || gaveta.kind === 'todos') return movs
    // Histórico completo de um lado (todas as entradas / saídas / transferências).
    if (gaveta.todoKind) return movs.filter((m) => m.kind === gaveta.kind)
    // Transferência: casa pelo par origem → destino.
    if (gaveta.kind === 'transferencia')
      return movs.filter(
        (m) => m.kind === 'transferencia' && m.origem_id === gaveta.origemId && m.destino_id === gaveta.destinoId,
      )
    // Igualdade exata: "Sem tipo"/"Sem categoria" (grupo_id null) casa só com null.
    return movs.filter((m) => m.kind === gaveta.kind && m.grupo_id === gaveta.grupoId)
  }, [dados, gaveta])

  // Onde o dinheiro está hoje (saldo atual por local — não depende do período).
  useEffect(() => {
    let vivo = true
    saldosApi.obter().then((r) => {
      if (vivo) { setSaldos(r.saldos); setTotalSaldos(r.total_centavos) }
    }).catch(() => {})
    return () => { vivo = false }
  }, [])

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
  const totalInicial = (saldos ?? []).reduce((acc, x) => acc + x.inicial_centavos, 0)

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

      {/* Caracterização por tipo — logo abaixo do card de saldo */}
      {dados && (
        <div className={b.tipos}>
          <div className={b.tiposCol}>
            <div className={b.tiposHead}>
              <span className={b.tiposTit}>Entradas por tipo</span>
              <button
                type="button"
                className={b.verLink}
                onClick={() => setGaveta({ kind: 'entrada', grupoId: null, titulo: 'Histórico de entradas', todoKind: true })}
              >
                Histórico
              </button>
            </div>
            {dados.por_tipo_entrada.length === 0 ? (
              <p className={b.vazio}>Sem entradas no período.</p>
            ) : (
              dados.por_tipo_entrada.map((t) => (
                <button
                  key={t.tipo_id ?? 'sem'}
                  type="button"
                  className={b.tipoRow}
                  onClick={() => abrirGaveta('entrada', t.tipo_id, `Entradas · ${t.tipo_nome ?? 'Sem tipo'}`)}
                >
                  <span className={b.tipoNome}>
                    {t.tipo_nome ?? 'Sem tipo'} <span className={b.tipoQtd}>{t.qtd}</span>
                  </span>
                  <span className={b.tipoValor}>{brl(comTaxa ? t.liquido_centavos : t.bruto_centavos)}</span>
                </button>
              ))
            )}
          </div>

          <div className={b.tiposCol}>
            <div className={b.tiposHead}>
              <span className={b.tiposTit}>Saídas por categoria</span>
              <button
                type="button"
                className={b.verLink}
                onClick={() => setGaveta({ kind: 'saida', grupoId: null, titulo: 'Histórico de saídas', todoKind: true })}
              >
                Histórico
              </button>
            </div>
            {dados.por_categoria_saida.length === 0 ? (
              <p className={b.vazio}>Sem saídas no período.</p>
            ) : (
              dados.por_categoria_saida.map((c) => (
                <button
                  key={c.categoria_id ?? 'sem'}
                  type="button"
                  className={b.tipoRow}
                  onClick={() => abrirGaveta('saida', c.categoria_id, `Saídas · ${c.categoria_nome ?? 'Sem categoria'}`)}
                >
                  <span className={b.tipoNome}>
                    {c.categoria_nome ?? 'Sem categoria'} <span className={b.tipoQtd}>{c.qtd}</span>
                  </span>
                  <span className={`${b.tipoValor} ${b.neg}`}>{brl(c.total_centavos)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

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

      {/* Transferências do período — card clicável (como entradas/saídas) */}
      {dados && dados.transferencias.length > 0 && (
        <div className={b.tiposCol}>
          <div className={b.tiposHead}>
            <span className={b.tiposTit}>Transferências</span>
            <button
              type="button"
              className={b.verLink}
              onClick={() => setGaveta({ kind: 'transferencia', grupoId: null, titulo: 'Histórico de transferências', todoKind: true })}
            >
              Histórico
            </button>
          </div>
          {dados.transferencias.map((t, idx) => (
            <button
              key={idx}
              type="button"
              className={b.tipoRow}
              onClick={() =>
                setGaveta({
                  kind: 'transferencia',
                  grupoId: null,
                  origemId: t.origem_id,
                  destinoId: t.destino_id,
                  titulo: `${t.origem_nome} → ${t.destino_nome}`,
                })
              }
            >
              <span className={b.tipoNome}>
                {t.origem_nome} <span className={b.transfSeta}>→</span> {t.destino_nome}{' '}
                <span className={b.tipoQtd}>{t.qtd}</span>
              </span>
              <span className={b.tipoValor}>{brl(t.total_centavos)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Onde está o dinheiro (saldo atual por local) */}
      {saldos && saldos.length > 0 && (
        <div className={b.onde}>
          <div className={b.ondeHead}>
            <span className={b.ondeTit}>Onde está o dinheiro</span>
            <span className={b.ondeNota}>saldo atual · aporte inicial</span>
          </div>
          <div className={b.ondeLista}>
            {saldos.map((x) => (
              <div key={x.banco_id ?? 'caixa'} className={b.ondeRow}>
                <span className={b.ondeNome}>
                  <span className={b.dot} style={{ background: x.banco_id == null ? 'var(--pay-especie)' : 'var(--brand-blue)' }} />
                  <span className={b.ondeNomeTxt}>
                    {x.nome}
                    {x.inicial_centavos !== 0 && (
                      <span className={b.ondeInicial}>aporte inicial · {brl(x.inicial_centavos)}</span>
                    )}
                  </span>
                </span>
                <span className={x.saldo_centavos < 0 ? b.neg : ''}>{brl(x.saldo_centavos)}</span>
              </div>
            ))}
            {totalInicial !== 0 && (
              <div className={b.ondeAporte}>
                <span>Aporte inicial total</span>
                <span>{brl(totalInicial)}</span>
              </div>
            )}
            <div className={b.ondeTotal}>
              <span>Total</span>
              <span>{brl(totalSaldos)}</span>
            </div>
          </div>
        </div>
      )}

      {carregando && <div className={b.carregando}>Atualizando…</div>}

      {/* Gaveta — histórico detalhado */}
      {gaveta &&
        createPortal(
          <div className={b.gavetaBackdrop} onMouseDown={() => setGaveta(null)}>
            <aside className={b.gaveta} onMouseDown={(e) => e.stopPropagation()}>
              <div className={b.gavetaHead}>
                <span className={b.gavetaTit}>{gaveta.titulo}</span>
                <button type="button" className={b.gavetaFechar} onClick={() => setGaveta(null)} aria-label="Fechar">
                  ×
                </button>
              </div>
              <div className={b.gavetaBody}>
                {movsFiltrados.length === 0 ? (
                  <p className={b.vazio}>Nada no período.</p>
                ) : (
                  movsFiltrados.map((m) => (
                    <div key={`${m.kind}-${m.id}`} className={b.movRow}>
                      <span
                        className={`${b.movDot} ${m.kind === 'entrada' ? b.movEnt : m.kind === 'saida' ? b.movSai : b.movTransf}`}
                      />
                      <div className={b.movCorpo}>
                        <div className={b.movTop}>
                          <span className={b.movRotulo}>
                            {m.rotulo ?? (m.kind === 'entrada' ? 'Sem tipo' : m.kind === 'saida' ? 'Sem categoria' : 'Transferência')}
                          </span>
                          <span className={m.kind === 'entrada' ? b.pos : m.kind === 'saida' ? b.neg : undefined}>
                            {m.kind === 'entrada' ? '+ ' : m.kind === 'saida' ? '− ' : ''}
                            {brl(m.kind === 'entrada' && comTaxa && m.liquido_centavos != null ? m.liquido_centavos : m.valor_centavos)}
                          </span>
                        </div>
                        <span className={b.movMeta}>
                          {dataBR(m.data)}
                          {m.forma ? ` · ${FORMA_LABEL[m.forma]}` : ''}
                          {m.detalhe ? ` · ${m.detalhe}` : ''}
                          {m.paciente_nome ? ` · ${m.paciente_nome}` : ''}
                        </span>

                        {/* Pagamento por %: abre a conta que gerou este valor.
                            Vem congelada do momento do pagamento, então bate
                            com o que foi mostrado na hora de registrar. */}
                        {m.pg_percentual_bp != null && m.pg_bruto_centavos != null && (
                          <div className={b.movCalc}>
                            <CalculoSalario
                              bruto={m.pg_bruto_centavos}
                              taxa={m.pg_taxa_centavos ?? 0}
                              percentualBp={m.pg_percentual_bp}
                              valor={m.valor_centavos}
                              de={m.pg_periodo_de}
                              ate={m.pg_periodo_ate}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  )
}
