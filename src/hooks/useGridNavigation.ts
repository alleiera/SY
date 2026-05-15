import { useEffect, useRef } from 'react';
import { Column, GridFeatures } from '../components/UniversalDataGrid';

interface UseGridNavigationProps {
    isActive: boolean;
    editingCell: any;
    selectionStart: { row: number, col: number } | null;
    processedData: any[];
    columns: Column[];
    groupBy: string[];
    features: GridFeatures;
    focusedHeader: string | null;
    quickSearchBuffer: string;
    setQuickSearchBuffer: (val: string) => void;
    handleRefresh: () => void;
    startEditing: (row: number, col: number, key?: string) => void;
    toggleGroup: (id: string) => void;
    handleRowSelect: (id: string | number) => void;
    setSelectionStart: (val: { row: number, col: number } | null) => void;
    setSelectionCurrent: (val: { row: number, col: number } | null) => void;
    ensureCellVisible: (row: number, col: number) => void;
}

export const useGridNavigation = ({
    isActive,
    editingCell,
    selectionStart,
    processedData,
    columns,
    groupBy,
    features,
    focusedHeader,
    quickSearchBuffer,
    setQuickSearchBuffer,
    handleRefresh,
    startEditing,
    toggleGroup,
    handleRowSelect,
    setSelectionStart,
    setSelectionCurrent,
    ensureCellVisible
}: UseGridNavigationProps) => {
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isActive) return;
            if (editingCell) return;
            if (e.altKey && e.key.toLowerCase() === 'r') { e.preventDefault(); handleRefresh(); return; }
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (e.key === 'Escape' || e.key === 'Enter') { setQuickSearchBuffer(""); }

            const currentRow = selectionStart?.row ?? 0;
            const rowData = processedData[currentRow];
            const currentCol = selectionStart?.col ?? 0;

            if (e.key === 'Enter' && rowData && !rowData.isGroup) {
                e.preventDefault();
                startEditing(currentRow, currentCol);
                return;
            }

            if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && rowData && !rowData.isGroup && e.key !== ' ') {
                if (!focusedHeader) {
                    e.preventDefault();
                    startEditing(currentRow, currentCol, e.key);
                    return;
                }
            }

            if (rowData?.isGroup) {
                if (e.key === 'ArrowRight' && !rowData.expanded) {
                    e.preventDefault();
                    toggleGroup(rowData.id);
                    return;
                }
                if (e.key === 'ArrowLeft' && rowData.expanded) {
                    e.preventDefault();
                    toggleGroup(rowData.id);
                    return;
                }
            }

            if (e.key === ' ') {
                e.preventDefault();
                if (rowData) {
                    if (!rowData.isGroup) handleRowSelect(rowData.id);
                    else toggleGroup(rowData.id);
                }
                return;
            }

            if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                setQuickSearchBuffer("");
                let nextRow = currentRow;
                let nextCol = currentCol;
                if (e.key === 'ArrowDown') nextRow = Math.min(currentRow + 1, processedData.length - 1);
                else if (e.key === 'ArrowUp') nextRow = Math.max(currentRow - 1, 0);
                else if (e.key === 'ArrowRight') nextCol = Math.min(currentCol + 1, columns.length - 1);
                else if (e.key === 'ArrowLeft') nextCol = Math.max(currentCol - 1, 0);

                // Skip hidden or grouped columns
                while (columns[nextCol] && (groupBy.includes(columns[nextCol].field) || columns[nextCol].visible === false)) {
                    if (e.key === 'ArrowRight') nextCol++;
                    else if (e.key === 'ArrowLeft') nextCol--;
                    else break;
                }

                setSelectionStart({ row: nextRow, col: nextCol });
                setSelectionCurrent({ row: nextRow, col: nextCol });
                ensureCellVisible(nextRow, nextCol);
                return;
            }

            if (!focusedHeader) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            if (e.key.length === 1) {
                const newBuffer = quickSearchBuffer + e.key;
                setQuickSearchBuffer(newBuffer);
                const targetColIndex = columns.findIndex(c => c.field === focusedHeader);
                if (targetColIndex === -1) return;

                const foundIndex = processedData.findIndex(row => {
                    if (row.isGroup) return false;
                    const cellVal = row[focusedHeader];
                    return cellVal && String(cellVal).toLocaleLowerCase('tr-TR').startsWith(newBuffer.toLocaleLowerCase('tr-TR'));
                });

                if (foundIndex !== -1) {
                    setSelectionStart({ row: foundIndex, col: targetColIndex });
                    setSelectionCurrent({ row: foundIndex, col: targetColIndex });
                    ensureCellVisible(foundIndex, targetColIndex);
                }

                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = setTimeout(() => {
                    setQuickSearchBuffer("");
                }, 1500);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        isActive,
        selectionStart,
        focusedHeader,
        quickSearchBuffer,
        processedData,
        columns,
        groupBy,
        editingCell,
        handleRefresh,
        features,
        setQuickSearchBuffer,
        startEditing,
        toggleGroup,
        handleRowSelect,
        setSelectionStart,
        setSelectionCurrent,
        ensureCellVisible
    ]);
};
