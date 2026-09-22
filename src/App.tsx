import { ArrowDown, CalendarDays, MapPin, Mountain } from 'lucide-react'
import { ExpeditionForm } from './components/ExpeditionForm'

function App() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#102219] text-white">
      <section className="relative isolate min-h-[700px] overflow-hidden lg:min-h-[820px]">
        <img
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          src="/images/monte-verde-hero.webp"
          alt="Vista aérea entre araucárias em Monte Verde"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(13,31,21,0.98)_0%,rgba(13,31,21,0.8)_48%,rgba(13,31,21,0.2)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(10,26,17,0.97)_0%,transparent_60%)]" />
        <div aria-hidden="true" className="absolute -right-20 top-28 -z-10 hidden h-px w-[34rem] rotate-[-8deg] bg-gradient-to-l from-[#78a96b] via-[#78a96b]/70 to-transparent lg:block" />

        <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-7 sm:px-10 lg:px-16 lg:py-9">
          <img
            className="h-16 w-auto brightness-0 invert sm:h-20 lg:h-24"
            src="/images/usina-logo-mark.png"
            alt="Usina do Jet"
          />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white/75 sm:text-xs">
            Expedição off-road
          </span>
        </header>

        <div className="mx-auto flex min-h-[575px] w-full max-w-[1440px] items-end px-6 pb-12 sm:px-10 lg:min-h-[660px] lg:px-16 lg:pb-16">
          <div className="w-full max-w-[1180px]">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Mountain aria-hidden="true" className="h-4 w-4 text-[#78a96b]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
                Serra, natureza e aventura
              </span>
            </div>

            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.28em] text-[#78a96b] sm:text-sm">
              Usina do Jet apresenta
            </p>
            <h1 className="max-w-[1120px] font-display text-[clamp(3rem,8.6vw,9rem)] font-black uppercase leading-[0.84] tracking-[-0.065em]">
              <span className="block">Monte Verde</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Prepare seus dados e documentos para uma experiência off-road entre trilhas, araucárias e paisagens da Serra da Mantiqueira.
              Antes do envio, você poderá revisar toda a inscrição com tranquilidade.
            </p>

            <div className="mt-8 flex flex-col gap-5 border-t border-white/15 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
              <div className="flex items-center gap-3">
                <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-[#78a96b]" />
                <span className="text-sm font-semibold">6 a 8 de novembro de 2026</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-[#78a96b]" />
                <span className="text-sm font-semibold">Monte Verde · Saída de São Paulo</span>
              </div>
              <a
                className="inline-flex items-center justify-center gap-3 bg-[#477a50] px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_36px_rgba(71,122,80,0.3)] transition hover:-translate-y-0.5 hover:bg-[#5d9365] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:ml-auto"
                href="#inscricao"
              >
                Começar inscrição
                <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <ExpeditionForm />
    </main>
  )
}

export default App
