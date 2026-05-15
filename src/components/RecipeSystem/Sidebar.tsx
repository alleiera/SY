import React, { useState } from 'react';
import { useRecipeStore } from './store';
import { PanelLeftClose, PanelLeftOpen, StickyNote } from 'lucide-react';
import { getRecipeIcon } from './iconRegistry';
import { useSettings } from '../../context/SettingsContext';

export function Sidebar() {
  const { theme } = useSettings();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const nodeTypesConfig = useRecipeStore(state => state.nodeTypesConfig);

  return (
    <aside className={`transition-all duration-300 ease-in-out border-r flex flex-col h-full shadow-sm z-10 shrink-0 ${isCollapsed ? 'w-14' : 'w-64'} ${isDarkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
      <div className={`p-3 border-b flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isDarkMode ? 'border-[#2a2a2a] bg-[#1f1f1f]' : 'border-gray-200 bg-gray-50'}`}>
        {!isCollapsed && (
          <div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-slate-800'}`}>Düğüm Türleri</h2>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}
          title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <div className={`flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'items-center p-1.5' : 'p-2'}`}>
        {!isCollapsed && <p className={`text-[10px] px-1 mb-1 font-medium ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>Sürükleyip çalışma alanına bırakın.</p>}
        {nodeTypesConfig.map((config) => {
          const Icon = getRecipeIcon(config.icon_name);
          return (
            <div
              key={config.id}
              className={`flex items-center border rounded-md cursor-grab transition-all hover:shadow-md shrink-0 ${isCollapsed ? 'justify-center p-1.5 w-9' : 'gap-2.5 px-3 py-1.5 w-full'} ${isDarkMode ? 'bg-[#252525] border-[#333] hover:border-blue-500 text-gray-200' : config.color_classes}`}
              onDragStart={(event) => onDragStart(event, config.code_key)}
              draggable
              title={config.label}
            >
              <div className={`p-1 rounded shadow-sm border ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-current/10'} ${config.icon_color_classes}`}>
                <Icon size={14} />
              </div>
              {!isCollapsed && <span className="text-[13px] font-semibold flex-1 truncate">{config.label}</span>}
            </div>
          );
        })}
        
        {/* Statik Yapışkan Not (Sticky Note) Eklentisi */}
        <div
          className={`flex items-center border rounded-md cursor-grab transition-all hover:shadow-md shrink-0 ${isCollapsed ? 'justify-center p-1.5 w-9' : 'gap-2.5 px-3 py-1.5 w-full'} ${isDarkMode ? 'bg-[#252525] border-[#333] hover:border-amber-500 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}
          onDragStart={(event) => onDragStart(event, 'NOTE')}
          draggable
          title="Yapışkan Not (Kısayol: T)"
        >
          <div className={`p-1 rounded shadow-sm border ${isDarkMode ? 'bg-amber-900/30 border-amber-700/50 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-600'}`}>
            <StickyNote size={14} />
          </div>
          {!isCollapsed && <span className="text-[13px] font-semibold flex-1 truncate">Yapışkan Not</span>}
        </div>
      </div>
    </aside>
  );
}
