import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer, } from "recharts";

type GameStatsProp = {
    icon: string;
    category: string;
    cardStat: number;
    maxStat: number
}

function CardGameStats(props: GameStatsProp) {
    const graphData = [{ power: props.cardStat, remainder: props.maxStat - props.cardStat }];

    return (
        <div className="w-full py-2">
            <div className="flex flex-row justify-start">
                <span className="material-symbols-outlined text-[20px] leading-none">{props.icon}</span>
                <p className="pl-2">{props.category}</p>
            </div>

            <ResponsiveContainer width="100%" height={24}>
                <BarChart
                    layout="vertical"
                    data={graphData}
                    stackOffset="expand"
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                    <XAxis type="number" hide />
                    <YAxis type="category" hide />
                    <Bar
                        dataKey="power"
                        stackId="a"
                        className="fill-purple-900"
                        radius={[16, 0, 0, 16]}
                    >
                        <LabelList
                            valueAccessor={() => props.cardStat}
                            position="insideLeft"
                            offset={20}
                            className="fill-white text-[10px] md:text-sm font-medium"
                        />
                    </Bar>
                    <Bar
                        dataKey="remainder"
                        stackId="a"
                        className="fill-neutral-400"
                        radius={[0, 16, 16, 0]}
                    >
                        <LabelList
                            valueAccessor={() => props.maxStat}
                            position="insideRight"
                            offset={20}
                            className="fill-purple-900 text-[10px] md:text-sm font-medium"
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

        </div>
    )
}

export default CardGameStats