import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface WarningPopupProps {
  user?: { name: string, photo_url: string }
  target?: string
  onConfirm: (warnTypeId: number, customMessage: string | null) => void
  onCancel: () => void
  scope?: 'user' | 'event'
}

const WarningPopup = ({ user, target, onConfirm, onCancel, scope = 'user' }: WarningPopupProps) => {
  const [selected, setSelected] = useState<number | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [warnTypes, setWarnTypes] = useState<{ warn_type_id: number, warn_type: string }[]>([])

  useEffect(() => {
    const fetchWarnTypes = async () => {
      const { data, error } = await supabase
        .from('warn_type')
        .select('warn_type_id, warn_type')
        .eq('scope_id', scope === 'user' ? 1 : 2)

      if (!error && data) {
        setWarnTypes(data)
      }
    }

    fetchWarnTypes()
  }, [scope])

  const selectedType = warnTypes.find(w => w.warn_type_id === selected)
  const isOtherSelected = selectedType?.warn_type === 'Other'

  const handleConfirm = () => {
    if (!selected) return
    onConfirm(selected, isOtherSelected ? customMessage : null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[500px] overflow-hidden shadow-xl">

        {/* Header */}
        <div className="bg-violet-950 px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-full p-1 flex items-center justify-center bg-amarillo-warn">
              <span className="material-symbols-outlined text-amarillo-oscuro" style={{ fontSize: '20px'}}>exclamation</span>
            </div>
            <p className="text-white font-semibold">Warn {target}</p>
          </div>
          <button onClick={onCancel} className="text-white">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-7 py-7">
          <h2 className="text-center pt-1">Send a warning to this user?</h2>

          {user && (
            <div className="flex flex-col items-center gap-2 my-3">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {user.photo_url && <img src={user.photo_url} className="w-full h-full object-cover" />}
              </div>
              <p className="text-sm">@{user.name}</p>
            </div>
          )}

          {/* Info box */}
          <div className="rounded-lg px-4 py-3 flex gap-2 items-start border mb-5 bg-amarillo-warn/25 border-amarillo-warn">
            <span className="material-symbols-outlined mt-0.5 text-amarillo-lakers" style={{ fontSize: '16px'}}>info</span>
            <small className="!text-sm text-Gris-Oscuro">This will notify the user about inappropriate behavior and remind them to follow community guidelines.</small>
          </div>

          {/* Warnings */}
          <p className="font-semibold">Warning Type</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {warnTypes.map(w => (
            <button
                key={w.warn_type_id}
                onClick={() => setSelected(w.warn_type_id)}
                className={`px-4 py-2 rounded-lg text-sm text-left border hover:brightness-95 transition-all ${selected === w.warn_type_id ? 'brightness-90' : ''}`}
                style={{
                backgroundColor: '#F3F4F6',
                borderColor: selected === w.warn_type_id ? '#6F697530' : 'transparent',
                }}
            >
                {w.warn_type}
            </button>
            ))}
          </div>

          {isOtherSelected && (
            <textarea
              placeholder="Describe the issue..."
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-gray-400"
              rows={3}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2">
            <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-gray-100 text-black font-medium hover:brightness-90">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected || (isOtherSelected && !customMessage)}
              className="flex-1 py-2 rounded-lg text-black font-semibold hover:brightness-90 disabled:opacity-50 bg-amarillo-warn"
            >
              Warn {target}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WarningPopup