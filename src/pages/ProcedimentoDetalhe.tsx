import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { acharProcedimento } from '../config/procedimentos'
import s from './ProcedimentoDetalhe.module.css'

/**
 * Página de um procedimento (/procedimentos/:slug).
 *
 * Mesmo visual dos cards da listagem, mas sozinho e sem empilhamento —
 * é o destino do "Saiba mais". Slug inexistente volta para a listagem.
 */
export default function ProcedimentoDetalhe() {
  const { slug } = useParams<{ slug: string }>()
  const procedimento = slug ? acharProcedimento(slug) : undefined
  const [aba, setAba] = useState<'visao' | 'recomendados'>('visao')

  if (!procedimento) return <Navigate to="/" replace />

  const temRecomendados = (procedimento.recomendados?.length ?? 0) > 0

  return (
    <div className={s.page}>
      <Navbar />

      <section className={s.card}>
        <div className={s.visual} aria-hidden>
          <span className={s.brilho1} />
          <span className={s.brilho2} />
          <span className={s.brilho3} />
          <span className={s.visualNome}>{procedimento.nome}</span>
        </div>

        <div className={s.conteudo}>
          <div className={s.topo}>
            <span className={s.rotulo}>Procedimento</span>
            <Link to="/" className={s.contador}>
              ← Voltar ao site
            </Link>
          </div>

          <h1 className={s.titulo}>{procedimento.nome}</h1>

          <div className={s.abas} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'visao'}
              className={`${s.aba} ${aba === 'visao' ? s.abaAtiva : ''}`}
              onClick={() => setAba('visao')}
            >
              Visão geral
            </button>
            {temRecomendados && (
              <button
                type="button"
                role="tab"
                aria-selected={aba === 'recomendados'}
                className={`${s.aba} ${aba === 'recomendados' ? s.abaAtiva : ''}`}
                onClick={() => setAba('recomendados')}
              >
                Recomendados
              </button>
            )}
          </div>

          <div className={s.abaConteudo}>
            {aba === 'visao' ? (
              <>
                <p className={s.resumo}>{procedimento.resumo}</p>
                {procedimento.descricao && <p className={s.descricao}>{procedimento.descricao}</p>}
              </>
            ) : (
              <ul className={s.recomendados}>
                {procedimento.recomendados?.map((r) => (
                  <li key={r} className={s.recomendadoItem}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
