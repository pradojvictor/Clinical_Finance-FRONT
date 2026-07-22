import {
  ENDERECO,
  HORARIOS,
  MAPA_EMBED_URL,
  TELEFONE_EXIBICAO,
  WHATSAPP_AGENDAR,
} from '../config/contato'
import s from './SobreSecao.module.css'

/**
 * Seção "Sobre" da Home — fica DEPOIS dos profissionais. É o destino do
 * link "Sobre" do header (rolagem até #sobre, não é página separada).
 *
 * Layout: MAPA à esquerda; à direita o endereço, o número com o link de
 * agendar consulta (WhatsApp) e o horário de funcionamento — dimensionado
 * para caber inteiro numa tela no desktop.
 */
export default function SobreSecao() {
  return (
    <section className={s.secao} data-tone="dark" id="sobre">
      <div className={s.inner}>
        <header className={s.cabecalho}>
          <span className={s.rotulo}>Sobre a clínica</span>
          <h2 className={s.titulo}>Clinleste</h2>
        </header>

        <div className={s.grade}>
          {/* ---- Mapa (esquerda) ---------------------------------------- */}
          <div className={s.mapa}>
            <iframe
              className={s.mapaFrame}
              src={MAPA_EMBED_URL}
              title="Mapa — como chegar à Clinleste"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* ---- Informações (direita) ---------------------------------- */}
          <div className={s.info}>
            <div className={s.infoGrupo}>
              <span className={s.infoTitulo}>Endereço</span>
              <p className={s.endereco}>{ENDERECO}</p>
            </div>

            <div className={s.infoGrupo}>
              <span className={s.infoTitulo}>Agende sua consulta</span>
              <a
                href={WHATSAPP_AGENDAR}
                target="_blank"
                rel="noopener noreferrer"
                className={s.telefone}
              >
                {TELEFONE_EXIBICAO}
              </a>
              <a
                href={WHATSAPP_AGENDAR}
                target="_blank"
                rel="noopener noreferrer"
                className={s.agendar}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.25 8.24-8.25m-3.34 4.16c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.39 1 2.56.13.17 1.76 2.67 4.25 3.73 2.06.87 2.48.7 2.93.66.45-.05 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.47-.28-.25-.13-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.17-.28.19-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.55-1.34-.76-1.84-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.47-.01"
                  />
                </svg>
                Agendar consulta
              </a>
            </div>

            <div className={s.infoGrupo}>
              <span className={s.infoTitulo}>Horário de funcionamento</span>
              <ul className={s.horarios}>
                {HORARIOS.map((h) => (
                  <li key={h.dia} className={s.horarioLinha}>
                    <span className={s.dia}>{h.dia}</span>
                    <span className={h.horario === 'Fechado' ? s.fechado : s.horas}>
                      {h.horario}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
