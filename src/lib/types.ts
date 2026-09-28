export type TipoChamada = 'feita' | 'atendida'
export type Status = 'Interessado' | 'Agendado'

export interface Perfil {
  id: string
  nome: string
  email: string
  created_at: string
}

export interface Chamada {
  id: string
  user_id: string
  tipo: TipoChamada
  created_at: string
  /** 'manual' quando registrada no app; nome do sistema quando veio pela integração. */
  origem: string
  externo_id: string | null
  telefone: string | null
  contato: string | null
  duracao_segundos: number | null
}

export interface Convertido {
  id: string
  user_id: string
  nome: string
  empresa: string | null
  cargo: string | null
  celular: string | null
  dia_workshop: string | null
  status: Status
  observacoes: string | null
  created_at: string
}

export type NovoConvertido = Omit<Convertido, 'id' | 'user_id' | 'created_at'>
