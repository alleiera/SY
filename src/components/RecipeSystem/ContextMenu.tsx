import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useRecipeStore } from './store';
import { Trash2, Copy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ContextMenu({
  id,
  top,
  left,
  right,
  bottom,
  ...props
}: {
  id: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  onClick: () => void;
}) {
  const { getNode, getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const setNodesToDelete = useRecipeStore((state) => state.setNodesToDelete);

  const duplicateNode = useCallback(() => {
    const clickedNode = getNode(id);
    if (!clickedNode) return;

    let nodesToDuplicate: any[] = [];
    const allNodes = getNodes();

    if (clickedNode.selected) {
      nodesToDuplicate = allNodes.filter(n => n.selected);
    } else {
      nodesToDuplicate = [clickedNode];
    }

    let expandedSet = new Set(nodesToDuplicate.map(n => n.id));
    let addedNew = true;
    while (addedNew) {
      addedNew = false;
      allNodes.forEach(n => {
        if (n.parentId && expandedSet.has(n.parentId) && !expandedSet.has(n.id)) {
          expandedSet.add(n.id);
          nodesToDuplicate.push(n);
          addedNew = true;
        }
      });
    }

    const idMap = new Map();
    nodesToDuplicate.forEach(node => {
      idMap.set(node.id, uuidv4());
    });

    const newNodes: any[] = [];
    nodesToDuplicate.forEach(node => {
      const isTopLevelCopy = !node.parentId || !expandedSet.has(node.parentId);
      
      const newPosition = isTopLevelCopy 
        ? { x: node.position.x + 50, y: node.position.y + 50 } 
        : { ...node.position };

      const newParentId = node.parentId && expandedSet.has(node.parentId) 
        ? idMap.get(node.parentId) 
        : node.parentId;

      const newNode = {
        ...node,
        id: idMap.get(node.id),
        position: newPosition,
        parentId: newParentId,
        selected: false,
        data: { ...node.data },
      };

      if (isTopLevelCopy) {
        newNode.data.label = `${node.data.label || 'Kopya'} (Kopya)`;
      }

      newNodes.push(newNode);
    });

    const allEdges = getEdges();
    const newEdges: any[] = [];
    allEdges.forEach(edge => {
      if (expandedSet.has(edge.source) && expandedSet.has(edge.target)) {
        newEdges.push({
          ...edge,
          id: uuidv4(),
          source: idMap.get(edge.source),
          target: idMap.get(edge.target),
          selected: false,
        });
      }
    });

    setNodes((nds) => nds.map(n => ({...n, selected: false})).concat(newNodes.map(n => ({...n, selected: true}))));
    setEdges((eds) => eds.concat(newEdges));

    props.onClick();
  }, [id, getNode, getNodes, getEdges, setNodes, setEdges, props]);

  const removeNode = useCallback(() => {
    setNodesToDelete([id]);
    props.onClick();
  }, [id, setNodesToDelete, props]);

  return (
    <div
      style={{ top, left, right, bottom }}
      className="absolute z-50 bg-white border border-slate-200 shadow-lg rounded-lg py-1 min-w-[160px]"
      {...props}
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 border-b border-slate-100 mb-1">
        Düğüm Seçenekleri
      </div>
      <button
        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
        onClick={duplicateNode}
      >
        <Copy size={14} />
        Çoğalt
      </button>
      <button
        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
        onClick={removeNode}
      >
        <Trash2 size={14} />
        Düğümü Sil
      </button>
    </div>
  );
}
