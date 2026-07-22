import { useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { MidiaCard } from '../components/MidiasSecao'
import { MIDIAS } from '../config/midias'
import s from './Midias.module.css'

/**
 * Página /midias — o "mini blog" da clínica: todos os artigos e vídeos
 * dos profissionais, do mais novo pro mais antigo (alimentado como o
 * Instagram: novidade entra no topo de config/midias.ts).
 *
 * Por enquanto lista os cards (conteúdo placeholder); quando os textos e
 * vídeos reais chegarem, cada card ganha o destino (post/vídeo).
 */
export default function Midias() {
  // Vindo da Home rolada, abre no topo — antes do primeiro paint.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className={s.page}>
      <Navbar />

      <main className={s.main}>
        <header className={s.cabecalho}>
          <Link to="/" className={s.voltar}>
            ← Voltar ao site
          </Link>
          <span className={s.rotulo}>Mídias e informativos</span>
          <h1 className={s.titulo}>Conteúdos dos nossos profissionais</h1>
          <p className={s.sub}>
            Artigos e vídeos explicativos, sempre com novidades — como no nosso Instagram.
          </p>
        </header>

        <div className={s.grade}>
          {MIDIAS.map((m) => (
            <MidiaCard midia={m} key={m.id} />
          ))}
        </div>
      </main>
    </div>
  )
}
