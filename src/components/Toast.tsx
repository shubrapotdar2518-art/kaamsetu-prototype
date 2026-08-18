import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
          isSuccess
            ? 'bg-[#15803D] text-white border-[#166534]'
            : isError
            ? 'bg-rose-600 text-white border-rose-700'
            : 'bg-gray-900 text-white border-gray-800'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-200" />
        ) : (
          <Info className="w-5 h-5 shrink-0 text-blue-200" />
        )}

        <span className="flex-1 leading-snug">{toast.message}</span>

        <button
          onClick={clearToast}
          className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
