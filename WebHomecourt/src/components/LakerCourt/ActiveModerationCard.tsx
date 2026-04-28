export default function ActiveModerationCard() {
  return (
    <section className="w-full h-48 rounded-[15px] border-[0.8px] border-black/8 bg-white px-[24.8px] pt-[24.8px] pb-4 shadow-[0_4px_4px_rgba(0,0,0,0.08)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-morado-lakers text-[14px] text-amarillo-lakers shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          AI
        </div>

        <div className="flex-1">
          <h3 className="text-[14px] leading-5.25 text-[#11061A]">Active Moderation</h3>
          <p className="mt-1 text-[12px] leading-4.5 text-Gris-Oscuro">
            Every user&apos;s activity is monitored with AI to grant safe and respectful communication.
          </p>
        </div>
      </div>
    </section>
  )
}
