import { useState } from 'react'
import ConfirmModal from './ConfirmPopup'
import WarningPopup from './WarningPopup'

interface ActionButtonsProps {
  onDismiss: () => void 
  onWarning: (warnTypeId: number, customMessage: string | null) => void
  onSuspend: () => void
  onBan: () => void
  user?: { name: string, photo_url: string }
  target?: string
  dismissText?: string
  warningText?: string
  suspendText?: string
  banText?: string
}

const ActionButtons = ({
  onDismiss,
  onWarning,
  onSuspend,
  onBan,
  user,
  target,
  dismissText = 'Dismiss',
  warningText = 'Warn ' + (target),
  suspendText = 'Suspend ' + (target),
  banText = 'Ban ' + (target),
}: ActionButtonsProps) => {
  const [modal, setModal] = useState<'suspend' | 'ban' | 'warning' | null>(null)

  return (
    <>
      {modal === 'suspend' && (
        <ConfirmModal
          type="Suspend"
          action="temporarily restrict"
          confirmIcon="account_circle_off"
          accentColor="#D38B43"
          user={user}
          target={target}
          onConfirm={() => { setModal(null); onSuspend?.() }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'ban' && (
        <ConfirmModal
          type="Ban"
          action="prevent"
          confirmIcon="block"
          accentColor="#BC3737"
          user={user}
          target={target}
          onConfirm={() => { setModal(null); onBan() }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'warning' && (
        <WarningPopup
          user={user}
          target={target}
          onConfirm={(warnTypeId, customMessage) => { setModal(null); onWarning(warnTypeId, customMessage) }}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="flex flex-wrap gap-10 pt-5 mt-2 justify-center">
        <button onClick={onDismiss} className="w-49 px-5 py-2 rounded-lg bg-[#E7E6E8] text-black font-medium hover:brightness-75 transition-colors">
          {dismissText}
        </button>
        <button onClick={() => setModal('warning')} className="w-48 px-5 py-2 rounded-lg bg-[#FFD796] text-black font-medium hover:brightness-90 transition-colors">
          {warningText}
        </button>
        <button onClick={() => setModal('suspend')} className="w-48 px-5 py-2 rounded-lg bg-[#D38B43] text-white font-medium hover:brightness-90 transition-colors">
          {suspendText}
        </button>
        <button onClick={() => setModal('ban')} className="w-48 px-5 py-2 rounded-lg bg-[#BC3737] text-white font-medium hover:brightness-75 transition-colors">
          {banText}
        </button>
      </div>
    </>
  )
}

export default ActionButtons