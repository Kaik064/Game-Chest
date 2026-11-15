import { useEffect, useState } from 'react'

export function useDebounce<T>(valor: T, atraso = 300): T {
  const [adiado, setAdiado] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setAdiado(valor), atraso)
    return () => clearTimeout(timer)
  }, [valor, atraso])

  return adiado
}
