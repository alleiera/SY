import { Node, Edge } from '@xyflow/react';
import { NodeTypeConfig } from '../store';

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 90;

export function getInheritedData(nodeId: string, nodes: Node[], edges: Edge[]) {
  const inheritedData: any = {};
  const visited = new Set<string>();
  const traverse = (currentId: string) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);
    const parentEdges = edges.filter(e => e.target === currentId);
    for (const edge of parentEdges) {
      const parentNode = nodes.find(n => n.id === edge.source);
      if (parentNode) {
        // Genel alan mirası: parent'ın data'sındaki her alanı, henüz set edilmemişse ekle
        Object.keys(parentNode.data).forEach(key => {
          if (parentNode.data[key] !== undefined && parentNode.data[key] !== null && inheritedData[key] === undefined) {
            inheritedData[key] = parentNode.data[key];
          }
        });
        traverse(parentNode.id);
      }
    }
  };
  traverse(nodeId);
  return inheritedData;
}

export interface TableRow {
  groupName: string;
  terminalLabel: string;
  terminalType: string | undefined;
  [key: string]: any;
}

export function getTableData(nodes: Node[], edges: Edge[], nodeTypesConfig: NodeTypeConfig[] = []): TableRow[] {
  const report: TableRow[] = [];

  // Terminal düğümler: giden kenarı olmayan, GROUP ve NOTE olmayan düğümler
  const candidateTerminals = nodes.filter(n =>
    !edges.some(e => e.source === n.id) && n.type !== 'GROUP' && n.type !== 'NOTE'
  );

  if (candidateTerminals.length === 0) return report;

  candidateTerminals.forEach(termNode => {
    const visited = new Set<string>();
    const queue: { id: string, sourceHandle?: string | null }[] = [{ id: termNode.id, sourceHandle: null }];

    // Config'den gelen tüm node tipleri için dinamik collected nesnesi
    const collected: Record<string, any[]> = {};
    nodeTypesConfig.forEach(config => {
      collected[config.code_key] = [];
    });

    let groupName = '-';
    if (termNode.parentId) {
      const parentNode = nodes.find(n => n.id === termNode.parentId);
      if (parentNode && parentNode.type === 'GROUP') {
        groupName = (parentNode.data?.label as string) || 'İsimsiz Grup';
      }
    }

    // Aşağıdan yukarıya (terminalden atalara doğru) BFS
    while (queue.length > 0) {
      const { id: currId, sourceHandle } = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const currNode = nodes.find(n => n.id === currId);
      if (currNode && currNode.type && collected[currNode.type] !== undefined) {
        let label = (currNode.data?.label as string) || 'İsimsiz';

        // Eğer bağlantı dinamik bir porttan geldiyse, portun adını kullan
        if (sourceHandle && sourceHandle.startsWith('source-')) {
          const parts = sourceHandle.split('-');
          if (parts.length >= 4) {
            label = decodeURIComponent(parts.slice(3).join('-'));
          }
        }

        collected[currNode.type].push({
          name: label,
          amount: currNode.data?.amount,
          unit: currNode.data?.unit,
          code: currNode.data?.code,
          // Tüm data alanlarını da sakla (SKU template engine için)
          _data: { ...currNode.data },
        });
      }

      // Eğer terminal'in grubu yoksa atalarda ara
      if (groupName === '-' && currNode?.parentId) {
        const pNode = nodes.find(n => n.id === currNode.parentId);
        if (pNode && pNode.type === 'GROUP') {
          groupName = (pNode.data?.label as string) || 'İsimsiz Grup';
        }
      }

      // Üst düğümleri kuyruğa ekle (gelinen bağlantı noktasını da aktar)
      const parentEdges = edges.filter(e => e.target === currId);
      for (const e of parentEdges) {
        queue.push({ id: e.source, sourceHandle: e.sourceHandle });
      }
    }

    const uniqueItems = (arr: any[]) =>
      Array.from(new Map(arr.map(item => [item.name, item])).values());

    const row: TableRow = {
      groupName,
      terminalLabel: (termNode.data?.label as string) || '-',
      terminalType: termNode.type,
    };

    // Her node tipi için tekrarsız öğe listesini satıra ekle
    nodeTypesConfig.forEach(config => {
      row[config.code_key] = uniqueItems(collected[config.code_key]);
    });

    // Terminal node'un kendi tipinin verisi zaten collected'a giriyor,
    // ama onu da ayrıca _termData olarak saklayalım (SKU engine için)
    row._termData = { ...termNode.data };
    row._termInherited = getInheritedData(termNode.id, nodes, edges);

    report.push(row);
  });

  return report;
}

export function getAutoLayoutNodes(currentNodes: Node[], currentEdges: Edge[]) {
  const newNodes = currentNodes.map(n => ({...n}));
  const placed = new Set<string>();
  let currentX = 50;
  const X_SPACING = NODE_WIDTH + 50;
  
  // Hiyerarşik Derinlik (Y Ekseni)
  const Y_MAP: Record<string, number> = { 'RAW_MATERIAL': 50, 'H_CODE': 250, 'SURFACE': 450, 'PRINT': 650, 'PATTERN': 850, 'FINAL_PRODUCT': 1050 };

  // Post-order DFS yerleşimi
  const placeNodeAndChildren = (nodeId: string, currentY: number, depthX: number): number => {
    const node = newNodes.find(n => n.id === nodeId);
    if (!node || placed.has(node.id)) return depthX;
    placed.add(node.id);

    const childrenEdges = currentEdges.filter(e => e.source === nodeId);
    let nextX = depthX;
    let firstChildX = -1;
    let lastChildX = -1;

    if (childrenEdges.length > 0) {
      childrenEdges.forEach((edge) => {
        const targetNode = newNodes.find(n => n.id === edge.target);
        if (targetNode && !placed.has(targetNode.id)) {
          const targetY = Y_MAP[targetNode.type!] || (currentY + 200);
          nextX = placeNodeAndChildren(targetNode.id, targetY, nextX);
          if (firstChildX === -1) firstChildX = targetNode.position.x;
          lastChildX = targetNode.position.x;
        }
      });
      if (firstChildX !== -1 && lastChildX !== -1) {
        node.position = { x: (firstChildX + lastChildX) / 2, y: currentY };
      } else {
        node.position = { x: depthX, y: currentY };
        nextX = depthX + X_SPACING;
      }
      return nextX;
    } else {
      node.position = { x: depthX, y: currentY };
      return depthX + X_SPACING;
    }
  };

  const hCodes = newNodes.filter(n => n.type === 'H_CODE');
  hCodes.forEach(hCode => {
    let hCodeEndX = placeNodeAndChildren(hCode.id, Y_MAP['H_CODE'], currentX);
    const rawIds = currentEdges.filter(e => e.target === hCode.id).map(e => e.source);
    const raws = newNodes.filter(n => rawIds.includes(n.id) && !placed.has(n.id));
    if (raws.length > 0) {
      const rawTotalWidth = (raws.length - 1) * X_SPACING;
      let rawStartX = hCode.position.x - rawTotalWidth / 2;
      raws.forEach(raw => { raw.position = { x: rawStartX, y: Y_MAP['RAW_MATERIAL'] }; placed.add(raw.id); rawStartX += X_SPACING; });
    }
    currentX = Math.max(hCodeEndX, currentX + X_SPACING) + 80;
  });

  const roots = newNodes.filter(n => !currentEdges.some(e => e.target === n.id) && !placed.has(n.id));
  roots.forEach(root => {
    if (root.type === 'RAW_MATERIAL') {
      root.position = { x: currentX, y: Y_MAP['RAW_MATERIAL'] };
      placed.add(root.id);
      currentX += X_SPACING;
    } else {
      let endX = placeNodeAndChildren(root.id, Y_MAP[root.type!] || 50, currentX);
      currentX = Math.max(endX, currentX + X_SPACING) + 80;
    }
  });

  newNodes.filter(n => !placed.has(n.id)).forEach(node => {
    node.position = { x: currentX, y: Y_MAP[node.type!] || 50 };
    placed.add(node.id);
    currentX += X_SPACING;
  });

  const sortedNodes = [...newNodes].sort((a, b) => {
    if (a.type === 'GROUP' && b.type !== 'GROUP') return -1;
    if (a.type !== 'GROUP' && b.type === 'GROUP') return 1;
    return 0;
  });

  return sortedNodes;
}

export function exportToCSV(tableData: any[], nodeTypesConfig: NodeTypeConfig[] = []) {
  const baseHeaders = ['Grup', 'Düğüm Adı', 'Düğüm Tipi'];
  const typeHeaders = nodeTypesConfig.map(c => c.label);
  const headers = [...baseHeaders, ...typeHeaders];

  const rows = tableData.map(row => {
    const base = [
      row.groupName || '-',
      row.terminalLabel || '-',
      nodeTypesConfig.find(c => c.code_key === row.terminalType)?.label || row.terminalType || '-',
    ];
    const typeCols = nodeTypesConfig.map(config => {
      const items = row[config.code_key] || [];
      if (items.length === 0) return '-';
      return items.map((item: any) =>
        item.amount !== undefined ? `${item.name} (${item.amount} ${item.unit || ''})` : item.name
      ).join(' + ');
    });
    return [...base, ...typeCols];
  });

  let csvContent = "data:text/csv;charset=utf-8,"
    + [headers.join(','), ...rows.map(e => e.map((v: string) => `"${v}"`).join(','))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "uretim_recetesi.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
