type FilterButtonProps = {
    text: string;
    selected: boolean;
    onClick: () => void;
}

function FilterButton(props: FilterButtonProps) {
    return (
        <button
            onClick={props.onClick}
            className={props.selected ? "px-4 py-2 rounded-xl text-white bg-morado-lakers" : "px-4 py-2 rounded-xl text-white bg-Gris-Oscuro"}
        >
            {props.text}
        </button>
    )
}

export default FilterButton