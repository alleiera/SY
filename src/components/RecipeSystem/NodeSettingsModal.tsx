import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Type, Hash, List, Search, Package, Box } from 'lucide-react';
import { useRecipeStore } from './store';
import { NodeTypeConfig, NodeAttribute } from './store';
import { getRecipeIcon } from './iconRegistry';
import { useSettings } from '../../context/SettingsContext';
import { fetchMaterialTypes } from '../../services/materialService';
import FeedbackBanner from '../FeedbackBanner';
import ConfirmDialog from '../ConfirmDialog';

interface NodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { label: 'Sarı (Hammadde)', value: 'bg-amber-50 border-amber-400 text-amber-900' },
  { label: 'Turuncu (Yarı Mamul)', value: 'bg-orange-50 border-orange-400 text-orange-900' },
  { label: 'Yeşil (Nihai Ürün)', value: 'bg-emerald-50 border-emerald-400 text-emerald-900' },
  { label: 'Mavi (İşlem)', value: 'bg-blue-50 border-blue-400 text-blue-900' },
  { label: 'Mor (Özel)', value: 'bg-purple-50 border-purple-400 text-purple-900' },
  { label: 'Gri (Pasif)', value: 'bg-slate-50 border-slate-400 text-slate-900' }
];

export function NodeSettingsModal({ isOpen, onClose }: NodeSettingsModalProps) {
  const { nodeTypesConfig, saveNodeType, deleteNodeType, saveNodeAttribute, deleteNodeAttribute } = useRecipeStore();
  const { theme } = useSettings();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [activeNodeId, setActiveNodeId] = useState<string>('');
  const [editingNode, setEditingNode] = useState<Partial<NodeTypeConfig> | null>(null);
  const [editingAttributes, setEditingAttributes] = useState<Partial<NodeAttribute>[]>([]);
  const [iconSearch, setIconSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; actionType: 'deleteNode' | 'deleteAttribute' | null; targetId: string | number | null; message: string }>({ isOpen: false, actionType: null, targetId: null, message: '' });

  // Fetch material types for the filter section
  useEffect(() => {
    if (isOpen) {
      fetchMaterialTypes().then((data) => {
        if (data) setMaterialTypeOptions(data.map((t: any) => ({
          value: t.material_group || t.name, // material_group benzersiz tanımlayıcı (HM, TB, B, 10...)
          label: t.name,
          code: t.code,
          group: t.material_group,
        })));
      }).catch(err => console.error("Error fetching material types:", err));
    }
  }, [isOpen]);

  // Initialize selected node
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      if (!activeNodeId && nodeTypesConfig.length > 0) {
        setActiveNodeId(nodeTypesConfig[0].id);
      }
    }
  }, [isOpen, nodeTypesConfig, activeNodeId]);

  // Sync editing state when activeNodeId changes
  useEffect(() => {
    if (activeNodeId === 'new') {
      setEditingNode({
        id: 'new',
        label: 'Yeni Düğüm',
        code_key: 'NEW_NODE',
        color_classes: COLOR_PRESETS[3].value,
        icon_name: 'Box',
        icon_color_classes: 'text-blue-600',
        port_in: true,
        port_out: true,
        has_consumption: false,
        material_type_filters: [],
      });
      setEditingAttributes([]);
    } else {
      const node = nodeTypesConfig.find(n => n.id === activeNodeId);
      if (node) {
        setEditingNode({ ...node });
        setEditingAttributes(node.attributes?.map(a => ({ ...a })) || []);
      }
    }
  }, [activeNodeId, nodeTypesConfig]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!editingNode || !editingNode.code_key || !editingNode.label) {
      setFeedback({ type: 'error', message: 'Kaydetmek için düğüm kodu ve düğüm adını doldurun.' });
      return;
    }
    
    setFeedback(null);
    setIsSaving(true);
    try {
      await saveNodeType(editingNode);
      if (activeNodeId !== 'new') {
        for (const attr of editingAttributes) {
          if (!attr.label || !attr.field_key) continue;
          await saveNodeAttribute({ ...attr, node_type_id: activeNodeId });
        }
        setFeedback({ type: 'success', message: 'Düğüm ve alan ayarları kaydedildi.' });
      } else {
        setFeedback({ type: 'info', message: 'Yeni düğüm oluşturuldu. Alan eklemek için soldan düğümü tekrar seçin.' });
        setActiveNodeId('');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Kaydetme sırasında hata oluştu: ' + (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNode = () => {
    setConfirmState({
      isOpen: true,
      actionType: 'deleteNode',
      targetId: activeNodeId,
      message: 'Bu düğüm türünü silmek istediğinize emin misiniz? Düğüme ait tüm form alanları ve bu düğümü kullanan reçeteler etkilenebilir!'
    });
  };

  const handleAddAttribute = () => {
    if (activeNodeId === 'new') {
      setFeedback({ type: 'info', message: 'Önce düğümü kaydedin, ardından form alanı ekleyin.' });
      return;
    }
    setFeedback(null);
    setEditingAttributes([...editingAttributes, {
      id: 'new-' + Date.now(),
      node_type_id: activeNodeId,
      label: '',
      field_key: '',
      field_type: 'text',
      display_order: editingAttributes.length
    }]);
  };

  const handleDeleteAttribute = async (index: number) => {
    const attr = editingAttributes[index];
    if (attr.id && !attr.id.startsWith('new-')) {
      setConfirmState({
        isOpen: true,
        actionType: 'deleteAttribute',
        targetId: index,
        message: 'Bu alanı veritabanından kalıcı olarak silmek istediğinize emin misiniz?'
      });
    } else {
      setEditingAttributes(editingAttributes.filter((_, i) => i !== index));
    }
  };

  const executeConfirm = async () => {
    const { actionType, targetId } = confirmState;
    setConfirmState({ isOpen: false, actionType: null, targetId: null, message: '' });

    if (actionType === 'deleteNode' && typeof targetId === 'string') {
      await deleteNodeType(targetId);
      setActiveNodeId('');
    } else if (actionType === 'deleteAttribute' && typeof targetId === 'number') {
      const attr = editingAttributes[targetId];
      if (attr && attr.id) {
        await deleteNodeAttribute(attr.id);
        setEditingAttributes(editingAttributes.filter((_, i) => i !== targetId));
      }
    }
  };

  const updateAttribute = (index: number, updates: Partial<NodeAttribute>) => {
    const newAttrs = [...editingAttributes];
    newAttrs[index] = { ...newAttrs[index], ...updates };
    setEditingAttributes(newAttrs);
  };

  const parseOptionsJson = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  };

  // İkon önizlemesi için
  const SelectedIcon = getRecipeIcon(editingNode?.icon_name);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#181818] border border-[#333]' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-[#252525] border-[#333]' : 'bg-slate-50'}`}>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Düğüm ve Özellik Yönetimi</h2>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Üretim ağacınızdaki düğüm türlerini (hammadde, makine, işlem) buradan tasarlayın.</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#333] text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}>
            <X size={20} />
          </button>
        </div>
        <FeedbackBanner
          feedback={feedback}
          onClose={() => setFeedback(null)}
          isDarkMode={isDarkMode}
          className="mx-4 mt-4 rounded-lg text-sm"
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Node Types List */}
          <div className={`w-64 border-r flex flex-col shrink-0 ${isDarkMode ? 'bg-[#252525] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`p-3 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#181818] border-[#333]' : 'bg-white'}`}>
              <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Düğüm Türleri</span>
              <button 
                onClick={() => setActiveNodeId('new')}
                className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold ${isDarkMode ? 'hover:bg-[#333] text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`}
              >
                <Plus size={14} /> Yeni
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {nodeTypesConfig.map(config => (
                <button
                  key={config.id}
                  onClick={() => setActiveNodeId(config.id)}
                  className={`px-3 py-2.5 text-left text-sm font-medium rounded-md transition-all flex items-center gap-2 border ${
                    activeNodeId === config.id 
                      ? (isDarkMode ? 'bg-[#333] text-blue-400 border-[#444] shadow-sm' : 'bg-blue-50 text-blue-700 shadow-sm border-blue-100') 
                      : (isDarkMode ? 'text-gray-300 hover:bg-[#333] border-transparent' : 'text-slate-600 hover:bg-slate-200 border-transparent')
                  }`}
                >
                  {React.createElement(getRecipeIcon(config.icon_name), { size: 16 })}
                  <span className="truncate">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Editor */}
          <div className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-slate-50/50'}`}>
            {editingNode ? (
              <div className="max-w-4xl mx-auto space-y-6 pb-20">
                
                {/* 1. Düğüm Genel Ayarları */}
                <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'}`}>
                  <h3 className={`text-sm font-bold mb-4 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Genel Ayarlar
                    {activeNodeId !== 'new' && (
                      <button onClick={handleDeleteNode} className={`p-1 rounded transition-colors ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`} title="Düğümü Sil">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Düğüm Adı (Arayüzde Görünecek)</label>
                      <input 
                        type="text" 
                        value={editingNode.label || ''} 
                        onChange={e => setEditingNode({...editingNode, label: e.target.value})}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#181818] border-[#444] text-white' : 'bg-white border-slate-200'}`}
                        placeholder="Örn: Paketleme, Kesim Makinesi"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Kod (Veritabanı Anahtarı)</label>
                      <input 
                        type="text" 
                        value={editingNode.code_key || ''} 
                        onChange={e => setEditingNode({...editingNode, code_key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')})}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono ${isDarkMode ? 'bg-[#181818] border-[#444] text-white' : 'bg-white border-slate-200'}`}
                        placeholder="Örn: PACKAGING, CUTTER_1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Açıklama</label>
                      <input 
                        type="text" 
                        value={editingNode.description || ''} 
                        onChange={e => setEditingNode({...editingNode, description: e.target.value})}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#181818] border-[#444] text-white' : 'bg-white border-slate-200'}`}
                        placeholder="Kullanıcılar bilgi ikonuna tıkladığında görünecek açıklama..."
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Renk Teması</label>
                      <select 
                        value={editingNode.color_classes || COLOR_PRESETS[5].value} 
                        onChange={e => setEditingNode({...editingNode, color_classes: e.target.value})}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#181818] border-[#444] text-white' : 'bg-white border-slate-200'}`}
                      >
                        {COLOR_PRESETS.map(preset => (
                          <option key={preset.value} value={preset.value}>{preset.label}</option>
                        ))}
                      </select>
                    </div>
                    


                    <div className={`col-span-2 flex flex-wrap gap-4 p-3 rounded-lg border ${isDarkMode ? 'bg-[#181818] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                      <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        <input type="checkbox" checked={editingNode.port_in} onChange={e => setEditingNode({...editingNode, port_in: e.target.checked})} className="rounded text-blue-600" />
                        Üstten Bağlantı Al (Port In)
                      </label>
                      <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        <input type="checkbox" checked={editingNode.port_out} onChange={e => setEditingNode({...editingNode, port_out: e.target.checked})} className="rounded text-blue-600" />
                        Alta Bağlantı Ver (Port Out)
                      </label>
                      <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        <input type="checkbox" checked={editingNode.has_consumption} onChange={e => setEditingNode({...editingNode, has_consumption: e.target.checked})} className="rounded text-blue-600" />
                        Miktar/Birim Ekle
                      </label>
                      <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        <input type="checkbox" checked={editingNode.has_code_templates || false} onChange={e => setEditingNode({...editingNode, has_code_templates: e.target.checked})} className="rounded text-blue-600" />
                        Kod Şablonları
                      </label>
                    </div>

                    {/* Üretilen Ürün Grubu */}
                    <div className={`col-span-2 p-3 rounded-lg border ${isDarkMode ? 'bg-[#181818] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                      <label className={`block text-xs font-bold mb-2 flex flex-col ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                          <Package size={14} className={isDarkMode ? 'text-gray-400' : 'text-slate-500'} />
                          Üretilen Ürün Grubu (Product Group)
                        </span>
                        <span className={`text-[10px] font-normal mt-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          — Bu düğümün ürettiği ürünün (yarı mamul/mamul) grubunu belirler. Reçete oluştururken üretilen ürün bu grupta açılır.
                        </span>
                      </label>
                      <select 
                        value={editingNode.product_group || ''} 
                        onChange={e => setEditingNode({...editingNode, product_group: e.target.value})}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#181818] border-[#444] text-white' : 'bg-white border-slate-200'}`}
                      >
                        <option value="">-- Grup Seçilmedi --</option>
                        {materialTypeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} {(opt as any).group ? `(${ (opt as any).group })` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dinamik Çoklu Çıkış Noktaları */}
                    <div className={`col-span-2 p-3 rounded-lg border ${isDarkMode ? 'bg-[#181818] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                      <label className={`block text-xs font-bold mb-2 flex flex-col ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                          <List size={14} className={isDarkMode ? 'text-gray-400' : 'text-slate-500'} />
                          Dinamik Çoklu Çıkış Noktaları (Tablodan Oku)
                        </span>
                        <span className={`text-[10px] font-normal mt-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          — Eğer seçilirse, node üzerinde bu tablodaki tüm veriler listelenir ve her biri için ayrı bir çıkış noktası (port) oluşturulur.
                        </span>
                      </label>
                      <select 
                        value={editingNode.dynamic_ports_table || ''} 
                        onChange={e => setEditingNode({...editingNode, dynamic_ports_table: e.target.value})}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#181818] border-[#444] text-white' : 'bg-white border-slate-200'}`}
                      >
                        <option value="">-- Standart Tek Çıkış (Yok) --</option>
                        <option value="surfaces">Yüzeyler (surfaces)</option>
                        <option value="pvc_widths">PVC Genişlik (pvc_widths)</option>
                        <option value="coil_widths">Bobin Genişlik (coil_widths)</option>
                        <option value="thicknesses">Kalınlık (thicknesses)</option>
                        <option value="material_types">Malzeme Türleri (material_types)</option>
                      </select>
                    </div>

                    {/* Material Type Filters */}
                    <div className={`col-span-2 p-3 rounded-lg border ${isDarkMode ? 'bg-[#181818] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={14} className={isDarkMode ? 'text-gray-400' : 'text-slate-500'} />
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                          Malzeme Seçici Filtreleri
                        </span>
                        <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          — seçilirse node'da malzeme picker aktif olur
                        </span>
                      </div>
                      {materialTypeOptions.length === 0 ? (
                        <p className={`text-[11px] italic ${isDarkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                          Malzeme türü bulunamadı (material_types tablosu boş olabilir).
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {materialTypeOptions.map(opt => (
                            <label key={opt.value} className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                              <input
                                type="checkbox"
                                className="rounded text-blue-600"
                                checked={(editingNode.material_type_filters || []).includes(opt.value)}
                                onChange={e => {
                                  const current = editingNode.material_type_filters || [];
                                  const updated = e.target.checked
                                    ? [...current, opt.value]
                                    : current.filter(v => v !== opt.value);
                                  setEditingNode({ ...editingNode, material_type_filters: updated });
                                }}
                              />
                              <span>{opt.label}</span>
                              {(opt as any).group && (
                                <span className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? 'bg-[#333] text-gray-400' : 'bg-slate-200 text-slate-500'}`}>{(opt as any).group}</span>
                              )}
                            </label>
                          ))}

                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Düğüm Özellikleri (Form Alanları) */}
                <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Form Alanları (Özellikler)</h3>
                    <button 
                      onClick={handleAddAttribute}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                    >
                      <Plus size={14} /> Alan Ekle
                    </button>
                  </div>
                  
                  {editingAttributes.length === 0 ? (
                    <div className={`text-center py-8 text-sm border-2 border-dashed rounded-lg ${isDarkMode ? 'border-[#444] text-gray-500' : 'border-slate-200 text-slate-400'}`}>
                      Bu düğüm için henüz özel bir form alanı eklenmemiş.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editingAttributes.sort((a,b) => (a.display_order||0) - (b.display_order||0)).map((attr, index) => (
                        <div key={attr.id} className={`flex items-start gap-3 p-3 border rounded-lg transition-colors group ${isDarkMode ? 'bg-[#181818] border-[#333] hover:border-[#555]' : 'bg-slate-50/50 border-slate-100 hover:border-slate-300'}`}>
                          <div className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                            {attr.field_type === 'text' ? <Type size={16} /> : attr.field_type === 'number' ? <Hash size={16} /> : <List size={16} />}
                          </div>
                          
                          <div className="flex-1 grid grid-cols-12 gap-3">
                            <div className="col-span-4">
                              <label className={`block text-[10px] font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Görünür İsim (Label)</label>
                              <input 
                                type="text" 
                                value={attr.label || ''} 
                                onChange={e => updateAttribute(index, { label: e.target.value })}
                                className={`w-full border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#252525] border-[#444] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                                placeholder="Örn: Genişlik, Renk"
                              />
                            </div>
                            <div className="col-span-4">
                              <label className={`block text-[10px] font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Alan Anahtarı (Key)</label>
                              <input 
                                type="text" 
                                value={attr.field_key || ''} 
                                onChange={e => updateAttribute(index, { field_key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                                className={`w-full border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono text-xs ${isDarkMode ? 'bg-[#252525] border-[#444] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                                placeholder="Örn: width, color_code"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className={`block text-[10px] font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Türü</label>
                              <select 
                                value={attr.field_type || 'text'} 
                                onChange={e => updateAttribute(index, { field_type: e.target.value as "number" | "text" | "select" })}
                                className={`w-full border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#252525] border-[#444] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                              >
                                <option value="text">Metin (Text)</option>
                                <option value="number">Sayı (Number)</option>
                                <option value="select">Seçim (Dropdown)</option>
                              </select>
                            </div>
                            <div className="col-span-1 flex items-end justify-end">
                              <button 
                                onClick={() => handleDeleteAttribute(index)}
                                className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-gray-500 hover:bg-red-900/30 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            {/* Select options input */}
                            {attr.field_type === 'select' && (
                              <div className="col-span-12 mt-1">
                                <label className={`block text-[10px] font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                  Seçenekler (JSON formatında)
                                </label>
                                <textarea 
                                  value={typeof attr.options === 'string' ? attr.options : JSON.stringify(attr.options || [])}
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateAttribute(index, { options: parseOptionsJson(val) || val as any });
                                  }}
                                  className={`w-full border rounded px-2 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none h-16 ${isDarkMode ? 'bg-[#252525] border-[#444] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                                  placeholder='[{"label": "Kırmızı", "value": "red"}, {"label": "Mavi", "value": "blue"}]'
                                />
                                <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>Örnek: <code className={`px-1 rounded ${isDarkMode ? 'bg-[#333]' : 'bg-slate-100'}`}>{`[{"label": "Evet", "value": "true"}, {"label": "Hayır", "value": "false"}]`}</code></p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className={`h-full flex flex-col items-center justify-center ${isDarkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                <Box size={48} className="mb-4 opacity-20" />
                <p>Düzenlemek için sol menüden bir düğüm seçin veya yeni oluşturun.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end gap-3 shrink-0 ${isDarkMode ? 'bg-[#252525] border-[#333]' : 'bg-slate-50'}`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-[#333]' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            İptal
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !editingNode}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Kaydet
          </button>
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onConfirm={executeConfirm}
        onCancel={() => setConfirmState({ isOpen: false, actionType: null, targetId: null, message: '' })}
        title="Onay Gerekli"
        message={confirmState.message}
      />
    </div>
  );
}
