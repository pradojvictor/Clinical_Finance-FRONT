import { useEffect, useRef } from 'react'
import { PROFISSIONAIS } from '../config/profissionais'
import s from './ProfissionaisSecao.module.css'

/**
 * Apresentação dos profissionais — carrossel guiado pelo scroll.
 *
 * A seção fica fixada (sticky) e o scroll conta a história de cada
 * profissional, um por vez:
 *  1. o card da FOTO entra da ESQUERDA e centraliza (o próximo fica
 *     espiando na borda esquerda, DESFOCADO — profundidade);
 *  2. fase de texto: nome + profissão ao lado do card; desliza para a
 *     direita e some;
 *  3. o CARD DA FORMAÇÃO emerge de trás da foto e abre para o LADO
 *     DIREITO (sai desfocado de trás e fica nítido no lugar);
 *  4. ao descer, o CARD DA ATUAÇÃO continua o padrão aparecendo pela
 *     ESQUERDA — composição final: [atuação] [foto] [formação];
 *  5. os cards se fecham atrás da foto e o conjunto sai pela direita,
 *     desfocando ao recuar; o próximo profissional centraliza.
 *
 * Tudo que está ATRÁS fica desfocado: o próximo card espiando, os cards
 * laterais enquanto emergem, e o conjunto ao sair.
 *
 * Mesmo receituário de desempenho das outras seções: cálculo a partir do
 * layout (imune a transform), escrita no DOM só quando muda, rAF
 * agrupando o scroll e early-exit fora da tela.
 */
/** Quanto scroll cada profissional segura (altura do segmento). É O botão
 *  de ritmo da seção: maior = história mais longa, transições mais lentas. */
const VH_POR_PROFISSIONAL = 500

export default function ProfissionaisSecao() {
  const secaoRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const secao = secaoRef.current
    if (!secao) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Sem movimento: o CSS mostra tudo estático e legível.
      secao.setAttribute('data-estatico', '')
      return
    }

    const profs = Array.from(secao.querySelectorAll<HTMLElement>('[data-prof]'))
    const cartoes = profs.map((p) => p.querySelector<HTMLElement>('[data-cartao]'))
    const cardsFormacao = profs.map((p) => p.querySelector<HTMLElement>('[data-card-formacao]'))
    const cardsAtuacao = profs.map((p) => p.querySelector<HTMLElement>('[data-card-atuacao]'))
    const fasesNome = profs.map((p) => p.querySelector<HTMLElement>('[data-fase-nome]'))
    const N = profs.length
    if (N === 0) return

    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
    const janela = (q: number, ini: number, fim: number) => clamp((q - ini) / (fim - ini), 0, 1)
    // Smootherstep: velocidade ZERO nas duas pontas — o elemento não dá
    // arranque ao começar nem freia seco ao assentar. É o que deixa as
    // entradas guiadas pelo scroll suaves.
    const suave = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

    // ---- Roteiro (progresso local 0→1 de cada profissional) -----------
    // Janelas mais LONGAS que a 1ª versão (entrada era 10% do segmento —
    // rápida demais): agora cada movimento tem tempo de scroll pra respirar.
    const ENTRA_FIM = 0.18 // card da foto vem da esquerda e centraliza
    const NOME = [0.18, 0.27, 0.36, 0.43] as const // nome + profissão
    const SAI_INI = 0.93 // conjunto se fecha e sai
    const GAP = 24 // espaço entre a foto e os cards laterais (px)

    // Janelas dos cards laterais. Em tela larga os dois convivem
    // ([atuação][foto][formação]); em tela estreita não cabem juntos — a
    // formação fecha antes de a atuação abrir (revezam no mesmo lugar).
    let estreito = false
    const jFormacao = () =>
      estreito
        ? { abre: [0.43, 0.53], fecha: [0.56, 0.62] }
        : { abre: [0.43, 0.55], fecha: [0.86, 0.93] }
    const jAtuacao = () =>
      estreito
        ? { abre: [0.64, 0.74], fecha: [0.86, 0.93] }
        : { abre: [0.62, 0.74], fecha: [0.86, 0.93] }

    // Medidas de layout (imunes a transform) — refeitas só no resize.
    let wFoto = 0
    let wFormacao = 0
    let wAtuacao = 0
    const laterais = [...cardsFormacao, ...cardsAtuacao].filter((c): c is HTMLElement => !!c)
    const recalcular = () => {
      estreito = window.innerWidth <= 832
      wFoto = cartoes[0]?.offsetWidth ?? 0
      wFormacao = cardsFormacao[0]?.offsetWidth ?? 0
      wAtuacao = cardsAtuacao[0]?.offsetWidth ?? 0
      // Rolagem interna SÓ no card cujo conteúdo transborda. Com o escape
      // sempre ligado, a roda parava sobre o card: o Lenis ignorava o
      // evento (data-lenis-prevent) e o card não tinha o que rolar.
      for (const c of laterais) {
        if (c.scrollHeight > c.clientHeight + 2) {
          c.setAttribute('data-lenis-prevent', '')
          c.style.pointerEvents = 'auto'
        } else {
          c.removeAttribute('data-lenis-prevent')
          c.style.pointerEvents = ''
        }
      }
    }

    // Escrita no DOM só quando muda (cache por elemento).
    const memo = new Map<HTMLElement, string>()
    // Quem está "em cena" (espiando, ativo ou saindo). Fora de cena, o
    // profissional é DESATIVADO: visibility:hidden o tira da composição e
    // o will-change é limpo — nada de camada de GPU parada à toa.
    const emCena: (boolean | null)[] = profs.map(() => null)
    const aplicar = (el: HTMLElement, transform: string, opacity: string, filter = '') => {
      const chave = transform + '|' + opacity + '|' + filter
      if (memo.get(el) === chave) return
      memo.set(el, chave)
      el.style.transform = transform
      el.style.opacity = opacity
      el.style.filter = filter
    }

    const atualizar = () => {
      const vh = window.innerHeight || 1
      const vw = window.innerWidth || 1
      const rect = secao.getBoundingClientRect()
      if (rect.bottom < -vh || rect.top > vh * 2) return
      const total = secao.offsetHeight - vh
      const p = clamp(-rect.top / total, 0, 1)
      const seg = 1 / N
      // Janelas iguais para todos: calculadas 1x por quadro, não por perfil.
      const jF = jFormacao()
      const jA = jAtuacao()

      for (let i = 0; i < N; i++) {
        const prof = profs[i]
        const cartao = cartoes[i]
        const cardF = cardsFormacao[i]
        const cardA = cardsAtuacao[i]
        const faseNome = fasesNome[i]
        if (!prof || !cartao) continue
        const q = (p - i * seg) / seg

        // Fora de cena (nem espiando, nem ativo, nem saindo)? DESATIVA e
        // pula: sem composição e sem nenhum cálculo para ele neste quadro.
        const vivo = q > -1 && q < 1
        if (emCena[i] !== vivo) {
          emCena[i] = vivo
          prof.style.visibility = vivo ? '' : 'hidden'
          prof.style.willChange = vivo ? 'transform, opacity, filter' : ''
        }
        if (!vivo) continue

        // ---- Aberturas dos cards laterais (a deriva pra direita é
        //      guiada pela abertura da atuação) --------------------------
        const aF =
          suave(janela(q, jF.abre[0] ?? 0, jF.abre[1] ?? 1)) *
          (1 - suave(janela(q, jF.fecha[0] ?? 0, jF.fecha[1] ?? 1)))
        const aA =
          suave(janela(q, jA.abre[0] ?? 0, jA.abre[1] ?? 1)) *
          (1 - suave(janela(q, jA.fecha[0] ?? 0, jA.fecha[1] ?? 1)))
        // Deriva pra DIREITA quando a atuação entra: o card não fica em
        // cima do próximo profissional (que espia à esquerda) e o conjunto
        // se afasta da esquerda — anunciando que a história está acabando.
        // Segue só a ABERTURA (não volta): a saída continua o movimento.
        const deriva = estreito
          ? 0
          : vw * 0.07 * suave(janela(q, jA.abre[0] ?? 0, jA.abre[1] ?? 1))

        // ---- Container (entrada / espiada desfocada / saída) ----------
        let x = 0
        let op = 1
        let sc = 1
        let borrao = 0 // "desfoque de quem está atrás"
        if (q < 0) {
          if (q > -1) {
            // PRÓXIMO: espiando na borda esquerda, ao fundo → desfocado.
            x = -vw * 0.49
            sc = 0.88
            op = 0.55
            borrao = 8
          } else {
            x = -vw * 1.2
            op = 0
          }
        } else if (q < ENTRA_FIM) {
          // Vem do fundo para a frente: o desfoque abre junto.
          const e = suave(q / ENTRA_FIM)
          x = -vw * 0.49 * (1 - e)
          sc = 0.88 + 0.12 * e
          op = 0.55 + 0.45 * e
          borrao = 8 * (1 - e)
        } else if (q > SAI_INI) {
          // Fecha e sai pela direita, recuando pro fundo → desfoca.
          const f = suave(janela(q, SAI_INI, 1))
          x = vw * 0.55 * f
          op = 1 - f
          sc = 1 - 0.06 * f
          borrao = 5 * f
        }
        // A deriva soma por cima da fase ativa e da saída (nunca da espiada).
        if (q >= 0) x += deriva
        aplicar(
          prof,
          `translateX(${x.toFixed(1)}px) scale(${sc.toFixed(4)})`,
          op.toFixed(3),
          borrao > 0.05 ? `blur(${borrao.toFixed(1)}px)` : '',
        )

        // ---- Cards laterais (formação → direita; atuação → esquerda) --
        // A foto cede espaço: esquerda quando a formação abre à direita,
        // e volta ao centro quando a atuação abre à esquerda.
        const fotoX = estreito ? 0 : (aA * (wAtuacao + GAP)) / 2 - (aF * (wFormacao + GAP)) / 2
        aplicar(cartao, Math.abs(fotoX) > 0.5 ? `translateX(${fotoX.toFixed(1)}px)` : '', '1')

        if (cardF) {
          // Emerge de TRÁS da foto para a direita; desfocado enquanto está atrás.
          const xF = estreito ? 0 : aF * (fotoX + (wFoto + wFormacao) / 2 + GAP)
          aplicar(
            cardF,
            `translateX(${xF.toFixed(1)}px) scale(${(0.94 + 0.06 * aF).toFixed(4)})`,
            aF.toFixed(3),
            aF < 0.999 ? `blur(${(6 * (1 - aF)).toFixed(1)}px)` : '',
          )
        }
        if (cardA) {
          // Continua o padrão: aparece pela ESQUERDA.
          const xA = estreito ? 0 : aA * (fotoX - (wFoto + wAtuacao) / 2 - GAP)
          aplicar(
            cardA,
            `translateX(${xA.toFixed(1)}px) scale(${(0.94 + 0.06 * aA).toFixed(4)})`,
            aA.toFixed(3),
            aA < 0.999 ? `blur(${(6 * (1 - aA)).toFixed(1)}px)` : '',
          )
        }

        // ---- Fase de texto: nome + profissão --------------------------
        if (faseNome) {
          const ent = suave(janela(q, NOME[0], NOME[1]))
          const sai = suave(janela(q, NOME[2], NOME[3]))
          const fx = -40 * (1 - ent) + 96 * sai
          aplicar(
            faseNome,
            `translateX(${fx.toFixed(1)}px)`,
            (ent * (1 - sai)).toFixed(3),
            sai > 0 ? `blur(${(4 * sai).toFixed(1)}px)` : '',
          )
        }
      }
    }

    // No máximo uma atualização por quadro.
    let agendado = false
    const aoRolar = () => {
      if (agendado) return
      agendado = true
      requestAnimationFrame(() => {
        agendado = false
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
    <section
      ref={secaoRef}
      className={s.secao}
      data-tone="light"
      id="profissionais"
      style={{ height: `${PROFISSIONAIS.length * VH_POR_PROFISSIONAL}vh` }}
    >
      <div className={s.palco}>
        <span className={s.rotuloSecao}>Nossos profissionais</span>

        {PROFISSIONAIS.map((p, i) => (
          <div className={s.prof} data-prof key={p.id}>
            {/* Card da foto (frente). */}
            <article
              className={s.cartao}
              data-cartao
              style={p.foto ? undefined : { background: p.gradiente }}
            >
              {p.foto ? (
                // lazy: a seção fica milhares de px abaixo — as fotos só
                // baixam quando o visitante se aproxima, não no carregamento.
                <img
                  className={s.foto}
                  src={p.foto}
                  alt={`Foto de ${p.nome}`}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className={s.semFoto} aria-hidden>
                  <svg viewBox="0 0 24 24" width="52" height="52">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8.5c.8-3.2 3.6-5 7-5s6.2 1.8 7 5"
                    />
                  </svg>
                  <span className={s.semFotoNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={s.semFotoAviso}>foto em breve</span>
                </div>
              )}
            </article>

            {/* Card da FORMAÇÃO — abre para o lado DIREITO da foto. */}
            <aside className={`${s.cardLateral} ${s.cardFormacao}`} data-card-formacao>
              <span className={s.compTitulo}>Formação</span>
              <ul className={s.compLista}>
                {p.formacao.map((linha) => (
                  <li key={linha} className={s.compItem}>
                    <span className={s.marcador} aria-hidden />
                    {linha}
                  </li>
                ))}
              </ul>
            </aside>

            {/* Card da ATUAÇÃO — continua o padrão, aparece pela ESQUERDA.
                Cada bloco é um serviço: título + descrição. */}
            <aside className={`${s.cardLateral} ${s.cardAtuacao}`} data-card-atuacao>
              <span className={s.compTitulo}>Atuação na clínica</span>
              {p.atuacaoIntro && <p className={s.atuacaoIntro}>{p.atuacaoIntro}</p>}
              {p.atuacao.map((bloco) => (
                <div key={bloco.titulo} className={s.atuacaoBloco}>
                  <h4 className={s.atuacaoTitulo}>{bloco.titulo}</h4>
                  {bloco.texto && <p className={s.atuacaoTexto}>{bloco.texto}</p>}
                </div>
              ))}
            </aside>

            {/* Fase de texto: nome + profissão, ao lado do card. */}
            <div className={s.fases}>
              <div className={s.fase} data-fase-nome>
                <h3 className={s.nome}>{p.nome}</h3>
                <p className={s.profissao}>{p.profissao}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
