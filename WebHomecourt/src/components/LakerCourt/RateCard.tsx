import { useState } from "react";

interface RateCardProps {
  id: string;
  avatarUrl: string;
  playerName: string;
  playerTag: string;
  initialRating?: number;
  onReport: (playerId: string, playerName: string) => void;
  onRatingChange?: (playerId: string, rating: number) => void;
}

export default function RateCard({
  id,
  avatarUrl,
  playerName,
  playerTag,
  initialRating = 0,
  onReport,
  onRatingChange,
}: RateCardProps) {
  const [rating, setRating] = useState(initialRating);
  const stars = [1, 2, 3, 4, 5] as const;

  const handleRatingChange = (starValue: number) => {
    setRating(starValue);
    onRatingChange?.(id, starValue);
  };

  return (
    <div className="w-88 h-48 p-2.5 flex flex-col items-start gap-5 bg-[#E7E6E8] border border-black/24 rounded-[15px]">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 border-2 border-[#E7E6E8] rounded-full p-0.5 box-border">
          <img
            src={avatarUrl}
            alt={playerName}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[24px] leading-6.5 font-normal text-[#000000] m-0">{playerName}</h3>
          <p className="text-[18px] leading-5 font-normal text-[#000000] m-0">{playerTag}</p>
        </div>
      </div>

      <div className="flex gap-3.75 justify-center items-center w-full">
        {stars.map((starValue) => (
          <button
            key={starValue}
            className={`w-6 h-6 text-2xl leading-none flex items-center justify-center transition-all duration-200 ${
              starValue <= rating ? "text-amarillo-lakers" : "text-[#A09CA4]"
            } cursor-pointer bg-transparent border-none p-0`}
            onClick={() => handleRatingChange(starValue)}
            aria-label={`Calificar ${starValue} de 5 estrellas`}
          >
            <span className="material-symbols-outlined text-[32px]">star_rate</span>
          </button>
        ))}
      </div>

      <button
        className="w-83 h-11 flex justify-center items-center py-3 px-5 gap-2.5 bg-transparent border-[3px] border-morado-lakers opacity-50 rounded-[15px] transition-all hover:bg-morado-lakers/10 hover:opacity-100"
        onClick={() => onReport(id, playerName)}
        aria-label={`Reportar a ${playerName}`}
      >
        <span className="text-morado-lakers text-[18px] leading-5 font-normal">Report</span>
      </button>
    </div>
  );
}
