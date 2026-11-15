const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const formatadorNumero = new Intl.NumberFormat('pt-BR')

export function formatarData(iso?: string | null): string {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return formatadorData.format(data)
}

export function formatarNumero(valor: number): string {
  return formatadorNumero.format(valor)
}

export function formatarHoras(horas: number): string {
  return `${formatarNumero(horas)}h`
}

export function numeroRegistro(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

export function mediaDasNotas(notas: number[]): string {
  if (notas.length === 0) return '—'
  const media = notas.reduce((soma, nota) => soma + nota, 0) / notas.length
  return media.toFixed(1).replace('.', ',')
}
