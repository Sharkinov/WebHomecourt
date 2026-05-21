import { useState } from 'react'

export function OnboardingSteps() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-br from-white to-Background rounded-[15px] p-4 mb-8 border border-morado-oscuro/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        onClick={() => setIsCollapsed(false)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-morado-oscuro to-morado-lakers rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
              question_mark
            </span>
          </div>
          <span style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-oscuro)', fontSize: '14px', fontWeight: 500 }}>
            How to create your Lakers Wrapped
          </span>
        </div>
        <svg className="w-5 h-5 text-morado-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-Background rounded-[15px] p-4 md:p-6 lg:p-8 mb-6 lg:mb-8 border border-morado-oscuro/10 shadow-sm relative">
      <button
        onClick={() => setIsCollapsed(true)}
        className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-morado-oscuro/10 flex items-center justify-center transition-colors"
        title="Collapse"
      >
        <svg className="w-5 h-5 text-morado-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <h2
        className="text-center mb-4 md:mb-6"
        style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-texto-oscuro)', fontSize: '20px', fontWeight: 400 }}
      >
        Create Your Lakers Wrapped
        <br />
        <span style={{ fontSize: '16px', color: 'var(--color-Gris-Oscuro)' }}>in 3 simple steps</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
        {/* FLECHA 1 */}
        <svg className="hidden lg:block absolute text-morado-oscuro/30" style={{ top: '28px', left: 'calc(33% - 36px)', width: '72px', height: '40px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        {/* FLECHA 2 */}
        <svg className="hidden lg:block absolute text-morado-oscuro/30" style={{ top: '28px', right: 'calc(33% - 36px)', width: '72px', height: '40px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>

        {/* STEP 1 */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-morado-oscuro to-morado-lakers rounded-full flex items-center justify-center">
              <span className="text-white text-[28px] font-bold" style={{ fontFamily: 'Graphik, sans-serif' }}>1</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FDB927] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-morado-oscuro" style={{ fontSize: '16px' }}>
                palette
              </span>
            </div>
          </div>
          <h3 style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-oscuro)', fontSize: '20px', fontWeight: 500 }} className="mb-2">
            Make It Yours
          </h3>
          <p style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-Gris-Oscuro)', fontSize: '14px', lineHeight: '21px' }}>
            Pick your wrap type, theme and style to make it uniquely yours
          </p>
        </div>

        {/* STEP 2 */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-morado-oscuro to-morado-lakers rounded-full flex items-center justify-center">
              <span className="text-white text-[28px] font-bold" style={{ fontFamily: 'Graphik, sans-serif' }}>2</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FDB927] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-morado-oscuro" style={{ fontSize: '16px' }}>
                download
              </span>
            </div>
          </div>
          <h3 style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-oscuro)', fontSize: '20px', fontWeight: 500 }} className="mb-2">
            Download & Save
          </h3>
          <p style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-Gris-Oscuro)', fontSize: '14px', lineHeight: '21px' }}>
            Download your wrap as a 9:16 image, perfectly sized for Instagram Stories
          </p>
        </div>

        {/* STEP 3 */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-morado-oscuro to-morado-lakers rounded-full flex items-center justify-center">
              <span className="text-white text-[28px] font-bold" style={{ fontFamily: 'Graphik, sans-serif' }}>3</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FDB927] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-morado-oscuro" style={{ fontSize: '16px' }}>
                share
              </span>
            </div>
          </div>
          <h3 style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-oscuro)', fontSize: '20px', fontWeight: 500 }} className="mb-2">
            Share on Instagram
          </h3>
          <p style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-Gris-Oscuro)', fontSize: '14px', lineHeight: '21px' }}>
            Post it to your Instagram Story and show the world you're a Lakers fan
          </p>
        </div>
      </div>

      {/* EL PRO TIP */}
      <div className="mt-6 bg-[#FDB927]/10 border-l-4 border-[#FDB927] p-3 rounded-lg flex items-start gap-3">
        <span className="material-symbols-outlined text-[#FDB927] shrink-0" style={{ fontSize: '18px' }}>
          star
        </span>
        <p style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-oscuro)', fontSize: '13px', lineHeight: '1.5' }}>
          <strong>Pro Tip:</strong> The more you personalize, the more legendary your wrap becomes
        </p>
      </div>
    </div>
  )
}