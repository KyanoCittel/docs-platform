'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ActionState } from '@/app/admin/actions';

type ToastKind = 'success' | 'error';
type Toast = { id: number; kind: ToastKind; message: string };

type Ctx = {
  push: (kind: ToastKind, message: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`shadow-lg rounded-md px-4 py-3 text-sm border flex items-start gap-2 animate-in slide-in-from-right ${
              t.kind === 'success'
                ? 'bg-green-50 border-green-300 text-green-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="font-bold">{t.kind === 'success' ? '✓' : '✗'}</span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast buiten ToastProvider');
  return ctx;
}

// Triggert automatisch een toast wanneer een useActionState-resultaat verandert.
export function useToastOnAction(state: ActionState) {
  const { push } = useToast();
  useEffect(() => {
    if (!state) return;
    push(state.ok ? 'success' : 'error', state.message);
  }, [state, push]);
}
