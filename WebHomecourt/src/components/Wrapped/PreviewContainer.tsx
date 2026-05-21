import confettiAnim from '../../assets/Wrapped/Lottie-Animations/Confetti.json'
import crownAnim from '../../assets/Wrapped/Lottie-Animations/Crown.json'
import fireAnim from '../../assets/Wrapped/Lottie-Animations/Fire.json'
import trophyAnim from '../../assets/Wrapped/Lottie-Animations/Trophy.json'
import { LastGameWrap } from './LastGameWrap'
import { MvpMomentWrap } from './MvpMomentWrap'
import { TopStatsWrap } from './TopStatsWrap'

interface PreviewContainerProps {
  selectedWrap: string;
  selectedStickers: string[];
  customCaption: string;
  frameStyle: string;
  currentFont: { id: string; label: string; style: React.CSSProperties };
  currentScheme: { bg: string; accent: string; secondary: string };
  wrapData: any;
  getBackgroundStyle: () => React.CSSProperties;
  textStyle: React.CSSProperties;
  downloadWrap: () => void;
  randomizeStyles: () => void;
  resetStyles: () => void;
  wrapRef: React.RefObject<HTMLDivElement>;
  isDownloading: boolean;
  elements: Record<string, boolean>;
  droppedStickers: Array<{id: string, src: string, x: number, y: number}>;
  setDroppedStickers: (value: Array<{id: string, src: string, x: number, y: number}>) => void;
}

export function PreviewContainer({
  selectedWrap, selectedStickers,
  customCaption, frameStyle,
  currentFont, currentScheme, wrapData,
  getBackgroundStyle,
  textStyle,
  downloadWrap, randomizeStyles, resetStyles,
  wrapRef, isDownloading,
  elements,
  droppedStickers, setDroppedStickers,
}: PreviewContainerProps) {
  const stickerAnimations: Record<string, any> = {
    trophy: trophyAnim,
    fire: fireAnim,
    crown: crownAnim,
    confetti: confettiAnim,
  }

  return (
    <div className="w-full flex flex-col min-w-0">
      <div className="bg-white rounded-[15px] p-4 md:p-6 shadow-[0_2px_12px_rgba(59,25,92,0.08)] flex flex-col">
        <style>{`
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* HEADER */}
        <div className="flex items-center justify-between pb-3.5 border-b border-morado-oscuro/10 mb-6">
          <div>
            <h2 style={{ fontFamily: 'Graphik, sans-serif', fontSize: '18px', fontWeight: 600, color: 'var(--color-texto-oscuro)', margin: 0 }}>
              Preview
            </h2>
            <p style={{ fontFamily: 'Graphik, sans-serif', fontSize: '12px', color: 'var(--color-morado-bajo)', margin: 0 }}>
              Customize and generate your wrap
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
              style={{ fontFamily: 'Graphik, sans-serif', background: 'rgba(253,185,39,0.12)',
                borderColor: 'rgba(253,185,39,0.35)', color: '#8a6200', letterSpacing: '0.03em' }}
            >
              9:16 · Story
            </span>
            <span
              className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-Background"
              style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-bajo)' }}
            >
              1080 × 1920
            </span>
          </div>
        </div>

        {/* STORY CARD */}
        <div className="pt-4 pb-4 flex items-center justify-center">
          <div
            ref={wrapRef}
            className="relative overflow-hidden flex flex-col rounded-[20px] transition-all duration-300 mx-auto"
            style={{
              width: 'clamp(280px, 55vw, 590px)',
              aspectRatio: '9/16',
              ...getBackgroundStyle(),
              boxShadow: '0 25px 70px rgba(59,25,92,0.4), 0 8px 20px rgba(0,0,0,0.25)',
              ...(frameStyle === 'classic' && {
                border: '6px solid white',
                boxShadow: `0 0 0 12px ${currentScheme.accent}, 0 20px 60px rgba(59,25,92,0.35)`,
              }),
              ...(frameStyle === 'modern' && {
                border: `3px solid ${currentScheme.accent}`,
                outline: '2px solid white',
                outlineOffset: '-7px',
              }),
              ...(frameStyle === 'neon' && {
                border: `3px solid ${currentScheme.accent}`,
                boxShadow: `0 0 20px ${currentScheme.accent}, inset 0 0 20px ${currentScheme.accent}40`,
              }),
            }}
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => {
              e.preventDefault()
              try {
                const stickerData = JSON.parse(e.dataTransfer.getData('sticker'))
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                setDroppedStickers([...droppedStickers, { ...stickerData, x, y }])
              } catch (error) {
                console.error('Error dropping sticker:', error)
              }
            }}
          >
            <div className="w-full h-full relative">

              {/* LAST GAME */}
              {selectedWrap === 'last-game' && (
                <LastGameWrap
                  wrapData={wrapData}
                  currentFont={currentFont}
                  textStyle={textStyle}
                  selectedStickers={selectedStickers}
                  stickerAnimations={stickerAnimations}
                  customCaption={customCaption}
                  elements={elements}
                />
              )}

              {/* MVP MOMENT */}
              {selectedWrap === 'mvp-moment' && (
                <MvpMomentWrap
                  wrapData={wrapData}
                  currentFont={currentFont}
                  currentScheme={currentScheme}
                  textStyle={textStyle}
                  selectedStickers={selectedStickers}
                  stickerAnimations={stickerAnimations}
                  customCaption={customCaption}
                  elements={elements}
                />
              )}

              {/* TOP STATS */}
              {selectedWrap === 'top-stats' && (
                <TopStatsWrap
                  wrapData={wrapData}
                  currentFont={currentFont}
                  textStyle={textStyle}
                  elements={elements}
                  selectedStickers={selectedStickers}
                  stickerAnimations={stickerAnimations}
                  customCaption={customCaption}
                />
              )}

              {/* DROPPED STICKERS */}
              {droppedStickers.map((sticker, index) => (
                <img
                  key={`${sticker.id}-${index}`}
                  src={sticker.src}
                  alt="sticker"
                  onClick={() => {
                    setDroppedStickers(droppedStickers.filter((_, i) => i !== index))
                  }}
                  style={{
                    position: 'absolute',
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 100,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex-shrink-0 pt-6">
          <button
            onClick={downloadWrap}
            disabled={isDownloading}
            className="w-full h-12 rounded-[13px] border-none flex items-center justify-center gap-2 text-white text-[15px] font-semibold transition-all hover:opacity-90 mb-2.5"
            style={{
              fontFamily: 'Graphik, sans-serif',
              background: isDownloading ? 'var(--color-Gris-Oscuro)' : 'linear-gradient(135deg, var(--color-morado-oscuro), var(--color-morado-lakers))',
              cursor: isDownloading ? 'wait' : 'pointer',
              opacity: isDownloading ? 0.7 : 1
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isDownloading ? 'hourglass_empty' : 'download'}
            </span>
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
          <div className="flex gap-2.5">
            <button onClick={randomizeStyles}
              className="flex-1 h-10 rounded-[13px] flex items-center justify-center gap-2 text-[14px] font-medium transition-all"
              style={{ fontFamily: 'Graphik, sans-serif', background: 'white', border: '1.5px solid #E2DCF0', color: 'var(--color-morado-oscuro)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-morado-fosfo)'; (e.currentTarget as HTMLButtonElement).style.background = '#F7F5FA' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2DCF0'; (e.currentTarget as HTMLButtonElement).style.background = 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                autorenew
              </span>
              Randomize
            </button>
            <button onClick={resetStyles}
              className="flex-1 h-10 rounded-[13px] flex items-center justify-center gap-2 text-[14px] font-medium transition-all"
              style={{ fontFamily: 'Graphik, sans-serif', background: 'white', border: '1.5px solid #E2DCF0', color: 'var(--color-morado-oscuro)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-morado-fosfo)'; (e.currentTarget as HTMLButtonElement).style.background = '#F7F5FA' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2DCF0'; (e.currentTarget as HTMLButtonElement).style.background = 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                delete
              </span>
              Reset
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}