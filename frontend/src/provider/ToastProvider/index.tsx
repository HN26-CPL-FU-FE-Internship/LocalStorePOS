import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { FEEDBACK_CONFIG } from '@/constants';
import { ToastContext, type ToastType } from './ToastContext';

type ToastItem = {
    id: number;
    message: string;
    type: ToastType;
    /** When true, exit animation plays before DOM removal */
    hiding?: boolean;
};

const AUTO_DISMISS_MS = 4000;

/* ── Inject animation keyframes once ─────────────────────────────── */
const TOAST_ANIMATION_ID = 'toast-global-anim';

function ensureAnimationStyles() {
    if (document.getElementById(TOAST_ANIMATION_ID)) return;

    const style = document.createElement('style');
    style.id = TOAST_ANIMATION_ID;
    style.textContent = `
      @keyframes toast-slide-in {
        0%   { transform: translateX(120%); opacity: 0; }
        70%  { transform: translateX(-10px); opacity: 1; }
        100% { transform: translateX(0); opacity: 1; }
      }

      .toast-global-enter {
        animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .toast-global-exit {
        opacity: 0 !important;
        transform: translateX(120%) !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      /* Keep toast content visible while the exit animation plays */
      .toast-global-exit .toast.fade:not(.show) {
        display: block;
      }

      /* Spacing between stacked toasts */
      .toast-global-wrapper + .toast-global-wrapper {
        margin-top: 12px;
      }
    `;
    document.head.appendChild(style);
}

const TOAST_BG: Record<ToastType, string> = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info',
};

/* ── Toast item view ──────────────────────────────────────────────── */
const ToastItemView = ({ toast, onClose }: { toast: ToastItem; onClose: (id: number) => void }) => {
    const config = FEEDBACK_CONFIG[toast.type];

    return (
        <div className={`toast-global-enter ${toast.hiding ? 'toast-global-exit' : ''}`}>
            <Toast
                bg={TOAST_BG[toast.type]}
                autohide
                delay={AUTO_DISMISS_MS}
                onClose={() => onClose(toast.id)}
                className="border-0"
            >
                <Toast.Body className="d-flex align-items-center gap-2 text-white">
                    <Icon name={config.icon} className="fs-5 flex-shrink-0" />
                    <span className="flex-grow-1 fs-14">{toast.message}</span>
                    <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        aria-label="Close"
                        onClick={() => onClose(toast.id)}
                    />
                </Toast.Body>
            </Toast>
        </div>
    );
};

/* ── Provider ────────────────────────────────────────────────────── */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // Inject animation styles once on mount
    useEffect(() => {
        ensureAnimationStyles();
    }, []);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        // Step 1 – mark as hiding → triggers exit animation
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, hiding: true } : t)));

        // Step 2 – after animation completes, remove from DOM
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <ToastContainer
                position="top-end"
                className="p-3"
                containerPosition="fixed"
                style={{
                    zIndex: 9999,
                    pointerEvents: 'none',
                    maxHeight: '100vh',
                    overflowY: 'hidden',
                }}
            >
                {toasts.map((toast) => (
                    <div key={toast.id} className="toast-global-wrapper mt-2" style={{ pointerEvents: 'auto' }}>
                        <ToastItemView toast={toast} onClose={removeToast} />
                    </div>
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
};
