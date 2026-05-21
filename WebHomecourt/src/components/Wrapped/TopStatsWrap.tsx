import watermarkImg from '../../assets/Wrapped/wrapped-watermark.png'

interface TopStatsWrapProps {
  wrapData: any;
  currentFont: { id: string; label: string; style: React.CSSProperties };
  textStyle: React.CSSProperties;
  elements: Record<string, boolean>;
  customCaption: string;
}

export function TopStatsWrap({
  wrapData,
  currentFont,
  textStyle,
  elements,
  customCaption,
}: TopStatsWrapProps) {
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

      {/* FRAME GLOW */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: `
            inset 0 0 70px rgba(120,0,255,0.08),
            inset 0 0 90px rgba(253,185,39,0.05),
            0 0 40px rgba(120,0,255,0.08)
          `,
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10 w-full px-5 flex flex-col items-center">

        {/* HEADER */}
        <div className="flex flex-col items-center mt-8 mb-7">

          <span
            style={{
              fontFamily: 'Graphik, sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              color: 'rgba(253,185,39,0.9)',
              letterSpacing: '0.22em',
              marginBottom: '10px',
            }}
          >
            TOP STATS
          </span>

          <div className="relative">

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
                  0 0 14px rgba(253,185,39,0.35),
                  0 4px 20px rgba(0,0,0,0.55)
                `,
              }}
            >
              GAME DAY
            </span>

          </div>

        </div>

        {/* STATS */}
        <div className="flex flex-col gap-4 w-full">

          {wrapData.topStats.map((stat: any, i: number) => {

            const isTeamScore = i === 0

            const parts = stat.value.split(' · ')
            const hasPlayer = parts.length === 2

            const playerName = hasPlayer ? parts[0] : null
            const statValue = hasPlayer ? parts[1] : parts[0]

            const valueParts = statValue.trim().split(' ')
            const numberValue = valueParts[0]
            const unitValue = valueParts.slice(1).join(' ')

            return (
              <div
                key={i}
                className="relative overflow-hidden rounded-[24px] grid grid-cols-[1fr_auto] items-center"
                style={{
                  padding: isTeamScore
                    ? '24px 24px'
                    : '18px 22px',

                  background: isTeamScore
                    ? `
                      linear-gradient(
                        135deg,
                        rgba(32, 8, 60, 0.72),
                        rgba(18, 5, 35, 0.78)
                      )
                    `
                    : `
                      linear-gradient(
                        135deg,
                        rgba(88, 45, 130, 0.48),
                        rgba(45, 18, 75, 0.58)
                      )
                    `,

                  backdropFilter: 'blur(8px)',

                  border: isTeamScore
                    ? '1.5px solid rgba(253,185,39,0.55)'
                    : '1px solid rgba(255,255,255,0.08)',

                  boxShadow: isTeamScore
                    ? `
                      0 0 30px rgba(253,185,39,0.18),
                      inset 0 1px 0 rgba(255,255,255,0.05)
                    `
                    : `
                      0 6px 20px rgba(0,0,0,0.22),
                      inset 0 1px 0 rgba(255,255,255,0.04)
                    `,
                }}
              >

                {/* GOLD LINE*/}
                {!isTeamScore && (
                  <div
                    className="absolute top-3 bottom-3"
                    style={{
                      left: '-3px',
                      width: '8px',
                      background: '#FDB927',
                      boxShadow: '0 0 12px rgba(253,185,39,0.45)',
                      borderRadius: '24px',
                    }}
                  />
                )}

                {/* LEFT */}
                <div className="flex items-center gap-4 pl-3 justify-self-start">

                  {/* ICON */}
                  {elements.icons !== false && (
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: isTeamScore ? 54 : 46,
                      height: isTeamScore ? 54 : 46,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: isTeamScore ? 24 : 20,
                        color: '#FDB927',
                      }}
                    >
                      {i === 0 ? 'rewarded_ads' : i === 1 ? 'star_rate' : i === 2 ? 'sports_basketball' : 'security'}
                    </span>
                  </div>
                  )}

                  {/* LABEL */}
                  <span
                    style={{
                      fontFamily: 'Graphik, sans-serif',
                      fontSize: isTeamScore ? '18px' : '17px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.72)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {stat.label}
                  </span>

                </div>

                {/* RIGHT */}
                <div className="text-right justify-self-end relative z-10">

                  <div className="flex items-baseline justify-end gap-1">

                    {/* NUMBER */}
                    <span
                      style={{
                        fontFamily: 'Graphik, sans-serif',
                        fontSize: isTeamScore ? '58px' : '40px',
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: '-0.05em',

                        color: isTeamScore
                          ? '#FDB927'
                          : 'white',

                        textShadow: isTeamScore
                          ? '0 0 18px rgba(253,185,39,0.25)'
                          : 'none',

                        ...currentFont.style,
                        ...textStyle,
                      }}
                    >
                      {numberValue}
                    </span>

                    {/* UNIT */}
                    {unitValue && (
                      <span
                        style={{
                          fontFamily: 'Graphik, sans-serif',
                          fontSize: isTeamScore ? '28px' : '20px',
                          fontWeight: 800,
                          color: isTeamScore
                            ? '#FDB927'
                            : 'rgba(255,255,255,0.75)',
                        }}
                      >
                        {unitValue}
                      </span>
                    )}

                  </div>

                  {/* PLAYER */}
                  {playerName && (
                    <div
                      style={{
                        fontFamily: 'Graphik, sans-serif',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'rgba(180,150,255,0.72)',
                        letterSpacing: '0.08em',
                        marginTop: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {playerName}
                    </div>
                  )}

                </div>

              </div>
            )
          })}
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
              marginTop: '24px',
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
              marginTop: customCaption ? '0' : '24px',
            }}
          />
        )}

      </div>

    </div>
  )
}
