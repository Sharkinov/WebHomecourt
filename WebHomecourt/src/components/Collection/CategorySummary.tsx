type SummaryProp = {
    category: string,
    unlocked: number,
    total: number,
    outline: string, // Tailwind color to inject if user has completed the collection
};

function CategorySummary( props: SummaryProp) {
    let injectVictoryOutline = '';
    let progress = 0; // Default none unlocked

    // Calculate percentage 
    if (props.unlocked == props.total) {
        // Only case where it can be 100% and can inject the outline color 
        progress = 100; 
        injectVictoryOutline = props.outline;
    } else if (props.total != 0) {
        // Only calculate percentage if total is not out of 0 
        progress = Math.round((props.unlocked / props.total) * 100);
    } 

    return (
        <div className={`w-50 md:w-72 px-3.5 py-4 bg-white rounded-2xl inline-flex flex-col justify-center items-start gap-4 ${injectVictoryOutline}`}>
            <h3>{props.category}</h3>
            <div className="text-4xl font-semibold">{props.unlocked}/{props.total}</div>
            <div className="text-gris-disabled">{progress}% unlocked</div>
        </div>
    )
}

export default CategorySummary