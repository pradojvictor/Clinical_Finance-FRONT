// =====================================================================
// Contatos e redes da clínica — usados no header do site (e onde mais
// for preciso). Centralizado aqui para trocar num lugar só.
//
export const WHATSAPP_URL = 'https://wa.me/5586999538421'
export const INSTAGRAM_URL = 'https://instagram.com/clinlesteteresina'

export const ENDERECO = 'R. das Orquídeas, 601 — Jóquei, Teresina - PI'
export const TELEFONE_EXIBICAO = '+55 86 99953-8421'

/** WhatsApp já com a mensagem de agendamento preenchida. */
export const WHATSAPP_AGENDAR = `${WHATSAPP_URL}?text=${encodeURIComponent(
  'Olá! Gostaria de agendar uma consulta.',
)}`

/** Embed do Google Maps (sem chave de API) apontando para a clínica. */
export const MAPA_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  'Clinleste, R. das Orquídeas, 601 - Jóquei, Teresina - PI',
)}&output=embed&hl=pt-BR`

/** Horário de funcionamento, na ordem de exibição. */
export const HORARIOS: { dia: string; horario: string }[] = [
  { dia: 'domingo', horario: 'Fechado' },
  { dia: 'segunda-feira', horario: '08:00–12:00, 14:00–18:00' },
  { dia: 'terça-feira', horario: '08:00–12:00, 14:00–18:00' },
  { dia: 'quarta-feira', horario: '08:00–12:00, 14:00–18:00' },
  { dia: 'quinta-feira', horario: '08:00–12:00, 14:00–18:00' },
  { dia: 'sexta-feira', horario: '08:00–12:00, 14:00–18:00' },
  { dia: 'sábado', horario: 'Fechado' },
]
