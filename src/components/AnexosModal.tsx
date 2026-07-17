import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ApiError, saidasApi, urlAnexo, type AnexoInfo, type SaidaDetalhe } from '../lib/api'
import { brl, dataBR } from '../lib/format'
import e from '../pages/Entradas.module.css'

const msg = (x: unknown) => (x instanceof ApiError ? x.message : 'Ocorreu um erro.')
const kb = (b: number) => (b < 1024 ? `${b} B` : `${(b / 1024).toFixed(0)} KB`)

/**
 * Recibos de uma saída: ver, baixar, anexar e remover.
 *
 * Os arquivos não vivem em pasta pública — cada um sai por uma rota que
 * exige sessão. Por isso a miniatura é a própria URL autenticada (o
 * cookie viaja junto) e não um caminho estático.
 */
export default function AnexosModal({
  saida,
  onClose,
  onMudou,
}: {
  saida: SaidaDetalhe
  onClose: () => void
  onMudou: () => void
}) {
  const [anexos, setAnexos] = useState<AnexoInfo[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [removendo, setRemovendo] = useState<AnexoInfo | null>(null)
  const [senha, setSenha] = useState('')

  const carregar = () => {
    saidasApi
      .anexos(saida.id)
      .then((r) => setAnexos(r.anexos))
      .catch((x) => setErro(msg(x)))
  }
  useEffect(carregar, [saida.id])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const enviar = async (files: FileList | null) => {
    const lista = Array.from(files ?? [])
    if (lista.length === 0) return
    setErro(null)
    setEnviando(true)
    try {
      await saidasApi.anexar(saida.id, lista)
      carregar()
      onMudou()
    } catch (x) {
      setErro(msg(x))
    } finally {
      setEnviando(false)
    }
  }

  const confirmarRemocao = async () => {
    if (!removendo) return
    if (!senha) return setErro('Digite sua senha para confirmar.')
    setErro(null)
    try {
      await saidasApi.excluirAnexo(removendo.id, senha)
      setRemovendo(null)
      setSenha('')
      carregar()
      onMudou()
    } catch (x) {
      setErro(msg(x))
    }
  }

  return createPortal(
    <div className={e.backdrop} onMouseDown={onClose}>
      <div
        className={e.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Recibos da saída"
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <div className={e.head}>
          <h2 className={e.titulo}>Recibos</h2>
          <button type="button" className={e.fechar} onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className={e.form}>
          {erro && <div className={e.erro}>{erro}</div>}

          <div className={e.taxaBox}>
            <strong>{brl(saida.valor_centavos)}</strong> · {dataBR(saida.data)} ·{' '}
            {[saida.categoria_nome, saida.subcategoria_nome].filter(Boolean).join(' · ')}
          </div>

          {anexos === null ? (
            <p className={e.dataNota}>Carregando…</p>
          ) : anexos.length === 0 ? (
            <p className={e.dataNota}>Nenhum recibo anexado.</p>
          ) : (
            <div className={e.anexoLista}>
              {anexos.map((a) => (
                <div key={a.id} className={e.anexoItem}>
                  {a.mime === 'image/webp' ? (
                    // A imagem foi re-codificada no servidor: é inerte,
                    // então abrir na tela é seguro.
                    <a href={urlAnexo(a.id)} target="_blank" rel="noreferrer" className={e.anexoMini}>
                      <img src={urlAnexo(a.id)} alt={a.nome} />
                    </a>
                  ) : (
                    <span className={`${e.anexoMini} ${e.anexoPdf}`}>PDF</span>
                  )}

                  <div className={e.anexoInfo}>
                    <a href={urlAnexo(a.id)} target="_blank" rel="noreferrer" className={e.acaoLink}>
                      {a.nome}
                    </a>
                    <span className={e.dataNota}>
                      {kb(a.tamanho_bytes)} · {dataBR(a.criado_em.slice(0, 10))}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={e.acaoPerigo}
                    onClick={() => {
                      setRemovendo(a)
                      setErro(null)
                    }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Confirmação de remoção — exige senha, como as outras exclusões.
              Bloco próprio (não o .taxaBox, que é uma linha horizontal de
              resumo e espremia o campo em metade da largura). */}
          {removendo && (
            <div className={e.anexoRemover}>
              <p className={e.anexoRemoverTexto}>
                Remover <strong>{removendo.nome}</strong>? Não há desfazer.
              </p>
              <label className={e.campo}>
                <span className={e.label}>Sua senha (confirmação)</span>
                <input
                  className={e.input}
                  type="password"
                  value={senha}
                  onChange={(ev) => setSenha(ev.target.value)}
                  onKeyDown={(ev) => ev.key === 'Enter' && confirmarRemocao()}
                  placeholder="senha do gestor"
                  autoComplete="current-password"
                  autoFocus
                />
              </label>
              <div className={e.anexoRemoverAcoes}>
                <button
                  type="button"
                  className={e.cancelar}
                  onClick={() => {
                    setRemovendo(null)
                    setSenha('')
                    setErro(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="button" className={e.submitPerigo} onClick={confirmarRemocao}>
                  Remover recibo
                </button>
              </div>
            </div>
          )}

          <label className={e.campo}>
            <span className={e.label}>Anexar recibo</span>
            <input
              className={e.input}
              type="file"
              multiple
              accept="image/*,application/pdf,.pdf,.heic"
              disabled={enviando}
              onChange={(ev) => enviar(ev.target.files)}
            />
            <span className={e.dataNota}>
              {enviando ? 'Enviando…' : 'Foto ou PDF. A foto é reduzida no envio.'}
            </span>
          </label>
        </div>
      </div>
    </div>,
    document.body,
  )
}
