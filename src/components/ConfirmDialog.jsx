import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, isDarkMode = true }) {
    const cancelRef = useRef(null);
    const confirmRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                // Execute whichever button is focused
                if (document.activeElement === cancelRef.current) {
                    onCancel();
                } else {
                    onConfirm();
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
                e.preventDefault();
                // Toggle focus between the two buttons
                if (document.activeElement === confirmRef.current) {
                    cancelRef.current?.focus();
                } else {
                    confirmRef.current?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        // Focus the confirm (Sil) button by default
        setTimeout(() => confirmRef.current?.focus(), 50);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onCancel]);

    if (!isOpen) return null;

    const focusRing = 'focus:outline-none focus:ring-2 focus:ring-offset-1';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onCancel}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className={`relative w-full max-w-sm mx-4 rounded-2xl border shadow-2xl overflow-hidden
                    ${isDarkMode ? 'bg-[#1f1f1f] border-white/10' : 'bg-white border-gray-200'}`}
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'confirmSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                {/* Header */}
                <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                        <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <h3 className={`text-sm font-bold flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {title || 'Onay'}
                    </h3>
                    <button
                        onClick={onCancel}
                        tabIndex={-1}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                            ${isDarkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className={`px-5 py-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="text-[13px] leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className={`flex gap-2 px-5 py-4 border-t ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-gray-100 bg-gray-50'}`}>
                    <button
                        ref={cancelRef}
                        onClick={onCancel}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${focusRing}
                            ${isDarkMode
                                ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-white/5 focus:ring-white/30 focus:ring-offset-[#1f1f1f]'
                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 focus:ring-gray-400 focus:ring-offset-white'}`}
                    >
                        İptal
                    </button>
                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${focusRing}
                            bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50 border border-red-500/30
                            ${isDarkMode ? 'focus:ring-offset-[#1f1f1f]' : 'focus:ring-offset-white'}`}
                    >
                        Sil
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes confirmSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
