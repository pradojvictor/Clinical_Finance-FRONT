import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Navbar from '../components/Navbar'
import childrenGif from '../assets/children.gif'
import logoLoader from '../assets/logoloading.svg'
import styles from './Home.module.css'

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

    const atualizar = () => {
      atualizarTom()
      revelarTexto()
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





      <div className={`${styles.navWrapper} ${!isLoading ? styles.loadedNav : ''}`}>
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
        <section className={styles.service} data-tone="dark">
          <div className={styles.serviceInner}>
            aqui vamos definir os serviços!!
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