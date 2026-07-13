import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import childrenGif from '../assets/children.gif'
import styles from './Home.module.css'

/** Home pública — landing por seções de tela cheia (scroll).
    Etapa 1: hero com gif em loop + nome da clínica. O header é
    transparente e adapta a cor (branco/marinho) à seção visível. */
export default function Home() {
  // Tom do header conforme a seção que está sob ele (data-tone).
  const [tone, setTone] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Rolagem por telas no documento (scroll-snap) + começa sempre no topo.
    const de = document.documentElement
    const prevSnap = de.style.scrollSnapType
    const prevBehavior = de.style.scrollBehavior
    de.style.scrollSnapType = 'y proximity'
    de.style.scrollBehavior = 'smooth'
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    // Só as seções DENTRO do main (o header também tem data-tone e não deve ser observado).
    const container = document.querySelector('main')
    const secoes = container ? Array.from(container.querySelectorAll<HTMLElement>('[data-tone]')) : []
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const t = (e.target as HTMLElement).dataset.tone
            if (t === 'light' || t === 'dark') setTone(t)
          }
        }
      },
      { rootMargin: '0px 0px -88% 0px', threshold: 0 },
    )
    secoes.forEach((s) => io.observe(s))

    return () => {
      io.disconnect()
      de.style.scrollSnapType = prevSnap
      de.style.scrollBehavior = prevBehavior
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto'
    }
  }, [])

  return (
    <>
      <Navbar landing tone={tone} />

      <main className={styles.main}>
        {/* Tela 1 — hero */}
        <section className={styles.hero} data-tone="light">
          <img src={childrenGif} alt="" aria-hidden className={styles.heroGif} />
          <div className={styles.heroScrim} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Clinleste</h1>
            <p className={styles.heroSub}>Cuidado que acolhe, saúde que transforma.</p>
          </div>
          <div className={styles.scrollCue} aria-hidden>
            <span>role para explorar</span>
            <span className={styles.scrollArrow} />
          </div>
        </section>

        {/* Tela 2 — placeholder (próximas seções na próxima etapa) */}
        <section className={styles.proxima} data-tone="dark">
          <div className={styles.proximaInner}>
            <span className={styles.proximaTag}>clinleste</span>
            <h2 className={styles.proximaTitulo}>
              Saúde mental além dos medicamentos. Tratamentos com abordagem terapêutica em Neuromodulação. 
            </h2>
            <p className={styles.proximaTexto}>
              
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
