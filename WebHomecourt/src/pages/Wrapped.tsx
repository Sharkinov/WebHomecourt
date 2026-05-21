import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import Nav from '../components/Nav/Nav.tsx';
import BannerGeneral from '../components/BannerGeneral.tsx';
import { OnboardingSteps } from '../components/Wrapped/OnboardingStepsContainer.tsx';
import { PreviewContainer } from '../components/Wrapped/PreviewContainer.tsx';
import { PickWrapContainer } from '../components/Wrapped/PickWrapContainer.tsx';
import { CustomizeStyleContainer } from '../components/Wrapped/CustomizeStyleContainer.tsx';
import { useWrapBackgrounds } from '../hooks/Wrapped/useWrapBackgrounds.ts';
import { useLastGame } from '../hooks/Wrapped/useLastGame';
import { useMVPMoment } from '../hooks/Wrapped/useMVPMoment';
import { useTopStats } from '../hooks/Wrapped/useTopStats';

export function WrappedPage() {
  const { backgrounds, loading: backgroundsLoading } = useWrapBackgrounds()
  const { lastGame, loading: lastGameLoading, error: lastGameError } = useLastGame()
  const { mvp, loading: mvpLoading, error: mvpError } = useMVPMoment()
  const { topStats, loading: topStatsLoading, error: topStatsError } = useTopStats()

  const wrapRef = useRef<HTMLDivElement>(null!)
  const [isDownloading, setIsDownloading] = useState(false)

  const [selectedWrap, setSelectedWrap] = useState('last-game');
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState('purple');
  const [fontStyle, setFontStyle] = useState('bold');
  const [backgroundPattern, setBackgroundPattern] = useState('solid');
  const [textShadow, setTextShadow] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [droppedStickers, setDroppedStickers] = useState<Array<{id: string, src: string, x: number, y: number}>>([]);
  const [customCaption, setCustomCaption] = useState('');
  const [elements, setElements] = useState<Record<string, boolean>>({
    player: true,
    teamLogo: true,
    stadium: true,
    stats: true,
    icons: true,
    watermark: true,
  });

  const wrapData = {
    lastGame: {
      team1: lastGame?.lakersAbbr || 'LAL',
      team2: lastGame?.opponentAbbr || '---',
      opponentName: lastGame?.opponentName || '---',
      lakersName: lastGame?.lakersName || 'Los Angeles Lakers',
      score1: lastGame?.lakersScore?.toString() || '0',
      score2: lastGame?.opponentScore?.toString() || '0',
      date: lastGame?.date || '',
      location: lastGame?.venue || '',
      won: lastGame?.won ?? true,
      lakersLogoUrl: lastGame?.lakersLogoUrl || null,
      opponentLogoUrl: lastGame?.opponentLogoUrl || null,
    },
    mvp: {
      playerName: mvp?.playerName || '---',
      points: mvp?.points?.toString() || '0',
      assists: mvp?.assists?.toString() || '0',
      rebounds: mvp?.rebounds?.toString() || '0',
      photoUrl: mvp?.photoUrl || null,
    },
    topStats: topStats,
  };

  const colorSchemes = [
    { id: 'purple', label: 'Purple', bg: '#2D1B4E', accent: '#7E57D7', secondary: '#3B195C' },
    { id: 'red', label: 'Red', bg: '#4A0E0E', accent: '#EF5350', secondary: '#B71C1C' },
    { id: 'blue', label: 'Blue', bg: '#0A1929', accent: '#42A5F5', secondary: '#0D47A1' },
    { id: 'green', label: 'Green', bg: '#1B3A1F', accent: '#66BB6A', secondary: '#2E7D32' },
    { id: 'gold', label: 'Gold', bg: '#2A1F0A', accent: '#FDB927', secondary: '#C8961E' },
  ];

  const fonts = [
    { id: 'bold', label: 'Bold', style: { fontWeight: 'bold', fontFamily: 'Graphik, sans-serif' } },
    { id: 'script', label: 'Script', style: { fontFamily: 'cursive', fontStyle: 'italic' } },
    { id: 'retro', label: 'Retro', style: { fontFamily: 'monospace', letterSpacing: '0.02em' } },
  ];

  const currentScheme = colorSchemes.find(s => s.id === colorScheme) || colorSchemes[0];
  const currentFont = fonts.find(f => f.id === fontStyle) || fonts[0];

  const applyBackground = (backgroundId: string) => {
    setSelectedBackground(backgroundId)
  }

  const toggleSticker = (stickerId: string) => {
    setSelectedStickers(prev =>
      prev.includes(stickerId)
        ? prev.filter(id => id !== stickerId)
        : [...prev, stickerId]
    );
  };

  const toggleElement = (elementId: string) => {
    setElements(prev => ({ ...prev, [elementId]: !prev[elementId] }));
  };

  const randomizeStyles = () => {
    const randomScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    setColorScheme(randomScheme.id);

    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    setFontStyle(randomFont.id);

    setTextShadow(Math.random() > 0.5);

    if (backgrounds.length > 0) {
      const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
      setSelectedBackground(randomBg.wrap_backgrounds_id);
    }
  };

  const resetStyles = () => {
    setSelectedBackground(null);
    setColorScheme('purple');
    setFontStyle('bold');
    setBackgroundPattern('solid');
    setTextShadow(false);
    setSelectedStickers([]);
    setDroppedStickers([]);
    setCustomCaption('');
  };

  const downloadWrap = async () => {
    if (!wrapRef.current) return
    setIsDownloading(true)
    document.body.style.cursor = 'wait'

    try {
      const element = wrapRef.current
      const rect = element.getBoundingClientRect()
      const scaleToUse = 1080 / rect.width

      const canvas = await html2canvas(element, {
        scale: scaleToUse,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: rect.width,
        height: rect.height,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `lakers-wrap-${selectedWrap}-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        setIsDownloading(false)
        document.body.style.cursor = 'default'
      }, 'image/png')

    } catch (error) {
      console.error('Error downloading wrap:', error)
      setIsDownloading(false)
      document.body.style.cursor = 'default'
    }
  }

  const getBackgroundStyle = () => {
    const selected = backgrounds.find(b => b.wrap_backgrounds_id === selectedBackground)
    if (selected) {
      return {
        backgroundImage: `url(${selected.posterUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    if (backgroundPattern === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${currentScheme.bg} 0%, ${currentScheme.secondary} 100%)`,
      };
    } else if (backgroundPattern === 'dots') {
      return {
        backgroundColor: currentScheme.bg,
        backgroundImage: `radial-gradient(${currentScheme.secondary} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      };
    }
    return { backgroundColor: currentScheme.bg };
  };

  const textStyle = textShadow ? { textShadow: '2px 2px 8px rgba(0,0,0,0.8)' } : {};

  const isLoading = lastGameLoading || mvpLoading || topStatsLoading
  const hasError = lastGameError || mvpError || topStatsError

  return (
    <div className="min-h-screen bg-Background">
      <Nav current="Wrapped" />
      <div className="px-4 md:px-6 xl:px-14 py-5 bg-Background w-full">
        <div className="mb-8">
          <BannerGeneral
            title="Wrapped"
            subtitle="The game happened. Make it legendary."
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <p style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-oscuro)', fontSize: '18px' }}>
              Loading...
            </p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p style={{ fontFamily: 'Graphik, sans-serif', color: '#EF5350', fontSize: '18px', fontWeight: 600 }}>
              Error loading data
            </p>
            <div style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-morado-oscuro)', fontSize: '14px', maxWidth: '600px', textAlign: 'center' }}>
              {lastGameError && <p>Last Game: {lastGameError}</p>}
              {mvpError && <p>MVP Moment: {mvpError}</p>}
              {topStatsError && <p>Top Stats: {topStatsError}</p>}
            </div>
          </div>
        ) : (
          <>
        <OnboardingSteps />

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="w-full xl:w-[788px] flex-shrink-0">
           <PreviewContainer
            selectedWrap={selectedWrap}
            selectedStickers={selectedStickers}
            customCaption={customCaption}
            currentFont={currentFont}
            currentScheme={currentScheme}
            wrapData={wrapData}
            getBackgroundStyle={getBackgroundStyle}
            textStyle={textStyle}
            downloadWrap={downloadWrap}
            randomizeStyles={randomizeStyles}
            resetStyles={resetStyles}
            wrapRef={wrapRef}
            isDownloading={isDownloading}
            elements={elements}
            droppedStickers={droppedStickers}
            setDroppedStickers={setDroppedStickers}
          />
          </div>

          <div className="w-full xl:flex-1 xl:min-w-0 flex flex-col gap-6">
            <PickWrapContainer
              selectedWrap={selectedWrap}
              setSelectedWrap={setSelectedWrap}
            />
            <CustomizeStyleContainer
              backgrounds={backgrounds}
              backgroundsLoading={backgroundsLoading}
              selectedBackground={selectedBackground}
              applyBackground={applyBackground}
              setSelectedBackground={setSelectedBackground}
              setBackgroundPattern={setBackgroundPattern}
              selectedStickers={selectedStickers}
              toggleSticker={toggleSticker}
              fonts={fonts}
              fontStyle={fontStyle}
              setFontStyle={setFontStyle}
              customCaption={customCaption}
              setCustomCaption={setCustomCaption}
              colorSchemes={colorSchemes}
              colorScheme={colorScheme}
              setColorScheme={setColorScheme}
              elements={elements}
              toggleElement={toggleElement}
              selectedWrap={selectedWrap}
            />
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  );
}