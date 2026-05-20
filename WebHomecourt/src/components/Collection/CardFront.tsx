import { format, parseISO } from 'date-fns'; // For date formattings 
import type { CollectionCard } from '../../hooks/Collection/collectionTypes.tsx';
import RarityLabelCircle from './RarityLabelCircle.tsx';

type CardProp = {
    card: CollectionCard;
}

// Record sirve para poder alt el style and kinda "inject it" depending on the var recieved
const triangleColorClasses: Record<string, string> = {
    Common: "border-l-royal-blue",
    Rare: "border-l-morado-lakers",
    Legendary: "border-l-amarillo-lakers",
    Limited: "border-l-light-blue"
};

function CardFront({ card }: CardProp) {
    return (
        <div className="w-60 h-96 px-4 py-3 bg-white rounded-2xl shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] shadow-lg outline outline-[0.80px] outline-offset-[-0.80px] outline-gray-100 inline-flex flex-col justify-between items-center animate-[pulse_0.75s_ease-in-out_2]">
            {/* Image w player and counter */}
            <div className="h-52 w-48 flex flex-col relative mt-1.5 justify-center items-center">
                {/* Circle with repeated ownership count */}
                {card.times_unlocked > 1 && <div className="absolute top-0 right-0 z-10 translate-x-1/4 -translate-y-1/5 w-16 h-7 bg-morado-fosfo rounded-full text-xl text-center text-white">{card.times_unlocked}x</div>}

                {/* Image and triangle framing it */}
                <div className="h-48 w-44 flex flex-col justify-center items-center gap-2.5 overflow-hidden mt-1 text-white text-8xl font-bold relative">
                    <img src={card.web_url} className="w-full h-full z-0 object-cover" alt="Card image" />

                    {/* Triangle holder */}
                    <div className={`absolute bottom-0 left-0 w-0 h-0 z-10 border-l-[3rem] border-t-[5.5rem] border-t-transparent ${triangleColorClasses[card.rarity_label] || "border-l-transparent"}`}
                    ></div>
                </div>
            </div>

            {/* Card info */}
            <div className="font-semibold text-xl text-center mt-1.5 mb-1">{card.player_name}</div>

            {/* See if I can align to bottom */}
            <div className="flex flex-col justify-center items-center text-center">
                {/* Apparently need to mega expand what the label is represented as but okay */}
                <RarityLabelCircle
                    type={card.rarity_label as 'Common' | 'Rare' | 'Legendary' | 'Limited' | 'locked'}
                    labelText={card.rarity_label}
                />
                <p className="mt-1.5">Pack: {card.pack_name}</p>
                <div className="text-sm mt-0.5">Unlocked: {format(parseISO(card.first_unlock), "MMM dd, yyyy")}</div>
            </div>
        </div>
    )
}

export default CardFront