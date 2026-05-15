import React from 'react';
import { Monitor } from 'lucide-react';

/* eslint-disable no-unused-vars */

/**
 * Pencere başlık barının tüm içeriğini render eder:
 * - Sol taraf: ikon + pencere başlığı
 * - Sağ taraf: minimize, maximize/restore, close butonları
 *
 * WindowRenderer'dan ayrılması sayesinde başlık barı stili
 * tek yerden yönetilir ve bağımsız olarak test edilebilir.
 */
export function WindowTitleBar({
    win, isDark, isMobile, colors,
    onMouseDown, onDoubleClick,
    onMinimize, onToggleMaximize, onClose,
    WinMinimize, WinMaximize, WinRestore, WinClose,
}) {
    return (
        <div
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            className={`flex items-center justify-between pl-4 pr-1 py-1 ${colors.windowHeader} cursor-grab active:cursor-grabbing border-b ${isDark ? 'border-black' : 'border-gray-200'} shrink-0 transition-colors duration-300`}
        >
            {/* Sol: İkon + Başlık */}
            <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-[#137fec]" />
                <span className={`text-[10px] font-black tracking-widest uppercase ${isDark ? 'text-[#9aa0a6]' : 'text-gray-600'}`}>
                    {win.title}
                </span>
            </div>

            {/* Sağ: Pencere Kontrolleri */}
            <WindowControls
                win={win}
                isDark={isDark}
                isMobile={isMobile}
                onMinimize={onMinimize}
                onToggleMaximize={onToggleMaximize}
                onClose={onClose}
                WinMinimize={WinMinimize}
                WinMaximize={WinMaximize}
                WinRestore={WinRestore}
                WinClose={WinClose}
            />
        </div>
    );
}

/**
 * Sağ taraftaki pencere kontrol butonları (minimize / maximize / close).
 * Ayrı export edilmesi App.jsx'teki Electron başlık barında da yeniden
 * kullanılabilmesini sağlar.
 */
export function WindowControls({
    win, isDark, isMobile,
    onMinimize, onToggleMaximize, onClose,
    WinMinimize, WinMaximize, WinRestore, WinClose,
}) {
    return (
        <div
            className={`flex items-center h-full nodrag ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            {/* Minimize — mobilde gösterilmez */}
            {!isMobile && (
                <button
                    onClick={(e) => onMinimize(win.id, e)}
                    title="Küçült"
                    className={`w-10 h-7 flex items-center justify-center transition-colors rounded-sm ${isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-black/5 hover:text-black'}`}
                >
                    <WinMinimize />
                </button>
            )}

            {/* Maximize / Restore — mobilde gösterilmez */}
            {!isMobile && (
                <button
                    onClick={(e) => onToggleMaximize(win.id, e)}
                    title={win.isMax ? 'Geri Yükle' : 'Büyüt'}
                    className={`w-10 h-7 flex items-center justify-center transition-colors rounded-sm ${isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-black/5 hover:text-black'}`}
                >
                    {win.isMax ? <WinRestore /> : <WinMaximize />}
                </button>
            )}

            {/* Close */}
            <button
                onClick={(e) => onClose(win.id, e)}
                title="Kapat"
                className="w-10 h-7 flex items-center justify-center transition-colors rounded-sm hover:bg-[#e81123] hover:text-white ml-1"
            >
                <WinClose />
            </button>
        </div>
    );
}
