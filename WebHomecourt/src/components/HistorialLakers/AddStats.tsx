import { useState } from 'react'
import { saveUserEventStats } from '../../services/apiUser.ts'
import StatusAlert from '../Messages/StatusAlert'
import type { UserMatchHistoryRow } from '../../services/apiUser.ts'

interface AddStatsProps {
    row: UserMatchHistoryRow
    onClose: () => void
    onSaved: () => void
}

interface FormState {
    userScore: string
    opponentScore: string
    points: string
    rebounds: string
    assists: string
    steals: string
    blocks: string
    fgMade: string
    fgAttempts: string
    threeMade: string
    threeAttempts: string
}



const toNum = (val: string): number => {
    const n = parseInt(val, 10)
    return Number.isFinite(n) ? n : 0
}

const toNumOrNull = (val: string): number | null => {
    const n = parseInt(val, 10)
    return Number.isFinite(n) ? n : null
}

function NumericInput({
    label,
    value,
    onChange,
    required,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    required?: boolean
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-texto-oscuro">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 w-full rounded-[10px] border border-[#E7E6E8] bg-[#F5F5F7] px-4 text-[14px] text-texto-oscuro outline-none transition-colors focus:border-morado-lakers focus:bg-white"
                placeholder="0"
            />
        </div>
    )
}

function AddStats({ row, onClose, onSaved }: AddStatsProps) {
    const [form, setForm] = useState<FormState>({
        userScore: row.user_score?.toString() ?? '',
        opponentScore: row.opponent_score?.toString() ?? '',
        points: row.points?.toString() ?? '',
        rebounds: row.rebounds?.toString() ?? '',
        assists: row.assists?.toString() ?? '',
        steals: row.steals?.toString() ?? '',
        blocks: row.blocks?.toString() ?? '',
        fgMade: row.field_goals?.toString() ?? '',
        fgAttempts: row.field_goals_attempts?.toString() ?? '',
        threeMade: row.tre_pointer?.toString() ?? '',
        threeAttempts: row.tre_pointer_atemp?.toString() ?? '',
    })
    const [shootingOpen, setShootingOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{
        tone: 'success' | 'error' | 'warning' | 'info'
        title: string
        message?: string
    } | null>(null)

    const set = (key: keyof FormState) => (val: string) =>
        setForm((prev) => ({ ...prev, [key]: val }))

    // Resultado derivado del score
    const userScoreNum = toNum(form.userScore)
    const oppScoreNum = toNum(form.opponentScore)
    const scoresEntered = form.userScore !== '' && form.opponentScore !== ''
    const derivedResult: boolean | null = scoresEntered
        ? userScoreNum > oppScoreNum
        : null
    const resultLabel =
        derivedResult === true ? 'Win' : derivedResult === false ? 'Loss' : null
    const resultColor =
        derivedResult === true ? 'text-green-600' : 'text-red-500'

    // Auto-fill puntos desde shooting splits
    const AutoPuntos = () => {
        const points = toNum(form.fgMade) * 2 + toNum(form.threeMade) * 3
        setForm((prev) => ({ ...prev, points: String(points) }))
    }

    const canAutoFill =
        form.fgMade !== '' || form.threeMade !== ''

    const Save = async () => {
        if (!form.userScore || !form.opponentScore) {
            setStatus({ tone: 'error', title: 'Error', message: 'Your team score and the opponent score are required.' })
            return
        }
        if (!form.points || !form.rebounds || !form.assists) {
            setStatus({ tone: 'error', title: 'Error', message: 'Points, rebounds and assists are required.' })
            return
        }
        if (derivedResult === null) {
            setStatus({ tone: 'error', title: 'Error', message: 'Enter the scores to determine the result.' })
            return
        }

        setSaving(true)
        setStatus(null)

        const { success, error: saveError } = await saveUserEventStats({
            user_event_id: row.user_event_id,
            user_score: userScoreNum,
            opponent_score: oppScoreNum,
            result: derivedResult,
            points: toNum(form.points),
            rebounds: toNum(form.rebounds),
            assists: toNum(form.assists),
            steals: toNumOrNull(form.steals),
            blocks: toNumOrNull(form.blocks),
            field_goals: toNumOrNull(form.fgMade),
            field_goals_attempts: toNumOrNull(form.fgAttempts),
            tre_pointer: toNumOrNull(form.threeMade),
            tre_pointer_atemp: toNumOrNull(form.threeAttempts),
        })

        setSaving(false)

        if (!success) {
            setStatus({ tone: 'error', title: 'Error', message: saveError ?? 'Error saving. Please try again.' })
            return
        }

        setStatus({
            tone: 'success',
            title: 'Saved',
            message: 'Your stats were saved successfully. The page will reload.'
        })
        setTimeout(() => {
            onSaved()
        }, 1200)
    }

    const formattedDate = row.event_date
        ? new Date(row.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        : ''

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-145 overflow-hidden rounded-[20px] bg-white shadow-2xl">

                {/* Header morado */}
                <div className="relative bg-morado-lakers px-6 py-5">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                    <h2 className="text-[22px] font-bold text-white">
                        {row.points !== null ? 'Edit my stats' : 'Add my stats'}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-white/70">
                        {row.event_name}
                        {row.court_name ? ` · vs ${row.court_name}` : ''}
                        {formattedDate ? ` · ${formattedDate}` : ''}
                    </p>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">

                    {/* Status alert (success / info / error) */}
                    {status && (
                        <div className="mb-4">
                            <StatusAlert tone={status.tone} title={status.title} message={status.message} />
                        </div>
                    )}

                    {/* Final Score */}
                    <div className="mb-5 rounded-[14px] border border-[#E7E6E8] p-4">
                        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-Gris-Oscuro">
                            Final score
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="mb-1.5 text-[12px] text-Gris-Oscuro">Your Team</p>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.userScore}
                                    onChange={(e) => set('userScore')(e.target.value)}
                                    className="h-11 w-full rounded-[10px] border border-[#E7E6E8] bg-[#F5F5F7] px-4 text-[14px] text-texto-oscuro outline-none transition-colors focus:border-morado-lakers focus:bg-white"
                                    placeholder="0"
                                />
                            </div>
                            <span className="mt-5 text-[18px] font-bold text-Gris-Oscuro">—</span>
                            <div className="flex-1">
                                <p className="mb-1.5 text-[12px] text-Gris-Oscuro">Opposing team</p>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.opponentScore}
                                    onChange={(e) => set('opponentScore')(e.target.value)}
                                    className="h-11 w-full rounded-[10px] border border-[#E7E6E8] bg-[#F5F5F7] px-4 text-[14px] text-texto-oscuro outline-none transition-colors focus:border-morado-lakers focus:bg-white"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        {scoresEntered && (
                            <p className="mt-2.5 text-[13px] text-Gris-Oscuro">
                                Result:{' '}
                                <span className={`font-semibold ${resultColor}`}>{resultLabel}</span>
                            </p>
                        )}
                    </div>

                    {/* Stats grid */}
                    <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-4">
                        <NumericInput label="Points" value={form.points} onChange={set('points')} required />
                        <NumericInput label="Rebounds" value={form.rebounds} onChange={set('rebounds')} required />
                        <NumericInput label="Assists" value={form.assists} onChange={set('assists')} required />
                        <NumericInput label="Steals" value={form.steals} onChange={set('steals')} />
                        <NumericInput label="Blocks" value={form.blocks} onChange={set('blocks')} />
                    </div>

                    {/* Shooting splits colapsable */}
                    <div className="rounded-[14px] border border-[#E7E6E8]">
                        <button
                            onClick={() => setShootingOpen((o) => !o)}
                            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                        >
                            <span className="text-[14px] font-medium text-morado-lakers">
                                Shooting splits (optional)
                            </span>
                            <span className="material-symbols-outlined text-[18px] text-morado-lakers transition-transform duration-200"
                                style={{ transform: shootingOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            >
                                keyboard_arrow_down
                            </span>
                        </button>

                        {shootingOpen && (
                            <div className="border-t border-[#E7E6E8] px-4 pb-4 pt-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <NumericInput label="FG Made" value={form.fgMade} onChange={set('fgMade')} />
                                    <NumericInput label="FG Attempts" value={form.fgAttempts} onChange={set('fgAttempts')} />
                                    <NumericInput label="3P Made" value={form.threeMade} onChange={set('threeMade')} />
                                    <NumericInput label="3P Attempts" value={form.threeAttempts} onChange={set('threeAttempts')} />
                                </div>

                                {canAutoFill && (
                                    <button
                                        onClick={AutoPuntos}
                                        className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-morado-lakers px-4 text-[13px] font-medium text-white transition-colors hover:bg-morado-lakers/90"
                                    >
                                        <span className="material-symbols-outlined text-[15px] leading-none">auto_fix_high</span>
                                        Auto-fill points from shooting
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error handled via StatusAlert above */}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-[#E7E6E8] px-6 py-4">
                    <button
                        onClick={onClose}
                        className="h-10 rounded-[10px] px-5 text-[14px] font-medium text-Gris-Oscuro transition-colors hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={Save}
                        disabled={saving}
                        className="h-10 rounded-[10px] bg-morado-lakers px-6 text-[14px] font-medium text-white transition-colors hover:bg-morado-lakers/90 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : 'Save stats'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddStats