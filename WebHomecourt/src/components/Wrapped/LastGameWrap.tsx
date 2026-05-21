import Lottie from 'lottie-react'
import watermarkImg from '../../assets/Wrapped/wrapped-watermark.png'

interface LastGameWrapProps {
  wrapData: any;
  currentFont: { id: string; label: string; style: React.CSSProperties };
  textStyle: React.CSSProperties;
  selectedStickers: string[];
  stickerAnimations: Record<string, any>;
  customCaption: string;
  elements: Record<string, boolean>;
}

export function LastGameWrap({
  wrapData,
  currentFont,
  textStyle,
  selectedStickers,
  stickerAnimations,
  customCaption,
  elements,
}: LastGameWrapProps) {

  const won = wrapData.lastGame?.won

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
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
    >

      {/* CONTENT */}
      <div className="relative z-10 w-full h-full px-3 md:px-4 lg:px-5 flex flex-col items-center justify-center">

        {/* HEADER */}
        <div className="flex flex-col items-center mb-6 md:mb-8 lg:mb-10">

          <span
            className="text-[10px] md:text-xs lg:text-sm"
            style={{
              fontFamily: 'Graphik, sans-serif',
              fontWeight: 700,
              color: won
                ? 'rgba(253,185,39,0.88)'
                : 'rgba(255,120,120,0.88)',
              letterSpacing: '0.22em',
              marginBottom: '8px',
            }}
          >
            LAST GAME
          </span>

          <div className="relative flex items-center justify-center">

            {/* TITULO */}
            <span
              className="text-[42px] md:text-[56px] lg:text-[72px]"
              style={{
                position: 'relative',
                fontFamily: 'Graphik, sans-serif',
                fontWeight: 900,
                fontStyle: 'italic',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                color: won ? '#FDB927' : '#EF5350',

                textShadow: won
                  ? `
                    0 0 22px rgba(253,185,39,0.42),
                    0 6px 30px rgba(0,0,0,0.55)
                  `
                  : `
                    0 0 22px rgba(239,83,80,0.38),
                    0 6px 30px rgba(0,0,0,0.55)
                  `,
              }}
            >
              {won ? 'VICTORY' : 'DEFEAT'}
            </span>

          </div>

        </div>

        {/* MATCHUP */}
        <div className="w-full flex items-start justify-center gap-2 md:gap-3 lg:gap-4 mb-5 md:mb-6 lg:mb-8">

          {/* TEAM 1 */}
          <div className="flex-1 flex flex-col items-center">

            {/* TEAM CARD */}
            <div
              className="relative overflow-hidden rounded-[18px] md:rounded-[22px] lg:rounded-[28px] flex flex-col items-center justify-center w-[100px] h-[120px] md:w-[120px] md:h-[145px] lg:w-[148px] lg:h-[176px]"
              style={{

                background: `
                  linear-gradient(
                    135deg,
                    rgba(40,18,70,0.74),
                    rgba(18,8,38,0.84)
                  )
                `,

                border: '1px solid rgba(253,185,39,0.20)',

                boxShadow: `
                  0 0 26px rgba(253,185,39,0.12),
                  inset 0 1px 0 rgba(255,255,255,0.05)
                `,

                backdropFilter: 'blur(10px)',
              }}
            >

              {/* SHINEE EFECTO */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    linear-gradient(
                      120deg,
                      transparent 20%,
                      rgba(255,255,255,0.08) 45%,
                      rgba(255,255,255,0.16) 50%,
                      rgba(255,255,255,0.08) 55%,
                      transparent 80%
                    )
                  `,
                  transform: 'translateX(-120%) skewX(-18deg)',
                  animation: 'shineMove 4.5s ease-in-out infinite',
                  mixBlendMode: 'screen',
                }}
              />

              {/* LOGO */}
              <div
                className="flex items-center justify-center rounded-full mb-2 md:mb-2.5 lg:mb-3 w-[55px] h-[55px] md:w-[68px] md:h-[68px] lg:w-[82px] lg:h-[82px]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {wrapData.lastGame.lakersLogoUrl ? (
                  <img
                    src={wrapData.lastGame.lakersLogoUrl}
                    alt="LAL"
                    className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] lg:w-[72px] lg:h-[72px] object-contain"
                  />
                ) : (
                  <span
                    className="text-base md:text-lg lg:text-[22px]"
                    style={{
                      color: '#FDB927',
                      fontWeight: 800,
                    }}
                  >
                    LAL
                  </span>
                )}
              </div>

              {/* ABBR */}
              <span
                className="text-sm md:text-base lg:text-lg"
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  fontWeight: 800,
                  color: '#FDB927',
                  letterSpacing: '0.08em',
                  marginBottom: '2px',
                }}
              >
                {wrapData.lastGame.team1}
              </span>

              {/* NAME */}
              <span
                className="text-[9px] md:text-[10px] lg:text-xs"
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  color: 'rgba(255,255,255,0.48)',
                  textAlign: 'center',
                  padding: '0 6px',
                }}
              >
                {wrapData.lastGame.lakersName}
              </span>

            </div>

            {/* SCORE */}
            <div className="relative mt-2 md:mt-2.5 lg:mt-3 flex items-center justify-center">

              {/* SPARKLEE EFFECT */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    linear-gradient(
                      120deg,
                      transparent 20%,
                      rgba(255,255,255,0.20) 45%,
                      rgba(255,255,255,0.45) 50%,
                      rgba(255,255,255,0.20) 55%,
                      transparent 80%
                    )
                  `,
                  transform: 'translateX(-150%) skewX(-18deg)',
                  animation: 'scoreSparkle 3.8s ease-in-out infinite',
                  mixBlendMode: 'screen',
                }}
              />

              <span
                className="text-[60px] md:text-[80px] lg:text-[100px]"
                style={{
                  position: 'relative',
                  fontFamily: 'Graphik, sans-serif',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: 'white',
                  letterSpacing: '-0.08em',

                  textShadow: won
                    ? `
                      0 0 26px rgba(253,185,39,0.26),
                      0 0 40px rgba(253,185,39,0.12)
                    `
                    : `
                      0 0 18px rgba(255,255,255,0.10)
                    `,

                  ...currentFont.style,
                  ...textStyle,
                }}
              >
                {wrapData.lastGame.score1}
              </span>

            </div>

          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center pt-[56px] md:pt-[68px] lg:pt-[82px]">

            <div
              className="flex items-center justify-center rounded-full w-[32px] h-[32px] md:w-[38px] md:h-[38px] lg:w-[44px] lg:h-[44px]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="text-[10px] md:text-xs lg:text-[13px]"
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.38)',
                  letterSpacing: '0.08em',
                }}
              >
                VS
              </span>
            </div>

          </div>

          {/* TEAM 2 */}
          <div className="flex-1 flex flex-col items-center">

            {/* TEAM CARD */}
            <div
              className="relative overflow-hidden rounded-[18px] md:rounded-[22px] lg:rounded-[28px] flex flex-col items-center justify-center w-[100px] h-[120px] md:w-[120px] md:h-[145px] lg:w-[148px] lg:h-[176px]"
              style={{

                background: `
                  linear-gradient(
                    135deg,
                    rgba(55,55,70,0.46),
                    rgba(18,18,28,0.72)
                  )
                `,

                border: '1px solid rgba(255,255,255,0.08)',

                boxShadow: `
                  0 8px 20px rgba(0,0,0,0.22),
                  inset 0 1px 0 rgba(255,255,255,0.03)
                `,

                backdropFilter: 'blur(10px)',
              }}
            >

              {/* LOGO */}
              <div
                className="flex items-center justify-center rounded-full mb-2 md:mb-2.5 lg:mb-3 w-[55px] h-[55px] md:w-[68px] md:h-[68px] lg:w-[82px] lg:h-[82px]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {wrapData.lastGame.opponentLogoUrl ? (
                  <img
                    src={wrapData.lastGame.opponentLogoUrl}
                    alt={wrapData.lastGame.team2}
                    className="w-[48px] h-[48px] md:w-[60px] md:h-[60px] lg:w-[72px] lg:h-[72px] object-contain"
                  />
                ) : (
                  <span
                    className="text-base md:text-lg lg:text-[22px]"
                    style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontWeight: 800,
                    }}
                  >
                    {wrapData.lastGame.team2}
                  </span>
                )}
              </div>

              {/* ABBR */}
              <span
                className="text-sm md:text-base lg:text-lg"
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.82)',
                  letterSpacing: '0.08em',
                  marginBottom: '2px',
                }}
              >
                {wrapData.lastGame.team2}
              </span>

              {/* NAME */}
              <span
                className="text-[9px] md:text-[10px] lg:text-xs"
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  color: 'rgba(255,255,255,0.48)',
                  textAlign: 'center',
                  padding: '0 6px',
                }}
              >
                {wrapData.lastGame.opponentName || wrapData.lastGame.team2}
              </span>

            </div>

            {/* SCORE */}
            <div className="relative mt-2 md:mt-2.5 lg:mt-3 flex items-center justify-center">

              <span
                className="text-[60px] md:text-[80px] lg:text-[100px]"
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '-0.08em',

                  textShadow: `
                    0 0 16px rgba(255,255,255,0.05)
                  `,

                  ...currentFont.style,
                  ...textStyle,
                }}
              >
                {wrapData.lastGame.score2}
              </span>

            </div>

          </div>

        </div>

        {/* DATE + STADIUM */}
        {elements.stadium !== false && (
        <div
          className="flex items-center justify-center gap-2 md:gap-2.5 lg:gap-3 mb-3 md:mb-4 lg:mb-5 rounded-[16px] md:rounded-[20px] lg:rounded-[24px] px-3 py-2.5 md:px-4 md:py-3 lg:px-[22px] lg:py-[18px]"
          style={{
            background: `
              linear-gradient(
                135deg,
                rgba(88, 45, 130, 0.48),
                rgba(45, 18, 75, 0.58)
              )
            `,
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            boxShadow: `
              0 6px 20px rgba(0,0,0,0.22),
              inset 0 1px 0 rgba(255,255,255,0.04)
            `,
          }}
        >

          <span
            className="text-[10px] md:text-xs lg:text-[13px]"
            style={{
              fontFamily: 'Graphik, sans-serif',
              color: 'rgba(255,255,255,0.52)',
            }}
          >
            {wrapData.lastGame.date}
          </span>

          <div
            className="w-1 h-1"
            style={{
              borderRadius: '999px',
              background: won
                ? 'rgba(253,185,39,0.55)'
                : 'rgba(239,83,80,0.55)',
            }}
          />

          <span
            className="text-[10px] md:text-xs lg:text-[13px]"
            style={{
              fontFamily: 'Graphik, sans-serif',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {wrapData.lastGame.location}
          </span>

        </div>
        )}

        {/* STICKERS */}
        {selectedStickers.length > 0 && (
          <div className="flex gap-2 md:gap-2.5 lg:gap-3 justify-center mb-3 md:mb-3.5 lg:mb-4">
            {selectedStickers.map((id) => (
              <div
                key={id}
                className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] lg:w-[70px] lg:h-[70px]"
                style={{
                  filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.5))',
                }}
              >
                {stickerAnimations[id] && (
                  <Lottie
                    animationData={stickerAnimations[id]}
                    loop={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* CAPTION */}
        {customCaption && (
          <p
            className="text-[10px] md:text-[11px] lg:text-xs mb-3 md:mb-4 lg:mb-[18px]"
            style={{
              color: 'rgba(255,255,255,0.68)',
              fontStyle: 'italic',
              fontFamily: 'Graphik, sans-serif',
              lineHeight: '16px',
              textAlign: 'center',
              maxWidth: '75%',
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
            className="h-[50px] md:h-[60px] lg:h-[70px]"
            style={{
              objectFit: 'contain',
              opacity: 0.5,
            }}
          />
        )}

      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes shineMove {
          0% {
            transform: translateX(-140%) skewX(-18deg);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          50% {
            transform: translateX(140%) skewX(-18deg);
            opacity: 1;
          }

          100% {
            transform: translateX(140%) skewX(-18deg);
            opacity: 0;
          }
        }

        
      `}</style>

    </div>
  )
}