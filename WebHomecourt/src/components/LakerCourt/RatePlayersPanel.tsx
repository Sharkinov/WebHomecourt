import { useState } from "react";
import RateCard from "./RateCard";
import Button from ".././button";
import RportPopUp from "./ReportPlayer";
import type { RatePlayer } from "../../services/apiRate";

interface RatePlayersPanelProps {
  players: RatePlayer[];
  onSubmit: () => void;
  submitDisabled: boolean;
  submittingRatings: boolean;
  onRatingChange: (playerId: string, rating: number) => void;
  title?: string;
  subtitle?: string;
  submitText?: string;
  eventId: number; 
}

export default function RatePlayersPanel({
  players,
  onSubmit,
  submitDisabled,
  submittingRatings,
  onRatingChange,
  title = "Rate Players' Sportsmanship",
  subtitle = "Las Riveras Park, court 2",
  submitText = "Submit rating",
  eventId,
}: RatePlayersPanelProps) {
  const [reportTarget, setReportTarget] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);

  const handleReport = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    setReportTarget({ playerId, playerName: player.playerName });
  };

  return (
    <>
      <section className="w-full max-w-313.75 mx-auto flex flex-col">
        <header className="bg-morado-oscuro rounded-t-[15px] p-4 flex flex-col gap-2.5">
          <h2 className="text-texto-claro text-[24px] leading-7 font-normal m-0 sm:text-[28px] sm:leading-7.75">
            {title}
          </h2>
          <p className="text-texto-claro text-[18px] leading-5 font-normal m-0 sm:text-[20px] sm:leading-5.5">
            {subtitle}
          </p>
        </header>

        <div className="bg-Background border border-black/8 rounded-b-[15px] px-4 py-5 sm:px-6 lg:px-12.5 flex flex-col gap-8 sm:gap-12.5">
          <div className="grid grid-cols-1 justify-items-center gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12.5">
            {players.map((player) => (
              <RateCard
                key={player.id}
                id={player.id}
                avatarUrl={player.avatarUrl}
                playerName={player.playerName}
                playerTag={player.playerTag}
                initialRating={player.initialRating}
                onReport={handleReport}
                onRatingChange={onRatingChange}
              />
            ))}
          </div>

          <Button
            type={submitDisabled ? "primarydisable" : "primary"}
            text={submittingRatings ? "Enviando calificaciones..." : submitText}
            onClick={submitDisabled ? () => {} : onSubmit}
            className={[
              "w-full min-h-12.5 rounded-[15px] px-4 py-0 text-[20px] leading-6 font-normal inline-flex items-center justify-center sm:px-0 sm:text-[24px] sm:leading-6.5",
              submitDisabled
                ? "bg-morado-lakers/50 outline-3 outline-morado-lakers/50 text-gris-disabled cursor-not-allowed pointer-events-none"
                : "text-texto-claro",
            ].join(" ")}
          />
        </div>
      </section>

      {reportTarget && (
        <RportPopUp
          eventId={eventId}
          reportedUserId={reportTarget.playerId}
          reportedUserName={reportTarget.playerName}
          onClose={() => setReportTarget(null)}
          onSuccess={() => setReportTarget(null)}
        />
      )}
    </>
  );
}
