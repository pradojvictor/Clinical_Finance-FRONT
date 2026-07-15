import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Navbar from '../components/Navbar'
import childrenGif from '../assets/children.gif'
import logoLoader from '../assets/logoloading.svg'
import styles from './Home.module.css'

const SERVICOS = [
  {
    nome: 'Psiquiatria',
    texto: 'Diagnóstico e tratamento de transtornos mentais, com acompanhamento médico contínuo e humano.',
  },
  {
    nome: 'Psicologia',
    texto: 'Terapia e escuta cuidadosa para promover equilíbrio emocional e qualidade de vida.',
  },
  {
    nome: 'Neuromodulação',
    texto: 'Estimulação cerebral avançada e não invasiva para tratar sintomas onde o remédio não basta.',
  },
  {
    nome: 'Ortopedia',
    texto: 'Cuidado com ossos, articulações e músculos para devolver o seu movimento.',
  },
  {
    nome: 'Fonoaudiologia',
    texto: 'Avaliação e reabilitação da fala, linguagem, audição e deglutição.',
  },
  {
    nome: 'Fisioterapia',
    texto: 'Reabilitação física para recuperar força, função e autonomia no dia a dia.',
  },
]

export default function Home() {
  const [tone, setTone] = useState<'light' | 'dark'>('light')
  const [isLoading, setIsLoading] = useState(true)

  // 👇 Adicionamos este estado para controlar os blocos do scroll
  const [isSectionVisible, setIsSectionVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000)

    const de = document.documentElement
    const prevBehavior = de.style.scrollBehavior
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

    const container = document.querySelector('main')
    const secoes = container
      ? Array.from(container.querySelectorAll<HTMLElement>('[data-tone]'))
      : []

    // Tom do header: definido pela seção que está sob a linha do header.
    // Chamada direta no scroll (sem requestAnimationFrame) para não depender
    // de repaint — funciona mesmo com o IntersectionObserver throttled.
    const LINHA = 40 // altura aproximada do header
    const atualizarTom = () => {
      for (const s of secoes) {
        const r = s.getBoundingClientRect()
        if (r.top <= LINHA && r.bottom > LINHA) {
          const t = s.dataset.tone
          if (t === 'light' || t === 'dark') setTone(t)
          break
        }
      }
    }

    // Revelação do texto da 2ª seção (proxima): cada palavra sai de
    // desfocada+apagada -> nítida+cheia conforme a seção sobe pela viewport.
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn = (t: number) => t * t * t
    const proxima = secoes.find((s) => s.querySelector('[data-palavra]'))
    const palavras = proxima
      ? Array.from(proxima.querySelectorAll<HTMLElement>('[data-palavra]'))
      : []
    const revelarTexto = () => {
      if (!proxima || palavras.length === 0) return
      const vh = window.innerHeight
      const inicio = vh * 0.85 // começa a revelar quando o topo entra a 85% da tela
      const fim = vh * 0.28 // termina quando o topo chega a 28% da tela
      const top = proxima.getBoundingClientRect().top
      const p = clamp((inicio - top) / (inicio - fim), 0, 1)
      const n = Math.round(p * palavras.length)
      palavras.forEach((w, i) => {
        const on = i < n
        w.style.opacity = on ? '1' : ''
        w.style.filter = on ? 'blur(0px)' : ''
      })
    }

    // Sequência de serviços (scroll-pin): cada texto surge menor e cresce,
    // segura e some; o logo recua ao fundo; barra de progresso acompanha; e
    // no fim os cards entram lado a lado (visão geral).
    const servico = container?.querySelector<HTMLElement>('[data-servico]') ?? null
    const svItens = servico
      ? Array.from(servico.querySelectorAll<HTMLElement>('[data-servico-item]'))
      : []
    const svLogo = servico?.querySelector<HTMLElement>('[data-servico-logo]') ?? null
    const svStage = servico?.querySelector<HTMLElement>('[data-servico-stage]') ?? null
    const svOverview = servico?.querySelector<HTMLElement>('[data-servico-overview]') ?? null
    const svCards = svOverview
      ? Array.from(svOverview.querySelectorAll<HTMLElement>('[data-servico-card]'))
      : []
    const svBar = servico?.querySelector<HTMLElement>('[data-servico-bar]') ?? null
    const svCounter = servico?.querySelector<HTMLElement>('[data-servico-counter]') ?? null
    const svProgress = servico?.querySelector<HTMLElement>('[data-servico-progress]') ?? null
    const N = svItens.length

    const atualizarServicos = () => {
      if (!servico || N === 0) return
      const vh = window.innerHeight
      const total = servico.offsetHeight - vh
      const p = clamp(-servico.getBoundingClientRect().top / total, 0, 1)
      const segs = N + 1 // 6 serviços + visão geral
      const seg = 1 / segs
      const overviewInicio = N * seg

      // Textos: entram vindo do fundo (menor + desfocado) e da esquerda,
      // avançam para a frente (nítido) no centro, e saem pela direita ao fundo.
      svItens.forEach((item, i) => {
        const lp = (p - i * seg) / seg // 0..1 dentro do segmento
        let op = 0
        let tx = -72
        let sc = 0.72
        let blur = 8
        if (lp > -0.1 && lp < 1.1) {
          // pos: -1 (fundo/esquerda) -> 0 (frente/centro) -> +1 (fundo/direita)
          let pos: number
          if (lp < 0.4) pos = -(1 - easeOut(clamp(lp / 0.4, 0, 1)))
          else if (lp < 0.6) pos = 0
          else pos = easeIn(clamp((lp - 0.6) / 0.4, 0, 1))
          const depth = 1 - Math.abs(pos) // 1 = frente/nítido, 0 = fundo/desfocado
          tx = pos * 72
          sc = 0.72 + depth * 0.28
          blur = (1 - depth) * 8
          op = clamp(depth * 1.8, 0, 1)
        }
        item.style.opacity = op.toFixed(3)
        item.style.transform = `translate(-50%, -50%) translateX(${tx.toFixed(1)}px) scale(${sc.toFixed(3)})`
        item.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : ''
      })

      // Logo recuando: grande -> pequeno, esquerda -> direita, some no fim.
      if (svLogo) {
        const lp = clamp(p / overviewInicio, 0, 1)
        const fade = p >= overviewInicio ? clamp(1 - (p - overviewInicio) / seg, 0, 1) : 1
        svLogo.style.transform = `translate(-50%, -50%) translateX(${(-14 + lp * 46).toFixed(1)}vw) scale(${(1.6 - lp * 1.05).toFixed(3)})`
        svLogo.style.opacity = ((0.36 - lp * 0.18) * fade).toFixed(3)
      }

      // Barra de progresso + contador (fase dos textos).
      const pTextos = clamp(p / overviewInicio, 0, 1)
      if (svBar) svBar.style.transform = `scaleX(${pTextos.toFixed(4)})`
      if (svCounter) svCounter.textContent = String(Math.min(N, Math.floor(p / seg) + 1)).padStart(2, '0')

      // Visão geral: some o palco/logo, entram os cards com stagger.
      const ov = clamp((p - overviewInicio) / seg, 0, 1)
      if (svStage) svStage.style.opacity = String(clamp(1 - ov * 3, 0, 1))
      if (svProgress) svProgress.style.opacity = String(clamp(1 - ov * 3, 0, 1))
      if (svOverview) svOverview.style.opacity = String(clamp(ov * 3, 0, 1))
      svCards.forEach((c, i) => {
        const cp = clamp(ov * 1.8 - i * 0.12, 0, 1)
        c.style.opacity = cp.toFixed(3)
        c.style.setProperty('--enter', `${((1 - cp) * 42).toFixed(1)}px`)
      })
    }

    const atualizar = () => {
      atualizarTom()
      revelarTexto()
      atualizarServicos()
    }

    // Abre sempre no hero (sem restauração de scroll do navegador).
    de.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    atualizar()

    // Scroll suave (inércia) para valorizar os efeitos ligados ao rolar.
    // O Lenis dispara 'scroll' a cada frame -> atualiza tom + revelação do texto.
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true, touchMultiplier: 1.5 })
    lenis.on('scroll', atualizar)
    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Escadinha/blocos: mantém o observer (ativa quando a seção dark entra)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const t = (e.target as HTMLElement).dataset.tone
          if (t === 'dark') setIsSectionVisible(e.isIntersecting)
        }
      },
      { rootMargin: '-20% 0px -20% 0px', threshold: 0 },
    )
    secoes.forEach((s) => io.observe(s))

    window.addEventListener('scroll', atualizar, { passive: true })

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafId)
      lenis.destroy()
      io.disconnect()
      window.removeEventListener('scroll', atualizar)
      de.style.scrollBehavior = prevBehavior
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto'
    }
  }, [])

  return (
    <>
      {/* <div className={`${styles.preloader} ${!isLoading ? styles.preloaderHidden : ''}`}>
        <div className={styles.preloaderText}>{isLoading ? 'INICIANDO...' : ''}</div>
        <div className={styles.loader}>{isLoading ? '' : ''}</div>
        <div
          className={styles.loader}
          style={{ '--logo-url': `url(${logoLoader})` } as React.CSSProperties}
        >
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={styles.preloaderBlocks}>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
        </div>
      </div> */}

      <div className={`${styles.preloader} ${!isLoading ? styles.preloaderHidden : ''}`}>

        {/* 👇 1. BLOCOS PRIMEIRO: Ficam no fundo da tela */}
        <div className={styles.preloaderBlocks}>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
          <div className={styles.pBlock}></div>
        </div>

        {/* 👇 2. LOADER DEPOIS: Fica por cima dos blocos garantindo visibilidade */}
        <div className={styles.loader}>
          {/* Usamos a checagem 'logoLoader.src' caso você esteja no Next.js, ou só 'logoLoader' no Vite */}
          <span style={{ backgroundImage: `url("${typeof logoLoader === 'string' ? logoLoader : (logoLoader as any).src}")` }}></span>
          <span style={{ backgroundImage: `url("${typeof logoLoader === 'string' ? logoLoader : (logoLoader as any).src}")` }}></span>
          <span style={{ backgroundImage: `url("${typeof logoLoader === 'string' ? logoLoader : (logoLoader as any).src}")` }}></span>
          <span style={{ backgroundImage: `url("${typeof logoLoader === 'string' ? logoLoader : (logoLoader as any).src}")` }}></span>
        </div>

      </div>





      {/* Letreiro de localização — só na 1ª tela (hero). Recolhe ao rolar. */}
      <div
        className={`${styles.letreiro} ${tone === 'light' && !isLoading ? styles.letreiroVisivel : ''}`}
        aria-label="Localização da clínica: R. das Orquídeas, 601 - Jóquei, Teresina - PI"
      >
        <div className={styles.letreiroTrack} aria-hidden>
          <span className={styles.letreiroItem}>
            <svg className={styles.letreiroPin} viewBox="0 0 24 24" width="14" height="14" aria-hidden>
              <path
                fill="currentColor"
                d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
              />
            </svg>
            R. das Orquídeas, 601 - Jóquei, Teresina - PI
          </span>
        </div>
      </div>

      <div
        className={`${styles.navWrapper} ${!isLoading ? styles.loadedNav : ''} ${tone === 'light' ? styles.navComLetreiro : ''}`}
      >
        <Navbar landing tone={tone} />
      </div>

      <main className={`${styles.main} ${!isLoading ? styles.isLoaded : ''}`}>
        <section className={styles.hero} data-tone="light">
          <img src={childrenGif} alt="" aria-hidden className={styles.heroGif} />
          <div className={styles.heroScrim} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              {'Clinleste'.split('').map((char, index) => (
                <span key={index} style={{ transitionDelay: `${0.7 + (index * 0.08)}s` }}>{char}</span>
              ))}
            </h1>
            
            <p className={styles.heroSub}>Cuidado que acolhe, saúde que transforma.</p>
          </div>
          <div className={`${styles.scrollCue} ${!isLoading ? styles.loadedScroll : ''}`} aria-hidden>
            <span>role para explorar</span>
            <span className={styles.scrollArrow} />
          </div>
        </section>

        <section className={styles.proxima} data-tone="dark">
          {/* 👇 Usando o estado correto aqui 👇 */}
          <div className={`${styles.staircase} ${isSectionVisible ? styles.showStairs : ''}`} aria-hidden>
            <div className={styles.step}></div>
            <div className={styles.step}></div>
            <div className={styles.step}></div>
            <div className={styles.step}></div>
            <div className={styles.step}></div>
          </div>

          <div className={styles.proximaInner}>
            <span className={styles.proximaTag}>clinleste</span>
            <h2 className={styles.proximaTitulo}>
              {'Saúde mental além dos medicamentos. Tratamentos com abordagem terapêutica em Neuromodulação.'
                .split(' ')
                .map((palavra, i) => (
                  <span key={i} className={styles.palavra} data-palavra>
                    {palavra}
                  </span>
                ))}
            </h2>
            <p className={styles.proximaTexto}></p>
          </div>
        </section>
        <section className={styles.service} data-tone="dark" data-servico>
          <div className={styles.serviceSticky}>
            <img
              src={logoLoader}
              alt=""
              aria-hidden
              className={styles.serviceLogo}
              data-servico-logo
            />
            <div className={styles.serviceGlass} aria-hidden />

            <div className={styles.serviceStage} data-servico-stage>
              {SERVICOS.map((s, i) => (
                <div className={styles.serviceItem} data-servico-item key={s.nome}>
                  <span className={styles.serviceNum}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={styles.serviceNome}>{s.nome}</h3>
                  <p className={styles.serviceTexto}>{s.texto}</p>
                </div>
              ))}
            </div>

            <div className={styles.serviceOverview} data-servico-overview>
              <h3 className={styles.overviewTitulo}>Nossas especialidades</h3>
              <div className={styles.serviceCards}>
                {SERVICOS.map((s, i) => (
                  <article className={styles.serviceCard} data-servico-card key={s.nome}>
                    <span className={styles.cardNum}>{String(i + 1).padStart(2, '0')}</span>
                    <h4 className={styles.cardNome}>{s.nome}</h4>
                    <p className={styles.cardTexto}>{s.texto}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.serviceProgress} data-servico-progress aria-hidden>
              <span className={styles.progressCounter}>
                <span data-servico-counter>01</span> / {String(SERVICOS.length).padStart(2, '0')}
              </span>
              <span className={styles.progressTrack}>
                <span className={styles.progressFill} data-servico-bar />
              </span>
            </div>
          </div>
        </section>

        <section className={styles.procedimentos} data-tone="dark">
          <div className={styles.procedimentosInner}>
            aqui vamos apresentar os procedimentos!!
            zoom em cada um saindo da esquerda pra o fundo!
          </div>
        </section>

        <section className={styles.profissionais} data-tone="dark">
          <div className={styles.profissionaisInner}>
            aqui vamos apresentar os profissionais!!
            cads estilo carroseu
          </div>
        </section>

        <section className={styles.midia} data-tone="dark">
          <div className={styles.midiaInner}>
            <h2 className={styles.heros}>Clinleste</h2>
            <p className={styles.herosp}>aqui vamos apresentar a mídia!! quadros com informaçoes uteis e videos do instagran!</p>
          </div>
        </section>
      </main>
    </>
  )
}