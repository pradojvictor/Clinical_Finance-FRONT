import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PROCEDIMENTOS } from '../config/procedimentos'
import s from './ProcedimentosSecao.module.css'

/**
 * Fundo distinto por procedimento — tons profundos da paleta (navy/azul/teal/
 * índigo/ardósia). Cada folha tem uma cor própria, então o deslize, a
 * sobreposição e o desfoque ficam visíveis (como as fotos diferentes da
 * referência), sem sair da identidade escura da marca.
 */
const GRADIENTES = [
  'linear-gradient(150deg, #1a1f42 0%, #2b3a72 100%)', // navy → azul
  'linear-gradient(150deg, #12283a 0%, #1e5566 100%)', // petróleo → teal
  'linear-gradient(150deg, #201a42 0%, #3d3170 100%)', // índigo
  'linear-gradient(150deg, #0f2a2c 0%, #1d4f4a 100%)', // verde-teal profundo
  'linear-gradient(150deg, #1b2450 0%, #35508a 100%)', // azul aço
  'linear-gradient(150deg, #241b3c 0%, #4a3a6e 100%)', // ardósia-arroxeada
]

/**
 * Seção de procedimentos — cards empilhados (referência:
 * instituteofhealth.com/courses, a passagem do módulo 1 ao 2).
 *
 * Base: `position: sticky; top: 0` — cada card gruda no topo e o próximo
 * sobe e o cobre (folha sobre folha). Sobre isso, um efeito ligado ao
 * scroll (igual ao da referência, que ajusta `filter` por JS):
 *  - a folha que SAI encolhe, desce e escurece conforme é coberta;
 *  - a folha que ENTRA começa menor e sobe se encaixando, com desfoque
 *    que some quando ~15% dela já entrou na tela.
 * Cada card segue o layout do módulo — rótulo "Procedimento" + número,
 * nome, botão "Saiba mais", "Visão geral" e "Recomendados".
 * (Format e Units, da referência, foram retirados.)
 */
export default function ProcedimentosSecao() {
  const secaoRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const secao = secaoRef.current
    if (!secao) return
    // Respeita quem pediu menos movimento: deixa tudo estático e nítido.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cards = Array.from(secao.querySelectorAll<HTMLElement>('[data-card]'))
    // Escala cheia (largura E altura) — a redução nas laterais faz parte do
    // efeito, com timings diferentes:
    //  - quem ENTRA: só no INÍCIO — nasce menor (folgas laterais visíveis) e
    //    borrada, e "se encaixa" na tela (escala 1, nítida) quando ~15% já
    //    entrou; origem embaixo → o encaixe vira um movimento de subida;
    //  - quem SAI: durante TODA a saída — encolhe progressivamente (laterais
    //    + desce, origem no centro), escurece e desfoca até ser coberta.
    const DESFOQUE_ENTRADA = 12 // px de desfoque inicial de quem entra
    const LIMIAR_ENCAIXE = 0.15 // 15% dentro da tela → encaixada e nítida
    const DESFOQUE_COBERTO = 6 // px de desfoque máximo de quem sai
    const BRILHO_COBERTO = 0.72 // brilho mínimo de quem sai
    const BRILHO_ENTRADA = 0.85 // brilho inicial de quem entra
    const ESCALA_ENTRADA = 0.88 // escala inicial de quem entra (folga lateral)
    const ESCALA_COBERTA = 0.9 // escala mínima de quem sai
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

    // Posições de LAYOUT dos cards (offsetTop é imune a transform — não gera
    // o laço de realimentação que faria a folha de baixo tremer). O
    // offsetParent é a própria seção (position: relative). Recalculadas só
    // no resize; a posição da seção é lida por frame (barata e robusta a
    // reflow), pois a seção nunca recebe transform.
    let offsets = cards.map((c) => c.offsetTop)
    const recalcular = () => {
      offsets = cards.map((c) => c.offsetTop)
    }

    const atualizar = () => {
      const vh = window.innerHeight || 1
      const secaoTop = secao.getBoundingClientRect().top + window.scrollY
      const scrollY = window.scrollY
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const off = offsets[i]
        if (!card || off === undefined) continue
        // Topo do card no layout (o sticky é quem desliza; aqui só medimos).
        const top = secaoTop + off - scrollY
        let desfoque: number
        let brilho: number
        let escala: number
        if (top > 1) {
          // ENTRANDO: sobe REDUZIDA nas laterais durante a entrada inteira e
          // só preenche a tela no FINAL, quando termina de entrar (escala
          // acompanha o progresso completo). O desfoque some cedo, aos ~15%.
          // Origem embaixo: o crescimento empurra a borda de cima pra CIMA,
          // reforçando o movimento de subida do encaixe.
          const e = clamp((vh - top) / vh, 0, 1)
          const p = clamp(e / LIMIAR_ENCAIXE, 0, 1) // 0→1 até os 15%
          escala = ESCALA_ENTRADA + (1 - ESCALA_ENTRADA) * e // preenche no final
          desfoque = DESFOQUE_ENTRADA * (1 - p)
          brilho = BRILHO_ENTRADA + (1 - BRILHO_ENTRADA) * p
          card.style.transformOrigin = 'center bottom'
        } else {
          // SAINDO: durante TODA a cobertura — encolhe progressivamente
          // (laterais aparecem e a borda de cima desce), escurece e desfoca.
          // Origem no centro: o topo desce junto com o encolhimento.
          const offProx = offsets[i + 1]
          const topProx = offProx === undefined ? Infinity : secaoTop + offProx - scrollY
          const c = topProx === Infinity ? 0 : clamp((vh - topProx) / vh, 0, 1)
          escala = 1 - (1 - ESCALA_COBERTA) * c
          desfoque = DESFOQUE_COBERTO * c
          brilho = 1 - (1 - BRILHO_COBERTO) * c
          card.style.transformOrigin = 'center center'
        }
        card.style.transform = `scale(${escala.toFixed(4)})`
        card.style.filter = `brightness(${brilho.toFixed(3)}) blur(${desfoque.toFixed(2)}px)`
      }
    }

    const aoRedimensionar = () => {
      recalcular()
      atualizar()
    }
    recalcular()
    atualizar()
    window.addEventListener('scroll', atualizar, { passive: true })
    window.addEventListener('resize', aoRedimensionar)
    return () => {
      window.removeEventListener('scroll', atualizar)
      window.removeEventListener('resize', aoRedimensionar)
    }
  }, [])

  return (
    <section ref={secaoRef} className={s.secao} data-tone="dark" id="procedimentos">
      {PROCEDIMENTOS.map((p, i) => {
        const temRecomendados = (p.recomendados?.length ?? 0) > 0
        return (
          <article
            className={s.card}
            data-card
            key={p.slug}
            style={{ background: GRADIENTES[i % GRADIENTES.length] }}
          >
            {/* Fundo em névoa da marca — opaco, para cobrir o card de baixo. */}
            <div className={s.fundo} aria-hidden>
              <span className={s.brilho1} />
              <span className={s.brilho2} />
              <span className={s.brilho3} />
            </div>

            <div className={s.conteudo}>
              <div className={s.topo}>
                <span className={s.rotulo}>Procedimento</span>
                <span className={s.num}>{String(i + 1).padStart(2, '0')}</span>
              </div>

              <h2 className={s.nome}>{p.nome}</h2>

              <Link to={`/procedimentos/${p.slug}`} className={s.botao}>
                Saiba mais
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 6l6 6-6 6"
                  />
                </svg>
              </Link>

              <div className={s.blocos}>
                <div className={s.bloco}>
                  <span className={s.blocoTitulo}>Visão geral</span>
                  <p className={s.resumo}>{p.resumo}</p>
                  {p.descricao && <p className={s.descricao}>{p.descricao}</p>}
                </div>

                {temRecomendados && (
                  <div className={s.bloco}>
                    <span className={s.blocoTitulo}>Recomendados</span>
                    <ul className={s.lista}>
                      {p.recomendados!.map((r) => (
                        <li key={r} className={s.item}>
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
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
                  </div>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
