import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive"
        const label = title ?? description ?? ""
        return (
          <Toast key={id} variant={variant} {...props}>
            {isDestructive
              ? <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />
            }
            <ToastTitle className="flex-1">{label}</ToastTitle>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
