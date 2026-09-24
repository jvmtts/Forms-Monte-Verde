export type Step = 0 | 1 | 2
export interface Companion {
  id: string
  nome: string
  rg: string
  dataNascimento: string
  tamanhoCamiseta: string
}
export type VehicleMode = '' | 'proprio' | 'locacao'
export type VehicleType = '' | 'utv' | 'quadriciclo' | '4x4'
export type RentalPreference = '' | 'utv' | 'quadriciclo' | 'avaliar'

export interface FormValues {
  acompanhantes: Companion[]
  nomeCompleto: string
  cpf: string
  rg: string
  dataNascimento: string
  tamanhoCamiseta: string
  email: string
  whatsapp: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  cidade: string
  estado: string
  modalidadeVeiculo: VehicleMode
  tipoVeiculo: VehicleType
  marcaVeiculo: string
  modeloVeiculo: string
  anoVeiculo: string
  placaVeiculo: string
  docVeiculo: File | null
  numeroCnh: string
  validadeCnh: string
  docCnh: File | null
  preferenciaLocacao: RentalPreference
  quantidadeLocacao: string
  observacoesLocacao: string
  confirmacao: boolean
}

export type FormErrors = Record<string, string | undefined>

export const initialValues: FormValues = {
  acompanhantes: [],
  nomeCompleto: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  tamanhoCamiseta: '',
  email: '',
  whatsapp: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  cidade: '',
  estado: '',
  modalidadeVeiculo: '',
  tipoVeiculo: '',
  marcaVeiculo: '',
  modeloVeiculo: '',
  anoVeiculo: '',
  placaVeiculo: '',
  docVeiculo: null,
  numeroCnh: '',
  validadeCnh: '',
  docCnh: null,
  preferenciaLocacao: '',
  quantidadeLocacao: '1',
  observacoesLocacao: '',
  confirmacao: false,
}
