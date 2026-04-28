interface EndEventPopupProps {
  event: { name: string, location: string, date: string, host: string }
  onConfirm: () => void
  onCancel: () => void
}

const EndEventPopup = ({ event, onConfirm, onCancel }: EndEventPopupProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[450px] overflow-hidden shadow-xl">

        {/* Header */}
        <div className="bg-violet-950 px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-full p-1 flex items-center justify-center" style={{ backgroundColor: '#BC3737' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'white' }}>exclamation</span>
            </div>
            <p className="text-white font-semibold">End Event</p>
          </div>
          <button onClick={onCancel} className="text-white">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 px-7 py-7">
          <h2 className="font-medium text-center mx-2" style={{ fontSize: '24px' }}>Are you sure you want to end this event?</h2>

          <div className="flex flex-col items-center gap-1 my-3 text-center">
            <h5 className="font-bold text-lg mb-2">{event.name}</h5>
            <small className="text-sm text-gray-600">Location: {event.location}</small>
            <small className="text-sm text-gray-600">Date: {event.date}</small>
            <small className="text-sm text-gray-600">Host: @{event.host}</small>
          </div>

          <div className="rounded-lg px-4 py-3 flex gap-2 items-start border" style={{ backgroundColor: '#BC373722', borderColor: '#BC373780' }}>
            <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '16px', color: '#BC3737' }}>info</span>
            <small style={{ fontSize: '15px', color: '#6F6975' }}>This action will cancel the event and prevent participants from continuing or joining.</small>
          </div>

          <div className="flex gap-3 w-full mt-6">
            <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-gray-100 text-black font-medium hover:brightness-90">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 py-2 rounded-lg text-white font-medium hover:brightness-90 flex items-center justify-center gap-1" style={{ backgroundColor: '#BC3737' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event_busy</span>
              End Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EndEventPopup