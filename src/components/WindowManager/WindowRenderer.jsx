import React, { Suspense, lazy } from 'react';
import { WindowTitleBar } from './WindowControls';
import Dashboard from '../Dashboard';
import RibbonMenu from '../RibbonMenu';

// --- Code Splitting (Lazy Load) ---
const Materials = lazy(() => import('../Materials'));
const MaterialReceipts = lazy(() => import('../MaterialReceipts'));
const HCodes = lazy(() => import('../HCodes'));
const ChartColors = lazy(() => import('../ChartColors'));
const Surfaces = lazy(() => import('../Surfaces'));
const SettingsWindow = lazy(() => import('../SettingsWindow'));
const ProductionMonitor = lazy(() => import('../ProductionMonitor'));
const ProductionSchedule = lazy(() => import('../ProductionSchedule'));
const CompletedJobs = lazy(() => import('../CompletedJobs'));
const CodeTemplateSystem = lazy(() => import('../CodeTemplateSystem'));
const Products = lazy(() => import('../Products'));
const RecipeApp = lazy(() => import('../RecipeSystem/RecipeApp'));
const Dimensions = lazy(() => import('../Dimensions'));
const MachineManagement = lazy(() => import('../MachineManagement'));

// Windows-style resize handle yönleri
const RESIZE_DIRECTIONS = ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'];

/**
 * Belirli bir `win.type` değeri için hangi bileşenin render edileceğini döner.
 * Yeni bir ekran tipi eklenirken sadece bu fonksiyon güncellenir.
 */
function resolveWindowContent(win, activeWindowId) {
    const isActive = activeWindowId === win.id;
    let content = null;
    switch (win.type) {
        case 'products':          content = <Products isActive={isActive} winId={win.id} />; break;
        case 'dimensions':        content = <Dimensions isActive={isActive} winId={win.id} />; break;
        case 'materials':         content = <Materials isActive={isActive} winId={win.id} />; break;
        case 'receipts':          content = <MaterialReceipts isActive={isActive} winId={win.id} />; break;
        case 'h-codes':           content = <HCodes isActive={isActive} winId={win.id} />; break;
        case 'chart-colors':      content = <ChartColors isActive={isActive} winId={win.id} />; break;
        case 'surfaces':          content = <Surfaces isActive={isActive} winId={win.id} />; break;
        case 'settings':          content = <SettingsWindow winId={win.id} />; break;
        case 'machine-mgmt':      content = <MachineManagement winId={win.id} />; break;
        case 'production-monitor': content = <ProductionMonitor machineType={win.machineType} winId={win.id} />; break;
        case 'prod-schedule':     content = <ProductionSchedule winId={win.id} />; break;
        case 'prod-completed':    content = <CompletedJobs winId={win.id} />; break;
        case 'code-templates':    content = <CodeTemplateSystem winId={win.id} />; break;
        case 'recipe-system':     content = <RecipeApp isActive={isActive} winId={win.id} />; break;
        default:
            content = (
                <div className="flex flex-col items-center justify-center h-full">
                    <img src="/SVG/SY-ICON.svg" alt="SY Icon" className="w-64 h-64 opacity-5 pointer-events-none select-none" />
                </div>
            );
    }

    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full opacity-50">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            </div>
        }>
            {content}
        </Suspense>
    );
}

/**
 * Tek bir pencereyi render eder.
 * Tüm pencere container'ı, resize handle'ları, başlık barı ve içerik buradadır.
 */
function WindowFrame({
    win, activeWindowId, isDark, isMobile, colors,
    dragInfo, resizeInfo, recentlyDraggedWindowId, workspaceDimensions,
    onFocus, onClose, onMinimize, onToggleMaximize, onMouseDown, onStartResize,
    WinMinimize, WinMaximize, WinRestore, WinClose
}) {
    const isActive = activeWindowId === win.id;

    return (
        <div
            key={win.id}
            id={`window-${win.id}`}
            onClick={() => onFocus(win.id)}
            className={`absolute flex flex-col ${colors.windowBg} overflow-hidden transition-all duration-300 ${
                win.isMax
                    ? '!border-0 rounded-none'
                    : `border rounded-xl ${isActive
                        ? (isDark ? 'border-white/20' : 'border-black/20 shadow-lg')
                        : (isDark ? 'border-white/5' : 'border-gray-200')}`
            } ${isMobile ? '!left-0 !top-0 !w-full !h-full !border-0 rounded-none z-[100]' : ''}`}
            style={isMobile ? { zIndex: 100 } : {
                left: win.isMax ? 0 : (win.x || 0),
                top: win.isMax ? 0 : (win.y || 0),
                width: win.isMax ? workspaceDimensions.width : (win.w || 800),
                height: win.isMax ? workspaceDimensions.height : (win.h || 600),
                zIndex: win.z || 1,
                opacity: win.isMin ? 0 : 1,
                transform: win.isMin ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
                pointerEvents: win.isMin ? 'none' : 'auto',
                visibility: win.isMin ? 'hidden' : 'visible',
                transition: dragInfo?.id === win.id || resizeInfo?.id === win.id || recentlyDraggedWindowId === win.id
                    ? 'none'
                    : 'left 0.3s cubic-bezier(0.25, 1, 0.5, 1), top 0.3s cubic-bezier(0.25, 1, 0.5, 1), width 0.3s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease-in-out, transform 0.2s ease-in-out, visibility 0.2s',
                willChange: 'left, top, width, height, opacity, transform'
            }}
        >
            {/* Resize Handle'ları (Desktop Only) */}
            {(!win.isMax && !isMobile) && RESIZE_DIRECTIONS.map(d => {
                const isCorner = d.length === 2;
                const thickness = 6;
                return (
                    <div
                        key={d}
                        className="absolute z-[60]"
                        style={{
                            cursor: `${d}-resize`,
                            top: d.includes('n') ? (isCorner ? -8 : 0) : d.includes('s') ? 'auto' : 0,
                            bottom: d.includes('s') ? (isCorner ? -8 : 0) : 'auto',
                            left: d.includes('w') ? (isCorner ? -8 : 0) : d.includes('e') ? 'auto' : 0,
                            right: d.includes('e') ? (isCorner ? -8 : 0) : 'auto',
                            width: isCorner ? 24 : (d === 'n' || d === 's' ? '100%' : thickness),
                            height: isCorner ? 24 : (d === 'w' || d === 'e' ? '100%' : thickness),
                            backgroundColor: 'transparent'
                        }}
                        onMouseDown={(e) => onStartResize(win.id, d, e)}
                    />
                );
            })}

            {/* Başlık Barı */}
            <WindowTitleBar
                win={win}
                isDark={isDark}
                isMobile={isMobile}
                colors={colors}
                onMouseDown={(e) => onMouseDown(win.id, e)}
                onDoubleClick={() => onToggleMaximize(win.id)}
                onMinimize={onMinimize}
                onToggleMaximize={onToggleMaximize}
                onClose={onClose}
                WinMinimize={WinMinimize}
                WinMaximize={WinMaximize}
                WinRestore={WinRestore}
                WinClose={WinClose}
            />

            {/* Ribbon Menü */}
            {win.type !== 'generic' && (
                <RibbonMenu
                    winId={win.id}
                    onMouseDown={(e) => onMouseDown(win.id, e)}
                    onDoubleClick={() => onToggleMaximize(win.id)}
                />
            )}

            {/* İçerik */}
            <div className={`flex-1 overflow-auto custom-scrollbar ${colors.bg} p-0 flex flex-col relative w-full h-full select-text ${dragInfo?.id === win.id ? 'pointer-events-none' : ''}`}>
                {resolveWindowContent(win, activeWindowId)}
            </div>
        </div>
    );
}

/**
 * Tüm açık pencereleri ve (koşullu olarak) Dashboard'u render eder.
 */
export function WindowRenderer({
    windows, activeWindowId, isDark, isMobile, colors,
    dragInfo, resizeInfo, snapPreview, recentlyDraggedWindowId, workspaceDimensions,
    onFocus, onClose, onMinimize, onToggleMaximize, onMouseDown, onStartResize,
    WinMinimize, WinMaximize, WinRestore, WinClose,
    onOpenWindow
}) {
    return (
        <>
            {/* Snap Preview (Hayalet Pencere) */}
            {snapPreview && (
                <div className={`absolute top-2 bottom-2 z-[999] bg-[#137fec]/10 border-2 border-[#137fec]/40 rounded-xl transition-all duration-200 pointer-events-none ${
                    snapPreview === 'left' ? 'left-2 right-1/2 mr-1' : 'left-1/2 right-2 ml-1'
                }`} />
            )}

            {/* Pencereler */}
            {windows.length > 0 && windows.map((win) => {
                if (isMobile && win.id !== activeWindowId) return null;
                return (
                    <WindowFrame
                        key={win.id}
                        win={win}
                        activeWindowId={activeWindowId}
                        isDark={isDark}
                        isMobile={isMobile}
                        colors={colors}
                        dragInfo={dragInfo}
                        resizeInfo={resizeInfo}
                        recentlyDraggedWindowId={recentlyDraggedWindowId}
                        workspaceDimensions={workspaceDimensions}
                        onFocus={onFocus}
                        onClose={onClose}
                        onMinimize={onMinimize}
                        onToggleMaximize={onToggleMaximize}
                        onMouseDown={onMouseDown}
                        onStartResize={onStartResize}
                        WinMinimize={WinMinimize}
                        WinMaximize={WinMaximize}
                        WinRestore={WinRestore}
                        WinClose={WinClose}
                    />
                );
            })}

            {/* Dashboard — maksimize pencere yoksa veya mobilde aktif pencere yoksa göster */}
            {((isMobile && activeWindowId === null) || (!isMobile && !windows.some(w => w.isMax && !w.isMin))) && (
                <div className="flex flex-col items-center justify-center h-full w-full">
                    <Dashboard onOpenWindow={onOpenWindow} />
                </div>
            )}
        </>
    );
}
