import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { useRecipeStore } from '../store';
import { X } from 'lucide-react';

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const deleteEdge = useRecipeStore((state) => state.deleteEdge);

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          strokeWidth: 2, 
          stroke: '#94a3b8',
          transition: 'stroke 0.2s ease'
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan group"
        >
          <button
            className="w-5 h-5 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 shadow-sm transition-colors opacity-60 hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              deleteEdge(id);
            }}
            title="Bağlantıyı Sil"
          >
            <X size={12} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
