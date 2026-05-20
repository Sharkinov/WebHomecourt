import FilterButton from './filterButton.tsx';

type FilterBoxProps = {
    filterTitle: string;
    filterOptions: string[];
    selectedOption: string;
    onSelect: (option: string) => void; // To change in Collection
};

function FilterBox(props: FilterBoxProps) {
    return (
        <div className="self-stretch pr-10 px-3 pt-3 py-3 bg-Background rounded-xl inline-flex flex-col justify-start items-start gap-1">
            {/* Title of rectangle */}
            <div className="text-black text-base leading-4 mb-2">{props.filterTitle}</div>

            {/* Displays options */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full">
                {props.filterOptions.map((option, index) => (
                    <FilterButton
                        key={index}
                        text={option}
                        selected={props.selectedOption === option}
                        onClick={() => props.onSelect(option)}
                    />
                ))}
            </div>
        </div>
    )
}

export default FilterBox