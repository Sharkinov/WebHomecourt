interface ConfirmPopupProps {
  type: string
  action: string
  confirmIcon: string
  accentColor: string
  user?: { name: string, photo_url: string }
  target?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmPopup = ({
  type, action, confirmIcon, accentColor, user, target, onConfirm, onCancel
}: ConfirmPopupProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[450px] overflow-hidden shadow-xl">
        
        {/* Header */}
        <div className="bg-violet-950 px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div 
              className="rounded-full p-1 flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <span 
                className="material-symbols-outlined"
                style={{ fontSize: '20px', color: 'white' }}  
              >
                exclamation
              </span>
            </div>
            <p className="text-white font-semibold">{type + " " + target}</p>
          </div>
          <button onClick={onCancel} className="text-white">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 px-7 py-7">
          <h2 className="font-medium text-center mx-2" style={{ fontSize: '24px' }}>{"Are you sure you want to " + type.toLowerCase() + " this user?"}</h2>

          {user && (
            <div className="flex flex-col items-center gap-2 my-3">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {user.photo_url && <img src={user.photo_url} className="w-full h-full object-cover" />}
              </div>
              <p className="text-sm">@{user.name}</p>
            </div>
          )}

          <div 
            className="rounded-lg px-4 py-3 flex gap-2 items-start border"
            style={{ 
              backgroundColor: `${accentColor}22`,  // 22 es opacity en hex (~13%)
              borderColor: `${accentColor}80`       // 80 es opacity en hex (~50%)
            }}
          >
            <span className="material-symbols-outlined text-orange-400 mt-0.5" style={{ fontSize: '16px', color: accentColor }}>info</span>
            <small style={{ fontSize: '15px', color: '#6F6975' }}>{"This action will " + action + " the user from accessing the platform and participating in any events."}</small>
          </div>

          <div className="flex gap-3 w-full mt-6">
            <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-gray-100 text-black font-medium hover:brightness-90">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 rounded-lg text-white font-medium hover:brightness-90 flex items-center justify-center gap-1"
              style={{ backgroundColor: accentColor }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{confirmIcon}</span>
              {type + " " + target}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmPopup