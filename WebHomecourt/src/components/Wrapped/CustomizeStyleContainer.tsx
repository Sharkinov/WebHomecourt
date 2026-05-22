import type { WrapBackground } from '../../hooks/Wrapped/useWrapBackgrounds.ts'
import happysticker1 from '../../assets/Wrapped/Stickers/happysticker1-wrapped.png'
import happysticker2 from '../../assets/Wrapped/Stickers/happysticker2-wrapped.png'
import happysticker3 from '../../assets/Wrapped/Stickers/happysticker3-wrapped.png'
import happysticker4 from '../../assets/Wrapped/Stickers/happysticker4-wrapped.png'
import happysticker5 from '../../assets/Wrapped/Stickers/happysticker5-wrapped.png'
import sadsticker1 from '../../assets/Wrapped/Stickers/sadsticker1-wrapped.png'
import sadsticker2 from '../../assets/Wrapped/Stickers/sadsticker2-wrapped.png'
import sadsticker3 from '../../assets/Wrapped/Stickers/sadsticker3-wrapped.png'
import sadsticker4 from '../../assets/Wrapped/Stickers/sadsticker4-wrapped.png'
import sadsticker5 from '../../assets/Wrapped/Stickers/sadsticker5-wrapped.png'

interface Font {
  id: string;
  label: string;
  style: React.CSSProperties;
}

interface ColorScheme {
  id: string;
  label: string;
  bg: string;
  accent: string;
  secondary: string;
}

// interface Frame {
//   id: string;
//   label: string;
// }

interface WrapElement {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

interface CustomizeStyleContainerProps {
  backgrounds: WrapBackground[]
  backgroundsLoading: boolean
  selectedBackground: string | null
  applyBackground: (id: string) => void
  setSelectedBackground: (value: string | null) => void
  setBackgroundPattern: (value: string) => void
  selectedStickers: string[]
  toggleSticker: (stickerId: string) => void
  fonts: Font[]
  fontStyle: string
  setFontStyle: (value: string) => void
  customCaption: string
  setCustomCaption: (value: string) => void
  colorSchemes: ColorScheme[]
  colorScheme: string
  setColorScheme: (value: string) => void
  elements: Record<string, boolean>
  toggleElement: (id: string) => void
  selectedWrap: string
}

const dragDropStickers = [
  { id: 'happy1', src: happysticker1, label: 'Happy 1' },
  { id: 'happy2', src: happysticker2, label: 'Happy 2' },
  { id: 'happy3', src: happysticker3, label: 'Happy 3' },
  { id: 'happy4', src: happysticker4, label: 'Happy 4' },
  { id: 'happy5', src: happysticker5, label: 'Happy 5' },
  { id: 'sad1', src: sadsticker1, label: 'Sad 1' },
  { id: 'sad2', src: sadsticker2, label: 'Sad 2' },
  { id: 'sad3', src: sadsticker3, label: 'Sad 3' },
  { id: 'sad4', src: sadsticker4, label: 'Sad 4' },
  { id: 'sad5', src: sadsticker5, label: 'Sad 5' },
]

const ALL_WRAP_ELEMENTS: WrapElement[] = [
  { id: 'player', label: 'Player Image', description: 'Show featured player photo', icon: null },
  { id: 'teamLogo', label: 'Team Logo', description: 'Display Lakers logo', icon: null },
  { id: 'stadium', label: 'Stadium and Date', description: 'Show Crypto.com Arena', icon: null },
  { id: 'icons', label: 'Icons', description: 'Show stat icons', icon: null },
  { id: 'watermark', label: 'Watermark', description: 'LakersHomecourt badge', icon: null },
]

const ELEMENTS_BY_WRAP: Record<string, string[]> = {
  'last-game': ['stadium', 'watermark'],
  'mvp-moment': ['player', 'watermark'],
  'top-stats': ['icons', 'watermark'],
}

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${
      on ? 'bg-gradient-to-r from-morado-oscuro to-morado-lakers' : 'bg-[#D4CDE0]'
    }`}
  >
    <div className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-all ${
      on ? 'left-[23px]' : 'left-[3px]'
    }`} />
  </button>
)

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span
    className="block mb-2.5"
    style={{
      fontFamily: 'Graphik, sans-serif',
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--color-morado-bajo)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}
  >
    {children}
  </span>
)

const PillButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-all ${
      active
        ? 'text-white shadow-sm'
        : 'bg-Background text-Gris-Oscuro hover:bg-[#EDE8F7] hover:text-morado-oscuro'
    }`}
    style={
      active
        ? { background: 'linear-gradient(135deg, var(--color-morado-oscuro), var(--color-morado-lakers))', fontFamily: 'Graphik, sans-serif' }
        : { fontFamily: 'Graphik, sans-serif' }
    }
  >
    {children}
  </button>
)

export function CustomizeStyleContainer({
  backgrounds, backgroundsLoading, selectedBackground, applyBackground,
  // setSelectedBackground, setBackgroundPattern,
  // selectedStickers, toggleSticker,
  fonts, fontStyle, setFontStyle,
  customCaption, setCustomCaption,
  // colorSchemes, colorScheme, setColorScheme,
  elements, toggleElement,
  selectedWrap,
}: CustomizeStyleContainerProps) {
  const availableElementIds = ELEMENTS_BY_WRAP[selectedWrap] || []
  const wrapElements = ALL_WRAP_ELEMENTS.filter(el => availableElementIds.includes(el.id))

  return (
    <div className="bg-white rounded-[15px] p-4 md:p-5 overflow-y-auto shadow-[0_2px_12px_rgba(59,25,92,0.08)] w-full">

      {/* HEADER */}
      <div className="mb-4 pb-3 border-b border-morado-oscuro/10">
        <h3 style={{ fontFamily: 'Graphik, sans-serif', fontSize: '18px', fontWeight: 600, color: 'var(--color-texto-oscuro)', margin: 0 }}>
          Customize Style
        </h3>
        <p style={{ fontFamily: 'Graphik, sans-serif', fontSize: '12px', color: 'var(--color-morado-bajo)', margin: 0 }}>
          See your changes live as you customize
        </p>
      </div>

      {/* BACKGROUND */}
      <div className="mb-5">
        <SectionLabel>Background</SectionLabel>
        {backgroundsLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[72px] w-[120px] flex-shrink-0 rounded-[12px] bg-Background animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
            {/* IMAGE BACKGROUNDS */}
            {backgrounds.map((bg) => (
              <button
                key={bg.wrap_backgrounds_id}
                onClick={() => applyBackground(bg.wrap_backgrounds_id)}
                className={`relative h-[72px] w-[120px] flex-shrink-0 rounded-[12px] overflow-hidden transition-all ${
                  selectedBackground === bg.wrap_backgrounds_id
                    ? 'ring-2 ring-[#FDB927] shadow-[0_0_0_4px_rgba(253,185,39,0.2)]'
                    : 'hover:ring-2 hover:ring-morado-fosfo/40'
                }`}
                style={{
                  backgroundImage: `url(${bg.posterUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
                <div className="relative z-10 flex flex-col items-center justify-center h-full px-2">
                  <span style={{
                    fontFamily: 'Graphik, sans-serif',
                    fontSize: '11px',
                    color: 'white',
                    fontWeight: 600,
                    textAlign: 'center',
                    lineHeight: '14px',
                  }}>
                    {bg.label}
                  </span>
                </div>
                {selectedBackground === bg.wrap_backgrounds_id && (
                  <div className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-[#FDB927] rounded-full flex items-center justify-center z-10">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-morado-oscuro)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STICKERS */}
      <div className="mb-5">
        <SectionLabel>Stickers</SectionLabel>
        <p style={{
          fontFamily: 'Graphik, sans-serif',
          fontSize: '11px',
          color: 'var(--color-morado-bajo)',
          marginBottom: '8px',
          fontStyle: 'italic'
        }}>
          Drag and drop stickers onto your wrap
        </p>
        <div
          className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {dragDropStickers.map((sticker) => (
            <div
              key={sticker.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('sticker', JSON.stringify(sticker))

                // Crear un div temporal con la imagen del tamaño correcto
                const dragImage = document.createElement('div')
                dragImage.style.width = '80px'
                dragImage.style.height = '80px'
                dragImage.style.position = 'absolute'
                dragImage.style.top = '-1000px'

                const img = document.createElement('img')
                img.src = sticker.src
                img.style.width = '80px'
                img.style.height = '80px'
                img.style.objectFit = 'contain'

                dragImage.appendChild(img)
                document.body.appendChild(dragImage)

                e.dataTransfer.setDragImage(dragImage, 40, 40)

                // Limpiar después
                setTimeout(() => document.body.removeChild(dragImage), 0)
              }}
              className="h-[80px] w-[80px] flex-shrink-0 rounded-[12px] bg-[#F7F5FA] hover:bg-[#EDE8F7] cursor-grab active:cursor-grabbing flex items-center justify-center transition-all border border-[#E2DCF0] hover:border-morado-fosfo/40"
            >
              <img
                src={sticker.src}
                alt={sticker.label}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* CAPTION */}
      <div className="mb-5">
        <SectionLabel>Your Caption</SectionLabel>
        <input
          type="text"
          value={customCaption}
          onChange={(e) => {
            if (e.target.value.length <= 60) {
              setCustomCaption(e.target.value)
            }
          }}
          placeholder="Add your message here..."
          maxLength={60}
          className="w-full h-10 px-3.5 bg-[#F7F5FA] border-[1.5px] rounded-[10px] text-[13px] text-texto-oscuro placeholder:text-[#B0A8C0] focus:outline-none transition-colors"
          style={{
            fontFamily: 'Graphik, sans-serif',
            borderColor: '#E2DCF0',
          }}
        />
        <div className="flex justify-between mt-1.5">
          <span style={{
            fontFamily: 'Graphik, sans-serif',
            fontSize: '11px',
            color: '#B0A8C0'
          }}>
            Appears at the bottom of your wrap
          </span>
          <span style={{
            fontFamily: 'Graphik, sans-serif',
            fontSize: '11px',
            color: '#B0A8C0',
          }}>
            {customCaption.length}/60
          </span>
        </div>
      </div>

      {/* FONT STYLE */}
      <div className="mb-5">
        <SectionLabel>Font Style</SectionLabel>
        <div className="flex gap-2">
          {fonts.map((font) => (
            <PillButton
              key={font.id}
              active={fontStyle === font.id}
              onClick={() => setFontStyle(font.id)}
            >
              {font.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* ELEMENTS */}
      <div className="mb-1">
        <SectionLabel>Elements</SectionLabel>
        <div className="bg-[#F7F5FA] rounded-[12px] px-3.5 py-1">
          {wrapElements.map((el, i) => (
            <div
              key={el.id}
              className={`flex items-center justify-between py-2.5 ${
                i < wrapElements.length - 1 ? 'border-b border-morado-oscuro/[0.06]' : ''
              }`}
            >
              <div
                className="flex items-center gap-2"
                style={{ fontFamily: 'Graphik, sans-serif', fontSize: '14px', fontWeight: 500, color: 'var(--color-morado-oscuro)' }}
              >
                {el.label}
              </div>
              <Toggle on={elements[el.id] ?? true} onToggle={() => toggleElement(el.id)} />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}