// Prop for rarity circle
interface RarityProp {
    type: 'Common' | 'Rare' | 'Legendary' | 'Limited' | 'locked' ; 
    labelText: string; // What is shown in frontend
}

// Record sirve para poder alt el style and kinda "inject it" depending on the var recieved
const typeStyles: Record<string, string> = {
    Common: "bg-royal-blue", 
    Rare: "bg-morado-lakers",
    Legendary: "bg-amarillo-lakers",
    Limited: "bg-light-blue",
    locked: "bg-Gris-Oscuro"
};

function RarityLabelCircle({
    type = 'Common',
    labelText,
}: RarityProp) {
    return (
        <div className={`w-32 py-1 text-center rounded-full ${typeStyles[type]} text-base text-white`}>
            {labelText}
        </div>
    )
}

export default RarityLabelCircle;