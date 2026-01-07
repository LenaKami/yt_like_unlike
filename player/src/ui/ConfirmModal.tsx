import React from 'react';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal: React.FC<Props> = ({
  open,
  title = 'Potwierdzenie',
  message,
  confirmLabel = 'Usuń',
  cancelLabel = 'Anuluj',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-slate-700 dark:text-slate-300">{message}</p>
        </div>
        <div className="p-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="log-in-e px-3 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 "
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="log-in px-3 py-2 bg-red-500 hover:bg-red-600 text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
