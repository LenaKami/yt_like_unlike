import { useToast } from './ToastContext';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getBgColor(toast.type)} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-right pointer-events-auto`}
        >
          <div className="flex-shrink-0">
            {getIcon(toast.type)}
          </div>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 hover:opacity-75 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};
