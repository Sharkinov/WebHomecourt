import React from 'react'; 

// Prop for button
interface IconButtonProp {
    type?: 'primary' | 'secondary' | 'tertiary' | 'primarydisable' | 'yellow'; //| 'secondarydisable' | 'tertiarydisable'; // Add more if needed, will be string recieving type 
    leftIcon?: React.ReactNode; //Icon that is recieved
    leftMaterial?: string; // For material icon compatibility
    text: string; // What is shown in frontend
    rightIcon?: React.ReactNode; //Icon that is recieved
    onClick: () => void; // Function default does nothing
    className?: string // Lets add custom css o tailwind to button por si algn va a hacer algo más específico
}

// Record sirve para poder alt el style and kinda "inject it" depending on the var recieved
const typeStyles: Record<string, string> = {
    primary: "bg-morado-lakers text-white flex items-center justify-center gap-2.5 outline-3 outline-morado-lakers hover:bg-morado-bajo hover:outline-morado-bajo selected:bg-morado-oscuro",
    secondary: "bg-transparent text-morado-lakers flex items-center justify-center gap-2.5 outline-3 outline-morado-lakers hover:text-morado-bajo hover:outline-morado-bajo selected:text-morado-oscuro selected:outline-morado-oscuro",
    tertiary: "bg-transparent text-morado-lakers flex items-center justify-center gap-2.5 underline hover:text-morado-bajo selected:text-morado-oscuro",
    primarydisable: "bg-disabled text-gray-100 flex items-center justify-center gap-2.5 outline-3 outline-disabled",
    yellow: "bg-amarillo-lakers text-black flex items-center justify-center gap-2.5"
};

function IconButton({
    type = 'primary',
    leftIcon,
    leftMaterial,
    text,
    rightIcon,
    onClick = () => { }, // Backup default to do nothing
    className
}: IconButtonProp) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-5 text-center rounded-2xl ${typeStyles[type]} ${className}`}>
            {/* Will check first if there is left or right icon defined to show that img, and then the text itself if there is any and other icon if necessary*/}
            {leftIcon}
            <span className="material-symbols-outlined text-[20px] leading-none">{leftMaterial}</span>
            <span>{text}</span>
            {rightIcon}
        </button>
    )
}

export default IconButton;