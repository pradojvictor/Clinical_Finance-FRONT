import { Link } from 'react-router-dom'
import { MIDIAS, formatarData, type Midia } from '../config/midias'
import s from './MidiasSecao.module.css'

/** Ícone do tipo do conteúdo (play para vídeo, folha para artigo). */
function IconeTipo({ tipo }: { tipo: Midia['tipo'] }) {
  return tipo === 'video' ? (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M8 5.14v13.72L19 12 8 5.14Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M6 4h9l3 3v13H6zM9 9h6M9 13h6M9 17h4"
      />
    </svg>
  )
}

/** Card de uma mídia — usado na seção da Home e na página /midias.
    A capa é SEMPRE estática (foto ou GIF): vídeo não toca aqui. */
export function MidiaCard({ midia }: { midia: Midia }) {
  return (
    <article className={s.card}>
      <div
        className={s.capa}
        style={midia.capa ? undefined : { background: midia.gradiente }}
      >
        {midia.capa && <img className={s.capaImg} src={midia.capa} alt="" loading="lazy" />}
        <span className={s.tipo}>
          <IconeTipo tipo={midia.tipo} />
          {midia.tipo === 'video' ? 'Vídeo' : 'Artigo'}
        </span>
      </div>
      <div className={s.corpo}>
        <h3 className={s.tituloCard}>{midia.titulo}</h3>
        <p className={s.resumo}>{midia.resumo}</p>
        <span className={s.meta}>
          {midia.autor} · {formatarData(midia.data)}
        </span>
      </div>
    </article>
  )
}

/**
 * Seção "Mídias" da Home — vitrine INTRODUTÓRIA do mini blog: mostra os
 * 3 conteúdos mais recentes (capa estática) e o botão "Ver todos", que
 * leva à página /midias. Fica antes do Sobre.
 */
export default function MidiasSecao() {
  const recentes = MIDIAS.slice(0, 3)
  return (
    <section className={s.secao} data-tone="dark" id="midias">
      <div className={s.inner}>
        <header className={s.cabecalho}>
          <div>
            <span className={s.rotulo}>Mídias e informativos</span>
            <h2 className={s.titulo}>Conteúdos dos nossos profissionais</h2>
          </div>
          <Link to="/midias" className={s.verTodos}>
            Ver todos
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
        </header>

        <div className={s.grade}>
          {recentes.map((m) => (
            <MidiaCard midia={m} key={m.id} />
          ))}
        </div>
      </div>
    </section>
  )
}
