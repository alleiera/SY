import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function FeedbackBanner({
    feedback,
    isDarkMode = false,
    className = '',
    onClose,
    autoDismissMs = 4000,
    dismissible = true
}) {
    useEffect(() => {
        if (!feedback || !onClose || !autoDismissMs) return;
        const timeoutId = window.setTimeout(() => onClose(), autoDismissMs);
        return () => window.clearTimeout(timeoutId);
    }, [feedback, onClose, autoDismissMs]);

    if (!feedback) return null;

    const tone = feedback.type || 'info';
    const palette = tone === 'success'
        ? (isDarkMode ? 'bg-emerald-950/40 text-emerald-200 border-emerald-700/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
        : tone === 'error'
            ? (isDarkMode ? 'bg-red-950/40 text-red-200 border-red-700/60' : 'bg-red-50 text-red-700 border-red-200')
            : (isDarkMode ? 'bg-blue-950/40 text-blue-200 border-blue-700/60' : 'bg-blue-50 text-blue-700 border-blue-200');

    return (
        <div className={`rounded-md border px-3 py-2 text-xs shadow-sm ${palette} ${className}`}>
            <div className="flex items-start gap-2">
                <span className="flex-1">{feedback.message}</span>
                {dismissible && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className={`rounded p-0.5 transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                        aria-label="Bildirimi kapat"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
        </div>
    );
}
