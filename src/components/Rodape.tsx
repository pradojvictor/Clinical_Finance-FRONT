import {
  ENDERECO,
  INSTAGRAM_URL,
  TELEFONE_EXIBICAO,
  WHATSAPP_AGENDAR,
} from '../config/contato'
import s from './Rodape.module.css'

/** Salto instantâneo até uma seção da própria Home (mesmo padrão do header). */
const irPara = (id: string) => (e: React.MouseEvent) => {
  const alvo = document.getElementById(id)
  if (alvo) {
    e.preventDefault()
    alvo.scrollIntoView({ behavior: 'instant' })
  }
}

/**
 * Rodapé — última seção da Home. Marca + endereço, atalhos das seções,
 * contato (WhatsApp/Instagram) e horário resumido. Conteúdo vem de
 * config/contato.ts; o layout é a base para lapidar depois.
 */
export default function Rodape() {
  return (
    <footer className={s.rodape} data-tone="light" id="rodape">
      <div className={s.inner}>
        <div className={s.colunas}>
          {/* Marca + endereço */}
          <div className={s.coluna}>
            <span className={s.marca}>Clinleste</span>
            <p className={s.slogan}>Cuidado que acolhe, saúde que transforma.</p>
            <p className={s.endereco}>{ENDERECO}</p>
          </div>

          {/* Atalhos das seções */}
          <nav className={s.coluna} aria-label="Seções do site">
            <span className={s.titulo}>Navegue</span>
            <a className={s.link} href="#procedimentos" onClick={irPara('procedimentos')}>
              Procedimentos
            </a>
            <a className={s.link} href="#profissionais" onClick={irPara('profissionais')}>
              Profissionais
            </a>
            <a className={s.link} href="#midias" onClick={irPara('midias')}>
              Mídias e informativos
            </a>
            <a className={s.link} href="#sobre" onClick={irPara('sobre')}>
              Sobre a clínica
            </a>
          </nav>

          {/* Contato */}
          <div className={s.coluna}>
            <span className={s.titulo}>Agende sua consulta</span>
            <a
              className={s.link}
              href={WHATSAPP_AGENDAR}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp · {TELEFONE_EXIBICAO}
            </a>
            <a className={s.link} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram · @clinlesteteresina
            </a>
          </div>

          {/* Horários (resumo) */}
          <div className={s.coluna}>
            <span className={s.titulo}>Horário de funcionamento</span>
            <p className={s.horario}>Segunda a sexta</p>
            <p className={s.horarioForte}>08:00–12:00 · 14:00–18:00</p>
            <p className={s.horario}>Sábado e domingo — fechado</p>
          </div>
        </div>

        <div className={s.base}>
          <span>© {new Date().getFullYear()} Clinleste — Teresina, PI</span>
        </div>
      </div>
    </footer>
  )
}
