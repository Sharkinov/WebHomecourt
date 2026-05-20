import type { Player } from "./Player";
export default function CircleStats({ label, p1, p2, v1,  v2, max }: { label: string; p1: Player|null, p2: Player|null, v1: number | null; v2: number | null; max: number }) {
    const pct1 = v1 != null ? (v1 / max) : 0;
    const pct2 = v2 != null ? Math.min((v2 / max) ) : 0;
    const r = 30, c = 35, circ = 2 * Math.PI * r;

    return (
        <div className="py-2 flex flex-col items-center rounded-2xl bg-white border border-gray-300 rounded-2xl shadow">
            <span className="text-s">{label}</span>
            <div className="relative">
                <svg width="100" height="100" viewBox="0 0 72 72">
                <circle cx={c} cy={c} r={r} className="fill-none stroke-morado-lakers stroke-[5]"
                    strokeDasharray={`${(pct1) * circ} ${circ}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${c} ${c})`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
                <circle cx={c} cy={c} r={r*0.80} className="fill-none stroke-amarillo-lakers stroke-[5]"
                    strokeDasharray={`${(pct2) * circ} ${circ}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${c} ${c})`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gris-disabled">MAX</span>
                    <span className="text-sm font-bold text-gris-disabled"> {max} </span>
                </div>

            </div>
            <div className="flex flex-col px-5 py-1">
                <div> {p1 != null ? 
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-morado-lakers"></div>
                        <div className="flex-1 text-xs">{p1 != null ? p1.last_name : ''}</div>
                        <div className="text-xs">{v1 != null ? v1 : "—"}</div>
                    </div> : <div></div>}
                </div>
                <div> {p2 != null ? 
                    <div className="flex items-center gap-2">  
                        <div className="w-3 h-3 object-cover rounded-full bg-amarillo-lakers"></div>
                        <div className="flex-1 text-xs">{p2 != null ? p2.first_name : ''}</div>
                        <div className="text-xs">{v2 != null ? v2 : ""}</div>
                    </div> : <div></div>}
                </div>
            </div>
        </div>
    );
}
