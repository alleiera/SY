import React, { useState, useMemo } from 'react';
import { Handle, Position, useReactFlow, NodeResizer, useStore } from '@xyflow/react';
import { useRecipeStore } from '../store';
import { useCodeStore, generatePreviewFromTemplate } from '../../../store/codeStore';
import { supabase } from '../../../supabase';

const tableCache = new Map<string, any[]>();
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Focus,
  FolderPlus,
  Info,
  Italic,
  Palette,
  Trash2,
  Underline,
} from 'lucide-react';
import { getRecipeIcon } from '../iconRegistry';

import { getInheritedData } from '../utils/recipeUtils';

const useInheritedData = (nodeId: string) => {
  const selector = useMemo(() => {
    let lastVersion = -1;
    let lastResult: any = null;
    return (state: any) => {
      // Sürükleme vb. işlemlerde (dataVersion değişmediğinde) anında eski sonucu dön
      // Bu sayede sürükleme esnasında getInheritedData çalışmaz (O(1) performans)
      if (state.dataVersion === lastVersion) return lastResult;
      
      const newResult = getInheritedData(nodeId, state.nodes, state.edges);
      
      if (lastResult && JSON.stringify(lastResult) === JSON.stringify(newResult)) {
        lastVersion = state.dataVersion;
        return lastResult; // Veri değişmediyse eski referansı dön (re-render'ı engeller)
      }
      
      lastVersion = state.dataVersion;
      lastResult = newResult;
      return newResult;
    };
  }, [nodeId]);

  return useRecipeStore(selector);
};

export const GroupNode = React.memo(({ id, data, selected, targetPosition, sourcePosition }: { id: string, data: any, selected?: boolean, targetPosition?: Position, sourcePosition?: Position }) => {
  const updateNodeData = useRecipeStore((state) => state.updateNodeData);
  const setNodesToDelete = useRecipeStore((state) => state.setNodesToDelete);
  const toggleGroupCollapse = useRecipeStore((state) => state.toggleGroupCollapse);
  const isConnectingMode = useRecipeStore((state) => state.isConnectingMode);
  const filterText = useRecipeStore((state) => state.filterText);
  const filterType = useRecipeStore((state) => state.filterType);
  const { fitView, updateNode } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);

  // Auto-fit bounding box calculation
  const boundingBoxSig = useStore((s) => {
    const children = Array.from(s.nodeLookup.values()).filter((n) => n.parentId === id);
    if (children.length === 0) return '';
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    children.forEach(child => {
       const x = child.position.x;
       const y = child.position.y;
       const w = child.measured?.width ?? 260;
       const h = child.measured?.height ?? 350;
       if (x < minX) minX = x;
       if (y < minY) minY = y;
       if (x + w > maxX) maxX = x + w;
       if (y + h > maxY) maxY = y + h;
    });
    return `${minX},${minY},${maxX},${maxY}`;
  });

  React.useEffect(() => {
     if (!boundingBoxSig || data.isCollapsed) return;
     const [minX, minY, maxX, maxY] = boundingBoxSig.split(',').map(Number);
     if (minX === Infinity) return;

     const padding = 40;
     const requiredWidth = maxX + padding;
     const requiredHeight = maxY + padding;

     updateNode(id, (node) => {
       const currentWidth = parseInt(node.style?.width as string) || 280;
       const currentHeight = parseInt(node.style?.height as string) || 60;
       
       let newWidth = currentWidth;
       let newHeight = currentHeight;
       let changed = false;

       // Sadece büyütme yapıyoruz, küçültmeyi manuel resizer'a bırakıyoruz
       if (requiredWidth > currentWidth) { newWidth = requiredWidth; changed = true; }
       if (requiredHeight > currentHeight) { newHeight = requiredHeight; changed = true; }
       
       if (changed) {
         return { ...node, style: { ...node.style, width: newWidth, height: newHeight } };
       }
       return node;
    });
  }, [boundingBoxSig, data.isCollapsed, id, updateNode]);

  const isFilterActive = filterText.length > 0 || filterType !== 'ALL';
  const matchesText = !filterText || (data.label || 'Yeni Grup').toLowerCase().includes(filterText.toLowerCase());
  const matchesType = filterType === 'ALL' || filterType === 'GROUP';
  const isFilteredOut = isFilterActive && !(matchesText && matchesType);
  const filterClasses = isFilterActive && !isFilteredOut ? 'ring-4 ring-amber-400 shadow-xl scale-[1.02] z-50' : '';

  const handleFocus = () => {
    if (data.isCollapsed) {
      toggleGroupCollapse(id);
    }
    setTimeout(() => {
      fitView({ nodes: [{ id }], duration: 800, padding: 0.2 });
    }, 100);
  };

  return (
    <>
      <NodeResizer minWidth={280} minHeight={60} isVisible={selected && !data.isCollapsed} lineClassName="border-indigo-400" handleClassName="h-3 w-3 bg-white border-2 border-indigo-500 rounded" />
      <div className={`w-full h-full min-w-[280px] min-h-[60px] bg-indigo-50/40 border-[3px] border-indigo-300 rounded-3xl relative group transition-all hover:border-indigo-400 shadow-sm pointer-events-none ${isConnectingMode ? 'cursor-crosshair' : ''} ${filterClasses}`}>
      {id === 'node-1' && <Handle type="target" position={targetPosition || Position.Left} id="left-input" className="!w-4 !h-4 !border-2 !border-white shadow-sm !bg-slate-400 hover:!bg-slate-500 cursor-pointer z-10 pointer-events-auto" />}
      <div className={`absolute top-0 left-0 w-full h-16 bg-indigo-100/90 border-indigo-200 rounded-t-2xl ${data.isCollapsed ? 'rounded-b-2xl h-full border-b-0' : 'border-b'} pl-4 pr-6 flex items-center justify-between pointer-events-auto`} style={{ borderRadius: data.isCollapsed ? 'calc(1.5rem - 3px)' : 'calc(1.5rem - 3px) calc(1.5rem - 3px) 0 0' }}>
        <div className="flex items-center gap-2 flex-1 h-16">
          <FolderPlus size={18} className="text-indigo-600 cursor-pointer" onClick={() => toggleGroupCollapse(id)} />
          {isEditing ? (
            <input 
              type="text" 
              value={data.label || 'Yeni Grup'} 
              onChange={(e) => updateNodeData(id, { label: e.target.value })}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              autoFocus
              className="bg-transparent font-bold text-indigo-900 outline-none w-full text-lg nodrag"
              placeholder="Grup Adı"
            />
          ) : (
            <span
              onClick={() => toggleGroupCollapse(id)}
              onDoubleClick={() => {
                useRecipeStore.getState().saveHistory();
                setIsEditing(true);
              }}
              title="Daralt/Genişlet için tıkla, düzenlemek için çift tıkla"
              className="font-bold text-indigo-900 cursor-pointer select-none w-full text-lg truncate"
            >
              {data.label || 'Yeni Grup'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleFocus}
            className="text-indigo-400 hover:text-indigo-600 hover:bg-white p-1.5 rounded-lg transition-colors"
            title="Gruba Odaklan"
          >
            <Focus size={18} />
          </button>
          <button 
            onClick={() => toggleGroupCollapse(id)}
            className="text-indigo-400 hover:text-indigo-600 hover:bg-white p-1.5 rounded-lg transition-colors"
            title={data.isCollapsed ? "Grubu Genişlet" : "Grubu Daralt"}
          >
            {data.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button 
            onClick={() => setNodesToDelete([id])}
            className="text-indigo-400 hover:text-red-500 hover:bg-white p-1.5 rounded-lg transition-colors"
            title="Grubu Sil"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
    </>
  );
});

export const BaseNode = React.memo(({ id, data, typeKey, targetPosition, sourcePosition }: { id: string, data: any, typeKey: string, targetPosition?: Position, sourcePosition?: Position }) => {
  const updateNodeData = useRecipeStore((state) => state.updateNodeData);
  const setNodesToDelete = useRecipeStore((state) => state.setNodesToDelete);
  const isConnectingMode = useRecipeStore((state) => state.isConnectingMode);
  const sourceNodeId = useRecipeStore((state) => state.sourceNodeId);
  const filterText = useRecipeStore((state) => state.filterText);
  const filterType = useRecipeStore((state) => state.filterType);
  const setMaterialSelectorState = useRecipeStore((state) => state.setMaterialSelectorState);
  
  const nodeTypesConfig = useRecipeStore(state => state.nodeTypesConfig);
  const config = nodeTypesConfig.find(nt => nt.code_key === typeKey);
  
  const { templates, categoryMapping } = useCodeStore();
  const inheritedData = useInheritedData(id);

  const [dynamicPorts, setDynamicPorts] = React.useState<any[]>(config?.dynamic_ports_table ? tableCache.get(config.dynamic_ports_table) || [] : []);

  React.useEffect(() => {
    const tableName = config?.dynamic_ports_table;
    if (tableName && dynamicPorts.length === 0) {
      if (tableCache.has(tableName)) {
        setDynamicPorts(tableCache.get(tableName)!);
      } else {
        supabase.from(tableName).select('*').order('id', { ascending: true })
          .then(({ data }) => {
            if (data) {
              tableCache.set(tableName, data);
              setDynamicPorts(data);
            }
          });
      }
    }
  }, [config?.dynamic_ports_table, dynamicPorts.length]);

  if (!config) return null;

  const combinedData = {
    ...inheritedData,
    ...data,
  };

  const productCategory = data.productCategory || 'raw';
  const templateId = data.templateId || categoryMapping?.[productCategory]?.sku;
  const descTemplateId = data.descTemplateId || categoryMapping?.[productCategory]?.desc;
  const selectedTemplate = templates.find(t => t.id === templateId);
  const selectedDescTemplate = templates.find(t => t.id === descTemplateId);
  
  const generatedSku = generatePreviewFromTemplate(selectedTemplate, combinedData);
  const generatedDesc = generatePreviewFromTemplate(selectedDescTemplate, combinedData);
  
  const Icon = getRecipeIcon(config.icon_name);
  const isSource = sourceNodeId === id;

  const isFilterActive = filterText.length > 0 || filterType !== 'ALL';
  const matchesText = !filterText || (data.label || '').toLowerCase().includes(filterText.toLowerCase());
  const matchesType = filterType === 'ALL' || filterType === typeKey;
  const isFilteredOut = isFilterActive && !(matchesText && matchesType);
  const filterClasses = isFilterActive && !isFilteredOut ? 'ring-4 ring-amber-400 shadow-xl scale-[1.02] z-50' : '';

  const borderColorClass = config.color_classes?.split(' ')[1] || 'border-slate-500';
  const topBarColor = borderColorClass.replace('border-', 'bg-');

  return (
    <div className={`w-60 rounded-md border border-[#333] shadow-lg flex flex-col bg-[#1e1e1e] transition-all group ${
      isSource ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105' : ''
    } ${isConnectingMode ? 'cursor-crosshair' : ''} ${filterClasses}`}>
      
      {/* CANLI SKU GÖSTERİMİ */}
      {(generatedSku || generatedDesc) && (
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-mono px-3 py-0.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {generatedSku || generatedDesc || 'SKU Bekleniyor...'}
      </div>
      )}

      {config.port_in && (
        <Handle 
          type="target" 
          position={targetPosition || Position.Top} 
          style={(targetPosition === Position.Left || targetPosition === Position.Right) ? { top: 16 } : undefined}
          className="!w-3 !h-3 !border-2 !border-[#1e1e1e] shadow-sm !bg-gray-400 hover:!bg-gray-300 cursor-pointer z-10" 
        />
      )}
      {id === 'node-1' && (
        <Handle 
          type="target" 
          position={targetPosition || Position.Left} 
          id="left-input" 
          style={((targetPosition || Position.Left) === Position.Left || (targetPosition || Position.Left) === Position.Right) ? { top: 16 } : undefined}
          className="!w-3 !h-3 !border-2 !border-[#1e1e1e] shadow-sm !bg-gray-400 hover:!bg-gray-300 cursor-pointer z-10" 
        />
      )}
      
      <div className={`h-1.5 w-full rounded-t-[5px] ${topBarColor}`} />
      
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">{config.label}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative group/info flex items-center">
            <Info size={12} className="text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#2a2a2a] border border-[#444] text-gray-200 text-xs rounded shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 pointer-events-none text-center font-normal leading-relaxed">
              {config.description}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#444]"></div>
            </div>
          </div>
          <button 
            onClick={() => setNodesToDelete([id])}
            className="text-gray-500 hover:text-red-400 transition-colors"
            title="Düğümü Sil"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <div className="flex items-center px-4 py-2 flex-col items-stretch justify-center gap-2 h-full">
        {/* Label / Material Picker */}
        <div className="w-full relative group/picker nodrag">
          <input
            type="text"
            placeholder={(config.material_type_filters?.length ?? 0) > 0 ? "Çift tıklayarak malzeme seç..." : "İsim veya Etiket girin"}
            value={data.label || ''}
            readOnly={(config.material_type_filters?.length ?? 0) > 0}
            onChange={(e) => {
              if (!(config.material_type_filters && config.material_type_filters.length > 0)) {
                updateNodeData(id, { label: e.target.value });
              }
            }}
            className={`w-full text-sm font-medium bg-transparent border-b outline-none px-1 py-1 transition-colors ${
              (config.material_type_filters?.length ?? 0) > 0
                ? 'cursor-pointer text-blue-400 border-blue-900/50 hover:border-blue-500 focus:border-blue-500'
                : 'text-gray-100 border-[#333] focus:border-blue-500 placeholder-gray-600'
            }`}
          />
          {/* Click Overlay */}
           {config.material_type_filters && config.material_type_filters.length > 0 && (
            <div 
              className="absolute inset-0 cursor-pointer z-10"
              onDoubleClick={() => {
                setMaterialSelectorState({ nodeId: id, allowedTypes: config.material_type_filters! });
              }}
              title="Malzeme seçmek için çift tıklayın"
            />
          )}
        </div>

        {config.product_group && (
          <div className="w-full mt-1 bg-[#252525] border border-[#333] rounded px-2 py-1 flex items-center gap-1.5" title="Bu düğümün ürettiği ürün grubu">
            <span className="text-[8px] font-bold text-gray-500 uppercase">Grup:</span>
            <span className="text-[9px] font-bold text-gray-300">{config.product_group}</span>
          </div>
        )}

        {/* Dinamik Özellikler */}
        {config.attributes && config.attributes.slice().sort((a, b) => a.display_order - b.display_order).map((attr) => {
          if (attr.field_type === 'text' || attr.field_type === 'number') {
            return (
              <div key={attr.id} className="flex flex-col gap-1 w-full mt-1">
                <label className="text-[8px] font-bold text-gray-500 uppercase ml-1">{attr.label}</label>
                <input
                  type={attr.field_type}
                  value={data[attr.field_key] || ''}
                  onChange={(e) => updateNodeData(id, { [attr.field_key]: attr.field_type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                  className="w-full text-[10px] font-medium text-gray-200 bg-[#252525] border border-[#333] rounded px-2 py-1 outline-none nodrag focus:border-blue-500 transition-colors"
                />
              </div>
            );
          } else if (attr.field_type === 'select') {
            const options = Array.isArray(attr.options) ? attr.options : [];
            return (
              <div key={attr.id} className="flex flex-col gap-1 w-full mt-1">
                <label className="text-[8px] font-bold text-gray-500 uppercase ml-1">{attr.label}</label>
                <select
                  value={data[attr.field_key] || ''}
                  onChange={(e) => updateNodeData(id, { [attr.field_key]: e.target.value })}
                  className="w-full text-[10px] font-medium text-gray-200 bg-[#252525] border border-[#333] rounded px-2 py-1 outline-none nodrag cursor-pointer focus:border-blue-500 transition-colors"
                >
                  <option value="">Seçiniz...</option>
                  {options.map((opt: any, idx: number) => (
                    <option key={idx} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          }
          return null;
        })}

        {/* Kod Şablonu Seçicileri */}
        {config.has_code_templates && (
          <div className="flex flex-col gap-1.5 w-full mt-1 pt-2 border-t border-[#333]">
            <label className="text-[8px] font-bold uppercase ml-1 text-gray-500">
              Kod Şablonları
            </label>

            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-gray-500 ml-1 font-medium">Stok Kodu (SKU)</span>
              <select
                value={data.templateId || ''}
                onChange={(e) => updateNodeData(id, { templateId: e.target.value || undefined })}
                className="w-full text-[10px] font-medium text-gray-200 border rounded px-2 py-1 outline-none nodrag cursor-pointer transition-colors bg-[#252525] border-[#333] hover:border-[#555]"
              >
                <option value="">— Kategori Varsayılanı —</option>
                {templates.filter((t: any) => t.type === 'SKU').map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-gray-500 ml-1 font-medium">Açıklama (DESC)</span>
              <select
                value={data.descTemplateId || ''}
                onChange={(e) => updateNodeData(id, { descTemplateId: e.target.value || undefined })}
                className="w-full text-[10px] font-medium text-gray-200 border rounded px-2 py-1 outline-none nodrag cursor-pointer transition-colors bg-[#252525] border-[#333] hover:border-[#555]"
              >
                <option value="">— Kategori Varsayılanı —</option>
                {templates.filter((t: any) => t.type === 'DESC').map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {(generatedSku || generatedDesc) && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {generatedSku && (
                  <div className="px-2 py-1 rounded text-[9px] font-mono font-bold truncate bg-slate-100 text-slate-800" title={generatedSku}>
                    <span className="opacity-60 mr-1">SKU:</span>{generatedSku}
                  </div>
                )}
                {generatedDesc && (
                  <div className="px-2 py-1 rounded text-[9px] font-mono truncate bg-slate-50 text-slate-600" title={generatedDesc}>
                    <span className="opacity-60 mr-1">DESC:</span>{generatedDesc}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {config.has_consumption && (
          <div className="flex items-center gap-2 w-full mt-2">
            <input
              type="number"
              placeholder="Miktar"
              value={data.amount || ''}
              onChange={(e) => updateNodeData(id, { amount: parseFloat(e.target.value) || undefined })}
              className="w-20 text-xs font-medium text-gray-200 bg-[#252525] border border-[#333] rounded focus:border-blue-500 outline-none px-2 py-1.5 nodrag"
            />
            <select
              value={data.unit || 'kg'}
              onChange={(e) => updateNodeData(id, { unit: e.target.value })}
              className="flex-1 text-xs font-medium text-gray-200 bg-[#252525] border border-[#333] rounded focus:border-blue-500 outline-none px-2 py-1.5 nodrag cursor-pointer"
            >
              <option value="kg">kg</option>
              <option value="gr">gr</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="adet">adet</option>
              <option value="m²">m²</option>
            </select>
          </div>
        )}

        {config.dynamic_ports_table && dynamicPorts.length > 0 && (
          <div className="w-full mt-2 pt-2 border-t border-[#333] flex flex-col gap-1 relative">
            <label className="text-[8px] font-bold uppercase ml-1 text-gray-500 mb-1">
              Çıkış Noktaları
            </label>
            {dynamicPorts.map((port) => (
              <div key={port.id} className="relative flex items-center justify-between px-2 py-1 bg-[#252525] border border-[#333] rounded text-[10px] font-medium text-gray-300">
                <span className="truncate pr-2">{port.name || port.measured_value || port.code} {port.unit || ''}</span>
                {/* Her satır için Handle ekliyoruz */}
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={`source-${config.dynamic_ports_table}-${port.id}-${encodeURIComponent(port.name || port.measured_value || port.code || '')}`} 
                  className="!w-3 !h-3 !border-2 !border-[#1e1e1e] shadow-sm !bg-gray-400 hover:!bg-gray-300 !right-[-10px]" 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {config.port_out && (
        <Handle 
          type="source" 
          position={sourcePosition || Position.Bottom} 
          style={(sourcePosition === Position.Right || sourcePosition === Position.Left) ? { top: 16 } : undefined}
          className="!w-3 !h-3 !border-2 !border-[#1e1e1e] shadow-sm !bg-gray-400 hover:!bg-gray-300 cursor-pointer z-10" 
        />
      )}
    </div>
  );
});

export const NoteNode = React.memo(({ id, data, selected }: { id: string, data: any, selected?: boolean }) => {
  const updateNodeData = useRecipeStore((state) => state.updateNodeData);
  const setNodesToDelete = useRecipeStore((state) => state.setNodesToDelete);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const savedRangeRef = React.useRef<Range | null>(null);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = React.useState(false);
  const [currentFontSize, setCurrentFontSize] = React.useState("3");
  const isInitialRender = React.useRef(true);

  const fontSizes = [
    { value: "1", label: "Çok Küçük" },
    { value: "2", label: "Küçük" },
    { value: "3", label: "Normal" },
    { value: "4", label: "Büyük" },
    { value: "5", label: "Çok Büyük" },
    { value: "6", label: "Başlık" },
    { value: "7", label: "Dev Başlık" }
  ];

  const colors = [
    '#000000', '#475569', '#94a3b8', '#ffffff',
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
    '#7f1d1d', '#9a3412', '#713f12', '#14532d', '#164e63', '#1e3a8a', '#581c87', '#831843'
  ];
  
  // React'in DOM'u ezmesini önleyerek seçimin (selection) kaybolmamasını sağlayan yapı
  React.useEffect(() => {
    if (contentRef.current) {
      if (isInitialRender.current) {
        contentRef.current.innerHTML = data.html !== undefined ? data.html : (data.text || '');
        isInitialRender.current = false;
      } else if (document.activeElement !== contentRef.current && data.html !== undefined) {
        if (contentRef.current.innerHTML !== data.html) {
          contentRef.current.innerHTML = data.html;
        }
      }
    }
  }, [data.html, data.text]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRangeRef.current);
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
    restoreSelection();
    
    // Modern tarayıcılarda eski etiketler (<font> vb.) yerine inline style (<span>) kullanılmasını zorla
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch (e) {
      // Bazı eski tarayıcılar bunu desteklemeyebilir, görmezden gel
    }
    
    document.execCommand(command, false, value);
    
    if (contentRef.current) {
      updateNodeData(id, { html: contentRef.current.innerHTML });
    }
    saveSelection();
  };

  return (
    <>
      <NodeResizer minWidth={150} minHeight={100} isVisible={selected} lineClassName="border-amber-400" handleClassName="h-3 w-3 bg-white border-2 border-amber-500 rounded" />
      
      {/* Zengin Metin Araç Çubuğu (Toolbar) */}
      <div className={`absolute -top-10 left-0 bg-white dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-lg shadow-lg flex items-center p-1 gap-0.5 transition-all z-50 ${selected ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('bold')} className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded" title="Kalın"><Bold size={14} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('italic')} className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded" title="Eğik"><Italic size={14} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('underline')} className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded" title="Altı Çizili"><Underline size={14} /></button>
        
        <div className="w-px h-4 bg-slate-200 dark:bg-gray-700 mx-1"></div>
        
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('justifyLeft')} className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded" title="Sola Hizala"><AlignLeft size={14} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('justifyCenter')} className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded" title="Ortala"><AlignCenter size={14} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('justifyRight')} className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded" title="Sağa Hizala"><AlignRight size={14} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('justifyFull')} className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded" title="İki Yana Yasla"><AlignJustify size={14} /></button>
        
        <div className="w-px h-4 bg-slate-200 dark:bg-gray-700 mx-1"></div>
        
        <div className="relative">
          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`p-1.5 rounded transition-colors flex items-center justify-center ${showColorPicker ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333]'}`}
            title="Yazı Rengi"
          >
            <Palette size={14} />
          </button>
          
          {showColorPicker && (
            <div 
              className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#333] rounded-lg shadow-xl z-[100] grid grid-cols-4 gap-1.5 w-32"
            >
              {colors.map(color => (
                <button
                  type="button"
                  key={color}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { 
                    execCommand('foreColor', color);
                  }}
                  className="w-5 h-5 rounded border border-slate-200 dark:border-[#444] hover:scale-125 hover:z-10 transition-all shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="w-px h-4 bg-slate-200 dark:bg-gray-700 mx-1"></div>
        
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
            className={`text-xs border border-transparent rounded px-2 py-1 flex items-center gap-1 transition-colors ${showFontSizePicker ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#333]'}`}
            title="Yazı Boyutu"
          >
            <span>{fontSizes.find(f => f.value === currentFontSize)?.label || "Normal"}</span>
            <ChevronDown size={12} className="opacity-70" />
          </button>
          
          {showFontSizePicker && (
            <div className="absolute top-full right-0 mt-2 py-1 bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#333] rounded-lg shadow-xl z-[100] flex flex-col w-28">
              {fontSizes.map(font => (
                <button
                  type="button"
                  key={font.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    execCommand('fontSize', font.value);
                    setCurrentFontSize(font.value);
                    setShowFontSizePicker(false);
                  }}
                  className={`text-xs text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#333] transition-colors ${currentFontSize === font.value ? 'bg-slate-50 dark:bg-[#2a2a2a] text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-gray-300'}`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`w-full h-full min-w-[150px] min-h-[100px] bg-[#fdf5e6] dark:bg-amber-900/60 border-[2px] ${selected ? 'border-amber-400 shadow-md' : 'border-[#f5e6d3] dark:border-amber-800/50 shadow-sm'} rounded-lg relative group transition-all`}>
        {/* Drag handle area at the top */}
        <div className="absolute top-0 left-0 w-full h-6 bg-black/5 dark:bg-white/5 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2 cursor-grab active:cursor-grabbing">
           <div className="flex gap-1 items-center h-full w-full">
             <div className="flex gap-1 pl-1">
               <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></div>
             </div>
           </div>
           <button 
            onClick={() => setNodesToDelete([id])}
            className="absolute right-1 top-1 text-amber-600/50 hover:text-red-500 hover:bg-white/50 dark:hover:bg-black/50 p-0.5 rounded transition-colors z-10 cursor-pointer pointer-events-auto"
            title="Notu Sil"
          >
            <Trash2 size={12} />
          </button>
        </div>
        
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className="w-full h-full p-4 pt-6 bg-transparent outline-none nodrag text-sm text-amber-950 dark:text-amber-100 font-medium leading-relaxed overflow-y-auto"
          onInput={(e) => updateNodeData(id, { html: e.currentTarget.innerHTML })}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onBlur={saveSelection}
          style={{ cursor: 'text', wordBreak: 'break-word' }}
        />
        {(!data.html && !data.text) && (
          <div className="absolute top-6 left-4 pointer-events-none text-sm text-amber-700/40 dark:text-amber-300/40 font-medium">
            Buraya notunuzu yazın... (Biçimlendirmek için seçin)
          </div>
        )}
      </div>
    </>
  );
});
