import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { para: '/', rotulo: 'Feed', fim: true },
  { para: '/usuarios', rotulo: 'Explorar', fim: true },
  { para: '/perfil', rotulo: 'Meu diário', fim: false },
]

export function Navbar() {
  const { usuario, carregando } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          aria-label="Game Chest, ir para o feed"
          className="flex shrink-0 items-center gap-2.5"
        >
          <img
            src="/logo-mark.png"
            alt=""
            width={512}
            height={401}
            className="h-10 w-auto sm:h-11"
          />
          <span className="hidden font-display text-lg font-extrabold tracking-tight sm:inline">
            Game Chest
          </span>
        </NavLink>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Navegação principal">
          {links.map((link) => (
            <NavLink
              key={link.para}
              to={link.para}
              end={link.fim}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-surface text-paper' : 'text-muted hover:text-paper'
                }`
              }
            >
              {link.rotulo}
            </NavLink>
          ))}
        </nav>

        {usuario ? (
          <NavLink to="/nova-review" className="btn-primary px-4 py-2 text-[0.8rem] sm:text-sm">
            <Plus className="hidden size-4 sm:block" aria-hidden="true" />
            Avaliar jogo
          </NavLink>
        ) : !carregando ? (
          <NavLink to="/entrar" className="btn-primary px-4 py-2 text-[0.8rem] sm:text-sm">
            <LogIn className="hidden size-4 sm:block" aria-hidden="true" />
            Entrar
          </NavLink>
        ) : null}
      </div>
    </header>
  )
}
