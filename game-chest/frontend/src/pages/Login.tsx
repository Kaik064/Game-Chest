import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Gamepad2, Loader2, LockKeyhole, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTitulo } from '../hooks/useTitulo'
import { mensagemDeErro } from '../lib/api'

type Modo = 'entrar' | 'criar'

export function Login() {
  useTitulo('Entrar — Game Chest')

  const { usuario, carregando, entrar, registrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const destino = (location.state as { de?: string } | null)?.de ?? '/perfil'

  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setErro('')
  }, [modo])

  if (!carregando && usuario) {
    return <Navigate to={destino} replace />
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const emailLimpo = email.trim().toLowerCase()
    const nomeLimpo = nome.trim()

    if (!emailLimpo || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }

    if (modo === 'criar') {
      if (nomeLimpo.length < 2) {
        setErro('Escolha um nome com pelo menos 2 caracteres.')
        return
      }
      if (senha.length < 8) {
        setErro('A senha precisa ter pelo menos 8 caracteres.')
        return
      }
    }

    setEnviando(true)
    setErro('')

    try {
      if (modo === 'criar') {
        await registrar(nomeLimpo, emailLimpo, senha)
      } else {
        await entrar(emailLimpo, senha)
      }
      navigate(destino, { replace: true })
    } catch (falha) {
      setErro(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 pt-4 lg:grid-cols-[1fr_0.85fr] lg:items-center">
      <section className="reveal">
        <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
          <Gamepad2 className="size-3.5 text-amber" aria-hidden="true" />
          Arquivo de fliperama
        </span>

        <h1 className="mt-4 max-w-lg text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-5xl">
          Seu diário de games, com as horas certas.
        </h1>

        <p className="mt-4 max-w-md leading-relaxed text-muted">
          Entre para guardar suas reviews entre sessões e, se quiser, vincule a Steam para puxar
          automaticamente as horas jogadas de cada jogo da sua biblioteca.
        </p>

        <ul className="mt-6 space-y-3 text-sm text-muted">
          <li className="flex gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-amber/15 text-amber">
              1
            </span>
            Crie a conta e publique suas reviews — elas ficam ligadas a você.
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-amber/15 text-amber">
              2
            </span>
            Busque qualquer jogo no catálogo da Steam, mesmo sem vincular a conta.
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-amber/15 text-amber">
              3
            </span>
            Vincule a Steam e as horas da biblioteca preenchem o formulário sozinhas.
          </li>
        </ul>
      </section>

      <section className="panel p-5 sm:p-7">
        <div
          className="grid grid-cols-2 gap-1 rounded-full border border-line bg-ink-2 p-1"
          role="tablist"
          aria-label="Entrar ou criar conta"
        >
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'entrar'}
            onClick={() => setModo('entrar')}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              modo === 'entrar' ? 'bg-paper text-ink' : 'text-muted hover:text-paper'
            }`}
          >
            <LogIn className="size-4" aria-hidden="true" />
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'criar'}
            onClick={() => setModo('criar')}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              modo === 'criar' ? 'bg-paper text-ink' : 'text-muted hover:text-paper'
            }`}
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Criar conta
          </button>
        </div>

        <h2 className="mt-5 text-2xl font-bold">
          {modo === 'entrar' ? 'Bem-vindo de volta' : 'Comece seu arquivo'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {modo === 'entrar'
            ? 'Entre com o e-mail e a senha da sua conta.'
            : 'Leva menos de um minuto. Depois você pode vincular a Steam.'}
        </p>

        <form onSubmit={enviar} className="mt-5 space-y-4">
          {modo === 'criar' && (
            <div>
              <label htmlFor="conta-nome" className="field-label">
                Nome no feed
              </label>
              <input
                id="conta-nome"
                className="field"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder="Como você quer aparecer"
                maxLength={100}
                autoComplete="nickname"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="conta-email" className="field-label">
              E-mail
            </label>
            <input
              id="conta-email"
              type="email"
              className="field"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="conta-senha" className="field-label">
              Senha
            </label>
            <input
              id="conta-senha"
              type="password"
              className="field"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              placeholder={modo === 'criar' ? 'Pelo menos 8 caracteres' : 'Sua senha'}
              autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
              minLength={modo === 'criar' ? 8 : undefined}
              required
            />
          </div>

          {erro && (
            <p role="alert" className="rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-sm text-rose">
              {erro}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={enviando}>
            {enviando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LockKeyhole className="size-4" aria-hidden="true" />
            )}
            {enviando
              ? modo === 'criar'
                ? 'Criando conta…'
                : 'Entrando…'
              : modo === 'criar'
                ? 'Criar conta e entrar'
                : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Ainda não quer conta? Você pode{' '}
          <Link to="/" className="underline decoration-line underline-offset-4 hover:text-paper">
            navegar pelo feed
          </Link>{' '}
          — só é preciso entrar para publicar uma review.
        </p>
      </section>
    </div>
  )
}
