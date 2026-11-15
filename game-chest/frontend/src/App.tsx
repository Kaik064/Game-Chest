import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Profile } from './pages/Profile'
import { ReviewForm } from './pages/ReviewForm'
import { Login } from './pages/Login'
import { Usuarios } from './pages/Usuarios'
import { UsuarioPerfil } from './pages/UsuarioPerfil'
import { AuthProvider } from './context/AuthContext'
import { RotaProtegida } from './components/RotaProtegida'

function ScrollAoTopo() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-amber focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Pular para o conteúdo
      </a>

      <ScrollAoTopo />
      <Navbar />

      <main
        id="conteudo"
        className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-8"
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/usuarios/:id" element={<UsuarioPerfil />} />
          <Route path="/nova-review" element={<RotaProtegida><ReviewForm /></RotaProtegida>} />
          <Route path="/editar-review/:id" element={<RotaProtegida><ReviewForm /></RotaProtegida>} />
          <Route path="/perfil" element={<RotaProtegida><Profile /></RotaProtegida>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="border-t border-line/70 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-muted sm:px-6 lg:px-8">
          <p>Game Chest — seu diário de games.</p>
          <p>Capas e busca de jogos vêm da Steam.</p>
        </div>
      </footer>
      </AuthProvider>
    </BrowserRouter>
  )
}
