import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTitulo } from '../hooks/useTitulo'

export function NotFound() {
  useTitulo('Página não encontrada — Game Chest')

  return (
    <div className="flex flex-col items-center py-10 text-center sm:py-16">
      <img
        src="/logo-game-chest.png"
        alt="Game Chest"
        width={720}
        height={633}
        className="h-32 w-auto sm:h-40"
      />

      <h1 className="mt-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Essa página não existe
      </h1>
      <p className="mt-2 max-w-md text-muted">
        O link pode estar errado ou a página saiu do ar. O feed continua logo ali.
      </p>

      <Link to="/" className="btn-primary mt-6">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao feed
      </Link>
    </div>
  )
}
