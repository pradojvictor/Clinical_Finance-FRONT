import { useEffect, useState } from 'react'
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
    const prevSnap = de.style.scrollSnapType
    const prevBehavior = de.style.scrollBehavior
    de.style.scrollSnapType = 'y proximity'
    de.style.scrollBehavior = 'smooth'
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    const container = document.querySelector('main')
    const secoes = container ? Array.from(container.querySelectorAll<HTMLElement>('[data-tone]')) : []

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const t = (e.target as HTMLElement).dataset.tone
            if (t === 'light' || t === 'dark') setTone(t)

            // Ativa os blocos quando a tela 2 (dark) entra
            if (t === 'dark') setIsSectionVisible(true)
          } else {
            // Opcional: reseta ao sair
            const t = (e.target as HTMLElement).dataset.tone
            if (t === 'dark') setIsSectionVisible(false)
          }
        }
      },
      { rootMargin: '-20% 0px -20% 0px', threshold: 0 },
    )
    secoes.forEach((s) => io.observe(s))

    return () => {
      clearTimeout(timer)
      io.disconnect()
      de.style.scrollSnapType = prevSnap
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
              Saúde mental além dos medicamentos. Tratamentos com abordagem terapêutica em Neuromodulação.
            </h2>
            <p className={styles.proximaTexto}></p>
          </div>
        </section>
      </main>
    </>
  )
}