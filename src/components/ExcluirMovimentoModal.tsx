import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ApiError } from '../lib/api'
import { brl, dataBR, restaDaJanela } from '../lib/format'
import e from '../pages/Entradas.module.css'

/**
 * Confirmação de exclusão de um movimento (entrada ou saída).
 *
 * Exige a senha do gestor e só aparece dentro da janela de 24h a partir do
 * registro — quem decide de verdade é o servidor, que confere senha e
 * janela de novo. Esta tela existe para não oferecer um botão que falharia
 * e para o gestor ver o que está apagando antes de apagar.
 */
export default function ExcluirMovimentoModal({
  tipo,
  descricao,
  valorCentavos,
  data,
  criadoEm,
  aviso,
  onExcluir,
  onClose,
  onExcluido,
}: {
  tipo: 'entrada' | 'saída'
  descricao: string
  valorCentavos: number
  data: string
  criadoEm: string
  /** Consequência extra a avisar (ex.: leva o pagamento do profissional). */
  aviso?: string
  onExcluir: (senha: string) => Promise<unknown>
  onClose: () => void
  onExcluido: () => void
}) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setErro(null)
    if (!senha) return setErro('Digite sua senha para confirmar.')
    setEnviando(true)
    try {
      await onExcluir(senha)
      onExcluido()
    } catch (x) {
      setErro(x instanceof ApiError ? x.message : 'Não foi possível excluir.')
      setEnviando(false)
    }
  }

  const resta = restaDaJanela(criadoEm)

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div
        className={e.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Excluir ${tipo}`}
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <div className={e.head}>
          <h2 className={e.titulo}>Excluir {tipo}</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <form className={e.form} onSubmit={onSubmit} noValidate>
          {erro && <div className={e.erro}>{erro}</div>}

          {/* O que está sendo apagado, por extenso: exclusão não tem desfazer. */}
          <div className={e.taxaBox}>
            <div>
              <strong>{brl(valorCentavos)}</strong> · {dataBR(data)}
            </div>
            <div>{descricao}</div>
          </div>

          <p className={e.dataNota}>
            Isto apaga o registro de vez — não há desfazer.
            {aviso ? ` ${aviso}` : ''}
            {resta ? ` A exclusão fica disponível por mais ${resta}.` : ''}
          </p>

          <label className={e.campo}>
            <span className={e.label}>Sua senha (confirmação)</span>
            <input
              className={e.input}
              type="password"
              value={senha}
              onChange={(ev) => setSenha(ev.target.value)}
              placeholder="senha do gestor"
              autoComplete="current-password"
              autoFocus
            />
          </label>

          <div className={e.rodape}>
            <button type="button" className={e.cancelar} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={e.submitPerigo} disabled={enviando}>
              {enviando ? 'Excluindo…' : `Excluir ${tipo}`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
