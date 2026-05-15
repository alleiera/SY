import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Maximize2, Minimize2, MoreVertical, X } from 'lucide-react';

const USER_ID = 'user_1'; // Consistent storage key prefix

export default function DashboardWidget({
    id,
    title,
    icon: Icon,
    iconColor = 'text-gray-400',
    headerAction,
    defaultColSpan = 4,
    defaultHeight = 350,
    onMove,
    children
}) {
    // Persistent State for Widget Settings
    const [settings, setSettings] = useState(() => {
        try {
            const saved = window.localStorage.getItem(`${USER_ID}_widget_${id}`);
            return saved ? JSON.parse(saved) : { colSpan: defaultColSpan, height: defaultHeight };
        } catch {
            return { colSpan: defaultColSpan, height: defaultHeight };
        }
    });

    // Save to LocalStorage whenever settings change
    useEffect(() => {
        window.localStorage.setItem(`${USER_ID}_widget_${id}`, JSON.stringify(settings));
    }, [id, settings]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const [menuRect, setMenuRect] = useState(null);

    // Close menu when clicking outside or scrolling
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        const handleScroll = (event) => {
            if (event.target.tagName !== 'INPUT') {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const toggleMenu = (e) => {
        if (!isMenuOpen) {
            setMenuRect(e.currentTarget.getBoundingClientRect());
            setIsMenuOpen(true);
        } else {
            setIsMenuOpen(false);
        }
    };

    // Grid Column Mapping (Tailwind classes)
    const colSpanClass = {
        2: 'md:col-span-2',
        3: 'md:col-span-3',
        4: 'md:col-span-4',
        5: 'md:col-span-5',
        6: 'md:col-span-6',
        7: 'md:col-span-7',
        8: 'md:col-span-8',
        9: 'md:col-span-9',
        10: 'md:col-span-10',
        11: 'md:col-span-11',
        12: 'md:col-span-12',
    }[settings.colSpan] || `md:col-span-${settings.colSpan}`;

    return (
        <div
            className={`bg-[#1f1f1f] rounded-xl border border-white/5 shadow-lg flex flex-col relative transition-all duration-300 ${colSpanClass}`}
            style={{ 
                height: `${settings.height}px`,
                gridRowEnd: `span ${Number(settings.height) + 24}`
            }}
        >
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 h-14">
                <div className={`flex items-center gap-2 ${iconColor}`}>
                    {Icon && <Icon size={18} />}
                    <span className="font-bold text-xs tracking-widest uppercase">{title}</span>
                </div>

                <div className="flex items-center gap-2">
                    {headerAction}

                    {/* Settings Menu Trigger */}
                    <div>
                        <button
                            ref={buttonRef}
                            onClick={toggleMenu}
                            className={`p-1 rounded-md transition-colors ${isMenuOpen ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <Settings size={14} />
                        </button>

                        {/* Settings Dropdown Portal */}
                        {isMenuOpen && menuRect && createPortal(
                            <div 
                                ref={menuRef}
                                className="fixed w-64 bg-[#262626] border border-white/10 rounded-xl shadow-2xl z-[3000] p-4 text-left"
                                style={{ 
                                    top: menuRect.bottom + 8,
                                    left: Math.max(16, menuRect.right - 256)
                                }}
                            >
                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                    <span className="text-xs font-bold text-white">Görünüm Ayarları</span>
                                    <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-white"><X size={12} /></button>
                                </div>

                                {/* Width Slider */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Genişlik ({settings.colSpan}/12)</label>
                                    </div>
                                    <input
                                        type="range"
                                        min="2"
                                        max="12"
                                        step="1"
                                        value={settings.colSpan}
                                        onChange={(e) => setSettings({ ...settings, colSpan: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#137fec]"
                                    />
                                    <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono">
                                        <span>Dar</span>
                                        <span>Geniş</span>
                                    </div>
                                </div>

                                {/* Height Slider */}
                                <div className="mb-4">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Yükseklik ({settings.height}px)</label>
                                    <input
                                        type="range"
                                        min="250"
                                        max="800"
                                        step="10"
                                        value={settings.height}
                                        onChange={(e) => setSettings({ ...settings, height: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#137fec]"
                                    />
                                </div>

                                {/* Move Controls */}
                                <div className="border-t border-white/5 pt-3">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Sıralama</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onMove && onMove('left')}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                                        >
                                            ❮ Sola Taşı
                                        </button>
                                        <button
                                            onClick={() => onMove && onMove('right')}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                                        >
                                            Sağa Taşı ❯
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                <div className="h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
