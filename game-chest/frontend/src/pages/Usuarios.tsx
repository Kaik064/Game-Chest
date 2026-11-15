import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { buscarUsuarios, mensagemDeErro } from '../lib/api'
import { useTitulo } from '../hooks/useTitulo'
import type { UsuarioEncontrado } from '../types'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'

function Avatar({ usuario }: { usuario: UsuarioEncontrado }) {
  return usuario.avatar_url ? (
    <img src={usuario.avatar_url} alt="" className="size-12 rounded-full border border-line object-cover" />
  ) : (
    <span className="grid size-12 place-items-center rounded-full border border-line bg-surface-2 font-display text-lg font-bold">
      {usuario.nome.charAt(0).toUpperCase()}
    </span>
  )
}

export function Usuarios() {
  useTitulo('Explorar pessoas — Game Chest')
  const [termo, setTermo] = useState('')
  const [busca, setBusca] = useState('')
  const [usuarios, setUsuarios] = useState<UsuarioEncontrado[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (busca.length < 2) {
      setUsuarios([])
      return
    }
    let ativo = true
    setCarregando(true)
    setErro('')
    buscarUsuarios(busca)
      .then((dados) => { if (ativo) setUsuarios(dados) })
      .catch((falha) => { if (ativo) setErro(mensagemDeErro(falha)) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [busca])

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setBusca(termo.trim())
  }

  return (
    <>
      <section className="reveal">
        <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
          <Users className="size-3.5 text-amber" aria-hidden="true" />
          Comunidade
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Explore outros diários</h1>
        <p className="mt-2 max-w-xl text-muted">Pesquise uma pessoa pelo nome e veja as reviews públicas que ela publicou.</p>
      </section>

      <form onSubmit={enviar} className="mt-7 flex max-w-2xl gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            className="field pl-9"
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
            placeholder="Digite um nome de usuário"
            minLength={2}
            aria-label="Pesquisar usuário"
          />
        </div>
        <button type="submit" className="btn-primary">Pesquisar</button>
      </form>

      {erro && <p className="mt-4 text-sm text-rose">{erro}</p>}
      {carregando && <LoadingSpinner label="Procurando pessoas…" />}
      {!carregando && busca.length >= 2 && usuarios.length === 0 && !erro && (
        <div className="mt-6"><EmptyState titulo="Nenhuma pessoa encontrada" descricao="Tente outro nome ou uma parte do nome." /></div>
      )}
      {!carregando && usuarios.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              <Link to={`/usuarios/${usuario.id}`} className="panel flex items-center gap-3 p-4 transition-colors hover:border-amber/60">
                <Avatar usuario={usuario} />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate">{usuario.nome}</strong>
                  <span className="text-sm text-muted">{usuario.total_reviews} {usuario.total_reviews === 1 ? 'review' : 'reviews'}</span>
                </span>
                <span className="text-muted">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
