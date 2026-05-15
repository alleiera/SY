import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronDown, ChevronRight, Filter, X, ArrowDownAZ, ArrowUpAZ, Check, Search, Trash2, ListFilter,
    Layers, LayoutGrid, Columns, GripHorizontal, Copy, Download, FilterX, MousePointerClick,
    FileSpreadsheet, FileCode, FileText, Printer, Calculator, Moon, Sun, RefreshCw, Loader2, GripVertical,
    PanelTopClose, PanelTopOpen, Settings2, Plus, Edit, Eye
} from 'lucide-react';

import { exportToCSV, exportToTXT, exportToXML, exportToExcel, printGrid } from '../../utils/exportUtils';
import { useGridNavigation } from '../../hooks/useGridNavigation';
import { useSettings } from '../../context/SettingsContext';

import { Column, GridFeatures, ColumnFilterState, FilterCondition, GridRowData, ContextMenuState } from './types';
import { formatNumberTR } from './utils';
import { SearchPopup } from './components/SearchPopup';
import { FilterForm } from './components/FilterForm';
import { GridRow, GroupRow } from './components/GridComponents';
import {
    loadColumnsFromStorage,
    mergeColumnsWithDefinitions,
    saveColumnsToStorage,
    loadSearchableColumnsFromStorage,
    saveSearchableColumnsToStorage
} from './statePersistence';
import { checkCondition, filterAndSortData, buildGroupedData } from './dataProcessing';
import { useGridData } from './hooks/useGridData';
import { useGridColumns } from './hooks/useGridColumns';

// --- CORE COMPONENT ---
export const UniversalDataGrid = ({
    initialData,
    initialColumns,
    rowHeight = 27,
    height = 600,
    features = {
        enableGrouping: true,
        enableFiltering: true,
        enableSorting: true,
        enableEditing: true,
        enableSidebar: true,
        enableExport: true,
        enableSelection: true,
        enableDarkModeToggle: true
    },
    theme = 'light',
    showGroupPanel = false,
    loading = false,
    isActive = true,
    gridId = '',
    onAdd,
    onEdit,
    onInspect,
    onDelete,
    onDuplicate,
    onRefresh,
    onRowDoubleClick,
    onSelectionChange,
}: {
    initialData: any[],
    initialColumns: Column[],
    rowHeight?: number,
    height?: number | string,
    features?: GridFeatures,
    theme?: 'light' | 'dark',
    showGroupPanel?: boolean,
    loading?: boolean,
    isActive?: boolean,
    gridId?: string,
    onAdd?: () => void,
    onEdit?: (row: any) => void,
    onInspect?: (row: any) => void,
    onDelete?: (row: any) => void,
    onDuplicate?: (row: any) => void,
    onRefresh?: () => void,
    onRowDoubleClick?: (row: any) => void,
    onSelectionChange?: (rows: any[]) => void,
}) => {
    // @ts-ignore
    const { theme: globalTheme, rowHeight: globalRowHeight, zebraStriping: globalZebra, showGridLines: globalGridLines } = useSettings() || {};

    const activeRowHeight = globalRowHeight || rowHeight;
    const isGlobalDark = globalTheme === 'dark' || (globalTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const isDarkMode = globalTheme ? isGlobalDark : theme === 'dark';

    const [data, setData] = useState(initialData);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [globalSearchText, setGlobalSearchText] = useState("");
    const [searchableColumns, setSearchableColumns] = useState<string[]>(() => loadSearchableColumnsFromStorage(initialColumns));

    const {
        groupBy, setGroupBy,
        filters, setFilters, 
        sortConfig, setSortConfig,
        filteredData, processedData,
        toggleGroup, handleAddGroupBy, handleRemoveGroupBy, handleHeaderDoubleClick
    } = useGridData({
        data,
        features,
        globalSearchText,
        searchableColumns,
        expandedGroups,
        setExpandedGroups
    });

    const gridStyleRef = useRef<HTMLDivElement>(null);

    const {
        columns, setColumns,
        draggedColIndex, setDraggedColIndex,
        isResizing, setIsResizing,
        handleDragStart, handleDrop,
        handleSidebarDragStart, handleSidebarDrop,
        handleResizeStart,
        toggleColumnVisibility,
        totalColumnWidth
    } = useGridColumns({
        initialColumns,
        gridId,
        groupBy,
        gridStyleRef
    });

    const [selectedRowIds, setSelectedRowIds] = useState<Set<number | string>>(new Set());
    const [editingCell, setEditingCell] = useState<{ id: number | string, field: string, startKey?: string } | null>(null);
    const [isGroupPanelVisible, setIsGroupPanelVisible] = useState(showGroupPanel);
    const [isDragOverGroupPanel, setIsDragOverGroupPanel] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'columns' | 'filters'>('columns');
    const [columnSearch, setColumnSearch] = useState("");
    const [sidebarExpandedFilters, setSidebarExpandedFilters] = useState<Set<string>>(new Set());
    const [activeMenu, setActiveMenu] = useState<{ colField: string; anchorRect: DOMRect } | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ row: number, col: number } | null>(null);
    const [selectionCurrent, setSelectionCurrent] = useState<{ row: number, col: number } | null>(null);
    const [focusedHeader, setFocusedHeader] = useState<string | null>(null);
    const [quickSearchBuffer, setQuickSearchBuffer] = useState("");
    const [isLoading, setIsLoading] = useState(loading);
    const numericHeight = typeof height === 'number' ? height : 600;
    const [containerHeight, setContainerHeight] = useState(numericHeight);

    useEffect(() => {
        saveSearchableColumnsToStorage(searchableColumns);
    }, [searchableColumns]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isActive) return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, isActive]);

    useEffect(() => { setData(initialData); }, [initialData]);
    useEffect(() => { setIsLoading(loading); }, [loading]);

    const mainScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mainScrollRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                setContainerHeight(Math.max(entry.contentRect.height, numericHeight));
            }
        });
        observer.observe(mainScrollRef.current);
        return () => observer.disconnect();
    }, [numericHeight]);

    const isCellSelected = useCallback((r: number, c: number) => {
        if (!selectionStart || !selectionCurrent) return false;
        const minRow = Math.min(selectionStart.row, selectionCurrent.row);
        const maxRow = Math.max(selectionStart.row, selectionCurrent.row);
        const minCol = Math.min(selectionStart.col, selectionCurrent.col);
        const maxCol = Math.max(selectionStart.col, selectionCurrent.col);
        return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
    }, [selectionStart, selectionCurrent]);

    useLayoutEffect(() => {
        if (gridStyleRef.current) {
            columns.forEach((col, index) => {
                gridStyleRef.current!.style.setProperty(`--col-w-${index}`, `${col.width}px`);
            });
        }
    }, [columns]);

    const getColumnStyles = useCallback((col: Column, index: number, isHeader: boolean) => {
        const isHidden = col.visible === false || groupBy.includes(col.field);
        const style: React.CSSProperties = {
            width: `var(--col-w-${index})`,
            minWidth: `var(--col-w-${index})`,
            maxWidth: `var(--col-w-${index})`,
            display: isHidden ? 'none' : 'flex',
        };

        const borderColor = isDarkMode ? '#2a2a2a' : '#d1d5db';
        const headerBgColor = isDarkMode ? '#212121' : '#f3f4f6';

        if (col.pinned) {
            style.position = 'sticky';
            style.zIndex = isHeader ? 50 : 30;
            if (isHeader) { style.backgroundColor = headerBgColor; }

            if (col.pinned === 'left') {
                if (index === 0) style.left = '0px';
                else {
                    let left = 0;
                    for (let i = 0; i < index; i++) {
                        const c = columns[i];
                        if (c.pinned === 'left' && c.visible !== false && !groupBy.includes(c.field)) left += c.width;
                    }
                    style.left = `${left}px`;
                }
                style.borderRight = `1px solid ${borderColor}`;
            } else if (col.pinned === 'right') {
                let right = 0;
                for (let i = columns.length - 1; i > index; i--) {
                    const c = columns[i];
                    if (c.pinned === 'right' && c.visible !== false && !groupBy.includes(c.field)) right += c.width;
                }
                style.right = `${right}px`;
                style.borderLeft = `1px solid ${borderColor}`;
            }
        } else {
            style.position = isHeader ? 'sticky' : 'relative';
            style.zIndex = isHeader ? 40 : 10;
            if (isHeader) { style.top = 0; style.backgroundColor = headerBgColor; }
        }
        return style;
    }, [columns, groupBy, isDarkMode]);

    const handleGroupPanelDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOverGroupPanel(true); };
    const handleGroupPanelDragLeave = () => { setIsDragOverGroupPanel(false); };
    const handleGroupPanelDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragOverGroupPanel(false); if (draggedColIndex !== null) { const col = columns[draggedColIndex]; if (col.type !== 'checkbox') handleAddGroupBy(col.field, () => setActiveMenu(null)); } setDraggedColIndex(null); };

    const handleSelectAll = useCallback(() => { if (!features.enableSelection) return; const leafRows = processedData.filter(r => !r.isGroup); const allSelected = leafRows.length > 0 && leafRows.every(row => selectedRowIds.has(row.id)); let newSet: Set<any>; if (allSelected) { newSet = new Set(); } else { newSet = new Set(selectedRowIds); leafRows.forEach(row => newSet.add(row.id)); } setSelectedRowIds(newSet); if (onSelectionChange) { const selectedRows = filteredData.filter(r => newSet.has(r.id)); onSelectionChange(selectedRows); } }, [features.enableSelection, processedData, selectedRowIds, filteredData, onSelectionChange]);
    const handleRowSelect = useCallback((id: number | string) => { if (!features.enableSelection) return; const newSet = new Set(selectedRowIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedRowIds(newSet); if (onSelectionChange) { const selectedRows = filteredData.filter(r => newSet.has(r.id)); onSelectionChange(selectedRows); } }, [features.enableSelection, selectedRowIds, filteredData, onSelectionChange]);
    const ensureCellVisible = useCallback((rowIndex: number, colIndex: number) => { if (!mainScrollRef.current) return; const container = mainScrollRef.current; const { clientHeight, clientWidth, scrollTop, scrollLeft } = container; const headerH = 42; const rowTop = rowIndex * rowHeight + headerH; const rowBottom = rowTop + rowHeight; if (rowTop < scrollTop + headerH) container.scrollTop = rowTop - headerH; else if (rowBottom > scrollTop + clientHeight) container.scrollTop = rowBottom - clientHeight; let colLeft = 0; for (let i = 0; i < colIndex; i++) { if (!groupBy.includes(columns[i].field) && columns[i].visible !== false) colLeft += columns[i].width; } const currentWidth = groupBy.includes(columns[colIndex].field) ? 0 : columns[colIndex].width; const colRight = colLeft + currentWidth; let leftPinnedWidth = 0; columns.forEach(c => { if (c.pinned === 'left' && !groupBy.includes(c.field)) leftPinnedWidth += c.width; }); if (colLeft < scrollLeft + leftPinnedWidth) container.scrollLeft = colLeft - leftPinnedWidth; else if (colRight > scrollLeft + clientWidth) container.scrollLeft = colRight - clientWidth; }, [columns, groupBy, rowHeight]);
    const startEditing = useCallback((rowIndex: number, colIndex: number, startKey?: string) => { if (!features.enableEditing) return; const rowData = processedData[rowIndex]; const col = columns[colIndex]; if (rowData.isGroup || col.type === 'checkbox' || !col.editable) return; setEditingCell({ id: rowData.id, field: col.field, startKey }); }, [columns, features.enableEditing, processedData]);
    const handleCellUpdate = useCallback((newVal: any) => { if (!editingCell) return; setData(prev => prev.map(row => { if (row.id === editingCell.id) return { ...row, [editingCell.field]: newVal }; return row; })); setEditingCell(null); }, [editingCell]);
    const cancelEditing = useCallback(() => { setEditingCell(null); }, []);

    const handleRefresh = useCallback(() => {
        if (onRefresh) {
            onRefresh();
        } else {
            console.warn('onRefresh prop not provided to UniversalDataGrid');
        }
    }, [onRefresh]);

    useGridNavigation({
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
    });

    const handleMouseDown = useCallback((rowIndex: number, colIndex: number, e: React.MouseEvent) => {
        if (e.button === 2) { e.preventDefault(); const isInsideSelection = isCellSelected(rowIndex, colIndex); if (!isInsideSelection) { setSelectionStart({ row: rowIndex, col: colIndex }); setSelectionCurrent({ row: rowIndex, col: colIndex }); } const rowData = processedData[rowIndex]; if (!rowData.isGroup) { setContextMenu({ visible: true, x: e.clientX, y: e.clientY, rowIndex, colIndex, cellValue: rowData[columns[colIndex].field] }); } return; }
        if (e.button !== 0) return; // Only allow left click for selection
        setContextMenu(null); setQuickSearchBuffer(""); setIsSelecting(true); setSelectionStart({ row: rowIndex, col: colIndex }); setSelectionCurrent({ row: rowIndex, col: colIndex });
    }, [processedData, columns, isCellSelected]);

    const handleEmptySpaceContextMenu = useCallback((e: React.MouseEvent) => {
        if (e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                rowIndex: -1,
                colIndex: 0, // safe default
                cellValue: null
            });
        }
    }, []);

    const handleEmptySpaceMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                rowIndex: -1,
                colIndex: 0,
                cellValue: null
            });
            return;
        }
        setContextMenu(null);
        setSelectionStart(null);
        setSelectionCurrent(null);
        setSelectedRowIds(new Set());
    }, []);

    const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number) => {
        const rowData = processedData[rowIndex];
        if (rowData && !rowData.isGroup && onRowDoubleClick) {
            onRowDoubleClick(rowData);
            return;
        }
        startEditing(rowIndex, colIndex);
    }, [startEditing, processedData, onRowDoubleClick]);
    const handleMouseEnter = useCallback((rowIndex: number, colIndex: number) => { if (isSelecting) setSelectionCurrent({ row: rowIndex, col: colIndex }); }, [isSelecting]);

    useEffect(() => { const up = () => setIsSelecting(false); const click = () => setContextMenu(null); window.addEventListener('mouseup', up); window.addEventListener('click', click); return () => { window.removeEventListener('mouseup', up); window.removeEventListener('click', click); }; }, []);
    const openMenu = (e: React.MouseEvent, colField: string) => { e.stopPropagation(); e.preventDefault(); setActiveMenu({ colField, anchorRect: e.currentTarget.getBoundingClientRect() }); };

    const AdvancedFilterMenuPopup = ({ colField, onClose }: { colField: string, onClose: () => void }) => { const col = columns.find(c => c.field === colField); if (!col) return null; return (<div className="fixed w-[280px] bg-white shadow-xl border border-gray-400 flex flex-col text-sm z-[9999] animate-in fade-in zoom-in-95 duration-75 font-sans rounded-sm" style={{ top: activeMenu?.anchorRect.bottom, left: activeMenu?.anchorRect.left }} onClick={(e) => e.stopPropagation()}> <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-300"><span className="font-bold text-gray-700">Filtrele: {col.headerName}</span><button onClick={onClose}><X size={14} className="text-gray-500" /></button></div> <FilterForm col={col} currentFilter={filters[colField]} onApply={(state) => { setFilters(prev => ({ ...prev, [colField]: state })); onClose(); }} onClear={() => { setFilters(prev => { const n = { ...prev }; delete n[col.field]; return n; }); onClose(); }} isDarkMode={isDarkMode} /> </div>); };

    const ContextMenu = () => {
        const [showExportSubMenu, setShowExportSubMenu] = useState(false);
        if (!contextMenu || !contextMenu.visible) return null;
        const col = columns[contextMenu.colIndex];
        const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text).catch(err => console.error('Copy error:', err)); }; const handleCopy = () => { if (!selectionStart || !selectionCurrent) { copyToClipboard(String(contextMenu.cellValue)); setContextMenu(null); return; } if (selectionStart.row === selectionCurrent.row && selectionStart.col === selectionCurrent.col) { copyToClipboard(String(contextMenu.cellValue)); setContextMenu(null); return; } const minRow = Math.min(selectionStart.row, selectionCurrent.row); const maxRow = Math.max(selectionStart.row, selectionCurrent.row); const minCol = Math.min(selectionStart.col, selectionCurrent.col); const maxCol = Math.max(selectionStart.col, selectionCurrent.col); let clipText = ""; for (let r = minRow; r <= maxRow; r++) { const rowData = processedData[r]; let rowStrings: string[] = []; for (let c = minCol; c <= maxCol; c++) { const colDef = columns[c]; if (colDef.visible === false || groupBy.includes(colDef.field) || colDef.type === 'checkbox') continue; if (rowData.isGroup) { if (c === 0) rowStrings.push(rowData.value); else rowStrings.push(""); } else { let val = rowData[colDef.field]; if (colDef.type === 'number') val = formatNumberTR(val); rowStrings.push(String(val)); } } clipText += rowStrings.join("\t") + "\n"; } copyToClipboard(clipText); setContextMenu(null); }; const handleFilterByValue = () => { const val = String(contextMenu.cellValue); setFilters(prev => ({ ...prev, [col.field]: { condition1: { type: 'equals', value: val }, condition2: { type: 'contains', value: '' }, operator: 'AND', isActive: true } })); setContextMenu(null); }; const handleExport = (format: 'csv' | 'xml' | 'excel' | 'txt' | 'pdf') => { if (format === 'csv') exportToCSV(filteredData, columns); if (format === 'xml') exportToXML(filteredData, columns); if (format === 'excel') exportToExcel(filteredData, columns); if (format === 'txt') exportToTXT(filteredData, columns); if (format === 'pdf') printGrid(filteredData, columns); setContextMenu(null); };
        const isValidRow = contextMenu.rowIndex >= 0 && contextMenu.rowIndex < processedData.length;
        const rowData = isValidRow ? processedData[contextMenu.rowIndex] : null;

        const handleAddAction = () => { if (onAdd) onAdd(); setContextMenu(null); };
        const handleEditAction = () => { if (onEdit && rowData) onEdit(rowData); setContextMenu(null); };
        const handleInspectAction = () => { if (onInspect && rowData) onInspect(rowData); setContextMenu(null); };
        const handleDeleteAction = () => { if (onDelete && rowData) onDelete(rowData); setContextMenu(null); };
        const handleDuplicateAction = () => { if (onDuplicate && rowData) onDuplicate(rowData); setContextMenu(null); };

        const menuHeight = 320;
        const isOverflowing = contextMenu.y + menuHeight > window.innerHeight;
        const menuStyle = {
            top: isOverflowing ? 'auto' : contextMenu.y,
            bottom: isOverflowing ? (window.innerHeight - contextMenu.y) : 'auto',
            left: contextMenu.x
        };

        return createPortal(<div className={`fixed shadow-xl rounded-sm py-1 z-[99999] min-w-[200px] text-sm font-sans animate-in fade-in zoom-in-95 duration-75 ${isDarkMode ? 'bg-[#1f1f1f] border border-gray-600 text-gray-200' : 'bg-white border border-gray-300 text-gray-700'}`} style={menuStyle} onClick={(e) => e.stopPropagation()}>
            <div onClick={handleRefresh} className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><RefreshCw size={14} className="mr-2 opacity-70" /> Verileri Yenile</div><span className="text-xs opacity-50">Alt+R</span></div>
            <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
            <div onClick={handleAddAction} className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><Plus size={14} className="mr-2 opacity-70" /> Ekle</div></div>
            {isValidRow && (
                <>
                    <div onClick={handleEditAction} className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><Edit size={14} className="mr-2 opacity-70" /> Düzenle</div></div>
                    {onDuplicate && <div onClick={handleDuplicateAction} className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><Copy size={14} className="mr-2 text-blue-400" /> Kopyasını Oluştur</div></div>}
                    <div onClick={handleInspectAction} className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><Eye size={14} className="mr-2 opacity-70" /> İncele</div></div>
                    <div onClick={handleDeleteAction} className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><Trash2 size={14} className="mr-2 opacity-70" /> Sil</div></div>
                    <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                    <div onClick={handleCopy} className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><Copy size={14} className="mr-2 opacity-70" /> Tabloyu Kopyala</div><span className="text-xs opacity-50">Ctrl+C</span></div>
                    <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                    <div onClick={handleFilterByValue} className={`px-4 py-2 cursor-pointer flex items-center ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><Filter size={14} className="mr-2 opacity-70" /> Değere Göre Filtrele</div>
                </>
            )}
            <div onClick={() => { setFilters(prev => { const n = { ...prev }; delete n[col.field]; return n; }); setContextMenu(null); }} className={`px-4 py-2 cursor-pointer flex items-center ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><FilterX size={14} className="mr-2 opacity-70" /> Filtreyi Temizle</div>
            <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div> {features.enableExport && (<div className="relative group" onMouseEnter={() => setShowExportSubMenu(true)} onMouseLeave={() => setShowExportSubMenu(false)}> <div className={`px-4 py-2 cursor-pointer flex items-center justify-between ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><div className="flex items-center"><Download size={14} className="mr-2 opacity-70" /> İndir</div><ChevronRight size={14} className="opacity-50" /></div> {showExportSubMenu && (<div className={`absolute left-full top-[-4px] ml-0 shadow-xl rounded-sm py-1 min-w-[150px] z-[100000] ${isDarkMode ? 'bg-[#1f1f1f] border border-gray-600' : 'bg-white border border-gray-300'}`}> <div className="absolute -left-2 top-0 bottom-0 w-2 bg-transparent"></div> <div onClick={() => handleExport('csv')} className={`px-4 py-2 cursor-pointer flex items-center ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><FileText size={14} className="mr-2 opacity-70" /> CSV</div> <div onClick={() => handleExport('excel')} className={`px-4 py-2 cursor-pointer flex items-center ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><FileSpreadsheet size={14} className="mr-2 text-green-600" /> Excel (XLS)</div> <div onClick={() => handleExport('xml')} className={`px-4 py-2 cursor-pointer flex items-center ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><FileCode size={14} className="mr-2 text-blue-500" /> XML</div> <div onClick={() => handleExport('txt')} className={`px-4 py-2 cursor-pointer flex items-center ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><FileText size={14} className="mr-2 opacity-70" /> Metin (TXT)</div> <div onClick={() => handleExport('pdf')} className={`px-4 py-2 cursor-pointer flex items-center ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}><Printer size={14} className="mr-2 text-red-500" /> PDF (Yazdır)</div> </div>)} </div>)} </div>, document.body);
    };

    const renderMenu = () => { if (!activeMenu) return null; return createPortal(<><div className="fixed inset-0 z-[9998]" onClick={() => setActiveMenu(null)} /><AdvancedFilterMenuPopup colField={activeMenu.colField} onClose={() => setActiveMenu(null)} /></>, document.body); };

    const totalContentHeight = processedData.length * activeRowHeight;
    const effectiveScrollTop = Math.max(0, scrollTop - 42);
    const visibleRowCount = Math.ceil(containerHeight / activeRowHeight);
    const startIdx = Math.floor(effectiveScrollTop / activeRowHeight);
    const endIndex = Math.min(startIdx + visibleRowCount + 5, processedData.length);
    const visibleRows = processedData.slice(startIdx, endIndex);

    return (
        <div className={`flex h-full w-full overflow-hidden border font-sans text-sm transition-colors ${isDarkMode ? 'bg-[#181818] border-[#2a2a2a] text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`} onContextMenu={(e) => e.preventDefault()}>

            {isLoading && (<div className="absolute inset-0 z-[100000] bg-black/10 backdrop-blur-[1px] flex items-center justify-center"><div className={`flex flex-col items-center p-4 rounded-lg shadow-xl ${isDarkMode ? 'bg-[#1f1f1f] text-white' : 'bg-white text-gray-900'}`}><Loader2 size={32} className="animate-spin text-blue-600 mb-2" /><span className="font-semibold text-xs">Veriler Güncelleniyor...</span></div></div>)}

            <SearchPopup
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                columns={columns}
                searchableColumns={searchableColumns}
                setSearchableColumns={setSearchableColumns}
                searchText={globalSearchText}
                setSearchText={setGlobalSearchText}
                isDarkMode={isDarkMode}
            />

            <div ref={gridStyleRef} className="flex-1 flex flex-col h-full min-w-0 relative">

                {features.enableGrouping && isGroupPanelVisible && (
                    <div className={`px-3 py-2 border-b flex items-center text-xs transition-colors min-h-[38px] 
                        ${isDarkMode ? 'border-gray-700 bg-[#1f1f1f] text-gray-400' : 'border-gray-300 bg-gray-50 text-gray-500'}
                        ${isDragOverGroupPanel ? 'ring-2 ring-inset ring-blue-300' : ''}`}
                        onDragOver={handleGroupPanelDragOver} onDragLeave={handleGroupPanelDragLeave} onDrop={handleGroupPanelDrop}>
                        <span className="font-bold mr-2 flex items-center"><LayoutGrid size={14} className="mr-1" /> Gruplama:</span>
                        <div className="flex flex-wrap gap-2">
                            {groupBy.length > 0 ? (
                                groupBy.map((field) => (
                                    <div key={field} className={`flex items-center px-2 py-1 rounded-full shadow-sm ${isDarkMode ? 'bg-[#2a2a2a] border border-gray-600 text-gray-300' : 'bg-white border border-blue-300 text-blue-700'}`}>
                                        <Layers size={12} className="mr-1.5" />
                                        <span className="font-medium">{columns.find(c => c.field === field)?.headerName}</span>
                                        <button onClick={() => handleRemoveGroupBy(field)} className={`ml-2 rounded-full p-0.5 transition-colors ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-blue-100'}`}><X size={12} /></button>
                                    </div>
                                ))
                            ) : <span className={`italic opacity-60 border border-dashed rounded px-2 ${isDarkMode ? 'bg-[#181818] border-gray-600' : 'bg-white border-gray-300'}`}>Sütun başlığını buraya sürükleyin...</span>}
                        </div>
                    </div>
                )}

                <div ref={mainScrollRef} className="flex-1 overflow-auto relative custom-scrollbar outline-none" onScroll={(e) => { setScrollTop(e.currentTarget.scrollTop); if (activeMenu) setActiveMenu(null); }} tabIndex={0}>

                    <div className={`sticky top-0 z-40 inline-flex min-w-full border-b h-[42px] ${isDarkMode ? 'bg-[#212121] border-[#2a2a2a]' : 'bg-gray-100 border-gray-300'}`}>
                        {columns.map((col, index) => {
                            const style = getColumnStyles(col, index, true);
                            const isCheckbox = col.type === 'checkbox';
                            const isGrouped = groupBy.includes(col.field);
                            const isFiltered = filters[col.field]?.isActive;
                            const leafRows = processedData.filter(r => !r.isGroup);
                            const isAllSelected = leafRows.length > 0 && leafRows.every(r => selectedRowIds.has(r.id));
                            const isIndeterminate = !isAllSelected && leafRows.some(r => selectedRowIds.has(r.id));
                            const isSpecialCol = col.type === 'checkbox';
                            const paddingClass = isSpecialCol ? 'p-0' : 'px-3';

                            return (
                                <div
                                    key={col.field}
                                    draggable={!isResizing && !isCheckbox && !isGrouped}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDoubleClick={() => handleHeaderDoubleClick(col.field)}
                                    onClick={() => { setFocusedHeader(col.field); setQuickSearchBuffer(""); }}
                                    className={`relative flex items-center justify-between ${paddingClass} py-2 border-r group transition-colors flex-shrink-0 
                                        ${isDarkMode ? 'border-[#2a2a2a] hover:bg-[#252525]' : 'border-gray-300 hover:bg-gray-100'} 
                                        ${focusedHeader === col.field ? (isDarkMode ? 'bg-[#252525] text-blue-400' : 'bg-blue-50 text-blue-700') : ''}`}
                                    style={{ ...style, cursor: isCheckbox ? 'default' : (isResizing ? 'col-resize' : 'default'), height: '42px' }}
                                >
                                    {isCheckbox && features.enableSelection ? (
                                        <div className="flex items-center justify-center w-full h-full" onMouseDown={e => e.stopPropagation()}><input type="checkbox" className="w-3.5 h-3.5 cursor-pointer accent-blue-600" checked={isAllSelected} ref={input => { if (input) input.indeterminate = isIndeterminate; }} onChange={handleSelectAll} /></div>
                                    ) : (
                                        <>
                                            <div className="font-bold truncate flex-1 flex items-center gap-1">
                                                {isGrouped ? <Layers size={14} className="text-blue-600" /> : <GripVertical size={12} className={isDarkMode ? "text-gray-500" : "text-gray-300"} />}
                                                {col.headerName}
                                                {isGrouped && <span className={`text-xs px-1 rounded ml-1 ${isDarkMode ? 'text-blue-300 bg-blue-900/50' : 'text-blue-600 bg-blue-100'}`}>({groupBy.indexOf(col.field) + 1})</span>}
                                                {focusedHeader === col.field && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse ml-1" />}
                                            </div>
                                            {features.enableSorting && sortConfig?.key === col.field && (
                                                <div className="flex items-center ml-1">
                                                    {sortConfig.direction === 'asc' ? <ArrowDownAZ size={14} className="text-blue-600" /> : <ArrowUpAZ size={14} className="text-blue-600" />}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {!isCheckbox && !isGrouped && <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 z-50 opacity-0 hover:opacity-100" onMouseDown={(e) => handleResizeStart(e, index)} onClick={(e) => e.stopPropagation()} />}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ height: totalContentHeight > 0 ? totalContentHeight : '100%', position: 'relative', minWidth: '100%', flex: 1, minHeight: '600px' }} onContextMenu={handleEmptySpaceContextMenu} onMouseDown={handleEmptySpaceMouseDown}>
                        {visibleRows.length > 0 ? (
                            visibleRows.map((row, relativeIndex) => {
                                const actualIndex = startIdx + relativeIndex;
                                if (row.isGroup) {
                                    return <GroupRow
                                        key={row.id}
                                        row={row}
                                        actualIndex={actualIndex}
                                        activeRowHeight={activeRowHeight}
                                        totalColumnWidth={totalColumnWidth}
                                        isDarkMode={isDarkMode}
                                        columns={columns}
                                        toggleGroup={toggleGroup}
                                    />
                                }
                                return <GridRow
                                    key={row.id || actualIndex}
                                    row={row}
                                    actualIndex={actualIndex}
                                    columns={columns}
                                    activeRowHeight={activeRowHeight}
                                    totalColumnWidth={totalColumnWidth}
                                    isDarkMode={isDarkMode}
                                    globalZebra={globalZebra}
                                    getColumnStyles={getColumnStyles}
                                    isCellSelected={isCellSelected}
                                    selectionStart={selectionStart}
                                    editingCell={editingCell}
                                    features={features}
                                    selectedRowIds={selectedRowIds}
                                    handleMouseDown={handleMouseDown}
                                    handleMouseEnter={handleMouseEnter}
                                    handleCellDoubleClick={handleCellDoubleClick}
                                    handleCellUpdate={handleCellUpdate}
                                    cancelEditing={cancelEditing}
                                    handleRowSelect={handleRowSelect}
                                />;
                            })
                        ) : (
                            <div className={`flex items-center justify-center w-full min-h-[400px] absolute top-24 bottom-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} onContextMenu={handleEmptySpaceContextMenu} onMouseDown={handleEmptySpaceMouseDown}>Veri yok.</div>
                        )}

                        {processedData.length > 0 && (processedData.length * activeRowHeight) < containerHeight && (() => {
                            const visibleCols = columns.filter(c => c.visible !== false && !groupBy.includes(c.field));
                            const emptyRowCount = Math.ceil((containerHeight - (processedData.length * activeRowHeight)) / activeRowHeight);

                            return Array.from({ length: emptyRowCount }).map((_, idx) => {
                                const actualIndex = processedData.length + idx;
                                const isEven = globalZebra !== false && actualIndex % 2 === 0;
                                const useZebra = globalZebra !== false;

                                let bgClass = "";
                                if (isDarkMode) {
                                    if (!useZebra) bgClass = "bg-[#181818]";
                                    else bgClass = isEven ? "bg-[#181818]" : "bg-[#1e1e1e]";
                                } else {
                                    if (!useZebra) bgClass = "bg-white";
                                    else bgClass = isEven ? "bg-white" : "bg-gray-50";
                                }

                                return (
                                    <div key={`empty-${idx}`} className={`flex border-b ${isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} ${bgClass}`} style={{ height: activeRowHeight, minWidth: '100%', width: totalColumnWidth }} onContextMenu={handleEmptySpaceContextMenu} onMouseDown={handleEmptySpaceMouseDown}>
                                        {visibleCols.map((col, colIdx) => {
                                            let left = 0;
                                            if (col.pinned === 'left') {
                                                for (let i = 0; i < colIdx; i++) {
                                                    const c = visibleCols[i];
                                                    if (c.pinned === 'left') left += c.width;
                                                }
                                            }

                                            const pinnedBg = isDarkMode
                                                ? (bgClass.includes('1e1e1e') ? '#1e1e1e' : '#181818')
                                                : (bgClass.includes('gray-50') ? '#f9fafb' : '#ffffff');

                                            return (
                                                <div
                                                    key={col.field}
                                                    className={`px-3 flex items-center ${colIdx !== visibleCols.length - 1 ? 'border-r' : ''} ${isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}
                                                    style={{
                                                        width: col.width,
                                                        minWidth: col.width,
                                                        height: '100%',
                                                        position: col.pinned ? 'sticky' : undefined,
                                                        left: col.pinned === 'left' ? `${left}px` : undefined,
                                                        backgroundColor: col.pinned ? pinnedBg : undefined,
                                                        zIndex: col.pinned ? 2 : undefined
                                                    }}
                                                />
                                            )
                                        })}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            {
                features.enableSidebar && (
                    <div className={`flex border-l transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-9'} ${isDarkMode ? 'bg-[#181818] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                        <div className={`w-9 flex flex-col items-center py-2 border-r z-10 ${isDarkMode ? 'border-gray-700 bg-[#181818]' : 'border-gray-200 bg-white'}`}>
                            <button
                                onClick={() => setIsGroupPanelVisible(!isGroupPanelVisible)}
                                className={`mb-2 p-1.5 rounded transition-colors flex items-center justify-center w-7 h-7 border 
                        ${isGroupPanelVisible ? (isDarkMode ? 'bg-[#2a2a2a] border-gray-600 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-700') : (isDarkMode ? 'bg-[#181818] border-transparent text-gray-400 hover:bg-[#252525]' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100')}`}
                                title="Gruplama Panelini Aç/Kapat"
                            >
                                <LayoutGrid size={12} />
                            </button>
                            <button onClick={() => { if (isSidebarOpen && activeTab === 'columns') setIsSidebarOpen(false); else { setIsSidebarOpen(true); setActiveTab('columns'); } }} className={`mb-2 p-1.5 rounded transition-colors writing-mode-vertical transform -rotate-180 flex items-center justify-center h-24 w-7 text-xs font-bold tracking-wide border ${activeTab === 'columns' && isSidebarOpen ? (isDarkMode ? 'bg-[#2a2a2a] border-gray-600 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-700') : (isDarkMode ? 'bg-[#181818] border-transparent text-gray-400 hover:bg-[#252525]' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100')}`} style={{ writingMode: 'vertical-rl' }}><Columns size={12} className="mb-2 rotate-90" /> SÜTUNLAR</button>
                            <button onClick={() => { if (isSidebarOpen && activeTab === 'filters') setIsSidebarOpen(false); else { setIsSidebarOpen(true); setActiveTab('filters'); } }} className={`mb-2 p-1.5 rounded transition-colors writing-mode-vertical transform -rotate-180 flex items-center justify-center h-24 w-7 text-xs font-bold tracking-wide border ${activeTab === 'filters' && isSidebarOpen ? (isDarkMode ? 'bg-[#2a2a2a] border-gray-600 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-700') : (isDarkMode ? 'bg-[#181818] border-transparent text-gray-400 hover:bg-[#252525]' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100')}`} style={{ writingMode: 'vertical-rl' }}><Filter size={12} className="mb-2 rotate-90" /> FİLTRELER</button>
                        </div>
                        <div className={`flex-1 flex flex-col h-full overflow-hidden ${!isSidebarOpen ? 'hidden' : ''} ${isDarkMode ? 'bg-[#181818]' : 'bg-gray-50'}`}>
                            <div className={`px-3 py-2 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700 bg-[#181818] text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}><span className="font-bold">{activeTab === 'columns' ? 'Sütunlar' : 'Filtreler'}</span><button onClick={() => setIsSidebarOpen(false)} className={`hover:text-gray-500 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}><ChevronRight size={12} /></button></div>
                            {activeTab === 'columns' && (
                                <div className="flex-1 flex flex-col p-2 overflow-hidden">
                                    <div className="mb-2 relative"><input className={`w-full border rounded px-2 py-1.5 pl-7 text-sm outline-none ${isDarkMode ? 'bg-[#2a2a2a] border-gray-600 text-gray-200 focus:border-gray-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`} placeholder="Sütun Ara..." value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} /><Search size={14} className="absolute left-2 top-2.5 text-gray-400" /></div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                        {columns.map((col, index) => {
                                            if (col.type === 'checkbox') return null;
                                            if (columnSearch && !col.headerName.toLowerCase().includes(columnSearch.toLowerCase())) return null;
                                            const isGrouped = groupBy.includes(col.field);
                                            return (
                                                <div key={col.field} draggable onDragStart={(e) => handleSidebarDragStart(e, index)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleSidebarDrop(e, index)} className={`flex items-center p-2 border rounded shadow-sm cursor-grab active:cursor-grabbing ${isDarkMode ? 'bg-[#2a2a2a] border-gray-600 hover:bg-[#333] text-gray-200' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'} ${isGrouped ? 'opacity-75' : ''}`}>
                                                    <GripHorizontal size={14} className="text-gray-400 mr-2" />
                                                    <input type="checkbox" className="mr-2 cursor-pointer accent-blue-600" checked={col.visible !== false} onChange={() => toggleColumnVisibility(col.field)} />
                                                    <span className="text-sm flex-1 truncate">{col.headerName}</span>
                                                    {isGrouped && <Layers size={12} className="text-blue-500 ml-1" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {activeTab === 'filters' && (
                                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                                    <div className="p-2 space-y-1">
                                        {columns.map(col => {
                                            if (col.type === 'checkbox') return null;
                                            const isExpanded = sidebarExpandedFilters.has(col.field);
                                            const isFiltered = filters[col.field]?.isActive;
                                            return (
                                                <div key={col.field} className={`border rounded shadow-sm overflow-hidden ${isDarkMode ? 'border-gray-600 bg-[#2a2a2a]' : 'border-gray-200 bg-white'}`}>
                                                    <div onClick={() => { const s = new Set(sidebarExpandedFilters); if (s.has(col.field)) s.delete(col.field); else s.add(col.field); setSidebarExpandedFilters(s); }} className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none ${isDarkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-50'}`}>
                                                        <div className="flex items-center">{isExpanded ? <ChevronDown size={14} className="text-gray-500 mr-1" /> : <ChevronRight size={14} className="text-gray-500 mr-1" />}<span className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{col.headerName}</span></div>
                                                        {isFiltered && <Filter size={12} className="text-blue-600" />}
                                                    </div>
                                                    {isExpanded && <FilterForm col={col} currentFilter={filters[col.field]} onApply={(state) => { setFilters(prev => ({ ...prev, [col.field]: state })); }} onClear={() => { setFilters(prev => { const n = { ...prev }; delete n[col.field]; return n; }); }} isDarkMode={isDarkMode} />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {renderMenu()}
            {contextMenu && <ContextMenu />}
        </div >
    );
};
