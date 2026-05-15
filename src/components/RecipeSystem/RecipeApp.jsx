import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Sidebar } from './Sidebar';
import { RecipeFlow } from './RecipeFlow';
import { TableView } from './TableView';
import { useRecipeStore } from './store';
import { useCodeStore } from '../../store/codeStore';
import { Network, Table, Ghost, Save, Settings, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { NodeSettingsModal } from './NodeSettingsModal';

import { loadLatestWorkspace, updateWorkspace, createWorkspace } from '../../services/recipeWorkspaceService';

export default function RecipeApp({ isActive }) {
  const { nodes, edges, setNodes, setEdges, fetchReferenceData, isUIVisible, setIsUIVisible, setMaterialSelectorState } = useRecipeStore();
  const [saveStatus, setSaveStatus] = useState('');
  const [viewMode, setViewMode] = useState('flow');
  const [workspaceId, setWorkspaceId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { initializeStore } = useCodeStore();

  const { theme } = useSettings();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    initializeStore();
    fetchReferenceData();
  }, [initializeStore, fetchReferenceData]);

  // Sekme değişince açık malzeme seçici penceresi varsa kapat
  useEffect(() => {
    if (!isActive) {
      setMaterialSelectorState(null);
    }
  }, [isActive, setMaterialSelectorState]);

  // Initial load from Database
  useEffect(() => {
    let mounted = true;
    const loadWorkspace = async () => {
      try {
        setSaveStatus('Yükleniyor...');
        const { data, error } = await loadLatestWorkspace();
        
        if (error) throw error;

        if (mounted && data) {
          setWorkspaceId(data.id);
          if (data.nodes && data.nodes.length > 0) {
            const sortedNodes = [...data.nodes].sort((a, b) => {
              if (a.type === 'GROUP' && b.type !== 'GROUP') return -1;
              if (a.type !== 'GROUP' && b.type === 'GROUP') return 1;
              return 0;
            });
            setNodes(sortedNodes);
          }
          if (data.edges) setEdges(data.edges);
        }
      } catch (err) {
        console.error('Load workspace error:', err);
      } finally {
        if (mounted) {
           setSaveStatus('');
        }
      }
    };
    loadWorkspace();
    return () => { mounted = false; };
  }, [setNodes, setEdges]);

  // Kaydetme fonksiyonu
  const performSave = async (nodesToSave, edgesToSave) => {
    setSaveStatus('Kaydediliyor...');
    try {
      if (workspaceId) {
        const { error } = await updateWorkspace(workspaceId, nodesToSave, edgesToSave);
        if (error) throw error;
      } else {
        const { data, error } = await createWorkspace('Opal Global Workspace', nodesToSave, edgesToSave);
        if (data && data.id) setWorkspaceId(data.id);
        if (error) throw error;
      }
      setSaveStatus('Tüm değişiklikler kaydedildi.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Auto save error:', err);
      setSaveStatus('Kaydedilemedi!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Hayalet (görünmez/hidden) node'ları temizle
  const cleanGhostNodes = () => {
    const cleanNodes = nodes.filter(n => n.hidden !== true);
    const removedIds = nodes.filter(n => n.hidden === true).map(n => n.id);
    if (removedIds.length === 0) {
      setSaveStatus('Temizlenecek hayalet düğüm yok.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    const cleanEdges = edges.filter(e => !removedIds.includes(e.source) && !removedIds.includes(e.target));
    setNodes(cleanNodes);
    setEdges(cleanEdges);
    setSaveStatus(`${removedIds.length} hayalet düğüm temizlendi.`);
  };



  return (
    <div className={`h-full w-full flex flex-col font-sans ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      <div className={`h-12 flex items-center justify-between px-4 shrink-0 shadow-sm border-b z-20 ${isDarkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
        
        <div className="flex items-center gap-1 bg-transparent rounded-lg p-1">
          <button
            onClick={() => setViewMode('flow')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'flow' 
                ? (isDarkMode ? 'bg-[#2a2a2a] text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-200') 
                : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')
            }`}
          >
            <Network size={16} /> Ağ
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table' 
              ? (isDarkMode ? 'bg-[#2a2a2a] text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-200') 
              : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')
            }`}
          >
            <Table size={16} /> Tablo
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUIVisible(!isUIVisible)}
            title={isUIVisible ? "Ekranı ferahlatmak için menüleri gizle" : "Gizli menüleri tekrar göster"}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
              isDarkMode 
                ? 'bg-[#252525] border-[#333] text-gray-400 hover:text-blue-400 hover:border-blue-800' 
                : 'bg-white border-gray-200 text-gray-500 hover:text-blue-500 hover:border-blue-300'
            }`}
          >
            {isUIVisible ? <EyeOff size={13} /> : <Eye size={13} />}
            {isUIVisible ? "Arayüzü Gizle" : "Arayüzü Göster"}
          </button>

          <button
            onClick={cleanGhostNodes}
            title="Görünmez (hayalet) düğümleri temizle"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
              isDarkMode 
                ? 'bg-[#252525] border-[#333] text-gray-400 hover:text-red-400 hover:border-red-800' 
                : 'bg-white border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300'
            }`}
          >
            <Ghost size={13} />
            Hayalet Düğümleri Temizle
          </button>
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Düğüm ve Özellik Ayarları"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
              isDarkMode 
                ? 'bg-[#252525] border-[#333] text-gray-400 hover:text-slate-200 hover:border-slate-500' 
                : 'bg-white border-gray-200 text-gray-500 hover:text-slate-700 hover:border-slate-400'
            }`}
          >
            <Settings size={13} />
            Ayarlar
          </button>

          <button
            onClick={() => performSave(nodes, edges)}
            title="Değişiklikleri Veritabanına Kaydet"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all ${
              isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-500' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Save size={14} />
            Kaydet
          </button>
          <span className={`text-xs font-medium ${
            saveStatus === 'Kaydedilemedi!' ? 'text-red-500' : 
            saveStatus === 'Kaydediliyor...' ? 'text-amber-500 animate-pulse' : 
            'text-green-500'
          }`}>
            {saveStatus}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'flow' ? (
          <ReactFlowProvider>
            <Sidebar />
            <RecipeFlow />
          </ReactFlowProvider>
        ) : (
          <TableView />
        )}
      </div>

      <NodeSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
