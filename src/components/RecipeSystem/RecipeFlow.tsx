import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  SelectionMode,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { LayoutList, LayoutTemplate, FolderPlus, Settings, Link2, AlertTriangle, Search, Filter, ChevronUp, ChevronDown, Undo2, Redo2, Eye, EyeOff } from 'lucide-react';

import { useRecipeStore } from './store';
import { 
  GroupNode,
  BaseNode,
  NoteNode
} from './nodes/CustomNodes';
import { getLayoutedElements } from './utils/layout';
import ContextMenu from './ContextMenu';
import DeletableEdge from './edges/DeletableEdge';
import { useSettings } from '../../context/SettingsContext';
import { MaterialSelectorModal } from './MaterialSelectorModal';
import FeedbackBanner from '../FeedbackBanner';

const edgeTypes = {
  deletable: DeletableEdge,
};

export function RecipeFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ id: string, top?: number, left?: number, right?: number, bottom?: number } | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [deleteModalFocus, setDeleteModalFocus] = useState<'cancel' | 'confirm'>('cancel');
  const [feedback, setFeedback] = useState<{ type: 'info' | 'error'; message: string } | null>(null);
  const isUIVisible = useRecipeStore(state => state.isUIVisible);
  
  const { theme } = useSettings();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const nodeTypesConfig = useRecipeStore(state => state.nodeTypesConfig);

  const stableNodeTypes = useMemo(() => {
    const types: any = { GROUP: GroupNode, NOTE: NoteNode };
    nodeTypesConfig.forEach(config => {
      types[config.code_key] = React.memo((props: any) => <BaseNode {...props} typeKey={config.code_key} />);
    });
    return types;
  }, [nodeTypesConfig]);

  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges,
    isConnectingMode, sourceNodeId, setConnectingMode, setSourceNodeId,
    toggleGroupCollapse, nodesToDelete, setNodesToDelete, deleteNodes,
    filterText, filterType, setFilterText, setFilterType,
    saveHistory, undo, redo, past, future,
    materialSelectorState, setMaterialSelectorState, updateNodeData
  } = useRecipeStore();
  
  const { screenToFlowPosition, fitView, getIntersectingNodes } = useReactFlow();

  const stableEdgeTypes = useMemo(() => edgeTypes, []);

  const onNodeDragStart = useCallback(() => saveHistory(), [saveHistory]);
  const onSelectionDragStart = useCallback(() => saveHistory(), [saveHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'SELECT';
      if (isInput) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      if (node.type === 'GROUP') return;
      const intersections = getIntersectingNodes(node).filter((n) => n.type === 'GROUP');
      const groupNode = intersections[0];

      if (groupNode && groupNode.id !== node.parentId) {
        const updatedNodes = nodes.map((n) => {
          const draggedNode = draggedNodes.find((dn) => dn.id === n.id) as Node & { positionAbsolute?: { x: number, y: number } } | undefined;
          if (draggedNode && n.type !== 'GROUP') {
            const absX = draggedNode.positionAbsolute?.x ?? n.position.x;
            const absY = draggedNode.positionAbsolute?.y ?? n.position.y;
            return {
              ...n,
              parentId: groupNode.id,
              position: { x: absX - groupNode.position.x, y: absY - groupNode.position.y },
              extent: undefined,
              hidden: Boolean(groupNode.data?.isCollapsed),
            };
          }
          return n;
        });
        setNodes(updatedNodes);
      } else if (!groupNode && node.parentId) {
        const updatedNodes = nodes.map((n) => {
          const draggedNode = draggedNodes.find((dn) => dn.id === n.id) as Node & { positionAbsolute?: { x: number, y: number } } | undefined;
          if (draggedNode && n.type !== 'GROUP' && n.parentId) {
            const absX = draggedNode.positionAbsolute?.x ?? n.position.x;
            const absY = draggedNode.positionAbsolute?.y ?? n.position.y;
            return {
              ...n,
              parentId: undefined,
              position: { x: absX, y: absY },
              extent: undefined,
            };
          }
          return n;
        });
        setNodes(updatedNodes);
      }
    },
    [getIntersectingNodes, nodes, setNodes]
  );

  const handleCreateGroup = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected && n.type !== 'GROUP');
    if (selectedNodes.length === 0) {
      setFeedback({ type: 'info', message: 'Önce gruplamak istediğiniz düğümleri seçin (Shift + tıklama ile çoklu seçim yapabilirsiniz).' });
      return;
    }
    setFeedback(null);
    saveHistory();
    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.measured?.width ?? 260)));
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.measured?.height ?? 350)));

    const padding = 40;
    const headerHeight = 60;
    const groupId = uuidv4();

    const newGroupNode = {
      id: groupId,
      type: 'GROUP',
      position: { x: minX - padding, y: minY - padding - headerHeight },
      style: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 + headerHeight, zIndex: -1 },
      data: { label: 'Yeni Grup' },
    };

    const updatedNodes = nodes.map(n => {
      if (n.selected && n.type !== 'GROUP') {
        return {
          ...n,
          parentId: groupId,
          position: { x: n.position.x - newGroupNode.position.x, y: n.position.y - newGroupNode.position.y },
          selected: false
        };
      }
      return n;
    });

    setNodes([newGroupNode, ...updatedNodes]);
    setTimeout(() => { toggleGroupCollapse(groupId); }, 10);
  }, [nodes, setNodes, toggleGroupCollapse, saveHistory]);

  const onLayout = useCallback((direction: 'TB' | 'LR' = 'TB') => {
    saveHistory();
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    window.requestAnimationFrame(() => { fitView({ padding: 0.2, duration: 800 }); });
  }, [nodes, edges, setNodes, setEdges, fitView, saveHistory]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      saveHistory();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = { id: uuidv4(), type, position, data: { label: '' } };
      setNodes(nodes.concat(newNode));
    },
    [screenToFlowPosition, nodes, setNodes, saveHistory],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (isConnectingMode) {
      if (!sourceNodeId) {
        if (node.type === 'NOTE' || node.type === 'GROUP') return;
        const config = nodeTypesConfig.find(c => c.code_key === node.type);
        if (config && config.port_out) {
          setSourceNodeId(node.id);
        }
      } else {
        if (sourceNodeId !== node.id) {
          if (node.type !== 'NOTE' && node.type !== 'GROUP') {
            const config = nodeTypesConfig.find(c => c.code_key === node.type);
            if (config && config.port_in) {
              onConnect({ source: sourceNodeId, target: node.id, sourceHandle: null, targetHandle: null });
            }
          }
        }
        setSourceNodeId(null);
      }
    } else {
      setMenu(null);
      if (node.type === 'GROUP') {
        setTimeout(() => fitView({ nodes: [{ id: node.id }], duration: 800, padding: 0.2 }), 50);
      }
    }
  }, [isConnectingMode, sourceNodeId, onConnect, fitView, nodeTypesConfig]);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current?.getBoundingClientRect();
      if (!pane) return;
      setMenu({
        id: node.id,
        top: event.clientY < pane.height - 200 ? event.clientY - pane.top : undefined,
        left: event.clientX < pane.width - 200 ? event.clientX - pane.left : undefined,
        right: event.clientX >= pane.width - 200 ? pane.width - event.clientX + pane.left : undefined,
        bottom: event.clientY >= pane.height - 200 ? pane.height - event.clientY + pane.top : undefined,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'c' || e.key === 'C') {
        setConnectingMode(!isConnectingMode);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = nodes.filter(n => n.selected).map(n => n.id);
        if (selectedNodes.length > 0) setNodesToDelete(selectedNodes);
      } else if (e.key === 'n' || e.key === 'N') {
        const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const newNode = { id: uuidv4(), type: 'RAW_MATERIAL', position: center, data: { label: 'Yeni Hammadde' } };
        setNodes([...nodes, newNode]);
      } else if (e.key === 't' || e.key === 'T') {
        const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const newNode = { id: uuidv4(), type: 'NOTE', position: center, data: { text: '' } };
        setNodes([...nodes, newNode]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnectingMode, nodes, setConnectingMode, setNodesToDelete, screenToFlowPosition, setNodes]);

  const isFilterActive = filterText.length > 0 || filterType !== 'ALL';
  const matchingNodes = React.useMemo(() => {
    if (!isFilterActive) return [];
    return nodes.filter(node => {
      const label = String(node.data?.label || (node.type === 'GROUP' ? 'Yeni Grup' : '')).toLowerCase();
      const matchesText = !filterText || label.includes(filterText.toLowerCase());
      const matchesType = filterType === 'ALL' || filterType === node.type;
      return matchesText && matchesType;
    });
  }, [nodes, filterText, filterType, isFilterActive]);

  useEffect(() => { setCurrentMatchIndex(0); }, [filterText, filterType]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isFilterActive || matchingNodes.length === 0) return;
      const nodeToFocus = matchingNodes[currentMatchIndex] || matchingNodes[0];
      if (nodeToFocus) {
        if (nodeToFocus.parentId) {
          const parent = nodes.find(n => n.id === nodeToFocus.parentId);
          if (parent && parent.data?.isCollapsed) {
            useRecipeStore.getState().toggleGroupCollapse(parent.id);
          }
        }
        // focus the node with a slight delay if it was just uncollapsed to allow DOM render
        setTimeout(() => fitView({ nodes: [{ id: nodeToFocus.id }], duration: 800, padding: 0.2, maxZoom: 1.2 }), 50);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [isFilterActive, matchingNodes, currentMatchIndex, fitView]);

  const confirmDelete = () => { if (nodesToDelete.length > 0) { deleteNodes(nodesToDelete); setNodesToDelete([]); } };
  const cancelDelete = () => { setNodesToDelete([]); };

  useEffect(() => {
    if (nodesToDelete.length > 0) {
      setDeleteModalFocus('cancel');
    }
  }, [nodesToDelete.length]);

  useEffect(() => {
    if (nodesToDelete.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelDelete();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Tab') {
        e.preventDefault();
        setDeleteModalFocus(prev => prev === 'cancel' ? 'confirm' : 'cancel');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (deleteModalFocus === 'cancel') {
          cancelDelete();
        } else {
          confirmDelete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodesToDelete.length, deleteModalFocus]);

  return (
    <div className={`flex-1 h-full relative ${isDarkMode ? 'bg-[#121212]' : 'bg-slate-50'}`} ref={reactFlowWrapper}>
      <FeedbackBanner
        feedback={feedback}
        onClose={() => setFeedback(null)}
        isDarkMode={isDarkMode}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[100001]"
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        minZoom={0.05}
        maxZoom={4}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStart={onSelectionDragStart}
        onPaneClick={onPaneClick}
        nodeTypes={stableNodeTypes}
        edgeTypes={stableEdgeTypes}
        defaultEdgeOptions={{ type: 'deletable' }}
        fitView
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Meta', 'Shift', 'Control']}
        selectionKeyCode={['Shift', 'Control']}
        deleteKeyCode={null}
        nodesDraggable={!isConnectingMode}
        panOnDrag={!isConnectingMode}
        colorMode={isDarkMode ? 'dark' : 'light'}
        snapToGrid={true}
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={isDarkMode ? "#333" : "#cbd5e1"} gap={16} />
        {isUIVisible && <Controls className={isDarkMode ? "!bg-[#181818] border-[#2a2a2a]" : "bg-white border-slate-200"} />}
        {isUIVisible && <MiniMap nodeStrokeWidth={3} zoomable pannable className={`rounded-lg ${isDarkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm'}`} />}
        
        {isUIVisible && (
          <Panel position="top-left" className={`m-4 flex flex-col gap-2 p-3 rounded-xl shadow-sm border w-72 transition-opacity ${isDarkMode ? 'bg-[#181818]/90 backdrop-blur-md border-[#2a2a2a]' : 'bg-white/90 backdrop-blur-md border-slate-200'}`}>
          <div className={`flex items-center justify-between border-b pb-2 mb-1 ${isDarkMode ? 'border-[#2a2a2a]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <Filter size={16} className={isDarkMode ? 'text-gray-400' : 'text-slate-500'} />
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>Filtrele & Bul</span>
            </div>
            {isFilterActive && matchingNodes.length > 0 && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${isDarkMode ? 'bg-[#252525] text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                <span>{currentMatchIndex + 1} / {matchingNodes.length}</span>
                {matchingNodes.length > 1 && (
                  <div className={`flex items-center ml-1 border-l pl-1 ${isDarkMode ? 'border-gray-600' : 'border-slate-300'}`}>
                    <button onClick={() => setCurrentMatchIndex(prev => (prev > 0 ? prev - 1 : matchingNodes.length - 1))} className="p-0.5 hover:text-blue-500 rounded transition-colors"><ChevronUp size={14} /></button>
                    <button onClick={() => setCurrentMatchIndex(prev => (prev < matchingNodes.length - 1 ? prev + 1 : 0))} className="p-0.5 hover:text-blue-500 rounded transition-colors"><ChevronDown size={14} /></button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Düğüm etiketinde ara..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg focus:outline-none transition-all nodrag border ${isDarkMode ? 'bg-[#252525] border-[#333] text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/50'}`}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`w-full px-3 py-1.5 text-sm rounded-lg focus:outline-none transition-all nodrag border ${isDarkMode ? 'bg-[#252525] border-[#333] text-gray-300 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/50 text-slate-700'}`}
          >
            <option value="ALL">Tüm Türler / Renkler</option>
            <option value="GROUP">Grup (İndigo)</option>
            {nodeTypesConfig.map((config) => {
              const colorName = config.color_classes?.includes('amber') ? 'Sarı' : config.color_classes?.includes('blue') ? 'Mavi' : config.color_classes?.includes('purple') ? 'Mor' : config.color_classes?.includes('cyan') ? 'Turkuaz' : config.color_classes?.includes('pink') ? 'Pembe' : 'Yeşil';
              return <option key={config.code_key} value={config.code_key}>{config.label} ({colorName})</option>;
            })}
          </select>
        </Panel>
        )}

        {isUIVisible && (
        <Panel position="top-right" className="m-4 flex flex-col gap-2">
          <div className="flex gap-2 mb-2">
            <button
              onClick={undo} disabled={past.length === 0}
              className={`flex items-center justify-center flex-1 gap-2 px-3 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors ${past.length === 0 ? (isDarkMode ? 'text-gray-600 bg-[#181818] border-[#2a2a2a]' : 'text-slate-300 bg-white border-slate-200 cursor-not-allowed') : (isDarkMode ? 'text-gray-300 bg-[#252525] hover:bg-[#333] border-[#333]' : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200 hover:text-blue-600')}`}
            ><Undo2 size={16} /></button>
            <button
              onClick={redo} disabled={future.length === 0}
              className={`flex items-center justify-center flex-1 gap-2 px-3 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors ${future.length === 0 ? (isDarkMode ? 'text-gray-600 bg-[#181818] border-[#2a2a2a]' : 'text-slate-300 bg-white border-slate-200 cursor-not-allowed') : (isDarkMode ? 'text-gray-300 bg-[#252525] hover:bg-[#333] border-[#333]' : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200 hover:text-blue-600')}`}
            ><Redo2 size={16} /></button>
          </div>
          <button
            onClick={() => setConnectingMode(!isConnectingMode)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors ${isConnectingMode ? 'bg-blue-600 border-blue-600 text-white' : (isDarkMode ? 'bg-[#252525] border-[#333] text-gray-300 hover:bg-[#333]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600')}`}
          ><Link2 size={16} />{isConnectingMode ? 'Bağlantı Modu: Açık' : 'Bağlantı Modu'}</button>
          
          <button
            onClick={handleCreateGroup}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-gray-300 hover:bg-[#333]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
          ><FolderPlus size={16} /> Grup Oluştur</button>
          
          <div className="flex gap-2">
            <button
              onClick={() => onLayout('TB')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-gray-300 hover:bg-[#333]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
            ><LayoutList size={16} /> Dikey</button>
            <button
              onClick={() => onLayout('LR')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-gray-300 hover:bg-[#333]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
            ><LayoutTemplate size={16} /> Yatay</button>
          </div>
        </Panel>
        )}
        
        {isUIVisible && (
        <Panel position="bottom-left" className="m-4">
          <div className={`backdrop-blur-sm border rounded-lg p-3 shadow-sm text-xs flex flex-col gap-1.5 ${isDarkMode ? 'bg-[#181818]/80 border-[#2a2a2a] text-gray-400' : 'bg-white/80 border-slate-200 text-slate-500'}`}>
            <div className={`font-semibold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>Kısayollar</div>
            <div className="flex items-center gap-2"><kbd className={`border rounded px-1.5 py-0.5 font-mono text-[10px] ${isDarkMode ? 'bg-[#252525] border-gray-600 text-gray-400' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>N</kbd> <span>Yeni Düğüm</span></div>
            <div className="flex items-center gap-2"><kbd className={`border rounded px-1.5 py-0.5 font-mono text-[10px] ${isDarkMode ? 'bg-[#252525] border-gray-600 text-gray-400' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>C</kbd> <span>Bağlantı Modu</span></div>
            <div className="flex items-center gap-2"><kbd className={`border rounded px-1.5 py-0.5 font-mono text-[10px] ${isDarkMode ? 'bg-[#252525] border-gray-600 text-gray-400' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>Del</kbd> <span>Seçilileri Sil</span></div>
          </div>
        </Panel>
        )}

        {menu && <ContextMenu onClick={() => setMenu(null)} {...menu} />}
      </ReactFlow>
      
      {nodesToDelete.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000]">
          <div className={`rounded-2xl shadow-xl max-w-md w-full p-6 m-4 animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#181818] border border-[#2a2a2a]' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-4 text-amber-500">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100'}`}><AlertTriangle size={24} /></div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{nodesToDelete.length > 1 ? `${nodesToDelete.length} Düğümü Sil` : 'Düğümü Sil'}</h3>
            </div>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              {nodesToDelete.length > 1 ? `Seçili ${nodesToDelete.length} düğümü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.` : 'Bu düğümü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
              {nodes.some(n => nodesToDelete.includes(n.id) && n.type === 'GROUP') && (
                <span className={`block mt-2 text-sm font-medium p-2 rounded ${isDarkMode ? 'text-amber-400 bg-amber-400/10' : 'text-amber-700 bg-amber-50'}`}>Not: Grup silindiğinde içindeki düğümler silinmez, çalışma alanına taşınır.</span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelDelete} 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  deleteModalFocus === 'cancel' 
                    ? (isDarkMode ? 'ring-2 ring-gray-400 ring-offset-2 ring-offset-[#181818]' : 'ring-2 ring-gray-500 ring-offset-2 ring-offset-white')
                    : ''
                } ${isDarkMode ? 'text-gray-300 bg-[#252525] hover:bg-[#333]' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}
              >
                İptal
              </button>
              <button 
                onClick={confirmDelete} 
                className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all ${
                  deleteModalFocus === 'confirm' 
                    ? (isDarkMode ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#181818]' : 'ring-2 ring-red-500 ring-offset-2 ring-offset-white')
                    : ''
                }`}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Selector Modal — canvas dışında render edilir (fixed positioning için) */}
      {materialSelectorState && (
        <MaterialSelectorModal
          isOpen={true}
          onClose={() => setMaterialSelectorState(null)}
          onSelect={(material) => {
            updateNodeData(materialSelectorState.nodeId, {
              label: material.name,
              materialCode: material.code,
              materialType: material.type,
              ...(material.unit ? { unit: material.unit } : {}),
            });
            setMaterialSelectorState(null);
          }}
          allowedTypes={materialSelectorState.allowedTypes}
          title="Malzeme Seç"
        />
      )}
    </div>
  );
}
