import type { DisplayCard } from '../../hooks/Collection/collectionTypes.tsx';
import RarityLabelCircle from './RarityLabelCircle.tsx';
import CardGameStats from './CardGameStats.tsx';

type CardProp = {
    card: DisplayCard;
}

function CardBack({ card }: CardProp) {
    return (
        <div className="w-full h-full px-4 py-3 bg-white rounded-2xl shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] shadow-lg outline outline-[0.80px] outline-offset-[-0.80px] outline-gray-100 flex flex-col justify-start items-center">
            {/* Name of card */}
            <div className="font-semibold text-base md:text-xl text-center mt-4 md:mt-5 mb-1 md:mb-2 min-h-[3rem] md:min-h-[3.5rem]">{card.player_name}</div>
            <RarityLabelCircle
                type={card.rarity_label as 'Common' | 'Rare' | 'Legendary' | 'Limited' | 'locked'}
                labelText={card.rarity_label}
            />

            {/* Stats */} 
            <div className="mt-2 md:mt-6"></div>
            <CardGameStats icon="swords" category="Attack" cardStat={card.attack} maxStat={100} />
            <CardGameStats icon="favorite" category="Defense" cardStat={card.defense} maxStat={100} />
            <CardGameStats icon="bolt_boost" category="Velocity" cardStat={card.velocity} maxStat={5} />
        </div>
    )
}

export default CardBack