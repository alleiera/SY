import React, { useMemo } from 'react';
import { useRecipeStore } from './store';
import { getTableData, exportToCSV } from './utils/recipeUtils';
import { Table, FileDown, Network } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { UniversalDataGrid } from '../UniversalDataGrid';
import { Column } from '../UniversalDataGrid/types';

export function TableView() {
  const { nodes, edges, nodeTypesConfig } = useRecipeStore();
  const { theme } = useSettings();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const rawData = useMemo(() => getTableData(nodes, edges, nodeTypesConfig), [nodes, edges, nodeTypesConfig]);

  // Çoklu öğe içeren hücreleri render eden renderer
  const itemRenderer = (params: any) => {
    const items = params.value;
    if (!items || items.length === 0) return <span className="opacity-50 italic">-</span>;

    // Config'den renk bilgisini al
    const config = nodeTypesConfig.find(c => c.code_key === params.colDef.field);
    const colorClasses = config?.color_classes || '';

    // Renk sınıflarından tema rengi çıkar
    let borderColor = 'border-slate-400/30';
    let bgColor = 'bg-slate-500/10';
    let textColor = 'text-slate-600 dark:text-slate-400';
    let badgeBg = 'bg-slate-500/20';

    if (colorClasses.includes('amber')) {
      borderColor = 'border-amber-500/30'; bgColor = 'bg-amber-500/10'; textColor = 'text-amber-600 dark:text-amber-400'; badgeBg = 'bg-amber-500/20';
    } else if (colorClasses.includes('blue')) {
      borderColor = 'border-blue-500/30'; bgColor = 'bg-blue-500/10'; textColor = 'text-blue-600 dark:text-blue-400'; badgeBg = 'bg-blue-500/20';
    } else if (colorClasses.includes('purple')) {
      borderColor = 'border-purple-500/30'; bgColor = 'bg-purple-500/10'; textColor = 'text-purple-600 dark:text-purple-400'; badgeBg = 'bg-purple-500/20';
    } else if (colorClasses.includes('cyan')) {
      borderColor = 'border-cyan-500/30'; bgColor = 'bg-cyan-500/10'; textColor = 'text-cyan-600 dark:text-cyan-400'; badgeBg = 'bg-cyan-500/20';
    } else if (colorClasses.includes('pink')) {
      borderColor = 'border-pink-500/30'; bgColor = 'bg-pink-500/10'; textColor = 'text-pink-600 dark:text-pink-400'; badgeBg = 'bg-pink-500/20';
    } else if (colorClasses.includes('green') || colorClasses.includes('emerald')) {
      borderColor = 'border-emerald-500/30'; bgColor = 'bg-emerald-500/10'; textColor = 'text-emerald-600 dark:text-emerald-400'; badgeBg = 'bg-emerald-500/20';
    } else if (colorClasses.includes('red') || colorClasses.includes('rose')) {
      borderColor = 'border-rose-500/30'; bgColor = 'bg-rose-500/10'; textColor = 'text-rose-600 dark:text-rose-400'; badgeBg = 'bg-rose-500/20';
    } else if (colorClasses.includes('orange')) {
      borderColor = 'border-orange-500/30'; bgColor = 'bg-orange-500/10'; textColor = 'text-orange-600 dark:text-orange-400'; badgeBg = 'bg-orange-500/20';
    }

    return (
      <div className="flex flex-wrap gap-1.5 py-1.5 -ml-1">
        {items.map((item: any, idx: number) => (
          <div key={idx} className={`flex items-stretch text-xs border rounded overflow-hidden shadow-sm ${borderColor} ${bgColor} ${textColor}`}>
            <div className="px-2 py-0.5 font-bold flex items-center">{item.name}</div>
            {item.code && (
              <div className={`px-2 py-0.5 border-l ${borderColor} ${badgeBg} text-slate-800 dark:text-white font-mono text-[10.5px] flex items-center font-bold tracking-wider`}>
                {item.code}
              </div>
            )}
            {item.amount !== undefined && (
              <div className={`px-2 py-0.5 border-l ${borderColor} ${badgeBg} text-slate-800 dark:text-white font-mono text-[10.5px] flex items-center font-bold tracking-wider`}>
                {item.amount} {item.unit}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Tekli değer hücresi (terminal node etiketi gibi)
  const labelRenderer = (params: any) => {
    if (!params.value || params.value === '-') return <span className="opacity-50 italic">-</span>;
    return <span className="font-medium">{params.value}</span>;
  };

  // Sütunları dinamik olarak nodeTypesConfig'den üret
  const columns: Column[] = useMemo(() => {
    const baseColumns: Column[] = [
      { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
      { field: 'groupName', headerName: 'Grup', width: 130, pinned: 'left' },
      { field: 'terminalLabel', headerName: 'Düğüm Adı', width: 160, pinned: 'left', cellRenderer: labelRenderer },
    ];

    const typeColumns: Column[] = nodeTypesConfig.map(config => ({
      field: config.code_key,
      headerName: config.label,
      width: 240,
      cellRenderer: itemRenderer,
    }));

    return [...baseColumns, ...typeColumns];
  }, [nodeTypesConfig]);

  if (rawData.length === 0) {
    return (
      <div className={`flex-1 h-full flex flex-col items-center justify-center animate-in fade-in duration-300 ${isDarkMode ? 'bg-[#121212]' : 'bg-slate-50'}`}>
        <Network size={48} className={`mb-4 ${isDarkMode ? 'text-gray-700' : 'text-slate-300'}`} />
        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Henüz Gösterilecek Veri Yok</p>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-600' : 'text-slate-400'}`}>Ağ görünümüne geçip düğümleri birbirine bağlayarak reçetenizi oluşturun.</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 h-full w-full relative animate-in fade-in duration-300 ${isDarkMode ? 'bg-[#181818]' : 'bg-white'}`}>
      <div className={`h-14 px-4 flex items-center justify-between border-b shrink-0 ${isDarkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <Table size={18} className="text-[#137fec]" />
          <h2 className={`text-sm font-bold tracking-wide uppercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            Üretim Reçeteleri Veritabanı
          </h2>
        </div>
        <button
          onClick={() => exportToCSV(rawData, nodeTypesConfig)}
          disabled={rawData.length === 0}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-white border border-[#333]' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
        >
          <FileDown size={14} /> CSV İndir
        </button>
      </div>

      <div className="absolute top-14 left-0 right-0 bottom-0">
        <UniversalDataGrid
          gridId="recipe-table-view-grid"
          initialData={rawData}
          initialColumns={columns}
          features={{
            enableGrouping: true,
            enableFiltering: true,
            enableSorting: true,
            enablePagination: true,
            enableSidebar: true,
            enableExport: false,
            enableSelection: true
          }}
        />
      </div>
    </div>
  );
}
