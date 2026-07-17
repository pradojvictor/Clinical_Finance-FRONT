import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  balancoApi,
  entradasApi,
  saldosApi,
  type Balanco,
  type EntradaDetalhe,
  type SaldoLocal,
} from '../lib/api'
import { podeVerSecao } from '../config/nav'
import { useAuth } from '../lib/auth'
import { brl, hojeISO, periodoMes } from '../lib/format'
import Icon from '../components/ui/Icon'
import s from './Inicio.module.css'

/**
 * Início — responde "como estamos" e "onde está o dinheiro" numa olhada.
 *
 * Não repete o Balanço (que detalha o mês inteiro por forma, tipo e
 * movimento): o que é próprio daqui é o AGORA — quanto entrou hoje e onde
 * o dinheiro está parado.
 *
 * Cada bloco só aparece para quem tem a seção liberada, e a API só é
 * chamada quando há permissão: pedir um endpoint proibido devolveria 403 e
 * encheria a tela de erro para o perfil profissional.
 */
export default function Inicio() {
  const { user } = useAuth()
  const hoje = hojeISO()

  const veBalanco = podeVerSecao(user, 'balanco')
  const veEntradas = podeVerSecao(user, 'entradas')
  const veSaldos = podeVerSecao(user, 'transferencias')
  const podeLancar = veEntradas && user?.perfil !== 'profissional'

  const [mes, setMes] = useState<Balanco | null>(null)
  const [saldos, setSaldos] = useState<SaldoLocal[] | null>(null)
  const [totalSaldos, setTotalSaldos] = useState(0)
  const [doDia, setDoDia] = useState<EntradaDetalhe[] | null>(null)

  const { de, ate } = useMemo(() => {
    const d = new Date()
    return periodoMes(d.getFullYear(), d.getMonth() + 1)
  }, [])

  useEffect(() => {
    let vivo = true
    if (veBalanco) {
      balancoApi.obter(de, ate).then((r) => vivo && setMes(r.balanco)).catch(() => {})
    }
    if (veSaldos) {
      saldosApi
        .obter()
        .then((r) => {
          if (!vivo) return
          setSaldos(r.saldos)
          setTotalSaldos(r.total_centavos)
        })
        .catch(() => {})
    }
    if (veEntradas) {
      entradasApi
        .listar({ de: hoje, ate: hoje })
        .then((r) => vivo && setDoDia(r.entradas))
        .catch(() => {})
    }
    return () => {
      vivo = false
    }
  }, [de, ate, hoje, veBalanco, veSaldos, veEntradas])

  const totalHoje = (doDia ?? []).reduce((acc, e) => acc + e.valor_centavos, 0)
  const primeiroNome = (user?.nome ?? '').trim().split(/\s+/)[0] ?? ''
  const saldoMes = mes ? mes.total.entradas_liquido_centavos - mes.total.saidas_centavos : 0

  return (
    <div className={s.stack}>
      <div className={s.saudacao}>
        <h1 className={s.titulo}>Olá, {primeiroNome}</h1>
        <span className={s.data}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      </div>

      {/* Hoje — o que este painel tem de próprio. */}
      {veEntradas && (
        <div className={s.hoje}>
          <div className={s.hojeInfo}>
            <span className={s.hojeLabel}>Entrou hoje</span>
            <strong className={s.hojeValor}>{doDia === null ? '—' : brl(totalHoje)}</strong>
            <span className={s.hojeQtd}>
              {doDia === null
                ? 'carregando…'
                : doDia.length === 0
                  ? 'nenhum lançamento ainda'
                  : `${doDia.length} lançamento${doDia.length > 1 ? 's' : ''}`}
            </span>
          </div>
          {podeLancar && (
            <Link to="/sistema/entradas" className={s.acaoPrim}>
              <Icon name="entrada" size={18} /> Nova entrada
            </Link>
          )}
        </div>
      )}

      {/* Mês — só o resumo; o detalhe vive no Balanço. */}
      {veBalanco && (
        <div className={s.bloco}>
          <div className={s.blocoHead}>
            <span className={s.blocoTit}>Este mês</span>
            <Link to="/sistema/balanco" className={s.verLink}>Ver balanço</Link>
          </div>
          {mes === null ? (
            <p className={s.vazio}>Carregando…</p>
          ) : (
            <div className={s.mesGrid}>
              <div className={s.mesItem}>
                <span className={s.mesLabel}>Entradas</span>
                {/* Líquido: é o que de fato entrou, depois da taxa. */}
                <strong className={s.mesValor}>{brl(mes.total.entradas_liquido_centavos)}</strong>
              </div>
              <div className={s.mesItem}>
                <span className={s.mesLabel}>Saídas</span>
                <strong className={s.mesValor}>{brl(mes.total.saidas_centavos)}</strong>
              </div>
              <div className={s.mesItem}>
                <span className={s.mesLabel}>Saldo</span>
                <strong className={`${s.mesValor} ${saldoMes >= 0 ? s.pos : s.neg}`}>
                  {brl(saldoMes)}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onde o dinheiro está agora — não depende do período escolhido. */}
      {veSaldos && (
        <div className={s.bloco}>
          <div className={s.blocoHead}>
            <span className={s.blocoTit}>Onde o dinheiro está</span>
            <strong className={s.blocoTotal}>{brl(totalSaldos)}</strong>
          </div>
          {saldos === null ? (
            <p className={s.vazio}>Carregando…</p>
          ) : saldos.length === 0 ? (
            <p className={s.vazio}>Nenhum local cadastrado.</p>
          ) : (
            <div className={s.locais}>
              {saldos.map((l) => (
                <div key={l.banco_id ?? 'caixa'} className={s.local}>
                  <span className={s.localNome}>{l.nome}</span>
                  <span className={l.saldo_centavos >= 0 ? s.pos : s.neg}>{brl(l.saldo_centavos)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profissional sem seção liberada: explica, em vez de tela vazia. */}
      {!veEntradas && !veBalanco && !veSaldos && (
        <div className={s.bloco}>
          <p className={s.vazio}>
            Seu acesso ainda não tem nenhuma seção liberada. Fale com a coordenação.
          </p>
        </div>
      )}
    </div>
  )
}
