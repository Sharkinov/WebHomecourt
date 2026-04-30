interface ProfileButtonProp {
    type?: 'primary' | 'secondary' | 'tertiary' | 'primarydisable' | 'reddestructive';
    text: string;
    onClick: () => void;
    className?: string;
}
const typeStyles: Record<string, string> = {
    primary: "bg-morado-lakers text-white outline-3 outline-morado-lakers hover:bg-morado-bajo hover:outline-morado-bajo selected:bg-morado-oscuro",
    secondary: "bg-transparent text-morado-lakers outline-3 outline-morado-lakers hover:text-morado-bajo hover:outline-morado-bajo selected:text-morado-oscuro selected:outline-morado-oscuro",
    tertiary: "bg-transparent text-morado-lakers underline hover:text-morado-bajo selected:text-morado-oscuro",
    primarydisable: "bg-disabled text-gray-100 outline-3 outline-disabled",
    reddestructive: "bg-rojo-claro text-white outline-3 outline-rojo-claro hover:bg-rojo-oscuro hover:outline-rojo-oscuro selected:bg-rojo-oscuro"
};

function ProfileButton({
    type = 'primary',
    text,
    onClick = () => {},
    className
}: ProfileButtonProp) {
    return (
        <button
        onClick={onClick}
        className={`flex justify-center items-center rounded-[15px] ${typeStyles[type]} ${className}`}
        style={{
            padding: '13.997px 31.2px 15.545px 31.997px'
        }}>
            {text}
        </button>
    )
}

export default ProfileButton;
