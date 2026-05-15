import React from 'react';
import { Save, RotateCw, Download, Filter } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useRibbonStore } from '../store/ribbonStore';

export default function RibbonMenu({ winId, onMouseDown, onDoubleClick }) {
    const { theme } = useSettings();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const colors = {
        ribbonBg: isDark ? 'bg-[#2b2b2b]' : 'bg-white',
        ribbonBorder: isDark ? 'border-[#333]' : 'border-[#e0e0e0]',
        text: isDark ? 'text-white' : 'text-gray-800',
        textMuted: isDark ? 'text-white/60' : 'text-gray-500',
        hover: isDark ? 'hover:bg-white/5' : 'hover:bg-black/5',
        activeTabBorder: 'border-[#137fec]',
        activeTabText: 'text-[#137fec]',
    };

    const ribbonData = useRibbonStore(state => state.ribbons[winId]);
    const activeTabId = ribbonData?.activeTab;
    const setActiveTab = useRibbonStore(state => state.setActiveTab);

    // Default static fallback
    const defaultTabs = ['Home', 'Insert', 'View', 'Manage', 'Help'];

    const renderTabs = () => {
        if (!ribbonData || !ribbonData.tabs) {
            return defaultTabs.map((rt, i) => (
                <button key={rt} className={`h-full px-4 text-[11px] font-semibold transition-all border-b-2 flex items-center ${i === 0 ? `${colors.activeTabText} ${colors.activeTabBorder}` : `${colors.textMuted} ${colors.hover} border-transparent`}`}>
                    {rt}
                </button>
            ));
        }

        return ribbonData.tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(winId, tab.id)}
                    className={`h-full px-4 text-[11px] font-semibold transition-all border-b-2 flex items-center ${isActive ? `${colors.activeTabText} ${colors.activeTabBorder}` : `${colors.textMuted} ${colors.hover} border-transparent`}`}
                >
                    {tab.label}
                </button>
            )
        });
    };

    const renderActiveTabContent = () => {
        if (!ribbonData || !ribbonData.tabs) {
            // Default static content
            return (
                <div className="flex items-center gap-4 h-full">
                    <div className={`flex items-center gap-1 border-r ${isDark ? 'border-[#333]' : 'border-gray-300'} pr-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        <button className={`p-1.5 rounded ${colors.hover}`}><Save size={18} /></button>
                        <div className={`w-[1px] h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div>
                        <RotateCw size={14} className={`${isDark ? 'hover:text-white' : 'hover:text-black'} cursor-pointer`} />
                        <Download size={14} className={`${isDark ? 'hover:text-white' : 'hover:text-black'} cursor-pointer ml-1`} />
                    </div>
                    <div className="flex items-center gap-3 pl-2">
                        <Filter size={16} className="text-[#137fec]" />
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Sistem Aktif</span>
                    </div>
                </div>
            );
        }

        const activeTab = ribbonData.tabs.find(t => t.id === activeTabId) || ribbonData.tabs[0];
        if (!activeTab || !activeTab.groups) return null;

        return (
            <div className="flex items-center h-full">
                {activeTab.groups.map((group, gIdx) => (
                    <div key={group.id} className={`flex items-center h-full ${gIdx < activeTab.groups.length - 1 ? `border-r ${isDark ? 'border-[#333]' : 'border-gray-300'} pr-3 mr-3` : ''}`}>
                        {/* Group Items */}
                        <div className="flex items-center gap-1">
                            {group.items.map(item => {
                                const Icon = item.icon;
                                return (
                                    <button 
                                        key={item.id}
                                        onClick={item.onClick}
                                        disabled={item.disabled}
                                        title={item.tooltip || item.label}
                                        className={`flex items-center justify-center p-1.5 rounded transition-colors ${item.disabled ? 'opacity-30 cursor-not-allowed' : `${colors.hover} cursor-pointer`} ${item.className || ''}`}
                                    >
                                        {Icon && <Icon size={item.iconSize || 16} className={item.iconColor || (item.disabled ? colors.textMuted : colors.text)} />}
                                        {item.label && <span className={`text-[11px] font-medium ml-1.5 ${item.disabled ? colors.textMuted : colors.text}`}>{item.label}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            className={`${colors.ribbonBg} border-b ${colors.ribbonBorder} flex items-center justify-between px-3 h-10 z-10 relative shrink-0 transition-colors duration-300 cursor-grab active:cursor-grabbing select-none`}
        >
            <div className="flex items-center gap-1 h-full nodrag" onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                {renderTabs()}
            </div>
            <div className="flex items-center gap-2 h-full nodrag" onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                {renderActiveTabContent()}
            </div>
        </div>
    );
}
