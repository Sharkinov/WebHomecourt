import type { UserMatchHistorySummary, UserWinStreakSummary } from '../../services/apiUser.ts';
import type { StatCardProps } from './Stast.tsx';
import RecordCard from './Stast.tsx';

interface StatsContainerProps {
  summary: UserMatchHistorySummary | null;
  streak: UserWinStreakSummary | null;
  className?: string;
}

function StatsContainer({ summary, streak, className }: StatsContainerProps) {
  const wins = summary?.wins ?? 0;
  const losses = summary?.losses ?? 0;
  const totalMatches = summary?.totalMatches ?? 0;
  const pending = summary?.pending ?? 0;
  const ppg = summary?.ppg ?? 0;
  const rpg = summary?.rpg ?? 0;
  const apg = summary?.apg ?? 0;
  const fgPct = summary?.fgPct ?? 0;
  const threePct = summary?.threePct ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;
  const maxStreak = streak?.maxStreak ?? 0;

  const cards: StatCardProps[] = [
    {
      title: 'PPG',
      subtitle: 'Points per game',
      primaryValue: ppg,
      centerLabel: ppg.toFixed(1),
      secondaryColor: 'var(--color-amarillo-lakers)',
    },
    {
      title: 'RPG',
      subtitle: 'Rebounds per game',
      primaryValue: rpg,
      centerLabel: rpg.toFixed(1),
    },
    {
      title: 'APG',
      subtitle: 'Assists per game',
      primaryValue: apg,
      centerLabel: apg.toFixed(1),
      secondaryColor: 'var(--color-amarillo-lakers)',
    },
    {
      title: 'Record',
      subtitle: `${totalMatches} games played`,
      primaryValue: wins,
      secondaryValue: losses,
      primaryLabel: 'Win',
      secondaryLabel: 'Lose',
    },
    {
      title: 'FG%',
      subtitle: 'Field Goals',
      primaryValue: fgPct,
      total: 100,
      centerLabel: `${fgPct.toFixed(1)}%`,
    },
    {
      title: '3P%',
      subtitle: 'Three-Pointers',
      primaryValue: threePct,
      total: 100,
      centerLabel: `${threePct.toFixed(1)}%`,
      secondaryColor: 'var(--color-amarillo-lakers)',
    },
    {
      title: 'Streak Win',
      subtitle: `Max Win Streak: ${maxStreak}`,
      primaryValue: maxStreak,
      secondaryValue: currentStreak,
      primaryLabel: 'Max',
      secondaryLabel: 'Current',
      centerLabel: `${currentStreak}-${maxStreak}`,
    },
    {
      title: 'Pending',
      subtitle: 'Stats to log',
      primaryValue: pending,
      centerLabel: pending,
    },
  ];

  return (
    <section className={`w-full ${className ?? ''}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <RecordCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}

export default StatsContainer;
