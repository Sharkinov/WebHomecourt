import type { CollectionCard } from '../../hooks/Collection/collectionTypes.tsx';
import RarityLabelCircle from './RarityLabelCircle.tsx';

type CardProp = {
    card: CollectionCard;
}

function LockedCardFront({ card }: CardProp) {
    return (
        <div className="w-60 h-96 px-4 py-3 bg-gris-disabled rounded-2xl shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] shadow-lg outline outline-[0.80px] outline-offset-[-0.80px] outline-gray-100 inline-flex flex-col justify-between items-center">
            {/* Question mark */}
            <div className="h-52 w-44 pl-2.5 bg-Gris-Oscuro flex flex-col justify-center items-center gap-2.5 overflow-hidden mt-4 text-white text-8xl font-bold">
                ?
            </div>
            {/* Card info */}
            <div className="font-semibold text-xl text-center mt-1.5 mb-1">{card.player_name}</div>

            {/* See if I can align to bottom */}
            <div className="text-center">
                <RarityLabelCircle type="locked" labelText={card.rarity_label} />
                <p className="mt-1.5">Pack ?</p>
                <div className="text-sm mt-0.5">Not unlocked yet</div>
            </div>

        </div>

    )
}

export default LockedCardFront