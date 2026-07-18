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

    // ---- Otimizações ---------------------------------------------------
    // 1) Estilo só é escrito no DOM quando o valor MUDA (cache por card).
    // 2) Folha totalmente coberta é DESATIVADA: visibility:hidden a tira da
    //    composição — sem ela, o navegador não empilha telas borradas
    //    invisíveis umas atrás das outras.
    // 3) Folha parada e 100% visível fica sem filtro/transform nenhum —
    //    custo zero quando ninguém está em transição.
    // 4) Folha ainda fora da tela fica limpa e com a névoa pausada
    //    (data-dormindo pausa as animações de fundo via CSS).
    // 5) will-change só nas folhas perto de animar — nada de 6 camadas de
    //    GPU permanentes.
    // 6) O scroll é agrupado por requestAnimationFrame: no máximo uma
    //    atualização por quadro, por mais eventos que o Lenis dispare.
    interface Memo {
      transform: string | null
      filter: string | null
      origem: string | null
      oculto: boolean | null
      dorme: boolean | null
      prepara: boolean | null
    }
    const memos: Memo[] = cards.map(() => ({
      transform: null,
      filter: null,
      origem: null,
      oculto: null,
      dorme: null,
      prepara: null,
    }))

    const aplicar = (
      card: HTMLElement,
      memo: Memo,
      transform: string,
      filter: string,
      origem: string,
      oculto: boolean,
      dorme: boolean,
      prepara: boolean,
    ) => {
      if (memo.transform !== transform) {
        card.style.transform = transform
        memo.transform = transform
      }
      if (memo.filter !== filter) {
        card.style.filter = filter
        memo.filter = filter
      }
      if (memo.origem !== origem) {
        card.style.transformOrigin = origem
        memo.origem = origem
      }
      if (memo.oculto !== oculto) {
        card.style.visibility = oculto ? 'hidden' : ''
        memo.oculto = oculto
      }
      if (memo.dorme !== dorme) {
        if (dorme) card.setAttribute('data-dormindo', '')
        else card.removeAttribute('data-dormindo')
        memo.dorme = dorme
      }
      if (memo.prepara !== prepara) {
        card.style.willChange = prepara ? 'transform, filter' : ''
        memo.prepara = prepara
      }
    }

    // Identidade não vira estilo: sem filtro/transform é mais leve do que
    // brightness(1) blur(0px)/scale(1), que ativam os pipelines à toa.
    const transf = (escala: number) => (escala >= 0.9995 ? '' : `scale(${escala.toFixed(4)})`)
    const filtro = (brilho: number, desfoque: number) =>
      brilho >= 0.999 && desfoque <= 0.02
        ? ''
        : `brightness(${brilho.toFixed(3)}) blur(${desfoque.toFixed(2)}px)`

    const atualizar = () => {
      const vh = window.innerHeight || 1
      const secaoTop = secao.getBoundingClientRect().top + window.scrollY
      const scrollY = window.scrollY
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const off = offsets[i]
        const memo = memos[i]
        if (!card || off === undefined || !memo) continue
        // Topo do card no layout (o sticky é quem desliza; aqui só medimos).
        const top = secaoTop + off - scrollY

        if (top >= vh) {
          // Ainda fora da tela (abaixo): limpa e dorme. Prepara a camada de
          // GPU um pouco antes de entrar, para a promoção não custar um
          // soluço no primeiro quadro da entrada.
          aplicar(card, memo, '', '', '', false, true, top < vh * 1.2)
          continue
        }

        if (top > 1) {
          // ENTRANDO: sobe REDUZIDA nas laterais durante a entrada inteira e
          // só preenche a tela no FINAL (escala acompanha o progresso
          // completo). O desfoque some cedo, aos ~15%. Origem embaixo: o
          // crescimento empurra a borda de cima pra CIMA (subida do encaixe).
          const e = clamp((vh - top) / vh, 0, 1)
          const p = clamp(e / LIMIAR_ENCAIXE, 0, 1) // 0→1 até os 15%
          const escala = ESCALA_ENTRADA + (1 - ESCALA_ENTRADA) * e
          const desfoque = DESFOQUE_ENTRADA * (1 - p)
          const brilho = BRILHO_ENTRADA + (1 - BRILHO_ENTRADA) * p
          aplicar(card, memo, transf(escala), filtro(brilho, desfoque), 'center bottom', false, false, true)
          continue
        }

        // PRESA no topo: quanto a próxima folha já cobriu?
        const offProx = offsets[i + 1]
        const topProx = offProx === undefined ? Infinity : secaoTop + offProx - scrollY
        const c = topProx === Infinity ? 0 : clamp((vh - topProx) / vh, 0, 1)

        if (c >= 0.999) {
          // Totalmente coberta → desativada (fora da composição) e dormindo.
          aplicar(card, memo, '', '', '', true, true, false)
        } else if (c <= 0.001) {
          // Parada e 100% visível → custo zero (sem filtro, sem transform).
          aplicar(card, memo, '', '', '', false, false, true)
        } else {
          // SAINDO: durante TODA a cobertura — encolhe (laterais + topo
          // desce, origem no centro), escurece e desfoca.
          const escala = 1 - (1 - ESCALA_COBERTA) * c
          const desfoque = DESFOQUE_COBERTO * c
          const brilho = 1 - (1 - BRILHO_COBERTO) * c
          aplicar(card, memo, transf(escala), filtro(brilho, desfoque), 'center center', false, false, true)
        }
      }
    }

    // No máximo uma atualização por quadro (o Lenis dispara vários scrolls).
    let quadroAgendado = false
    const aoRolar = () => {
      if (quadroAgendado) return
      quadroAgendado = true
      requestAnimationFrame(() => {
        quadroAgendado = false
        atualizar()
      })
    }
    const aoRedimensionar = () => {
      recalcular()
      atualizar()
    }
    recalcular()
    atualizar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRedimensionar)
    return () => {
      window.removeEventListener('scroll', aoRolar)
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
