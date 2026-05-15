import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { appendHistorySnapshot, createHistorySnapshot } from './history';
import {
  deleteNodeAttributeReference,
  deleteNodeTypeReference,
  fetchNodeTypeReferenceData,
  saveNodeAttributeReference,
  saveNodeTypeReference,
} from './referenceDataService';

export type NodeData = {
  label?: string;
  amount?: number;
  unit?: string;
  duration?: number;
  temperature?: number;
  [key: string]: any;
};

export type AppNode = Node<NodeData>;

// Dinamik node tipi tanımı
export interface NodeAttribute {
  id: string;
  node_type_id: string;
  field_key: string;
  label: string;
  field_type: 'text' | 'number' | 'select';
  options?: any;
  is_required: boolean;
  display_order: number;
}

export interface NodeTypeConfig {
  id: string;
  code_key: string;
  label: string;
  description: string;
  color_classes: string;
  icon_name: string;
  icon_color_classes: string;
  port_in: boolean;
  port_out: boolean;
  has_consumption: boolean;
  has_code_templates?: boolean;
  dynamic_ports_table?: string;
  material_type_filters?: string[];
  product_group?: string;
  attributes?: NodeAttribute[];
}

export type RecipeTemplate = {
  id: string;
  name: string;
  hCode: string;
  rawMaterials: string[];
  surface: string;
  print: string;
  patterns: string[];
  finalProducts: string[];
};

type HistoryState = {
  nodes: AppNode[];
  edges: Edge[];
};

type AppState = {
  nodes: AppNode[];
  edges: Edge[];
  past: HistoryState[];
  future: HistoryState[];
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  templates: RecipeTemplate[];
  isConnectingMode: boolean;
  sourceNodeId: string | null;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  addTemplate: (template: RecipeTemplate) => void;
  updateTemplate: (id: string, template: Partial<RecipeTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setConnectingMode: (isMode: boolean) => void;
  setSourceNodeId: (id: string | null) => void;
  toggleGroupCollapse: (groupId: string) => void;
  nodesToDelete: string[];
  setNodesToDelete: (ids: string[]) => void;
  deleteNodes: (ids: string[]) => void;
  filterText: string;
  filterType: string;
  setFilterText: (text: string) => void;
  setFilterType: (type: string) => void;
  nodeTypesConfig: NodeTypeConfig[];
  fetchReferenceData: () => Promise<void>;
  saveNodeType: (type: Partial<NodeTypeConfig>) => Promise<void>;
  deleteNodeType: (id: string) => Promise<void>;
  saveNodeAttribute: (attr: Partial<NodeAttribute>) => Promise<void>;
  deleteNodeAttribute: (id: string) => Promise<void>;
  dataVersion: number;
  isUIVisible: boolean;
  setIsUIVisible: (isVisible: boolean) => void;
  materialSelectorState: { nodeId: string; allowedTypes: string[] } | null;
  setMaterialSelectorState: (state: { nodeId: string; allowedTypes: string[] } | null) => void;
};

export const useRecipeStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  dataVersion: 0,
  isUIVisible: true,
  setIsUIVisible: (isVisible) => set({ isUIVisible: isVisible }),
  materialSelectorState: null,
  setMaterialSelectorState: (materialSelectorState) => set({ materialSelectorState }),
  past: [],
  future: [],
  saveHistory: () => {
    const { nodes, edges, past } = get();
    const newPast = appendHistorySnapshot(past, nodes, edges);
    set({ past: newPast, future: [] });
  },
  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [createHistorySnapshot(nodes, edges), ...future],
    });
  },
  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, createHistorySnapshot(nodes, edges)],
      future: newFuture,
    });
  },
  isConnectingMode: false,
  sourceNodeId: null,
  nodesToDelete: [],
  filterText: '',
  filterType: 'ALL',
  setFilterText: (filterText: string) => set({ filterText }),
  setFilterType: (filterType: string) => set({ filterType }),
  nodeTypesConfig: [],
  fetchReferenceData: async () => {
    try {
      const config = await fetchNodeTypeReferenceData();
      set({ nodeTypesConfig: config });
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      // Geri dönüş (Fallback) olarak statik config sağlanabilir ancak şimdilik boş bırakıyoruz.
    }
  },

  saveNodeType: async (typeConfig: Partial<NodeTypeConfig>) => {
    try {
      await saveNodeTypeReference(typeConfig);
      // Veriyi yeniden çekerek state'i güncelle
      await get().fetchReferenceData();
    } catch (err) {
      console.error('saveNodeType error:', err);
      throw err;
    }
  },

  deleteNodeType: async (id: string) => {
    try {
      await deleteNodeTypeReference(id);
      await get().fetchReferenceData();
    } catch (err) {
      console.error('deleteNodeType error:', err);
      throw err;
    }
  },

  saveNodeAttribute: async (attr: Partial<NodeAttribute>) => {
    try {
      await saveNodeAttributeReference(attr);
      await get().fetchReferenceData();
    } catch (err) {
      console.error('saveNodeAttribute error:', err);
      throw err;
    }
  },

  deleteNodeAttribute: async (id: string) => {
    try {
      await deleteNodeAttributeReference(id);
      await get().fetchReferenceData();
    } catch (err) {
      console.error('deleteNodeAttribute error:', err);
      throw err;
    }
  },

  templates: [
    {
      id: 'default-1',
      name: 'Standart Ahşap Reçetesi',
      hCode: 'H-100',
      rawMaterials: ['MDF', 'Tutkal'],
      surface: 'Zımpara',
      print: 'Lazer',
      patterns: ['Meşe', 'Ceviz'],
      finalProducts: ['Masa', 'Sandalye']
    }
  ],
  onNodesChange: (changes: NodeChange<AppNode>[]) => {
    const state = get();
    const hasStructuralChange = changes.some(c => c.type === 'remove' || c.type === 'add');
    if (hasStructuralChange) state.saveHistory();
    let currentNodes = [...state.nodes];
    const removedNodeIds = changes
      .filter((c): c is { type: 'remove'; id: string } => c.type === 'remove')
      .map(c => c.id);
    if (removedNodeIds.length > 0) {
      const removedGroups = state.nodes.filter(n => removedNodeIds.includes(n.id) && n.type === 'GROUP');
      if (removedGroups.length > 0) {
        currentNodes = currentNodes.map(n => {
          const parentGroup = removedGroups.find(g => g.id === n.parentId);
          if (parentGroup) {
            return { ...n, parentId: undefined, position: { x: n.position.x + parentGroup.position.x, y: n.position.y + parentGroup.position.y }, extent: undefined };
          }
          return n;
        });
      }
    }
    set({ 
      nodes: applyNodeChanges(changes, currentNodes),
      dataVersion: hasStructuralChange ? state.dataVersion + 1 : state.dataVersion
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    const hasStructuralChange = changes.some(c => c.type === 'remove' || c.type === 'add');
    if (hasStructuralChange) get().saveHistory();
    set({ 
      edges: applyEdgeChanges(changes, get().edges),
      dataVersion: hasStructuralChange ? get().dataVersion + 1 : get().dataVersion
    });
  },
  onConnect: (connection: Connection) => {
    get().saveHistory();
    set({ 
      edges: addEdge({ ...connection, type: 'deletable' }, get().edges),
      dataVersion: get().dataVersion + 1
    });
  },
  setNodes: (nodes: AppNode[]) => set({ nodes, dataVersion: get().dataVersion + 1 }),
  setEdges: (edges: Edge[]) => set({ edges, dataVersion: get().dataVersion + 1 }),
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    set({ 
      nodes: get().nodes.map(node => node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node),
      dataVersion: get().dataVersion + 1
    });
  },
  deleteNode: (nodeId: string) => {
    get().saveHistory();
    const state = get();
    const nodeToDelete = state.nodes.find(n => n.id === nodeId);
    let newNodes = state.nodes.filter(node => node.id !== nodeId);
    if (nodeToDelete?.type === 'GROUP') {
      newNodes = newNodes.map(n => {
        if (n.parentId === nodeId) {
          return { ...n, parentId: undefined, position: { x: n.position.x + nodeToDelete.position.x, y: n.position.y + nodeToDelete.position.y }, extent: undefined };
        }
        return n;
      });
    }
    set({ 
      nodes: newNodes, 
      edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
      dataVersion: state.dataVersion + 1
    });
  },
  deleteEdge: (edgeId: string) => {
    get().saveHistory();
    set({ 
      edges: get().edges.filter(edge => edge.id !== edgeId),
      dataVersion: get().dataVersion + 1
    });
  },
  addTemplate: (template: RecipeTemplate) => set({ templates: [...get().templates, template] }),
  updateTemplate: (id: string, template: Partial<RecipeTemplate>) => {
    set({ templates: get().templates.map(t => t.id === id ? { ...t, ...template } : t) });
  },
  deleteTemplate: (id: string) => set({ templates: get().templates.filter(t => t.id !== id) }),
  setConnectingMode: (isConnectingMode: boolean) => set({ isConnectingMode, sourceNodeId: null }),
  setSourceNodeId: (sourceNodeId: string | null) => set({ sourceNodeId }),
  setNodesToDelete: (nodesToDelete: string[]) => set({ nodesToDelete }),
  deleteNodes: (nodeIds: string[]) => {
    get().saveHistory();
    const state = get();
    let newNodes = [...state.nodes];
    let newEdges = [...state.edges];
    nodeIds.forEach(nodeId => {
      const nodeToDelete = newNodes.find(n => n.id === nodeId);
      newNodes = newNodes.filter(node => node.id !== nodeId);
      if (nodeToDelete?.type === 'GROUP') {
        newNodes = newNodes.map(n => {
          if (n.parentId === nodeId) {
            return { ...n, parentId: undefined, position: { x: n.position.x + nodeToDelete.position.x, y: n.position.y + nodeToDelete.position.y }, extent: undefined };
          }
          return n;
        });
      }
      newEdges = newEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
    });
    set({ nodes: newNodes, edges: newEdges, dataVersion: state.dataVersion + 1 });
  },
  toggleGroupCollapse: (groupId: string) => {
    get().saveHistory();
    set(state => {
      const groupNode = state.nodes.find(n => n.id === groupId);
      if (!groupNode || groupNode.type !== 'GROUP') return state;
      const isCollapsed = !groupNode.data.isCollapsed;
      const newNodes = state.nodes.map(node => {
        if (node.id === groupId) {
          if (isCollapsed) {
            const currentW = node.width || node.style?.width;
            const currentH = node.height || node.style?.height;
            return { 
              ...node, 
              width: 280,
              height: 60,
              data: { ...node.data, isCollapsed: true, originalWidth: currentW, originalHeight: currentH }, 
              style: { ...node.style, width: 280, height: 60 } 
            };
          } else {
            const restoredW = node.data.originalWidth || 280;
            const restoredH = node.data.originalHeight || 60;
            return { 
              ...node, 
              width: restoredW,
              height: restoredH,
              data: { ...node.data, isCollapsed: false }, 
              style: { ...node.style, width: restoredW, height: restoredH } 
            };
          }
        }
        if (node.parentId === groupId) return { ...node, hidden: isCollapsed };
        return node;
      });
      return { nodes: newNodes };
    });
  },
}));
