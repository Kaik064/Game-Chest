import { AlertTriangle } from 'lucide-react'

interface ErrorBannerProps {
  mensagem: string
  onTentarDeNovo?: () => void
}

export function ErrorBanner({ mensagem, onTentarDeNovo }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm"
    >
      <AlertTriangle className="size-4 shrink-0 text-rose" aria-hidden="true" />
      <p className="min-w-0 flex-1">{mensagem}</p>
      {onTentarDeNovo && (
        <button type="button" onClick={onTentarDeNovo} className="btn-ghost">
          Tentar de novo
        </button>
      )}
    </div>
  )
}
