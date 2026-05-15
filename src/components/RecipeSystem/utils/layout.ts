import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

const nodeWidth = 260;
const nodeHeight = 150;
const groupPadding = 40;
const groupHeaderHeight = 64;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const collapsedGroups = new Set(
    nodes.filter(n => n.type === 'GROUP' && n.data?.isCollapsed).map(n => n.id)
  );

  // Hangi düğümlerin birbirine bağlı olduğunu bul
  const connectedNodeIds = new Set<string>();
  edges.forEach(e => { connectedNodeIds.add(e.source); connectedNodeIds.add(e.target); });

  // Hiçbir yere bağlı olmayan "Açıklama (Not)" düğümlerini tespit et
  const isUnconnectedNote = (node: Node) => node.type === 'NOTE' && !connectedNodeIds.has(node.id);

  const getDepth = (nodeId: string | undefined): number => {
    if (!nodeId) return 0;
    const n = nodes.find(x => x.id === nodeId);
    if (!n) return 0;
    return 1 + getDepth(n.parentId);
  };

  const getRootNodeId = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return nodeId;
    if (!node.parentId) return nodeId;
    return getRootNodeId(node.parentId);
  };

  const groupDimensions = new Map<string, { width: number, height: number }>();
  const relativePositions = new Map<string, { x: number, y: number }>();

  // 1. AŞAMA: Grupları İçten Dışa Doğru İşle (Bottom-up Layout)
  const groups = nodes.filter(n => n.type === 'GROUP');
  const sortedGroups = [...groups].sort((a, b) => getDepth(b.id) - getDepth(a.id));

  sortedGroups.forEach(groupNode => {
    if (collapsedGroups.has(groupNode.id)) {
      groupDimensions.set(groupNode.id, { width: 280, height: 60 });
      return;
    }

    const children = nodes.filter(n => n.parentId === groupNode.id);
    if (children.length === 0) {
      groupDimensions.set(groupNode.id, { width: 320, height: 160 });
      return;
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    // Sadece bağlı olanları (veya not olmayanları) dagre'ye ver
    const layoutedChildren = children.filter(c => !isUnconnectedNote(c));
    const noteChildren = children.filter(c => isUnconnectedNote(c));

    layoutedChildren.forEach(child => {
      let w = child.measured?.width ?? child.width ?? nodeWidth;
      let h = child.measured?.height ?? child.height ?? nodeHeight;
      if (child.type === 'GROUP') {
        const dim = groupDimensions.get(child.id);
        if (dim) { w = dim.width; h = dim.height; }
      }
      g.setNode(child.id, { width: w as number, height: h as number });
    });

    edges.forEach(edge => {
      if (layoutedChildren.find(c => c.id === edge.source) && layoutedChildren.find(c => c.id === edge.target)) {
        g.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(g);

    let maxRight = -Infinity;
    let startY = Infinity;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const childAbsPositions = new Map<string, { x: number, y: number }>();

    if (layoutedChildren.length > 0) {
      layoutedChildren.forEach(child => {
        const pos = g.node(child.id);
        const w = g.node(child.id).width;
        const h = g.node(child.id).height;

        childAbsPositions.set(child.id, { x: pos.x, y: pos.y });

        minX = Math.min(minX, pos.x - w / 2);
        minY = Math.min(minY, pos.y - h / 2);
        maxX = Math.max(maxX, pos.x + w / 2);
        maxY = Math.max(maxY, pos.y + h / 2);

        maxRight = Math.max(maxRight, pos.x + w / 2);
        startY = Math.min(startY, pos.y - h / 2);
      });
    } else {
      maxRight = 0; startY = 0; minX = 0; minY = 0; maxX = 0; maxY = 0;
    }

    // Bağlantısız Notları sağ tarafa hizala
    let currentX = layoutedChildren.length > 0 ? maxRight + 60 : 0;
    let currentY = startY;

    noteChildren.forEach(note => {
      const w = note.measured?.width ?? note.width ?? nodeWidth;
      const h = note.measured?.height ?? note.height ?? nodeHeight;
      
      const posX = currentX + (w as number) / 2;
      const posY = currentY + (h as number) / 2;
      childAbsPositions.set(note.id, { x: posX, y: posY });

      minX = Math.min(minX, posX - (w as number) / 2);
      minY = Math.min(minY, posY - (h as number) / 2);
      maxX = Math.max(maxX, posX + (w as number) / 2);
      maxY = Math.max(maxY, posY + (h as number) / 2);

      currentY += (h as number) + 40;
    });

    // Grubun Nihai (Notları da kapsayan) Boyutlarını Hesapla
    const width = Math.max(320, maxX - minX + groupPadding * 2);
    // Üst kenar boşluğunu da hesaba kat (groupPadding * 2)
    const height = Math.max(160, maxY - minY + groupPadding * 2 + groupHeaderHeight);
    groupDimensions.set(groupNode.id, { width, height });

    // React Flow için Relatif Koordinatlara Çevir
    children.forEach(child => {
      const pos = childAbsPositions.get(child.id);
      if (pos) {
        let w = child.measured?.width ?? child.width ?? nodeWidth;
        let h = child.measured?.height ?? child.height ?? nodeHeight;
        if (child.type === 'GROUP') {
          const dim = groupDimensions.get(child.id);
          if (dim) { w = dim.width; h = dim.height; }
        }

        const childTopLeftX = pos.x - (w as number) / 2;
        const childTopLeftY = pos.y - (h as number) / 2;

        const groupTopLeftX = minX - groupPadding;
        // Başlık yüksekliğine ek olarak üst padding de bırak
        const groupTopLeftY = minY - groupHeaderHeight - groupPadding;

        relativePositions.set(child.id, {
          x: childTopLeftX - groupTopLeftX,
          y: childTopLeftY - groupTopLeftY
        });
      }
    });
  });

  // 2. AŞAMA: Ana Ekran (Root) Seviyesindeki Düğümleri Yerleştir
  const rootGraph = new dagre.graphlib.Graph();
  rootGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120, marginx: 50, marginy: 50 });
  rootGraph.setDefaultEdgeLabel(() => ({}));

  const rootNodes = nodes.filter(n => !n.parentId);
  
  const layoutedRootNodes = rootNodes.filter(c => !isUnconnectedNote(c));
  const noteRootNodes = rootNodes.filter(c => isUnconnectedNote(c));

  layoutedRootNodes.forEach(node => {
    let w = node.measured?.width ?? node.width ?? nodeWidth;
    let h = node.measured?.height ?? node.height ?? nodeHeight;
    if (node.type === 'GROUP') {
      const dim = groupDimensions.get(node.id); // Grupların nihai boyutları (Notlar dahil)
      if (dim) { w = dim.width; h = dim.height; }
    }
    rootGraph.setNode(node.id, { width: w as number, height: h as number });
  });

  // Gruplar arası bağlantıları da gözet
  edges.forEach(edge => {
    const rootSource = getRootNodeId(edge.source);
    const rootTarget = getRootNodeId(edge.target);
    if (rootSource !== rootTarget) {
      if (layoutedRootNodes.find(n => n.id === rootSource) && layoutedRootNodes.find(n => n.id === rootTarget)) {
        rootGraph.setEdge(rootSource, rootTarget);
      }
    }
  });

  dagre.layout(rootGraph);

  const rootAbsPositions = new Map<string, { x: number, y: number }>();
  let maxRootRight = -Infinity;
  let rootStartY = Infinity;

  if (layoutedRootNodes.length > 0) {
    layoutedRootNodes.forEach(node => {
      const pos = rootGraph.node(node.id);
      const w = rootGraph.node(node.id).width;
      const h = rootGraph.node(node.id).height;
      
      const topLeftX = pos.x - w / 2;
      const topLeftY = pos.y - h / 2;
      
      rootAbsPositions.set(node.id, { x: topLeftX, y: topLeftY });

      maxRootRight = Math.max(maxRootRight, pos.x + w / 2);
      rootStartY = Math.min(rootStartY, topLeftY);
    });
  } else {
    maxRootRight = 0;
    rootStartY = 0;
  }

  let rootCurrentX = layoutedRootNodes.length > 0 ? maxRootRight + 80 : 50;
  let rootCurrentY = layoutedRootNodes.length > 0 ? rootStartY : 50;

  noteRootNodes.forEach(note => {
    const w = note.measured?.width ?? note.width ?? nodeWidth;
    const h = note.measured?.height ?? note.height ?? nodeHeight;
    
    rootAbsPositions.set(note.id, { x: rootCurrentX, y: rootCurrentY });
    rootCurrentY += (h as number) + 40;
  });

  const isHorizontal = direction === 'LR';

  // 3. AŞAMA: Tüm Düğümlere Hesaplanan Pozisyonları Ata
  const newNodes = nodes.map(node => {
    let resultNode = { ...node };

    // Yön değerlerine göre bağlantı noktalarını (handle) güncelle
    (resultNode as any).targetPosition = isHorizontal ? 'left' : 'top';
    (resultNode as any).sourcePosition = isHorizontal ? 'right' : 'bottom';

    if (node.type === 'GROUP') {
      const dim = groupDimensions.get(node.id);
      if (dim) {
        resultNode.style = { ...node.style, width: dim.width, height: dim.height };
        resultNode.width = dim.width;
        resultNode.height = dim.height;
      }
    }

    if (node.parentId) {
      if (!collapsedGroups.has(node.parentId)) {
        const relPos = relativePositions.get(node.id);
        if (relPos) resultNode.position = relPos;
      }
    } else {
      const absPos = rootAbsPositions.get(node.id);
      if (absPos) resultNode.position = absPos;
    }

    return resultNode;
  });

  // Render sırası için derinliğe göre sırala (Önce kök dizin, sonra içerikler)
  const sortedNodes = [...newNodes].sort((a, b) => {
    const levelA = getDepth(a.id), levelB = getDepth(b.id);
    if (levelA !== levelB) return levelA - levelB;
    if (a.type === 'GROUP' && b.type !== 'GROUP') return -1;
    if (a.type !== 'GROUP' && b.type === 'GROUP') return 1;
    return 0;
  });

  return { nodes: sortedNodes, edges };
};
