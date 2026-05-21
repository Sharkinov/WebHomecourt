import wrappedMvpBg from '../../assets/Wrapped/wrapped-mvp-bg.png'
import watermarkImg from '../../assets/Wrapped/wrapped-watermark.png'

interface MvpMomentWrapProps {
  wrapData: any;
  currentFont: { id: string; label: string; style: React.CSSProperties };
  currentScheme: { bg: string; accent: string; secondary: string };
  textStyle: React.CSSProperties;
  customCaption: string;
  elements: Record<string, boolean>;
}

export function MvpMomentWrap({
  wrapData,
  currentFont,
  currentScheme,
  textStyle,
  customCaption,
  elements,
}: MvpMomentWrapProps) {
  return (
    <>
      {/* OVERLAY */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(12,6,28,0.35) 0%,
              rgba(18,8,38,0.42) 45%,
              rgba(8,4,18,0.50) 100%
            )
          `,
        }}
      />

      {/* CONTENT */}
      <div className="w-full h-full flex flex-col items-center justify-center relative z-10">

        {/* HEADER */}
        <div className="flex flex-col items-center relative mb-10">

          <span
            style={{
              fontFamily: 'Graphik, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(253,185,39,0.82)',
              letterSpacing: '0.18em',
              marginBottom: '10px',
            }}
          >
            MVP MOMENT
          </span>

          <div className="relative flex items-center justify-center">

            {/* MAIN TITLE */}
            <span
              style={{
                position: 'relative',
                fontFamily: 'Graphik, sans-serif',
                fontSize: '72px',
                fontWeight: 900,
                fontStyle: 'italic',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                color: '#FDB927',
                textShadow: `
                  0 0 18px rgba(253,185,39,0.30),
                  0 8px 30px rgba(0,0,0,0.45)
                `,
              }}
            >
              LEGENDARY
            </span>

          </div>

        </div>

        {/* PLAYER CARD */}
        {elements.player !== false && (
        <div className="relative flex items-center justify-center mb-8">

          {/* CARD */}
          <div
            className="overflow-hidden relative flex items-end justify-center"
            style={{
              width: '230px',
              height: '240px',
              borderRadius: '30px',

              backgroundImage: `
                linear-gradient(
                  180deg,
                  rgba(25,10,45,0.55),
                  rgba(18,8,38,0.72)
                ),
                url(${wrappedMvpBg})
              `,
              backgroundSize: '112%',
              backgroundPosition: 'center',

              border: '1px solid rgba(253,185,39,0.20)',

              boxShadow: `
                0 0 30px rgba(253,185,39,0.10),
                inset 0 1px 0 rgba(255,255,255,0.06)
              `,
            }}
          >

            {/* PLAYER */}
            {wrapData.mvp.photoUrl ? (
              <img
                src={wrapData.mvp.photoUrl}
                alt={wrapData.mvp.playerName}
                className="relative z-10 object-contain"
                style={{
                  width: '115%',
                  height: '115%',
                  transform: 'translateY(67px) scale(1.15)',
                  transformOrigin: 'bottom center',
                  filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.38))',
                }}
              />
            ) : (
              <span
                style={{
                  color: currentScheme.accent,
                  fontSize: '28px',
                  fontWeight: 800,
                  fontFamily: 'Graphik, sans-serif',
                }}
              >
                MVP
              </span>
            )}
          </div>

          {/* BADGE */}
          <div
            className="absolute flex items-center justify-center overflow-hidden z-30"
            style={{
              bottom: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #FDB927, #e8a800)',
              borderRadius: '999px',
              padding: '7px 24px',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 18px rgba(253,185,39,0.35)',
            }}
          >

            <div className="flex items-center gap-1 relative">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '16px',
                  color: 'var(--color-morado-oscuro)',
                  fontVariationSettings: '"FILL" 1',
                }}
              >
                star
              </span>

              <span
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--color-morado-oscuro)',
                  letterSpacing: '0.06em',
                }}
              >
                MVP
              </span>
            </div>
          </div>

        </div>
        )}

        {/* NOMBRE */}
        <div className="flex flex-col items-center justify-center w-full mb-6">

          <span
            style={{
              fontFamily: 'Graphik, sans-serif',
              color: 'white',
              fontSize: '34px',
              fontWeight: 900,
              textAlign: 'center',
              textShadow: '0 4px 18px rgba(0,0,0,0.45)',
              letterSpacing: '-0.05em',
              ...currentFont.style,
              ...textStyle,
            }}
          >
            {wrapData.mvp.playerName}
          </span>

        </div>

        {/* STATS */}
        <div className="w-full flex justify-center items-center px-6 mb-8">

          {[
            { label: 'PTS', value: wrapData.mvp.points },
            { label: 'AST', value: wrapData.mvp.assists },
            { label: 'REB', value: wrapData.mvp.rebounds },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              className="flex-1 flex flex-col items-center relative"
            >

              {/* DIVIDER LINEA */}
              {i < arr.length - 1 && (
                <div
                  className="absolute right-0 top-3 bottom-3"
                  style={{
                    width: '1px',
                    background: `
                      linear-gradient(
                        180deg,
                        transparent,
                        rgba(255,255,255,0.12),
                        transparent
                      )
                    `,
                  }}
                />
              )}

              <div
                style={{
                  color: 'rgba(255,255,255,0.44)',
                  fontSize: '12px',
                  fontFamily: 'Graphik, sans-serif',
                  marginBottom: '6px',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                {s.label}
              </div>

              <div
                style={{
                  color: 'white',
                  fontSize: '58px',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                  textShadow: '0 0 14px rgba(255,255,255,0.06)',
                  ...currentFont.style,
                  ...textStyle,
                }}
              >
                {s.value}
              </div>

            </div>
          ))}

        </div>

        {/* CAPTION */}
        {customCaption && (
          <p
            style={{
              color: 'rgba(255,255,255,0.68)',
              fontSize: '12px',
              fontStyle: 'italic',
              fontFamily: 'Graphik, sans-serif',
              lineHeight: '18px',
              textAlign: 'center',
              maxWidth: '75%',
              marginBottom: '18px',
            }}
          >
            {customCaption}
          </p>
        )}

        {/* WATERMARK */}
        {elements.watermark !== false && (
          <img
            src={watermarkImg}
            alt="Lakers Homecourt"
            style={{
              height: '70px',
              objectFit: 'contain',
              opacity: 0.5,
            }}
          />
        )}

      </div>

    </>
  )
}