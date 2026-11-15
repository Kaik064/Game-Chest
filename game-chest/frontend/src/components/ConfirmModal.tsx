import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  aberto: boolean
  titulo: string
  mensagem: string
  rotuloConfirmar?: string
  ocupado?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmModal({
  aberto,
  titulo,
  mensagem,
  rotuloConfirmar = 'Excluir',
  ocupado = false,
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) return

    cancelarRef.current?.focus()

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !ocupado) onCancelar()
    }

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', aoTeclar)

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, ocupado, onCancelar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !ocupado) onCancelar()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-mensagem"
        className="panel w-full max-w-sm bg-surface p-6 shadow-2xl"
      >
        <h2 id="confirmar-titulo" className="text-xl font-bold">
          {titulo}
        </h2>
        <p id="confirmar-mensagem" className="mt-2 text-sm text-muted">
          {mensagem}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelarRef}
            type="button"
            className="btn-ghost"
            onClick={onCancelar}
            disabled={ocupado}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-rose px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-rose/90 disabled:opacity-50"
            onClick={onConfirmar}
            disabled={ocupado}
          >
            {ocupado ? 'Excluindo…' : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
