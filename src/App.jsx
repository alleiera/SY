import React, { useState, useMemo } from 'react';
import {
    X, Settings, Maximize2, Minimize2,
    Square, Search, Menu,
    LogOut, Zap, ChevronRight, ChevronDown,
    XCircle
} from 'lucide-react';

import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import { Loader2 } from 'lucide-react';
import { MENU_DATA } from './config/menuData';
import { useWindowManager } from './hooks/useWindowManager';
import { WindowRenderer } from './components/WindowManager/WindowRenderer';

// --- WINDOWS NATIVE ICONS ---
const WinMinimize = ({ className }) => (
    <svg width="11" height="11" viewBox="0 0 11 11" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1,6.5 1,10 4.5,10" />
        <line x1="1" y1="10" x2="4.8" y2="6.2" />
        <polyline points="10,4.5 10,1 6.5,1" />
        <line x1="10" y1="1" x2="6.2" y2="4.8" />
    </svg>
);
const WinMaximize = ({ className }) => (<svg width="10" height="10" viewBox="0 0 10 10" className={className}><rect width="9" height="9" x="0.5" y="0.5" fill="none" stroke="currentColor" strokeWidth="1" /></svg>);
const WinRestore = ({ className }) => (<svg width="10" height="10" viewBox="0 0 10 10" className={className}><path d="M2,0.5 h7.5 v7.5" fill="none" stroke="currentColor" strokeWidth="1" /><rect width="7.5" height="7.5" x="0.5" y="2" fill="none" stroke="currentColor" strokeWidth="1" /></svg>);
const WinClose = ({ className }) => (<svg width="10" height="10" viewBox="0 0 10 10" className={className}><path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" strokeWidth="1" /></svg>);

export default function App() {
    const { theme } = useSettings();
    const { user, loading, signOut } = useAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuSearch, setMenuSearch] = useState('');
    const [expandedMenus, setExpandedMenus] = useState({});

    const {
        windows, activeWindowId, dragInfo, resizeInfo,
        snapPreview, recentlyDraggedWindowId, workspaceDimensions,
        isMobile, workspaceRef,
        focusWindow, minimizeAll, minimizeWindow,
        openWindow, closeWindow, toggleMaximize,
        handleMouseDown, startResize,
    } = useWindowManager();

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const colors = {
        bg: isDark ? 'bg-[#181818]' : 'bg-[#f1f3f4]',
        workspaceBg: isDark ? 'bg-[#181818]' : 'bg-[#f1f3f4]',
        text: isDark ? 'text-white' : 'text-[#202124]',
        headerBg: isDark ? 'bg-black' : 'bg-[#dee1e6]',
        ribbonBg: isDark ? 'bg-[#2b2b2b]' : 'bg-white',
        ribbonBorder: isDark ? 'border-[#333]' : 'border-[#e0e0e0]',
        windowBg: isDark ? 'bg-[#1f1f1f]' : 'bg-white',
        windowHeader: isDark ? 'bg-[#222]' : 'bg-[#e3e5e8]',
        tabActiveFill: isDark ? '#222222' : '#e3e5e8',
        tabTextActive: isDark ? 'text-[#e8eaed]' : 'text-[#202124]',
        tabTextInactive: isDark ? 'text-[#9aa0a6]' : 'text-[#5f6368]',
        borderColor: isDark ? 'border-white/5' : 'border-black/5',
        iconColor: isDark ? 'text-white/70' : 'text-gray-600'
    };

    const filteredMenu = useMemo(() => {
        if (!menuSearch) return MENU_DATA;
        const s = menuSearch.toLowerCase();
        return MENU_DATA.filter(i =>
            i.label.toLowerCase().includes(s) ||
            i.subItems?.some(sub => sub.label.toLowerCase().includes(s))
        );
    }, [menuSearch]);

    const handleMenuOpen = (title, type, machineType) => {
        openWindow(title, type, machineType, () => setIsMenuOpen(false));
    };

    const activeWin = windows.find(w => w.id === activeWindowId);
    const isActiveWindowMaximized = activeWin ? activeWin.isMax : false;

    // --- AUTH GUARDS ---
    if (loading) {
        return (
            <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-100'}`}>
                <Loader2 size={48} className={`animate-spin ${theme === 'dark' ? 'text-blue-500' : 'text-blue-600'}`} />
            </div>
        );
    }

    if (!user) return <Auth />;

    return (
        <div className={`flex h-screen w-full ${colors.bg} ${colors.text} font-sans select-none overflow-hidden flex-col transition-colors duration-300`}>

            {/* HEADER */}
            <header className={`flex flex-col shrink-0 ${colors.headerBg} transition-colors duration-300`}>
                <div
                    className={`relative flex items-end justify-between px-2 pt-2 h-[42px] w-full ${colors.headerBg} z-30 transition-colors duration-300`}
                    style={{ WebkitAppRegion: 'drag' }}
                >
                    {/* Header Alt Çizgisi */}
                    <div className={`absolute bottom-0 left-0 w-full h-[1px] ${isDark ? 'bg-white/5' : 'bg-black/5'} ${isActiveWindowMaximized ? 'z-10' : 'z-30'} transition-all duration-300`} />

                    <div className="flex items-end flex-1 min-w-0 h-full">

                        {/* Menü Butonu */}
                        <div className="flex items-center justify-center h-[34px] w-[40px] mb-0 mr-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
                            <div
                                onClick={() => setIsMenuOpen(true)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all active:scale-95 ${isDark ? 'hover:bg-white/10 text-[#9dabb9] hover:text-white' : 'hover:bg-black/5 text-[#5f6368] hover:text-black'}`}
                            >
                                <Menu size={18} />
                            </div>
                        </div>

                        {/* Minimize All (Desktop Only) */}
                        <div
                            className={`${isMobile ? 'hidden' : 'flex'} items-center justify-center h-[34px] w-[34px] mb-0 mr-1 shrink-0`}
                            style={{ WebkitAppRegion: 'no-drag' }}
                        >
                            <div
                                onClick={minimizeAll}
                                className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all active:scale-95 ${isDark ? 'hover:bg-white/10 text-[#9dabb9] hover:text-white' : 'hover:bg-black/5 text-[#5f6368] hover:text-black'}`}
                            >
                                <WinMinimize />
                            </div>
                        </div>

                        {/* Sekmeler (Desktop Only) */}
                        <div
                            className={`${isMobile ? 'hidden' : 'flex'} items-end h-[34px] overflow-hidden flex-1`}
                            onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
                        >
                            {windows.map((win, idx) => (
                                <div
                                    key={win.id}
                                    onClick={() => focusWindow(win.id)}
                                    style={{ WebkitAppRegion: 'no-drag' }}
                                    className={`tab-item group relative flex items-center h-[34px] min-w-[140px] max-w-[220px] px-[10px] cursor-default transition-all duration-200 mr-[-4px]
                                        ${activeWindowId === win.id ? `active ${colors.tabTextActive} z-20` : `${colors.tabTextInactive} z-0`}`}
                                >
                                    {/* Aktif Sekme Arkaplanı */}
                                    {activeWindowId === win.id && (
                                        <div className="active-tab-bg absolute inset-0 z-[-1] flex items-end w-[calc(100%+24px)] -left-[12px] pointer-events-none">
                                            <svg className="tab-corner-left w-[20px] h-full transition-colors duration-300" style={{ shapeRendering: 'geometricPrecision', fill: colors.tabActiveFill }} viewBox="0 0 20 34">
                                                <path d="M20,0 C13,0 10,5 10,12 L10,24 C10,31 8,34 0,34 L20,34 Z"></path>
                                            </svg>
                                            <div className="tab-center flex-1 h-full transition-colors duration-300" style={{ backgroundColor: colors.tabActiveFill }}></div>
                                            <svg className="tab-corner-right w-[20px] h-full transition-colors duration-300" style={{ shapeRendering: 'geometricPrecision', fill: colors.tabActiveFill }} viewBox="0 0 20 34">
                                                <path d="M0,0 C7,0 10,5 10,12 L10,24 C10,31 12,34 20,34 L0,34 Z"></path>
                                            </svg>
                                        </div>
                                    )}

                                    {/* Pasif Sekme Hover */}
                                    {activeWindowId !== win.id && (
                                        <div className={`tab-hover-pill absolute inset-x-[11px] inset-y-[4px] rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity z-[-1] ${isDark ? 'bg-white/10' : 'bg-black/5'}`} />
                                    )}

                                    <div className="flex items-center flex-1 truncate z-10 pl-2">
                                        <span className="truncate flex-1 font-medium text-[12px] pt-[1px]">{win.title}</span>
                                    </div>

                                    <div
                                        onClick={(e) => closeWindow(win.id, e)}
                                        className={`tab-close shrink-0 w-5 h-5 rounded-full flex items-center justify-center ml-1 transition-all z-20 ${activeWindowId === win.id ? 'opacity-100' : `opacity-0 group-hover:opacity-100 ${isDark ? 'hover:bg-white/15' : 'hover:bg-black/10'} cursor-pointer`}`}
                                    >
                                        <X size={14} />
                                    </div>

                                    {/* Ayırıcı */}
                                    {activeWindowId !== win.id && idx !== windows.length - 1 && activeWindowId !== windows[idx + 1]?.id && (
                                        <div className={`tab-separator absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 ${isDark ? 'bg-[#3c4043]' : 'bg-[#dadce0]'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Electron Pencere Kontrolleri */}
                    {window.electronAPI && (
                        <div className="flex items-start h-full mb-1 space-x-0" style={{ WebkitAppRegion: 'no-drag' }}>
                            <button onClick={() => window.electronAPI.minimize()} className={`w-11 h-9 flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}>
                                <WinMinimize />
                            </button>
                            <button onClick={() => window.electronAPI.toggleMaximize()} className={`w-11 h-9 flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}>
                                <WinMaximize />
                            </button>
                            <button onClick={() => window.electronAPI.close()} className={`w-11 h-9 flex items-center justify-center transition-colors hover:bg-[#e81123] hover:text-white ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <WinClose />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* WORKSPACE */}
            <main
                className={`flex-1 flex overflow-hidden relative ${colors.workspaceBg} transition-colors duration-300`}
                ref={workspaceRef}
            >
                <WindowRenderer
                    windows={windows}
                    activeWindowId={activeWindowId}
                    isDark={isDark}
                    isMobile={isMobile}
                    colors={colors}
                    dragInfo={dragInfo}
                    resizeInfo={resizeInfo}
                    snapPreview={snapPreview}
                    recentlyDraggedWindowId={recentlyDraggedWindowId}
                    workspaceDimensions={workspaceDimensions}
                    onFocus={focusWindow}
                    onClose={closeWindow}
                    onMinimize={minimizeWindow}
                    onToggleMaximize={toggleMaximize}
                    onMouseDown={handleMouseDown}
                    onStartResize={startResize}
                    WinMinimize={WinMinimize}
                    WinMaximize={WinMaximize}
                    WinRestore={WinRestore}
                    WinClose={WinClose}
                    onOpenWindow={(title, type, machineType) => openWindow(title, type, machineType)}
                />
            </main>

            {/* Lobi Menü Arkaplan Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                    style={{ zIndex: 99998 }}
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* LOBİ MENÜSÜ */}
            <div 
                className={`fixed inset-y-0 left-0 w-72 bg-[#0d0d0d] border-r border-white/5 transform transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ zIndex: 99999 }}
            >
                <div className="flex flex-col h-full">
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-tr from-[#137fec] to-[#0051a3] rounded-lg flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
                            <div>
                                <span className="text-[12px] font-black tracking-widest text-white uppercase leading-none">SY</span>
                                <div className="text-[8px] text-[#9aa0a6] font-bold uppercase tracking-tighter">Platform</div>
                            </div>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 group-focus-within:text-[#137fec] transition-colors" />
                            <input
                                type="text"
                                placeholder="Hızlı ara..."
                                value={menuSearch}
                                onChange={(e) => setMenuSearch(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 pl-9 pr-3 text-[10.5px] font-bold text-white outline-none focus:border-[#137fec]/30 transition-all"
                            />
                            {menuSearch && (
                                <XCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white cursor-pointer" onClick={() => setMenuSearch('')} />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-0.5 pb-10">
                        {filteredMenu.map((item) => (
                            <div key={item.id} className="space-y-0.5">
                                <div
                                    onClick={() => item.subItems
                                        ? setExpandedMenus({ ...expandedMenus, [item.id]: !expandedMenus[item.id] })
                                        : handleMenuOpen(item.label, item.type || 'generic')
                                    }
                                    className={`flex items-center gap-3 py-1.5 px-3 rounded-lg cursor-pointer transition-all border border-transparent ${expandedMenus[item.id] ? 'bg-white/5 text-[#137fec]' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'}`}
                                >
                                    <div className={`transition-colors ${expandedMenus[item.id] ? 'text-[#137fec]' : 'text-gray-600'}`}><item.Icon size={15} /></div>
                                    <span className="text-[10.5px] font-bold uppercase tracking-wide flex-1">{item.label}</span>
                                    {item.subItems && (expandedMenus[item.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
                                </div>
                                {item.subItems && expandedMenus[item.id] && (
                                    <div className="ml-8 border-l border-white/5 pl-2 space-y-0.5">
                                        {item.subItems.map(sub => (
                                            <div
                                                key={sub.id}
                                                onClick={() => handleMenuOpen(sub.label, sub.type, sub.machineType)}
                                                className="flex items-center py-1.5 px-3 rounded-md text-[10px] font-bold text-gray-500 hover:text-white hover:bg-white/[0.03] cursor-pointer transition-all"
                                            >
                                                {sub.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
                        <div className="mb-3 px-2">
                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Aktif Kullanıcı</div>
                            <div className="text-[11px] text-white truncate font-medium opacity-80" title={user?.email}>{user?.email}</div>
                        </div>
                        <div
                            onClick={() => { setIsMenuOpen(false); signOut(); }}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer group"
                        >
                            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Oturumu Kapat</span>
                        </div>
                    </div>
                </div>
            </div>



            <style dangerouslySetInnerHTML={{
                __html: `
                .tab-item.active { z-index: 50 !important; }
                .active-tab-bg svg { shape-rendering: geometricPrecision; }
                .tab-corner-left { fill: #2b2b2b; }
                .tab-corner-right { fill: #2b2b2b; }
            `}} />
        </div>
    );
}
