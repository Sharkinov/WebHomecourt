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
  eventId: number; // necesario para el reporte
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
          <h2 className="text-[#F3F2F3] text-[28px] leading-7.75 font-normal m-0">
            {title}
          </h2>
          <p className="text-[#F3F2F3] text-[20px] leading-5.5 font-normal m-0">
            {subtitle}
          </p>
        </header>

        <div className="bg-[#FDFDFD] border border-black/8 rounded-b-[15px] px-12.5 py-5 flex flex-col gap-12.5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12.5 items-center justify-center">
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
              "w-full h-12.5 rounded-[15px] px-0 py-0 text-[24px] leading-6.5 font-normal inline-flex items-center justify-center",
              submitDisabled
                ? "bg-morado-lakers/50 outline-3 outline-morado-lakers/50 text-[#A09CA4] cursor-not-allowed pointer-events-none"
                : "text-[#F3F2F3]",
            ].join(" ")}
          />
        </div>
      </section>

      {/* Modal de reporte — se monta solo cuando hay un target */}
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