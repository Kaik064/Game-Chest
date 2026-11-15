interface LoadingSpinnerProps {
  label?: string
}

export function LoadingSpinner({ label = 'Carregando' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted" role="status">
      <span
        className="size-5 animate-spin rounded-full border-2 border-line border-t-amber"
        aria-hidden="true"
      />
      {label}
    </div>
  )
}
