import { useState, useEffect, useCallback, useMemo, RefObject } from 'react';
import { Column } from '../types';
import { loadColumnsFromStorage, saveColumnsToStorage, mergeColumnsWithDefinitions } from '../statePersistence';

export function useGridColumns({
    initialColumns,
    gridId,
    groupBy,
    gridStyleRef
}: {
    initialColumns: Column[],
    gridId: string,
    groupBy: string[],
    gridStyleRef: RefObject<HTMLDivElement | null>
}) {
    const [columns, setColumns] = useState<Column[]>(() => loadColumnsFromStorage(initialColumns, gridId));
    const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
    const [sidebarDragIndex, setSidebarDragIndex] = useState<number | null>(null);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => { saveColumnsToStorage(columns, gridId); }, [columns, gridId]);
    useEffect(() => { setColumns((prev) => mergeColumnsWithDefinitions(prev, initialColumns)); }, [initialColumns]);

    const moveColumn = useCallback((fromIndex: number, toIndex: number) => { 
        if (fromIndex === toIndex) return; 
        const newCols = [...columns]; 
        const [moved] = newCols.splice(fromIndex, 1); 
        newCols.splice(toIndex, 0, moved); 
        setColumns(newCols); 
    }, [columns]);

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => { 
        if (isResizing || columns[index].type === 'checkbox') { e.preventDefault(); return; } 
        setDraggedColIndex(index); 
    }, [isResizing, columns]);

    const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => { 
        e.preventDefault(); 
        if (draggedColIndex === null || draggedColIndex === dropIndex) return; 
        if (columns[dropIndex].type === 'checkbox') return; 
        const newCols = [...columns]; 
        const [moved] = newCols.splice(draggedColIndex, 1); 
        newCols.splice(dropIndex, 0, moved); 
        const leftNeighbor = newCols[dropIndex - 1]; 
        if (leftNeighbor?.pinned === 'left') moved.pinned = 'left'; 
        else if (dropIndex === 0) moved.pinned = 'left'; 
        else moved.pinned = null; 
        setColumns(newCols); 
        setDraggedColIndex(null); 
    }, [columns, draggedColIndex]);

    const handleSidebarDragStart = useCallback((e: React.DragEvent, index: number) => { 
        setSidebarDragIndex(index); 
    }, []);

    const handleSidebarDrop = useCallback((e: React.DragEvent, dropIndex: number) => { 
        e.preventDefault(); 
        if (sidebarDragIndex !== null && sidebarDragIndex !== dropIndex) { moveColumn(sidebarDragIndex, dropIndex); } 
        setSidebarDragIndex(null); 
    }, [sidebarDragIndex, moveColumn]);

    const handleResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => { 
        if (columns[colIndex].type === 'checkbox') return; 
        e.preventDefault(); e.stopPropagation(); 
        setIsResizing(true); 
        const startX = e.pageX; 
        const startWidth = columns[colIndex].width; 
        let newWidth = startWidth; 
        const onMouseMove = (ev: MouseEvent) => { 
            newWidth = Math.max(30, startWidth + (ev.pageX - startX)); 
            if (gridStyleRef.current) gridStyleRef.current.style.setProperty(`--col-w-${colIndex}`, `${newWidth}px`); 
        }; 
        const onMouseUp = () => { 
            setIsResizing(false); 
            document.removeEventListener('mousemove', onMouseMove); 
            document.removeEventListener('mouseup', onMouseUp); 
            setColumns(prev => { const n = [...prev]; n[colIndex] = { ...n[colIndex], width: newWidth }; return n; }); 
        }; 
        document.addEventListener('mousemove', onMouseMove); 
        document.addEventListener('mouseup', onMouseUp); 
    }, [columns, gridStyleRef]);

    const toggleColumnVisibility = useCallback((field: string) => { 
        setColumns(prev => prev.map(col => col.field === field ? { ...col, visible: !col.visible } : col)); 
    }, []);

    const totalColumnWidth = useMemo(() => {
        let width = 0;
        columns.forEach((col) => {
            if (col.visible !== false && !groupBy.includes(col.field)) {
                width += col.width;
            }
        });
        return width;
    }, [columns, groupBy]);

    return {
        columns, setColumns,
        draggedColIndex, setDraggedColIndex,
        isResizing, setIsResizing,
        handleDragStart, handleDrop,
        handleSidebarDragStart, handleSidebarDrop,
        handleResizeStart,
        toggleColumnVisibility,
        totalColumnWidth
    };
}
