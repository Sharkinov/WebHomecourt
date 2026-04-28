type StatusAlertProps = {
  tone: "success" | "error" | "warning" | "info"
  title: string
  message?: string
}

const toneStyles: Record<
  StatusAlertProps["tone"],
  { bg: string; text: string; outline: string; icon: string }
> = {
  success: {
    bg: "bg-green-100",
    text: "text-green-800",
    outline: "outline-green-800",
    icon: "check_small",
  },
  error: {
    bg: "bg-red-100",
    text: "text-red-800",
    outline: "outline-red-800",
    icon: "exclamation",
  },
  warning: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    outline: "outline-orange-800",
    icon: "warning",
  },
  info: {
    bg: "bg-sky-100",
    text: "text-sky-800",
    outline: "outline-sky-800",
    icon: "info",
  },
}

function StatusAlert({ title, message, tone }: StatusAlertProps) {
  const style = toneStyles[tone]

  return (
    <div
      className={`w-full rounded-xl px-3 py-2.5 outline outline-2 ${style.bg} ${style.text} ${style.outline}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">
          {style.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug break-words">{title}</p>
          {message && (
            <p className="text-xs opacity-80 leading-snug break-words">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatusAlert
