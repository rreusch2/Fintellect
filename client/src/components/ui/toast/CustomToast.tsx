import { Toast, ToastProps } from "@/components/ui/toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface CustomToastProps extends ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
}

export function CustomToast({ type, title, description, ...props }: CustomToastProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />
  };

  return (
    <Toast {...props} className="flex items-center gap-3 bg-background/95 backdrop-blur-sm border-gray-800">
      {icons[type]}
      <div className="grid gap-1">
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
    </Toast>
  );
} 