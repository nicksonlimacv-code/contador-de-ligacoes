export type TipoChamada = 'feita' | 'atendida'
export type Status = 'Interessado' | 'Agendado'

export interface Chamada {
  id: string
  tipo: TipoChamada
  created_at: string
}

export interface Convertido {
  id: string
  nome: string
  empresa: string | null
  cargo: string | null
  celular: string | null
  dia_workshop: string | null
  status: Status
  observacoes: string | null
  created_at: string
}

export type NovoConvertido = Omit<Convertido, 'id' | 'created_at'>
