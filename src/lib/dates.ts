// Todas as datas "de dia" são strings YYYY-MM-DD no fuso local do navegador.

const pad = (n: number) => String(n).padStart(2, '0')

export function toLocalDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayStr(): string {
  return toLocalDay(new Date())
}

/** Data local de um timestamp ISO vindo do banco. */
export function dayOf(iso: string): string {
  return toLocalDay(new Date(iso))
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shiftDay(day: string, delta: number): string {
  const d = parseDay(day)
  d.setDate(d.getDate() + delta)
  return toLocalDay(d)
}

/**
 * created_at para um novo registro: agora, se o dia selecionado é hoje;
 * senão, a hora atual aplicada à data do dia selecionado.
 */
export function createdAtForDay(day: string): string {
  const now = new Date()
  if (day === toLocalDay(now)) return now.toISOString()
  const d = parseDay(day)
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
  return d.toISOString()
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "segunda-feira, 28 de setembro" (+ ano se não for o ano atual). */
export function formatLong(day: string): string {
  const d = parseDay(day)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(d)
}

export function formatTitle(day: string): string {
  return day === todayStr() ? `Hoje, ${formatLong(day)}` : capitalize(formatLong(day))
}

/** "28/09" ou "28/09/2025". */
export function formatShort(day: string, withYear = false): string {
  const [y, m, d] = day.split('-')
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`
}

export function weekdayShort(day: string): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(parseDay(day))
    .replace('.', '')
}
