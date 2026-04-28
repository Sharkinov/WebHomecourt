// Prop for button
interface ButtonProp {
    type?: 'primary' | 'secondary' | 'tertiary' | 'primarydisable'; //| 'secondarydisable' | 'tertiarydisable'; // Add more if needed, will be string recieving type 
    text: string; // What is shown in frontend
    onClick: () => void; // Function default does nothing
    className?: string // Lets add custom css o tailwind to button por si algn va a hacer algo más específico
}

// Record sirve para poder alt el style and kinda "inject it" depending on the var recieved
const typeStyles: Record<string, string> = {
    primary: "bg-morado-lakers text-white outline-3 outline-morado-lakers hover:bg-morado-bajo hover:outline-morado-bajo selected:bg-morado-oscuro",
    secondary: "bg-transparent text-morado-lakers outline-3 outline-morado-lakers hover:text-morado-bajo hover:outline-morado-bajo selected:text-morado-oscuro selected:outline-morado-oscuro",
    tertiary: "bg-transparent text-morado-lakers underline hover:text-morado-bajo selected:text-morado-oscuro",
    primarydisable: "bg-disabled text-gray-100 outline-3 outline-disabled"
};

function Button({
    type = 'primary',
    text,
    onClick = () => {}, // Backup default to do nothing
    className
}: ButtonProp) {
    return (
        <button
        onClick={onClick}
        className={`px-3 py-5 text-center rounded-2xl ${typeStyles[type]} ${className}`}>
            {text}
        </button>
    )
}

export default Button;