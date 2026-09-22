import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileUp,
  LoaderCircle,
  LockKeyhole,
  CarFront,
  UserRound,
} from 'lucide-react'
import {
  FIELD_LIMITS,
  limitText,
  maskCep,
  maskCpf,
  maskDate,
  maskPhone,
  onlyDigits,
  sanitizeHouseNumber,
  sanitizeIdentifier,
  validateVehicle,
  validatePersonal,
} from '../lib/formRules'
import { initialValues } from '../types/expeditionForm'
import type { FormErrors, FormValues, RegistrationType, RentalPreference, Step, VehicleMode, VehicleType } from '../types/expeditionForm'

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

const steps = [
  { label: 'Dados pessoais', icon: UserRound },
  { label: 'Veículo e CNH', icon: CarFront },
  { label: 'Revisão', icon: FileCheck2 },
]

const BASIN_ENDPOINT = import.meta.env.VITE_BASIN_ENDPOINT?.trim() ?? ''
const SUBMISSION_TIMEOUT_MS = 180_000

function isValidBasinEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && url.hostname === 'usebasin.com' && /^\/f\/[^/]+\/?$/.test(url.pathname)
  } catch {
    return false
  }
}

const BASIN_ENDPOINT_IS_VALID = isValidBasinEndpoint(BASIN_ENDPOINT)

function appendText(payload: FormData, label: string, value: string) {
  const normalizedValue = value.trim()
  if (normalizedValue) payload.append(label, normalizedValue)
}

function createBasinPayload(values: FormValues) {
  const payload = new FormData()

  payload.append('_subject', `Nova inscrição — ${values.nomeCompleto} (Expedição Monte Verde)`)
  payload.append('Evento', 'Expedição Monte Verde — 6 a 8 de novembro de 2026')
  payload.append('Tipo de inscrição', values.tipoInscricao === 'dupla' ? 'Piloto e acompanhante' : 'Piloto individual')
  appendText(payload, 'Nome completo', values.nomeCompleto)
  appendText(payload, 'CPF', values.cpf)
  appendText(payload, 'RG', values.rg)
  appendText(payload, 'Data de nascimento', values.dataNascimento)
  appendText(payload, 'Tamanho da camiseta', values.tamanhoCamiseta)
  appendText(payload, 'E-mail', values.email)
  appendText(payload, 'WhatsApp', values.whatsapp)
  appendText(payload, 'CEP', values.cep)
  appendText(payload, 'Endereço', values.endereco)
  appendText(payload, 'Número', values.numero)
  appendText(payload, 'Complemento', values.complemento)
  appendText(payload, 'Cidade', values.cidade)
  appendText(payload, 'Estado', values.estado)

  if (values.tipoInscricao === 'dupla') {
    appendText(payload, 'Acompanhante - Nome', values.nomeAcompanhante)
    appendText(payload, 'Acompanhante - RG', values.rgAcompanhante)
    appendText(payload, 'Acompanhante - Data de nascimento', values.dataNascimentoAcompanhante)
    appendText(payload, 'Acompanhante - Tamanho da camiseta', values.tamanhoCamisetaAcompanhante)
  }

  payload.append('Participação com veículo', values.modalidadeVeiculo === 'proprio' ? 'Veículo próprio' : 'Necessita locação')
  appendText(payload, 'Número da CNH', values.numeroCnh)
  appendText(payload, 'Validade da CNH', values.validadeCnh)

  if (values.modalidadeVeiculo === 'proprio') {
    appendText(payload, 'Tipo de veículo', values.tipoVeiculo === '4x4' ? '4x4' : values.tipoVeiculo === 'utv' ? 'UTV' : 'Quadriciclo')
    appendText(payload, 'Marca do veículo', values.marcaVeiculo)
    appendText(payload, 'Modelo do veículo', values.modeloVeiculo)
    appendText(payload, 'Ano do veículo', values.anoVeiculo)
    appendText(payload, 'Placa ou identificação', values.placaVeiculo)
  } else {
    appendText(payload, 'Preferência de locação', values.preferenciaLocacao === 'avaliar' ? 'Precisa de orientação' : values.preferenciaLocacao.toUpperCase())
    appendText(payload, 'Quantidade para locação', values.quantidadeLocacao)
    appendText(payload, 'Observações sobre locação', values.observacoesLocacao)
  }

  payload.append('Declaração de veracidade aceita', values.confirmacao ? 'Sim' : 'Não')

  if (values.docVeiculo) payload.append('Documento do veículo', values.docVeiculo)
  if (values.docCnh) payload.append('Documento da CNH', values.docCnh)

  return payload
}

const fieldClassName = (hasError: boolean) =>
  `h-14 w-full rounded-xl border bg-[#fbfdfb] px-4 text-[15px] text-[#243b2b] outline-none transition duration-200 placeholder:text-[#a3b1a7] hover:border-[#b8c7bc] focus:border-[#477a50] focus:bg-white focus:ring-4 focus:ring-[#477a50]/10 ${
    hasError ? 'border-red-500 bg-red-50/40' : 'border-[#d1ddd3]'
  }`

interface FieldShellProps {
  id: string
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
}

function FieldShell({ id, label, error, required, hint, children }: FieldShellProps) {
  return (
    <div>
      <label className="mb-2.5 block text-[13px] font-semibold tracking-[0.01em] text-[#365944]" htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-[#477a50]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-2.5 text-xs leading-5 text-[#84968a]">{hint}</p>}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600" id={`${id}-error`}>
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

function TextField({ label, error, hint, required, id = '', ...props }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClassName(Boolean(error))}
        id={id}
        required={required}
      />
    </FieldShell>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: Array<{ value: string; label: string }>
}

function SelectField({ label, error, options, required, id = '', ...props }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} required={required}>
      <div className="relative">
        <select
          {...props}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          className={`${fieldClassName(Boolean(error))} appearance-none pr-11`}
          id={id}
          required={required}
        >
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8f82]" />
      </div>
    </FieldShell>
  )
}

interface StateSelectProps {
  value: string
  error?: string
  onChange: (value: string) => void
}

function StateSelect({ value, error, onChange }: StateSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <FieldShell id="estado" label="Estado" error={error} required>
      <div className="relative" ref={rootRef}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          className={`${fieldClassName(Boolean(error))} flex items-center justify-between text-left`}
          id="estado"
          onClick={() => setOpen((current) => !current)}
          ref={buttonRef}
          type="button"
        >
          <span className={value ? 'font-medium text-[#243b2b]' : 'text-[#a3b1a7]'}>
            {value || 'Selecione seu estado'}
          </span>
          <ChevronDown aria-hidden="true" className={`h-4 w-4 text-[#7c8f82] transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-30 rounded-2xl border border-[#d1ddd3] bg-white p-3 shadow-[0_22px_70px_rgba(24,49,36,0.18)]" role="listbox">
            <p className="px-2 pb-2 pt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#90a095]">
              Selecione a UF
            </p>
            <div className="grid max-h-60 grid-cols-4 gap-1 overflow-y-auto pr-1 sm:grid-cols-5">
              {states.map((state) => (
                <button
                  aria-selected={value === state}
                  className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition ${
                    value === state
                      ? 'bg-[#183124] text-white'
                      : 'text-[#4d6957] hover:bg-[#eaf3eb] hover:text-[#3d7048]'
                  }`}
                  key={state}
                  onClick={() => {
                    onChange(state)
                    setOpen(false)
                    buttonRef.current?.focus()
                  }}
                  role="option"
                  type="button"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldShell>
  )
}

interface UploadFieldProps {
  id: string
  label: string
  file: File | null
  error?: string
  required?: boolean
  onChange: (file: File | null) => void
}

function UploadField({ id, label, file, error, required = true, onChange }: UploadFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null)
  }

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      required={required}
      hint="PDF, JPG ou PNG de até 10 MB."
    >
      <label
        className={`flex min-h-28 cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-5 py-4 transition hover:border-[#477a50] hover:bg-[#f6faf6] ${
          error ? 'border-red-500 bg-red-50' : 'border-[#c9d7cd] bg-[#f7faf7]'
        }`}
        htmlFor={id}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f0e8] text-[#3d7048]">
          {file ? <FileCheck2 aria-hidden="true" className="h-5 w-5" /> : <FileUp aria-hidden="true" className="h-5 w-5" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#2a4532]">
            {file ? 'Documento selecionado' : 'Selecionar documento'}
          </span>
          <span className="mt-1 block truncate text-xs text-[#7c8f82]">
            {file?.name ?? 'Toque para escolher o arquivo'}
          </span>
        </span>
      </label>
      <input
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        id={id}
        onChange={handleChange}
        type="file"
      />
    </FieldShell>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[#dfe9e1] py-3 last:border-0 sm:grid-cols-[190px_1fr] sm:gap-5">
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#7c8f82]">{label}</dt>
      <dd className="break-words text-sm font-medium text-[#2a4532]">{value || 'Não informado'}</dd>
    </div>
  )
}

export function ExpeditionForm() {
  const formTopRef = useRef<HTMLElement>(null)
  const [step, setStep] = useState<Step>(0)
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const address = useMemo(
    () =>
      [
        values.endereco,
        values.numero,
        values.complemento,
        values.cidade,
        values.estado,
        values.cep,
      ]
        .filter(Boolean)
        .join(', '),
    [values],
  )

  const updateField = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError('')
  }

  const updateRegistrationType = (registrationType: RegistrationType) => {
    setValues((current) => ({
      ...current,
      tipoInscricao: registrationType,
      nomeAcompanhante: registrationType === 'individual' ? '' : current.nomeAcompanhante,
      rgAcompanhante: registrationType === 'individual' ? '' : current.rgAcompanhante,
      dataNascimentoAcompanhante: registrationType === 'individual' ? '' : current.dataNascimentoAcompanhante,
      tamanhoCamisetaAcompanhante: registrationType === 'individual' ? '' : current.tamanhoCamisetaAcompanhante,
    }))
    setErrors((current) => ({
      ...current,
      tipoInscricao: undefined,
      nomeAcompanhante: undefined,
      rgAcompanhante: undefined,
      dataNascimentoAcompanhante: undefined,
      tamanhoCamisetaAcompanhante: undefined,
    }))
    setSubmitError('')
  }

  const updateVehicleMode = (vehicleMode: VehicleMode) => {
    setValues((current) => ({
      ...current,
      modalidadeVeiculo: vehicleMode,
      tipoVeiculo: vehicleMode === 'proprio' ? current.tipoVeiculo : '',
      marcaVeiculo: vehicleMode === 'proprio' ? current.marcaVeiculo : '',
      modeloVeiculo: vehicleMode === 'proprio' ? current.modeloVeiculo : '',
      anoVeiculo: vehicleMode === 'proprio' ? current.anoVeiculo : '',
      placaVeiculo: vehicleMode === 'proprio' ? current.placaVeiculo : '',
      docVeiculo: vehicleMode === 'proprio' ? current.docVeiculo : null,
      preferenciaLocacao: vehicleMode === 'locacao' ? current.preferenciaLocacao : '',
      quantidadeLocacao: vehicleMode === 'locacao' ? current.quantidadeLocacao : '1',
      observacoesLocacao: vehicleMode === 'locacao' ? current.observacoesLocacao : '',
    }))
    setErrors((current) => ({
      ...current,
      modalidadeVeiculo: undefined,
      tipoVeiculo: undefined,
      marcaVeiculo: undefined,
      modeloVeiculo: undefined,
      anoVeiculo: undefined,
      placaVeiculo: undefined,
      docVeiculo: undefined,
      preferenciaLocacao: undefined,
      quantidadeLocacao: undefined,
      observacoesLocacao: undefined,
    }))
    setSubmitError('')
  }

  const scrollToForm = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showErrors = (nextErrors: FormErrors) => {
    setErrors(nextErrors)
    const firstField = Object.keys(nextErrors)[0]
    window.setTimeout(() => document.getElementById(firstField)?.focus(), 100)
  }

  const nextStep = () => {
    const nextErrors = step === 0 ? validatePersonal(values) : validateVehicle(values)
    if (Object.keys(nextErrors).length > 0) {
      showErrors(nextErrors)
      return
    }
    setErrors({})
    setStep((current) => Math.min(current + 1, 2) as Step)
    window.setTimeout(scrollToForm, 50)
  }

  const previousStep = () => {
    setErrors({})
    setStep((current) => Math.max(current - 1, 0) as Step)
    window.setTimeout(scrollToForm, 50)
  }

  const submitForm = async () => {
    const personalErrors = validatePersonal(values)
    if (Object.keys(personalErrors).length > 0) {
      setStep(0)
      showErrors(personalErrors)
      window.setTimeout(scrollToForm, 50)
      return
    }

    const vehicleErrors = validateVehicle(values)
    if (Object.keys(vehicleErrors).length > 0) {
      setStep(1)
      showErrors(vehicleErrors)
      window.setTimeout(scrollToForm, 50)
      return
    }

    if (!BASIN_ENDPOINT) {
      setSubmitError('O formulário está pronto, mas o canal de envio ainda não foi configurado.')
      return
    }

    if (!BASIN_ENDPOINT_IS_VALID) {
      setSubmitError('O endereço de envio configurado não é um endpoint válido do Basin.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), SUBMISSION_TIMEOUT_MS)

    try {
      const response = await fetch(BASIN_ENDPOINT, {
        method: 'POST',
        body: createBasinPayload(values),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (!response.ok) {
        let responseMessage = ''

        try {
          const responseBody = await response.json() as { error?: string; message?: string }
          responseMessage = responseBody.message ?? responseBody.error ?? ''
        } catch {
          responseMessage = ''
        }

        throw new Error(responseMessage || `Falha no envio: ${response.status}`)
      }

      setSubmitted(true)
      scrollToForm()
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'AbortError'
      setSubmitError(
        timedOut
          ? 'O envio demorou mais do que o esperado. Verifique sua conexão e tente novamente.'
          : 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.',
      )
    } finally {
      window.clearTimeout(timeoutId)
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="bg-[#edf2ec] px-6 py-24 text-[#183124]" id="inscricao" ref={formTopRef}>
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#d3dfd5] bg-[#fdfefd] p-8 text-center shadow-[0_24px_80px_rgba(24,49,36,0.09)] sm:p-12">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-[#477a50]" />
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d7048]">Inscrição recebida</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Dados enviados com sucesso.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#6c7f72]">
            A equipe da Usina do Jet conferirá os dados da Expedição Monte Verde e entrará em contato pelo WhatsApp informado.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="scroll-mt-0 bg-[#edf2ec] px-4 py-16 text-[#183124] sm:px-8 lg:py-24" id="inscricao" ref={formTopRef}>
      <div className="mx-auto max-w-[1120px]">
        <div className="max-w-2xl sm:pl-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#3d7048]">Sua inscrição</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl">Conte um pouco sobre você.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#708277] sm:text-base">
            Os campos com <span className="font-bold text-[#477a50]">*</span> são obrigatórios. Você poderá revisar tudo antes do envio.
          </p>
        </div>

        <nav aria-label="Etapas da inscrição" className="mt-10 grid grid-cols-3 overflow-hidden rounded-t-3xl border border-[#d0ded3] bg-[#fdfefd] shadow-[0_18px_55px_rgba(24,49,36,0.06)]">
          {steps.map(({ label, icon: Icon }, index) => {
            const active = index === step
            const complete = index < step
            return (
              <button
                aria-current={active ? 'step' : undefined}
                className={`flex min-h-24 items-center gap-3 border-r border-[#dce7de] px-3 text-left transition last:border-r-0 sm:px-6 ${
                  active ? 'bg-[#183124] text-white' : 'text-[#7c8f82]'
                } ${complete ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={!complete}
                key={label}
                onClick={() => {
                  setStep(index as Step)
                  setErrors({})
                }}
                type="button"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-[#477a50] text-white' : complete ? 'bg-[#e7f0e8] text-[#3d7048]' : 'bg-[#edf3ee]'}`}>
                  {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
                </span>
                <span className="hidden text-sm font-bold sm:block">{label}</span>
                <span className="font-mono text-[10px] font-bold sm:hidden">0{index + 1}</span>
              </button>
            )
          })}
        </nav>

        <form className="rounded-b-3xl border-x border-b border-[#d0ded3] bg-[#fdfefd] p-5 shadow-[0_26px_80px_rgba(24,49,36,0.09)] sm:p-9 lg:p-14" noValidate onSubmit={(event) => event.preventDefault()}>
          {step === 0 && (
            <div>
              <div className="mb-9 flex items-start gap-4 border-b border-[#e3ece5] pb-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f0e8] font-mono text-[11px] font-bold text-[#3d7048]">01</span>
                <div>
                  <h3 className="font-display text-2xl font-bold">Dados pessoais</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#7c8f82]">Use os mesmos dados que constam nos seus documentos.</p>
                </div>
              </div>

              <FieldShell id="tipoInscricao" label="Como será sua inscrição?" error={errors.tipoInscricao} required>
                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  {[
                    ['individual', 'Piloto individual', 'Apenas o piloto'],
                    ['dupla', 'Piloto e acompanhante', 'Inclui os dados do acompanhante'],
                  ].map(([value, label, description]) => (
                    <label className={`cursor-pointer rounded-xl border p-4 transition ${values.tipoInscricao === value ? 'border-[#477a50] bg-[#eef5ef] text-[#3d7048] ring-4 ring-[#477a50]/5' : 'border-[#d1ddd3] bg-[#fbfdfb] text-[#607467] hover:border-[#477a50]'}`} key={value}>
                      <span className="flex items-center gap-3 text-sm font-semibold">
                        <input checked={values.tipoInscricao === value} id={value === 'individual' ? 'tipoInscricao' : undefined} name="tipoInscricao" onChange={() => updateRegistrationType(value as RegistrationType)} type="radio" value={value} />
                        {label}
                      </span>
                      <span className="ml-7 mt-1 block text-xs font-normal opacity-75">{description}</span>
                    </label>
                  ))}
                </div>
              </FieldShell>

              <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField id="nomeCompleto" label="Nome completo" required autoComplete="name" maxLength={FIELD_LIMITS.nome} value={values.nomeCompleto} error={errors.nomeCompleto} onChange={(event) => updateField('nomeCompleto', limitText(event.target.value, FIELD_LIMITS.nome))} />
                </div>
                <TextField id="cpf" label="CPF" required inputMode="numeric" maxLength={FIELD_LIMITS.cpf} placeholder="000.000.000-00" value={values.cpf} error={errors.cpf} onChange={(event) => updateField('cpf', maskCpf(event.target.value))} />
                <TextField id="rg" label="RG" required inputMode="numeric" maxLength={FIELD_LIMITS.rg} hint="Somente números, de 5 a 14 dígitos." value={values.rg} error={errors.rg} onChange={(event) => updateField('rg', onlyDigits(event.target.value).slice(0, FIELD_LIMITS.rg))} />
                <TextField id="dataNascimento" label="Data de nascimento" required inputMode="numeric" autoComplete="bday" maxLength={FIELD_LIMITS.data} placeholder="DD/MM/AAAA" value={values.dataNascimento} error={errors.dataNascimento} onChange={(event) => updateField('dataNascimento', maskDate(event.target.value))} />
                <SelectField id="tamanhoCamiseta" label="Tamanho da camiseta" required value={values.tamanhoCamiseta} error={errors.tamanhoCamiseta} onChange={(event) => updateField('tamanhoCamiseta', event.target.value)} options={[{ value: '', label: 'Selecione' }, ...['PP', 'P', 'M', 'G', 'GG', 'XGG'].map((size) => ({ value: size, label: size }))]} />
                <TextField id="whatsapp" label="WhatsApp" required inputMode="numeric" autoComplete="tel" maxLength={FIELD_LIMITS.whatsapp} placeholder="(11) 99999-9999" value={values.whatsapp} error={errors.whatsapp} onChange={(event) => updateField('whatsapp', maskPhone(event.target.value))} />
                <div className="sm:col-span-2">
                  <TextField id="email" label="E-mail" required type="email" autoComplete="email" maxLength={FIELD_LIMITS.email} value={values.email} error={errors.email} onChange={(event) => updateField('email', limitText(event.target.value, FIELD_LIMITS.email))} />
                </div>
                <TextField id="cep" label="CEP" required inputMode="numeric" autoComplete="postal-code" maxLength={FIELD_LIMITS.cep} placeholder="00000-000" value={values.cep} error={errors.cep} onChange={(event) => updateField('cep', maskCep(event.target.value))} />
                <TextField id="endereco" label="Endereço" required autoComplete="address-line1" maxLength={FIELD_LIMITS.endereco} value={values.endereco} error={errors.endereco} onChange={(event) => updateField('endereco', limitText(event.target.value, FIELD_LIMITS.endereco))} />
                <TextField id="numero" label="Número" required maxLength={FIELD_LIMITS.numero} placeholder="Número ou S/N" value={values.numero} error={errors.numero} onChange={(event) => updateField('numero', sanitizeHouseNumber(event.target.value))} />
                <TextField id="complemento" label="Complemento" maxLength={FIELD_LIMITS.complemento} placeholder="Opcional" value={values.complemento} onChange={(event) => updateField('complemento', limitText(event.target.value, FIELD_LIMITS.complemento))} />
                <TextField id="cidade" label="Cidade" required autoComplete="address-level2" maxLength={FIELD_LIMITS.cidade} value={values.cidade} error={errors.cidade} onChange={(event) => updateField('cidade', limitText(event.target.value, FIELD_LIMITS.cidade))} />
                <StateSelect value={values.estado} error={errors.estado} onChange={(value) => updateField('estado', value)} />
              </div>

              {values.tipoInscricao === 'dupla' && (
                <div className="mt-10 rounded-2xl border border-[#d9e5dc] bg-[#f7faf7] p-5 sm:p-6">
                  <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d7048]">Dados do acompanhante</p>
                  <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <TextField id="nomeAcompanhante" label="Nome completo" required maxLength={FIELD_LIMITS.nome} value={values.nomeAcompanhante} error={errors.nomeAcompanhante} onChange={(event) => updateField('nomeAcompanhante', limitText(event.target.value, FIELD_LIMITS.nome))} />
                    </div>
                    <TextField id="rgAcompanhante" label="RG" required inputMode="numeric" maxLength={FIELD_LIMITS.rg} value={values.rgAcompanhante} error={errors.rgAcompanhante} onChange={(event) => updateField('rgAcompanhante', onlyDigits(event.target.value).slice(0, FIELD_LIMITS.rg))} />
                    <TextField id="dataNascimentoAcompanhante" label="Data de nascimento" required inputMode="numeric" maxLength={FIELD_LIMITS.data} placeholder="DD/MM/AAAA" value={values.dataNascimentoAcompanhante} error={errors.dataNascimentoAcompanhante} onChange={(event) => updateField('dataNascimentoAcompanhante', maskDate(event.target.value))} />
                    <SelectField id="tamanhoCamisetaAcompanhante" label="Tamanho da camiseta" required value={values.tamanhoCamisetaAcompanhante} error={errors.tamanhoCamisetaAcompanhante} onChange={(event) => updateField('tamanhoCamisetaAcompanhante', event.target.value)} options={[{ value: '', label: 'Selecione' }, ...['PP', 'P', 'M', 'G', 'GG', 'XGG'].map((size) => ({ value: size, label: size }))]} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-9 flex items-start gap-4 border-b border-[#e3ece5] pb-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f0e8] font-mono text-[11px] font-bold text-[#3d7048]">02</span>
                <div>
                  <h3 className="font-display text-2xl font-bold">Veículo e habilitação</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#7c8f82]">Informe como participará da experiência off-road e os dados da sua CNH.</p>
                </div>
              </div>

              <FieldShell id="modalidadeVeiculo" label="Como você participará?" error={errors.modalidadeVeiculo} required>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['proprio', 'Vou com veículo próprio', 'UTV, quadriciclo ou 4x4'],
                    ['locacao', 'Preciso de locação', 'A equipe orientará as opções disponíveis'],
                  ].map(([value, label, description]) => (
                    <label className={`cursor-pointer rounded-xl border p-4 transition ${values.modalidadeVeiculo === value ? 'border-[#477a50] bg-[#eef5ef] text-[#3d7048] ring-4 ring-[#477a50]/5' : 'border-[#d1ddd3] bg-[#fbfdfb] text-[#607467] hover:border-[#477a50]'}`} key={value}>
                      <span className="flex items-center gap-3 text-sm font-semibold">
                        <input checked={values.modalidadeVeiculo === value} id={value === 'proprio' ? 'modalidadeVeiculo' : undefined} name="modalidadeVeiculo" onChange={() => updateVehicleMode(value as VehicleMode)} type="radio" value={value} />
                        {label}
                      </span>
                      <span className="ml-7 mt-1 block text-xs font-normal opacity-75">{description}</span>
                    </label>
                  ))}
                </div>
              </FieldShell>

              <div className="mt-8 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                <TextField id="numeroCnh" label="Número da CNH" required inputMode="numeric" maxLength={FIELD_LIMITS.numeroCnh} hint="Digite os 11 números, sem pontos ou espaços." value={values.numeroCnh} error={errors.numeroCnh} onChange={(event) => updateField('numeroCnh', onlyDigits(event.target.value).slice(0, FIELD_LIMITS.numeroCnh))} />
                <TextField id="validadeCnh" label="Validade da CNH" required inputMode="numeric" maxLength={FIELD_LIMITS.data} placeholder="DD/MM/AAAA" value={values.validadeCnh} error={errors.validadeCnh} onChange={(event) => updateField('validadeCnh', maskDate(event.target.value))} />
                <div className="sm:col-span-2">
                  <UploadField id="docCnh" label="Documento da CNH" file={values.docCnh} error={errors.docCnh} onChange={(file) => updateField('docCnh', file)} />
                </div>
              </div>

              {values.modalidadeVeiculo === 'proprio' && (
                <div className="mt-6 rounded-2xl border border-[#d9e5dc] bg-[#f7faf7] p-5 sm:p-6">
                  <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d7048]">Seu veículo</p>
                  <FieldShell id="tipoVeiculo" label="Tipo de veículo" error={errors.tipoVeiculo} required>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {([['utv', 'UTV'], ['quadriciclo', 'Quadriciclo'], ['4x4', '4x4']] as const).map(([value, label]) => (
                        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4 text-sm font-semibold transition ${values.tipoVeiculo === value ? 'border-[#477a50] text-[#3d7048] ring-4 ring-[#477a50]/5' : 'border-[#d1ddd3] text-[#607467] hover:border-[#477a50]'}`} key={value}>
                          <input checked={values.tipoVeiculo === value} id={value === 'utv' ? 'tipoVeiculo' : undefined} name="tipoVeiculo" onChange={() => updateField('tipoVeiculo', value as VehicleType)} type="radio" value={value} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </FieldShell>

                  <div className="mt-6 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                    <TextField id="marcaVeiculo" label="Marca" required maxLength={FIELD_LIMITS.marcaVeiculo} placeholder="Ex.: Can-Am, Honda ou Toyota" value={values.marcaVeiculo} error={errors.marcaVeiculo} onChange={(event) => updateField('marcaVeiculo', limitText(event.target.value, FIELD_LIMITS.marcaVeiculo))} />
                    <TextField id="modeloVeiculo" label="Modelo" required maxLength={FIELD_LIMITS.modeloVeiculo} value={values.modeloVeiculo} error={errors.modeloVeiculo} onChange={(event) => updateField('modeloVeiculo', limitText(event.target.value, FIELD_LIMITS.modeloVeiculo))} />
                    <TextField id="anoVeiculo" label="Ano" required inputMode="numeric" maxLength={FIELD_LIMITS.anoVeiculo} placeholder="2025" value={values.anoVeiculo} error={errors.anoVeiculo} onChange={(event) => updateField('anoVeiculo', onlyDigits(event.target.value).slice(0, FIELD_LIMITS.anoVeiculo))} />
                    <TextField id="placaVeiculo" label="Placa ou identificação" maxLength={FIELD_LIMITS.placaVeiculo} hint="Opcional para veículos que não possuem placa." value={values.placaVeiculo} error={errors.placaVeiculo} onChange={(event) => updateField('placaVeiculo', sanitizeIdentifier(event.target.value, FIELD_LIMITS.placaVeiculo))} />
                    <div className="sm:col-span-2">
                      <UploadField id="docVeiculo" label="Documento do veículo" required={false} file={values.docVeiculo} error={errors.docVeiculo} onChange={(file) => updateField('docVeiculo', file)} />
                    </div>
                  </div>
                </div>
              )}

              {values.modalidadeVeiculo === 'locacao' && (
                <div className="mt-6 rounded-2xl border border-[#d9e5dc] bg-[#f7faf7] p-5 sm:p-6">
                  <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d7048]">Preferência de locação</p>
                  <FieldShell id="preferenciaLocacao" label="Qual opção você prefere?" error={errors.preferenciaLocacao} required>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {([['utv', 'UTV'], ['quadriciclo', 'Quadriciclo'], ['avaliar', 'Quero orientação']] as const).map(([value, label]) => (
                        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4 text-sm font-semibold transition ${values.preferenciaLocacao === value ? 'border-[#477a50] text-[#3d7048] ring-4 ring-[#477a50]/5' : 'border-[#d1ddd3] text-[#607467] hover:border-[#477a50]'}`} key={value}>
                          <input checked={values.preferenciaLocacao === value} id={value === 'utv' ? 'preferenciaLocacao' : undefined} name="preferenciaLocacao" onChange={() => updateField('preferenciaLocacao', value as RentalPreference)} type="radio" value={value} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </FieldShell>
                  <div className="mt-6 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                    <TextField id="quantidadeLocacao" label="Quantidade de veículos" required inputMode="numeric" maxLength={FIELD_LIMITS.quantidadeLocacao} value={values.quantidadeLocacao} error={errors.quantidadeLocacao} onChange={(event) => updateField('quantidadeLocacao', onlyDigits(event.target.value).slice(0, FIELD_LIMITS.quantidadeLocacao))} />
                    <div className="sm:col-span-2">
                      <FieldShell id="observacoesLocacao" label="Observações sobre a locação" hint="Opcional. Informe preferências ou necessidades específicas.">
                        <textarea className={`${fieldClassName(false)} min-h-28 resize-y py-4`} id="observacoesLocacao" maxLength={FIELD_LIMITS.observacoesLocacao} value={values.observacoesLocacao} onChange={(event) => updateField('observacoesLocacao', limitText(event.target.value, FIELD_LIMITS.observacoesLocacao))} />
                      </FieldShell>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-5 ${errors.confirmacao ? 'border-red-500 bg-red-50' : 'border-[#d1ddd3] bg-[#f7faf7]'}`}>
                  <input checked={values.confirmacao} className="mt-1 h-4 w-4 accent-[#477a50]" id="confirmacao" onChange={(event) => updateField('confirmacao', event.target.checked)} type="checkbox" />
                  <span className="text-sm leading-6 text-[#607467]">
                    Confirmo que os dados e documentos informados são verdadeiros e que estou apto a participar da experiência. <strong className="text-[#477a50]">*</strong>
                  </span>
                </label>
                {errors.confirmacao && <p className="mt-2 text-xs font-medium text-red-600">{errors.confirmacao}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-9 flex items-start gap-4 border-b border-[#e3ece5] pb-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f0e8] font-mono text-[11px] font-bold text-[#3d7048]">03</span>
                <div>
                  <h3 className="font-display text-2xl font-bold">Revise antes de enviar</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#7c8f82]">Confira com calma. Você ainda pode voltar e corrigir qualquer informação.</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#d9e4db] bg-[#fbfdfb] p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold">Dados pessoais</h4>
                    <button className="text-xs font-bold text-[#3d7048] underline" onClick={() => setStep(0)} type="button">Editar</button>
                  </div>
                  <dl>
                    <ReviewRow label="Inscrição" value={values.tipoInscricao === 'dupla' ? 'Piloto e acompanhante' : 'Piloto individual'} />
                    <ReviewRow label="Nome" value={values.nomeCompleto} />
                    <ReviewRow label="CPF" value={values.cpf} />
                    <ReviewRow label="RG" value={values.rg} />
                    <ReviewRow label="Nascimento" value={values.dataNascimento} />
                    <ReviewRow label="Camiseta" value={values.tamanhoCamiseta} />
                    <ReviewRow label="WhatsApp" value={values.whatsapp} />
                    <ReviewRow label="E-mail" value={values.email} />
                    <ReviewRow label="Endereço" value={address} />
                    {values.tipoInscricao === 'dupla' && <ReviewRow label="Acompanhante" value={`${values.nomeAcompanhante} · RG ${values.rgAcompanhante} · Camiseta ${values.tamanhoCamisetaAcompanhante}`} />}
                  </dl>
                </div>
                <div className="rounded-2xl border border-[#d9e4db] bg-[#fbfdfb] p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold">Veículo e CNH</h4>
                    <button className="text-xs font-bold text-[#3d7048] underline" onClick={() => setStep(1)} type="button">Editar</button>
                  </div>
                  <dl>
                    <ReviewRow label="Participação" value={values.modalidadeVeiculo === 'proprio' ? 'Veículo próprio' : 'Locação'} />
                    <ReviewRow label="CNH" value={values.numeroCnh} />
                    <ReviewRow label="Validade" value={values.validadeCnh} />
                    <ReviewRow label="Documento da CNH" value={values.docCnh?.name ?? ''} />
                    {values.modalidadeVeiculo === 'proprio' ? (
                      <>
                        <ReviewRow label="Veículo" value={[values.tipoVeiculo.toUpperCase(), values.marcaVeiculo, values.modeloVeiculo, values.anoVeiculo].filter(Boolean).join(' · ')} />
                        <ReviewRow label="Placa / identificação" value={values.placaVeiculo} />
                        <ReviewRow label="Documento do veículo" value={values.docVeiculo?.name ?? ''} />
                      </>
                    ) : (
                      <>
                        <ReviewRow label="Preferência" value={values.preferenciaLocacao === 'avaliar' ? 'Precisa de orientação' : values.preferenciaLocacao.toUpperCase()} />
                        <ReviewRow label="Quantidade" value={values.quantidadeLocacao} />
                        <ReviewRow label="Observações" value={values.observacoesLocacao} />
                      </>
                    )}
                  </dl>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#c6d9c9] bg-[#f6faf6] p-4 text-sm leading-6 text-[#4d6957]">
                <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#3d7048]" />
                {BASIN_ENDPOINT_IS_VALID
                  ? 'Seus dados e documentos serão enviados ao canal de recebimento configurado pela Usina do Jet.'
                  : 'A integração está preparada e será ativada quando o canal de recebimento da Usina do Jet for configurado.'}
              </div>

              {submitError && (
                <p className="mt-5 flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertCircle aria-hidden="true" className="h-4 w-4" />
                  {submitError}
                </p>
              )}
            </div>
          )}

          <div className="mt-12 flex flex-col-reverse gap-3 border-t border-[#e3ece5] pt-7 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c4d0c7] bg-white px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#4d6957] transition hover:border-[#183124] hover:text-[#183124]" onClick={previousStep} type="button">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Voltar
              </button>
            ) : <span />}

            {step < 2 ? (
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#183124] px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_28px_rgba(24,49,36,0.16)] transition hover:-translate-y-0.5 hover:bg-[#477a50]" onClick={nextStep} type="button">
                Continuar
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : (
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#477a50] px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_28px_rgba(71,122,80,0.24)] transition hover:-translate-y-0.5 hover:bg-[#315e3c] disabled:cursor-wait disabled:opacity-70" disabled={submitting} onClick={submitForm} type="button">
                {submitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
                {submitting ? 'Enviando...' : 'Enviar inscrição'}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
