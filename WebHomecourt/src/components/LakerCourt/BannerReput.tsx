import type { ReactNode } from 'react'

type HeroBannerProps = {
  title: string
  subtitle: string
  logoSrc: string
  logoAlt: string
  reputationLabel?: string
  reputationValue: number | null
  loadingReputation: boolean
  icon?: ReactNode
}

function HeroBanner({
  title,
  subtitle,
  logoSrc,
  logoAlt,
  reputationLabel = 'YOUR REPUTATION',
  reputationValue,
  loadingReputation,
  icon,
}: HeroBannerProps) {
  return (
    <div className="w-full max-w-315 mx-auto min-h-[169.588px] shrink-0 self-stretch px-5 py-7 bg-morado-oscuro rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.10),0_8px_10px_-6px_rgba(0,0,0,0.10)] flex flex-col gap-6 overflow-hidden md:flex-row md:items-center md:justify-between">
      <div className="inline-flex items-center gap-4">
        <img
          src={logoSrc}
          alt={logoAlt}
          className="h-20 w-24 rounded-md bg-zinc-100 p-1 object-contain"
        />
        <div className="text-zinc-100">
          <h1 className="justify-start text-zinc-100">{title}</h1>
          <p className="mt-2 text-xl text-zinc-300">{subtitle}</p>
        </div>
      </div>
      <div className="self-end text-right md:self-auto">
        <p className="uppercase tracking-[0.15em] text-zinc-300 text-sm">{reputationLabel}</p>
        <div className="mt-2 inline-flex items-center gap-2 text-amarillo-laker">
          <span className="text-6xl leading-none text-amarillo-lakers">
            {loadingReputation ? '...' : reputationValue !== null ? reputationValue.toFixed(1) : '--'}
          </span>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default HeroBanner
